import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MobileVerificationEntity } from './entities/mobile-verification.entity';
import { Repository } from 'typeorm';
import { SimProviderEnum, UserEntity } from 'src/users/users.entity';
import { Sms } from 'src/utils/types/sms.type';
import { fixMobile, hash } from 'src/utils';
import * as https from 'https';
import axios from 'axios';
import { UsersService } from 'src/users/users.service';
import { PasswordVerificationEntity } from './entities/password-verification.entity';

@Injectable()
export class VerificationsService {
  constructor(
    @InjectRepository(MobileVerificationEntity)
    private readonly mobileVerificationRepo: Repository<MobileVerificationEntity>,
    @InjectRepository(PasswordVerificationEntity)
    private readonly passwordVerificaionRepo: Repository<PasswordVerificationEntity>,
    private readonly userService: UsersService,
  ) {}

  async sendMobileVerification(user: UserEntity) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // Checking if the user has requested a verification code
    const previousVerification = await this.mobileVerificationRepo.findOne({
      where: {
        user: {
          user_id: user.user_id,
        },
        is_complete: false,
      },
    });

    if (previousVerification) {
      const lastVerification = new Date(
        new Date().getTime() - previousVerification.created_at.getTime(),
      ).getUTCMinutes();

      const dateToRetry = 15 - lastVerification;

      if (dateToRetry > 0)
        throw new HttpException(
          'Verification Code Sent Recently',
          HttpStatus.BAD_REQUEST,
        );
      const updateCode = await this.mobileVerificationRepo.update(
        {
          verification_id: previousVerification.verification_id,
        },
        { verification_code: code },
      );
      const sms: Sms = {
        code,
        mobile: user.mobile,
        simProvider: user.sim_provider,
      };

      return await this.sendSms(sms);
    }

    const createdVerification = this.mobileVerificationRepo.create({
      user: user,
      verification_code: code,
    });

    await this.mobileVerificationRepo.save(createdVerification);

    const sms: Sms = {
      code,
      mobile: user.mobile,
      simProvider: user.sim_provider,
    };

    const res = await this.sendSms(sms);
    return res;
  }

  async verifyMobile(user: UserEntity, code: string) {
    const mobileVerification: MobileVerificationEntity =
      await this.mobileVerificationRepo.findOne({
        where: {
          user: { user_id: user.user_id },
          is_complete: false,
        },
      });
    if (mobileVerification.verification_code === code) {
      await this.mobileVerificationRepo.update(
        { user: { user_id: user.user_id } },
        { is_complete: true },
      );
      await this.userService.verifyUser(user.user_id);
      return { statusCode: 200, message: 'verified successfully' };
    }
    throw new HttpException(
      'Verification code is not valid',
      HttpStatus.BAD_REQUEST,
    );
  }

  async requestPasswordReset(user: UserEntity) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const previousPasswordReset = await this.passwordVerificaionRepo.findOne({
      where: {
        user: {
          user_id: user.user_id,
        },
        is_complete: false,
      },
    });
    if (previousPasswordReset) {
      const lastVerification = new Date(
        new Date().getTime() - previousPasswordReset.created_at.getTime(),
      ).getUTCMinutes();

      const dateToRetry = 15 - lastVerification;

      if (dateToRetry > 0)
        throw new HttpException(
          'Verification Code Sent Recently',
          HttpStatus.BAD_REQUEST,
        );
    }
    const createdVerification = this.passwordVerificaionRepo.create({
      user: user,
      verification_code: code,
    });

    await this.passwordVerificaionRepo.save(createdVerification);

    const sms: Sms = {
      code,
      mobile: user.mobile,
      simProvider: user.sim_provider,
    };

    const res = await this.sendSms(sms);
    return res;
  }

  async verifyPasswordReset(user: UserEntity, password: string, code: string) {
    const passwordReset: PasswordVerificationEntity =
      await this.passwordVerificaionRepo.findOne({
        where: {
          user: { user_id: user.user_id },
          is_complete: false,
        },
      });
    if (passwordReset.verification_code === code) {
      await this.mobileVerificationRepo.update(
        { user: { user_id: user.user_id } },
        { is_complete: true },
      );
      await this.userService.updateUserPassword(user.user_id, password);
      return { statusCode: 200, message: 'Password changed successfully' };
    }
    throw new HttpException(
      'Verification code is not valid',
      HttpStatus.BAD_REQUEST,
    );
  }

  // helper functions
  private async sendSms(sms: Sms) {
    const fixedMobile = fixMobile(sms.mobile);

    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    if (sms.simProvider === SimProviderEnum.SYRIATEL) {
      var SyriatelConfig = {
        method: 'post',
        url: `https://bms.syriatel.sy/API/SendTemplateSMS.aspx?user_name=3obadi2&password=P@123456&template_code=3obadi2_T1&param_list=${sms.code.toString()}&sender=3obadi&to=${fixedMobile}`,
        httpsAgent: agent,
      };

      const syriatelRes = await axios(SyriatelConfig);
      
      if (typeof parseInt(syriatelRes.data) === typeof Number)
        return { statusCode: 200, message: 'Success' };

      throw new InternalServerErrorException();
    }
    if (sms.simProvider === SimProviderEnum.MTN) {
      var mtnConfig = {
        method: 'post',
        url: `https://services.mtnsyr.com:7443/general/MTNSERVICES/ConcatenatedSender.aspx?User=oci208&Pass=dabo121018&From=3obadi&Gsm=${sms.mobile}&Msg=${sms.code}&Lang=1`,
        headers: {
          Cookie: 'ASP.NET_SessionId=4iqtu0i3vs25mbxr0smasoo5',
        },
      };
      try {
        const mtnRes = await axios(mtnConfig);
        console.log(mtnRes.data)
        if (mtnRes.status === 200)
          return { statusCode: 200, message: 'Success' };
      } catch (error) {
        throw new InternalServerErrorException();
      }
    }
  }
}
