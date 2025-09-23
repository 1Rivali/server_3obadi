import {
  Injectable,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransitionEntity } from '../entities/transitions.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmountTypesEntity } from '../entities/amount-types.entity';
import { UsersService } from 'src/users/users.service';
import * as https from 'https';
import axios from 'axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class MtnService {
  private bankId: string;
  private mtnPassword: string;
  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(TransitionEntity)
    private readonly transitionRepo: Repository<TransitionEntity>,
    @InjectRepository(AmountTypesEntity)
    private readonly amountTypesRepo: Repository<AmountTypesEntity>,
    private readonly userService: UsersService,
  ) {
    this.bankId = this.configService.get<string>('MTN_BANK_ID');
    this.mtnPassword = this.configService.get<string>('MTN_PASSWORD');
  }
  async getToken(): Promise<string> {
    const cachedToken: string = await this.cacheManager.get<string>('token');

    if (cachedToken) {
      return cachedToken;
    }
    const data = new URLSearchParams();

    data.append(
      'inputObj',
      `{"bankId":"${this.bankId}","password":"${this.mtnPassword}"}`,
    );
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    const config = {
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
      const token = response.data.data.token;
      await this.cacheManager.set('token', token);
      return token;
    }
  }

  async checkNumberType(mobile: string) {
    const data = new URLSearchParams();
    data.append(
      'inputObj',
      `{"bankId":"${this.bankId}","password":"${this.mtnPassword}","gsmNumber":"${mobile}",}`,
    );

    const response = await this.sendRequestWithToken(
      'https://Services.mtnsyr.com:9090/checkGSMType',
      data,
    );
    if (response.data.data.gsmType === 'pre') {
      return true;
    }
    return false;
  }

  async recharge(mobile: string, amount: number) {
    await this.getToken();
    const user = await this.userService.findOne(mobile);
    const date = new Date();
    let dateString = 'YYYYMMDDhhmmss';
    dateString = dateString.replace(
      'YYYY',
      date.getFullYear().toString().slice(-2),
    );
    dateString = dateString.replace('MM', (date.getMonth() + 1).toString());
    dateString = dateString.replace('DD', date.getDate().toString());
    dateString = dateString.replace('hh', date.getHours().toString());
    dateString = dateString.replace('mm', date.getMinutes().toString());
    dateString = dateString.replace('ss', date.getSeconds().toString());

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

    const data = new URLSearchParams();
    data.append(
      'inputObj',
      `{"bankId":"${this.bankId}","password":"${this.mtnPassword}","gsmNumber":"${mobile}" ,"amount":"${amount}" ,"transactionId":"${transitionId}" ,"transactionDate":"${dateString}",}`,
    );
    if (user.is_pre_paid === true) {
      const response = await this.sendRequestWithToken(
        'https://Services.mtnsyr.com:9090/rechargePrepaidLine',
        data,
      );

      if (response.data.result === 'True') {
        await this.transitionRepo.update(
          {
            transition_id: transition.transition_id,
          },
          { is_accepted: true, is_success: true },
        );
        await this.userService.updateUserPoints(user.user_id, newPoints);
        return { amount };
      }

      throw new InternalServerErrorException();
    }
    if (user.is_pre_paid === false) {
      const response = await this.sendRequestWithToken(
        'https://Services.mtnsyr.com:9090/payPostpaidInvoice',
        data,
      );

      if (response.data.result === 'True') {
        await this.transitionRepo.update(
          {
            transition_id: transition.transition_id,
          },
          { is_accepted: true, is_success: true },
        );
        await this.userService.updateUserPoints(user.user_id, newPoints);
        return { amount };
      }
      throw new InternalServerErrorException();
    }
  }
  async sendRequestWithToken(url: string, data: any): Promise<any> {
    const token = await this.getToken();
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    const response = await axios({
      method: 'post',
      url,
      data,
      headers,
      httpsAgent: agent,
    });

    if (response.data.error === '100009') {
      await this.cacheManager.del('token');
      const refreshedToken = await this.getToken();

      const headers = {
        Authorization: `Bearer ${refreshedToken}`,
      };
      const response = await axios({ method: 'post', url, data, headers });
      return response;
    }
    return response;
  }
}
