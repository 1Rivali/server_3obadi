import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  HttpCode,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseFilters,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, LoginDto } from './dtos';
import { VerifyDto } from './dtos/verify.dto';

import { HttpExceptionFilter } from 'src/http-exception.filter';
import { PasswordResetDto } from './dtos/password-reset.dto';
import { RequestPasswordResetDto } from './dtos/req-password-reset.dto';
import { MobileVerifyDto } from './dtos/req-mobile-verify.dto';

@UseInterceptors(ClassSerializerInterceptor)
@UseFilters( HttpExceptionFilter)
@Controller('api/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/login')
  async login(@Body(new ValidationPipe()) loginDto: LoginDto) {
    const user = await this.authService.login(loginDto);
    return user;
  }

  @Post('/signup')
  async signup(@Body(new ValidationPipe()) authDto: AuthDto) {
    if (authDto.mobile.length === 10 && authDto.mobile.startsWith('09')) {
      authDto.mobile = '963' + authDto.mobile.substring(1);
    }
    const user = await this.authService.signup(authDto);
    return user;
  }

  @Post('/mobile/request/verify')
  @HttpCode(200)
  async sendMobileVerification(
    @Body(new ValidationPipe()) mobileVerifyDto: MobileVerifyDto,
  ) {
    return this.authService.sendMobileVerification(mobileVerifyDto.mobile);
  }

  @Post('/mobile/verify')
  async verifyMobile(@Body(new ValidationPipe()) verifyDto: VerifyDto) {
    return this.authService.verifyMobile(verifyDto);
  }

  @HttpCode(200)
  @Post('/password/request/reset')
  async requestPasswordReset(
    //need mobile
    @Body(new ValidationPipe()) reqPasswordResetDto: RequestPasswordResetDto,
  ) {
    return this.authService.requestPasswordReset(reqPasswordResetDto);
  }

  @HttpCode(200)
  @Post('/password/reset')
  async verifyPasswordReset(
    @Body(new ValidationPipe()) passwordResetDto: PasswordResetDto,
  ) {
    return this.authService.verifyPasswordReset(passwordResetDto);
  }
}
