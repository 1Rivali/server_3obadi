import { CACHE_MANAGER } from "@nestjs/cache-manager";
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
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
  private bankId: string;
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
    this.bankId = this.configService.get<string>("MTN_BANK_ID");
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

  async rechargeV2(mobile: string, amount: number) {
    await this.getToken();
    const user = await this.userService.findOne(mobile);
    const amountType: AmountTypesEntity = await this.amountTypesRepo.findOne({
      where: { amount },
    });
    if (!amountType)
      throw new HttpException("Invalid amount type", HttpStatus.BAD_REQUEST);

    const transition = this.transitionRepo.create({
      amount: amountType,
      user: user,
    });

    await this.transitionRepo.save(transition);
    const transitionId: string = "fa" + transition.transition_id;
    const newPoints: number = user.points - amount;
    if (newPoints < 0)
      throw new HttpException(
        "User Doesn't Have Enough Points",
        HttpStatus.BAD_REQUEST
      );
    let simType = "Prepaid";
    const bodyData = {
      userName: this.mtnUserName,
      DealerCode: this.mtnDealerCode,
      DealerPass: this.mtnDealerPassword,
      Amount: amount,
      TargetGSM: mobile,
      Type: simType,
      Distributor_Trx_Id: transitionId,
      IP: this.ipAdrr,
      GPS: "33.5132,36.2768",
    };
    const reqData = new URLSearchParams();
    reqData.append("inputObj", JSON.stringify(bodyData));
    const response = await this.sendRequestWithToken(
      "https://Servicestest.mtnsyr.com:985/Transfer",
      reqData,
      true
    );
    if (response.data.Result === "True") {
      return { amount };
    } else if (
      response.data.Result === "False" &&
      response.data.Error === "30004"
    ) {
      simType = "Postpaid";
      const response = await this.sendRequestWithToken(
        "https://Servicestest.mtnsyr.com:985/Transfer",
        reqData,
        true
      );
      if (response.data.Result === "True") {
        return { amount };
      }
      if (response.data.Result === "False" && response.data.Error === "30004") {
        throw new InternalServerErrorException();
      }
    }
  }

  async recharge(mobile: string, amount: number) {
    await this.getToken();
    const user = await this.userService.findOne(mobile);
    const date = new Date();
    let dateString = "YYYYMMDDhhmmss";
    dateString = dateString.replace(
      "YYYY",
      date.getFullYear().toString().slice(-2)
    );
    dateString = dateString.replace("MM", (date.getMonth() + 1).toString());
    dateString = dateString.replace("DD", date.getDate().toString());
    dateString = dateString.replace("hh", date.getHours().toString());
    dateString = dateString.replace("mm", date.getMinutes().toString());
    dateString = dateString.replace("ss", date.getSeconds().toString());

    const amountType: AmountTypesEntity = await this.amountTypesRepo.findOne({
      where: { amount },
    });
    if (!amountType)
      throw new HttpException("Invalid amount type", HttpStatus.BAD_REQUEST);

    const transition = this.transitionRepo.create({
      amount: amountType,
      user: user,
    });

    await this.transitionRepo.save(transition);
    const transitionId: string = "fa" + transition.transition_id;

    const newPoints: number = user.points - amount;
    if (newPoints < 0)
      throw new HttpException(
        "User Doesn't Have Enough Points",
        HttpStatus.BAD_REQUEST
      );

    const data = new URLSearchParams();
    data.append(
      "inputObj",
      `{"bankId":"${this.bankId}","password":"${this.mtnPassword}","gsmNumber":"${mobile}" ,"amount":"${amount}" ,"transactionId":"${transitionId}" ,"transactionDate":"${dateString}",}`
    );
    if (user.is_pre_paid === true) {
      const response = await this.sendRequestWithToken(
        "https://Services.mtnsyr.com:9090/rechargePrepaidLine",
        data
      );

      if (response.data.result === "True") {
        await this.transitionRepo.update(
          {
            transition_id: transition.transition_id,
          },
          { is_accepted: true, is_success: true }
        );
        await this.userService.updateUserPoints(user.user_id, newPoints);
        return { amount };
      }

      throw new InternalServerErrorException();
    }
    if (user.is_pre_paid === false) {
      const response = await this.sendRequestWithToken(
        "https://Services.mtnsyr.com:9090/payPostpaidInvoice",
        data
      );

      if (response.data.result === "True") {
        await this.transitionRepo.update(
          {
            transition_id: transition.transition_id,
          },
          { is_accepted: true, is_success: true }
        );
        await this.userService.updateUserPoints(user.user_id, newPoints);
        return { amount };
      }
      throw new InternalServerErrorException();
    }
  }

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
