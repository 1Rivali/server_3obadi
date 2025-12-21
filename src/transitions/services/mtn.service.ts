import { CACHE_MANAGER } from "@nestjs/cache-manager";
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import axios from "axios";
import { Cache } from "cache-manager";
import * as https from "https";
import { UsersService } from "src/users/users.service";
import { Repository } from "typeorm";
import { AmountTypesEntity } from "../entities/amount-types.entity";
import { TransitionEntity } from "../entities/transitions.entity";

@Injectable()
export class MtnService {
  private readonly logger = new Logger(MtnService.name);
  // private bankId: string;
  private mtnPassword: string;
  private mtnUserName: string;
  private mtnDealerCode: string;
  private mtnDealerPassword: string;
  private ipAdrr: string;
  private mtnDistributorCode: string;
  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(TransitionEntity)
    private readonly transitionRepo: Repository<TransitionEntity>,
    @InjectRepository(AmountTypesEntity)
    private readonly amountTypesRepo: Repository<AmountTypesEntity>,
    private readonly userService: UsersService
  ) {
    // this.bankId = this.configService.get<string>("MTN_BANK_ID");
    this.mtnPassword = this.configService.get<string>("MTN_PASSWORD");
    this.mtnUserName = this.configService.get<string>("MTN_USER_NAME");
    this.mtnDealerCode = this.configService.get<string>("MTN_DEALER_CODE");
    this.mtnDealerPassword = this.configService.get<string>(
      "MTN_DEALER_PASSWORD"
    );
    this.mtnDistributorCode = this.configService.get<string>(
      "MTN_DISTRIBUTOR_CODE"
    );
    this.ipAdrr = this.configService.get<string>("IP");
  }
  async getToken(): Promise<string> {
    const cachedToken: string = await this.cacheManager.get<string>("token");

    if (cachedToken) {
      return cachedToken;
    }
    const data = new URLSearchParams();

    data.append(
      "inputObj",
      `{"userName":"${this.mtnUserName}","password":"${this.mtnPassword}","DistributorCode":"${this.mtnDistributorCode}"}`
    );
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    const config = {
      method: "post",
      url: "https://servicestest.mtnsyr.com:985/authenticateDistributor",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: data,
      httpsAgent: agent,
    };

    const response = await axios(config);

    if (response.data.result === "True") {
      const token = response.data.data.token;
      await this.cacheManager.set("token", token);
      return token;
    }
  }

  // async checkNumberType(mobile: string) {
  //   const data = new URLSearchParams();
  //   data.append(
  //     "inputObj",
  //     `{"bankId":"${this.bankId}","password":"${this.mtnPassword}","gsmNumber":"${mobile}",}`
  //   );

  //   const response = await this.sendRequestWithToken(
  //     "https://Services.mtnsyr.com:9090/checkGSMType",
  //     data
  //   );
  //   if (response.data.data.gsmType === "pre") {
  //     return true;
  //   }
  //   return false;
  // }

  async rechargeV2(mobile: string, amount: AmountTypesEntity) {
    this.logger.log(
      `Starting MTN rechargeV2 - mobile: ${mobile}, amountTypeId: ${amount?.amount_type_id}, amount: ${amount?.amount}, mtn_id: ${amount?.mtn_id}`
    );

    this.logger.log("Retrieving MTN authentication token...");
    await this.getToken();
    this.logger.log("Token retrieved successfully");

    this.logger.log(`Looking up user by mobile: ${mobile}`);
    const user = await this.userService.findOne(mobile);
    this.logger.log(
      `User found - userId: ${user.user_id}, points: ${user.points}, sim_provider: ${user.sim_provider}`
    );

    if (!amount) {
      this.logger.error("Invalid amount type provided");
      throw new HttpException("Invalid amount type", HttpStatus.BAD_REQUEST);
    }

    this.logger.log("Creating transition record...");
    const transition = this.transitionRepo.create({
      amount: amount,
      user: user,
    });

    await this.transitionRepo.save(transition);
    this.logger.log(
      `Transition created and saved - transitionId: ${transition.transition_id}`
    );

    const transitionId: string = "fa" + transition.transition_id;
    this.logger.log(`Generated transition ID: ${transitionId}`);

    const newPoints: number = user.points - amount.amount;
    this.logger.log(
      `Calculating points - current: ${user.points}, amount to deduct: ${amount.amount}, new points: ${newPoints}`
    );

    if (newPoints < 0) {
      this.logger.error(
        `Insufficient points - user has ${user.points}, needs ${amount.amount}`
      );
      throw new HttpException(
        "User Doesn't Have Enough Points",
        HttpStatus.BAD_REQUEST
      );
    }

    let simType = "Prepaid";
    this.logger.log(`Preparing recharge request - simType: ${simType}`);
    const bodyData = {
      userName: this.mtnUserName,
      DealerCode: this.mtnDealerCode,
      DealerPass: this.mtnDealerPassword,
      Amount: amount.mtn_id,
      TargetGSM: mobile,
      Type: simType,
      Distributor_Trx_Id: transitionId,
      IP: this.ipAdrr,
      GPS: "33.5132,36.2768",
    };
    this.logger.log(
      `Request body prepared - Amount: ${amount.mtn_id}, TargetGSM: ${mobile}, Type: ${simType}, Distributor_Trx_Id: ${transitionId}`
    );

    const reqData = new URLSearchParams();
    reqData.append("inputObj", JSON.stringify(bodyData));

    this.logger.log(
      `Sending Prepaid recharge request to MTN API for mobile: ${mobile}`
    );
    const response = await this.sendRequestWithToken(
      "https://Servicestest.mtnsyr.com:985/Transfer",
      reqData,
      true
    );
    this.logger.log(
      `MTN API response received - Result: ${response.data.Result}, Error: ${
        response.data.Error || "N/A"
      }`
    );

    if (response.data.Result === "True") {
      this.logger.log(
        `Prepaid recharge successful - mobile: ${mobile}, amount: ${amount.mtn_id}`
      );
      return { amount: amount.mtn_id };
    } else if (
      response.data.Result === "False" &&
      response.data.Error === "30004"
    ) {
      this.logger.log(
        `Prepaid recharge failed with error 30004, retrying as Postpaid - mobile: ${mobile}`
      );
      simType = "Postpaid";
      bodyData.Type = simType;
      reqData.set("inputObj", JSON.stringify(bodyData));
      this.logger.log(
        `Sending Postpaid recharge request to MTN API for mobile: ${mobile}`
      );
      const response = await this.sendRequestWithToken(
        "https://Servicestest.mtnsyr.com:985/Transfer",
        reqData,
        true
      );
      this.logger.log(
        `MTN API response received (Postpaid) - Result: ${
          response.data.Result
        }, Error: ${response.data.Error || "N/A"}`
      );

      if (response.data.Result === "True") {
        this.logger.log(
          `Postpaid recharge successful - mobile: ${mobile}, amount: ${amount.mtn_id}`
        );
        return { amount: amount.mtn_id };
      }
      if (response.data.Result === "False" && response.data.Error === "30004") {
        this.logger.error(
          `Both Prepaid and Postpaid recharge attempts failed with error 30004 - mobile: ${mobile}, transitionId: ${transitionId}`
        );
        throw new InternalServerErrorException();
      }
    }

    this.logger.warn(
      `Unexpected response from MTN API - Result: ${JSON.parse(
        response.data
      )}, Error: ${response.data.Error || "N/A"}, mobile: ${mobile}`
    );
  }

  // async recharge(mobile: string, amount: number) {
  //   await this.getToken();
  //   const user = await this.userService.findOne(mobile);
  //   const date = new Date();
  //   let dateString = "YYYYMMDDhhmmss";
  //   dateString = dateString.replace(
  //     "YYYY",
  //     date.getFullYear().toString().slice(-2)
  //   );
  //   dateString = dateString.replace("MM", (date.getMonth() + 1).toString());
  //   dateString = dateString.replace("DD", date.getDate().toString());
  //   dateString = dateString.replace("hh", date.getHours().toString());
  //   dateString = dateString.replace("mm", date.getMinutes().toString());
  //   dateString = dateString.replace("ss", date.getSeconds().toString());

  //   const amountType: AmountTypesEntity = await this.amountTypesRepo.findOne({
  //     where: { amount },
  //   });
  //   if (!amountType)
  //     throw new HttpException("Invalid amount type", HttpStatus.BAD_REQUEST);

  //   const transition = this.transitionRepo.create({
  //     amount: amountType,
  //     user: user,
  //   });

  //   await this.transitionRepo.save(transition);
  //   const transitionId: string = "fa" + transition.transition_id;

  //   const newPoints: number = user.points - amount;
  //   if (newPoints < 0)
  //     throw new HttpException(
  //       "User Doesn't Have Enough Points",
  //       HttpStatus.BAD_REQUEST
  //     );

  //   const data = new URLSearchParams();
  //   data.append(
  //     "inputObj",
  //     `{"bankId":"${this.bankId}","password":"${this.mtnPassword}","gsmNumber":"${mobile}" ,"amount":"${amount}" ,"transactionId":"${transitionId}" ,"transactionDate":"${dateString}",}`
  //   );
  //   if (user.is_pre_paid === true) {
  //     const response = await this.sendRequestWithToken(
  //       "https://Services.mtnsyr.com:9090/rechargePrepaidLine",
  //       data
  //     );

  //     if (response.data.result === "True") {
  //       await this.transitionRepo.update(
  //         {
  //           transition_id: transition.transition_id,
  //         },
  //         { is_accepted: true, is_success: true }
  //       );
  //       await this.userService.updateUserPoints(user.user_id, newPoints);
  //       return { amount };
  //     }

  //     throw new InternalServerErrorException();
  //   }
  //   if (user.is_pre_paid === false) {
  //     const response = await this.sendRequestWithToken(
  //       "https://Services.mtnsyr.com:9090/payPostpaidInvoice",
  //       data
  //     );

  //     if (response.data.result === "True") {
  //       await this.transitionRepo.update(
  //         {
  //           transition_id: transition.transition_id,
  //         },
  //         { is_accepted: true, is_success: true }
  //       );
  //       await this.userService.updateUserPoints(user.user_id, newPoints);
  //       return { amount };
  //     }
  //     throw new InternalServerErrorException();
  //   }
  // }

  async sendRequestWithToken(
    url: string,
    data: URLSearchParams,
    bodyToken: boolean = false
  ): Promise<any> {
    const token = await this.getToken();
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    if (bodyToken) {
      this.updateBodyToken(data, token);
    }
    const response = await axios({
      method: "post",
      url,
      data,
      headers,
      httpsAgent: agent,
    });

    if (response.data.error === "100009") {
      await this.cacheManager.del("token");
      const refreshedToken = await this.getToken();

      const headers = {
        Authorization: `Bearer ${refreshedToken}`,
      };
      if (bodyToken) {
        this.updateBodyToken(data, refreshedToken);
      }
      const response = await axios({
        method: "post",
        url,
        data,
        headers,
        httpsAgent: agent,
      });
      return response;
    }
    return response;
  }

  private updateBodyToken(data: URLSearchParams, token: string) {
    const serialized = data.get("inputObj");
    if (!serialized) {
      return;
    }
    try {
      const parsed = JSON.parse(serialized);
      parsed.token = token;
      data.set("inputObj", JSON.stringify(parsed));
    } catch {
      // If the body is not JSON, do nothing; caller provided malformed payload
    }
  }
}
