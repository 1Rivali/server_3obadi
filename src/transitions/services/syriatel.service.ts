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
import { UserEntity } from "src/users/users.entity";
import { UsersService } from "src/users/users.service";
import { Repository } from "typeorm";
import { AmountTypesEntity } from "../entities/amount-types.entity";
import { TransitionEntity } from "../entities/transitions.entity";

@Injectable()
export class SyriatelService {
  private readonly syriatelUsername: string;
  private readonly syriatelPassword: string;
  private readonly ip: string;
  private readonly nationalId: string;
  private readonly aMobile: string;
  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(TransitionEntity)
    private readonly transitionRepo: Repository<TransitionEntity>,
    @InjectRepository(AmountTypesEntity)
    private readonly amountTypesRepo: Repository<AmountTypesEntity>,
    private readonly userService: UsersService
  ) {
    this.syriatelUsername = this.configService.get<string>("SYRIATEL_USERNAME");
    this.syriatelPassword = this.configService.get<string>("SYRIATEL_PASSWORD");
    this.ip = this.configService.get<string>("IP");
    this.nationalId = this.configService.get<string>("NATIONAL_ID");
    this.aMobile = this.configService.get<string>("SYRIATEL_A_MOBILE");
  }

  async getToken(): Promise<string> {
    const cachedToken: string = await this.cacheManager.get<string>(
      "syriatel_token"
    );

    if (cachedToken) {
      return cachedToken;
    }

    const data = {
      username: this.syriatelUsername,
      password: this.syriatelPassword,
    };

    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    const config = {
      method: "post",
      url: "https://bulk.syriatel.com.sy/CorporateAPIs/auth/token",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      data: data,
      httpsAgent: agent,
    };

    const response = await axios(config);

    const authHeader =
      response.headers.authorization || response.headers.Authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7); // Remove "Bearer " prefix
      await this.cacheManager.set("syriatel_token", token);
      return token;
    }

    throw new InternalServerErrorException(
      "Failed to retrieve token from Syriatel API"
    );
  }

  public async checkType(mobile: string, user: UserEntity) {
    const token = await this.getToken();
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    const transition_id: string = "ch" + user.user_id;

    const data = {
      a_party_msisdn: this.aMobile,
      transactionId: transition_id,
      b_party_msisdn: mobile,
      location: "33.4933377,36.2977893",
      a_party_ip: this.ip,
      national_id: this.nationalId,
      voucherId: 150,
      channel: 2,
    };
    const config = {
      method: "post",
      url: "https://bulk.syriatel.com.sy/CorporateAPIs/api/CheckForRecharge",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ` + token,
        "Content-Type": "application/json",
      },
      data: data,
      httpsAgent: agent,
    };

    const response = await axios(config);
    if (response.data.code === 5) {
      return false;
    }
    return true;
  }

  async recharge(mobile: string, amount: AmountTypesEntity, location: string) {
    const token = await this.getToken();
    const user = await this.userService.findOne(mobile);
    if (!amount)
      throw new HttpException("Invalid amount type", HttpStatus.BAD_REQUEST);

    const transition = this.transitionRepo.create({
      amount: amount,
      user: user,
    });

    await this.transitionRepo.save(transition);
    const transitionId: string = "fa" + transition.transition_id;

    const newPoints: number = user.points - amount.amount;
    if (newPoints < 0)
      throw new HttpException(
        "User Doesn't Have Enough Points",
        HttpStatus.BAD_REQUEST
      );

    if (user.is_pre_paid === true) {
      const data = {
        a_party_msisdn: this.aMobile,
        transactionId: transitionId,
        b_party_msisdn: mobile,
        location: location,
        a_party_ip: this.ip,
        national_id: this.nationalId,
        voucherId: amount.syr_id,
        channel: 2,
      };
      const agent = new https.Agent({
        rejectUnauthorized: false,
      });
      const config = {
        method: "post",
        url: "https://bulk.syriatel.com.sy/CorporateAPIs/api/Recharge",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ` + token,
          "Content-Type": "application/json",
        },
        data: data,
        httpsAgent: agent,
      };
      const response = await axios(config);

      if (response.data.code === 12)
        throw new HttpException(
          "User is on dept to syriatel",
          HttpStatus.BAD_REQUEST
        );

      if (response.data.code === 0) {
        await this.transitionRepo.update(
          { transition_id: transition.transition_id },
          { is_success: true, is_accepted: true }
        );
        await this.userService.updateUserPoints(user.user_id, newPoints);

        return { amount: amount.syr_id };
      }
      throw new InternalServerErrorException();
    }
    if (user.is_pre_paid === false) {
      const data = {
        a_party_msisdn: this.aMobile,
        transactionId: transitionId,
        b_party_msisdn: mobile,
        location: location,
        a_party_ip: this.ip,
        national_id: this.nationalId,
        amount: amount.mtn_id,
        channel: 1,
      };

      const agent = new https.Agent({
        rejectUnauthorized: false,
      });
      const config = {
        method: "post",
        url: "https://bulk.syriatel.com.sy/CorporateAPIs/api/PayInAdvanced",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ` + token,
          "Content-Type": "application/json",
        },
        data: data,
        httpsAgent: agent,
      };
      const response = await axios(config);

      if (response.data.code === 0) {
        await this.transitionRepo.update(
          { transition_id: transition.transition_id },
          { is_success: true }
        );
        await this.userService.updateUserPoints(user.user_id, newPoints);

        return { amount: amount.syr_id };
      }
      throw new InternalServerErrorException();
    }
  }
}
