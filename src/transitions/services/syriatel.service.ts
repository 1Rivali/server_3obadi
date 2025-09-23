import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import * as https from 'https';
import { TransitionEntity } from '../entities/transitions.entity';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { AmountTypesEntity } from '../entities/amount-types.entity';
import { UserEntity } from 'src/users/users.entity';

@Injectable()
export class SyriatelService {
  private readonly token: string;
  private readonly ip: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(TransitionEntity)
    private readonly transitionRepo: Repository<TransitionEntity>,
    @InjectRepository(AmountTypesEntity)
    private readonly amountTypesRepo: Repository<AmountTypesEntity>,
    private readonly userService: UsersService,
  ) {
    this.token = this.configService.get<string>('SYRIATEL_TOKEN');
    this.ip = this.configService.get<string>('IP');
  }

  public async checkType(mobile: string, user: UserEntity) {
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    const transition_id: string = 'ch' + user.user_id;

    const data = {
      msisdn: mobile,
      transactionId: transition_id,
      voucherId: 150,
      payChannel: 2,
      ip: this.ip,
      location: '33.4933377,36.2977893',
    };
    const config = {
      method: 'post',
      url: 'https://bulk.syriatel.com.sy/CompaniesAPIs/api/Company/CheckForRecharge',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ` + this.token,
        'Content-Type': 'application/json',
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

  async recharge(mobile: string, amount: number, location: string) {
    const user = await this.userService.findOne(mobile);
    const amountType: AmountTypesEntity = await this.amountTypesRepo.findOne({
      where: { amount },
    });
    if (!amountType)
      throw new HttpException('Invalid amount type', HttpStatus.BAD_REQUEST);

    const transition = this.transitionRepo.create({
      amount: amountType,
      user: user,
    });

    await this.transitionRepo.save(transition);
    const transitionId: string = 'fa' + transition.transition_id;

    const newPoints: number = user.points - amount;
    if (newPoints < 0)
      throw new HttpException(
        "User Doesn't Have Enough Points",
        HttpStatus.BAD_REQUEST,
      );

    if (user.is_pre_paid === true) {
      const data = {
        msisdn: mobile,
        transactionId: transitionId,
        voucherId: amount,
        payChannel: 2,
        ip: this.ip,
        location: location,
      };
      const agent = new https.Agent({
        rejectUnauthorized: false,
      });
      const config = {
        method: 'post',
        url: 'https://bulk.syriatel.com.sy/CompaniesAPIs/api/Company/Recharge',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ` + this.token,
          'Content-Type': 'application/json',
        },
        data: data,
        httpsAgent: agent,
      };
      const response = await axios(config);

      if (response.data.code === 12)
        throw new HttpException(
          'User is on dept to syriatel',
          HttpStatus.BAD_REQUEST,
        );

      if (response.data.code === 0) {
        await this.transitionRepo.update(
          { transition_id: transition.transition_id },
          { is_success: true, is_accepted: true },
        );
        await this.userService.updateUserPoints(user.user_id, newPoints);

        return { amount };
      }
      throw new InternalServerErrorException();
    }
    if (user.is_pre_paid === false) {
      const data = {
        transactionId: transitionId,
        msisdn: mobile,
        amount: amount,
        channel: 1,
        ip: this.ip,
        location: location,
        additional: '',
      };

      const agent = new https.Agent({
        rejectUnauthorized: false,
      });
      const config = {
        method: 'post',
        url: 'https://bulk.syriatel.com.sy/CompaniesAPIs/api/Company/PayInAdvanced',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ` + this.token,
          'Content-Type': 'application/json',
        },
        data: data,
        httpsAgent: agent,
      };
      const response = await axios(config);

      if (response.data.code === 0) {
        await this.transitionRepo.update(
          { transition_id: transition.transition_id },
          { is_success: true },
        );
        await this.userService.updateUserPoints(user.user_id, newPoints);

        return { amount };
      }
      throw new InternalServerErrorException();
    }
  }
}
