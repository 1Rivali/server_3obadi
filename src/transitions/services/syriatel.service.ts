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
    private readonly userService: UsersService
  ) {
    this.token = this.configService.get<string>('SYRIATEL_TOKEN');
    this.ip = this.configService.get<string>('IP');
  }

  private async checkForPrePaid(
    mobile: string,
    amount: number,
    location: string,
    user: UserEntity
  ): Promise<number> {
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    if (user.points < amount)
      throw new HttpException(
        "User doesn't have enough points",
        HttpStatus.BAD_REQUEST
      );

    const amountType: AmountTypesEntity = await this.amountTypesRepo.findOne({
      where: { amount },
    });
    if (!amountType)
      throw new HttpException('Invalid Amount type', HttpStatus.BAD_REQUEST);
    const transition = this.transitionRepo.create({
      amount: amountType,
      user,
    });
    await this.transitionRepo.save(transition);

    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    const transition_id: string = 'fa' + transition.transition_id;

    const data = {
      msisdn: mobile,
      transactionId: transition_id,
      voucherId: amount,
      payChannel: 2,
      ip: this.ip,
      location: location,
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

    if (response.data.code === 12)
      throw new HttpException(
        'User is on dept to syriatel',
        HttpStatus.BAD_REQUEST
      );
    if (response.data.code === 0) {
      await this.transitionRepo.update({ user }, { is_accepted: true });
      return transition.transition_id;
    }

    throw new InternalServerErrorException();
  }

  public async rechargePrePaid(
    mobile: string,
    amount: number,
    location: string,
    user: UserEntity
  ) {
    const transitionID: number = await this.checkForPrePaid(
      mobile,
      amount,
      location,
      user
    );
    const transition: TransitionEntity = await this.transitionRepo.findOne({
      where: { transition_id: transitionID },
    });
    if (transition.is_accepted === true) {
      const transition_id: string = 'fa' + transitionID;
      const data = {
        msisdn: mobile,
        transactionId: transition_id,
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

      const newPoints: number = user.points - amount;

      if (newPoints < 0)
        throw new HttpException(
          "User Doesn't Have Enough Points",
          HttpStatus.BAD_REQUEST
        );
      const response = await axios(config);
      if (response.data.code === 5) {
        console.log('number is postpaid');
        await this.userService.setUserPostPaid(user.user_id);
        return await this.rechargePostPaid(mobile, amount, location, user);
      }
      console.log('Syriatel', response.data);
      if (response.data.code === 0) {
        await this.transitionRepo.update(
          { transition_id: transitionID },
          { is_success: true }
        );
        await this.userService.updateUserPoints(user.user_id, newPoints);

        return { statusCode: 200, message: 'Success' };
      }

      throw new InternalServerErrorException();
    }
  }

  private async checkForPostPaid(
    mobile: string,
    user: UserEntity,
    amount: number
  ): Promise<number> {
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    if (user.points < amount)
      throw new HttpException(
        "User doesn't have enough points",
        HttpStatus.BAD_REQUEST
      );
    const transition = this.transitionRepo.create({
      amount: { amount },
      user,
    });
    await this.transitionRepo.save(transition);

    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    const transition_id: string = 'fa' + transition.transition_id;

    const data = {
      transactionId: transition_id,
      msisdn: mobile,
      channel: 1,
    };
    const config = {
      method: 'post',
      url: 'https://bulk.syriatel.com.sy/CompaniesAPIs/api/Company/CheckForPayBill',
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
      await this.transitionRepo.update({ user }, { is_accepted: true });
      return transition.transition_id;
    }
    throw new InternalServerErrorException();
  }

  public async rechargePostPaid(
    mobile: string,
    amount: number,
    location: string,
    user: UserEntity
  ) {
    const transitionID: number = await this.checkForPostPaid(
      mobile,
      user,
      amount
    );

    const transition: TransitionEntity = await this.transitionRepo.findOne({
      where: { transition_id: transitionID },
    });

    if (transition.is_accepted === true) {
      const transition_id: string = 'fa' + transitionID;

      const data = {
        transactionId: transition_id,
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

      const newPoints: number = user.points - amount;

      if (newPoints < 0)
        throw new HttpException(
          "User Doesn't Have Enough Points",
          HttpStatus.BAD_REQUEST
        );
      const response = await axios(config);
      console.log('Syriatel', response.data);
      if (response.data.code === 0) {
        await this.transitionRepo.update(
          { transition_id: transitionID },
          { is_success: true }
        );
        await this.userService.updateUserPoints(user.user_id, newPoints);

        return { statusCode: 200, message: 'Success' };
      }

      throw new InternalServerErrorException();
    }
  }
}
