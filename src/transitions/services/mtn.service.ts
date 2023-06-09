import {
  Injectable,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransitionEntity } from '../entities/transitions.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmountTypesEntity } from '../entities/amount-types.entity';
import { UsersService } from 'src/users/users.service';
import * as https from 'https';
import axios from 'axios';
import { fixMobile } from 'src/utils';
import { UserEntity } from 'src/users/users.entity';

@Injectable()
export class MtnService {
  private token: string;
  private bankId: string;
  private mtnPassword: string;
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(TransitionEntity)
    private readonly transitionRepo: Repository<TransitionEntity>,
    @InjectRepository(AmountTypesEntity)
    private readonly amountTypesRepo: Repository<AmountTypesEntity>,
    private readonly userService: UsersService
  ) {
    this.bankId = this.configService.get<string>('MTN_BANK_ID');
    this.mtnPassword = this.configService.get<string>('MTN_PASSWORD');
    this.token = ' ';
  }
  async getToken() {
    const data = new URLSearchParams();

    data.append(
      'inputObj',
      `{"bankId":"${this.bankId}","password":"${this.mtnPassword}"}`
    );
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    var config = {
      method: 'post',
      url: 'https://services.mtnsyr.com:9090/getToken',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: data,
      httpsAgent: agent,
    };

    const response = await axios(config);

    if (response.data.errorDesc === 'Operation Success') {
      this.token = response.data.data.token;
    }
  }

  async checkNumberType(mobile: string) {
    if (!this.token) await this.getToken();

    const data = new URLSearchParams();
    data.append(
      'inputObj',
      `{"bankId":"${this.bankId}","password":"${this.mtnPassword}","gsmNumber":"${mobile}",}`
    );
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    var config = {
      method: 'post',
      url: 'https://Services.mtnsyr.com:9090/checkGSMType',
      headers: {
        Authorization: `Bearer ` + this.token,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: data,
      httpsAgent: agent,
    };
    try {
      let response = await axios(config);

      if (response.data.error === '100009') {
        await this.getToken();
        response = await axios(config);
      }
      if (response.data.data.gsmType === 'pre') {
        return true;
      }
      return false;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async recharge(mobile: string, amount: number, user: UserEntity) {
    await this.getToken();

    const date = new Date();
    let dateString: string = 'YYYYMMDDhhmmss';
    dateString = dateString.replace(
      'YYYY',
      date.getFullYear().toString().slice(-2)
    );
    dateString = dateString.replace('MM', (date.getMonth() + 1).toString());
    dateString = dateString.replace('DD', date.getDate().toString());
    dateString = dateString.replace('hh', date.getHours().toString());
    dateString = dateString.replace('mm', date.getMinutes().toString());
    dateString = dateString.replace('ss', date.getSeconds().toString());
    const fixedMobile: string = fixMobile(mobile);
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
        HttpStatus.BAD_REQUEST
      );

    const data = new URLSearchParams();
    data.append(
      'inputObj',
      `{"bankId":"${this.bankId}","password":"${this.mtnPassword}","gsmNumber":"${mobile}" ,"amount":"${amount}" ,"transactionId":"${transitionId}" ,"transactionDate":"${dateString}",}`
    );
    if (user.is_pre_paid === true) {
      var config = {
        method: 'post',
        url: 'https://Services.mtnsyr.com:9090/rechargePrepaidLine',
        headers: {
          Authorization: `Bearer ` + this.token,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: data,
      };
      let response = await axios(config);

      if (response.data.result === 'True') {
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
      var config = {
        method: 'post',
        url: 'https://Services.mtnsyr.com:9090/payPostpaidInvoice',
        headers: {
          Authorization: `Bearer ` + this.token,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: data,
      };
      let response = await axios(config);

      if (response.data.result === 'True') {
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
}
