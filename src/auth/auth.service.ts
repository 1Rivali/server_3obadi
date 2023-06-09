import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { AuthDto, LoginDto } from './dtos';
import { SimProviderEnum, UserEntity } from 'src/users/users.entity';
import * as bcrypt from 'bcryptjs';
import { VerifyDto } from './dtos/verify.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { VerificationsService } from 'src/verifications/verifications.service';
import { PasswordResetDto } from './dtos/password-reset.dto';
import { RequestPasswordResetDto } from './dtos/req-password-reset.dto';
import { MtnService } from 'src/transitions/services/mtn.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly verificationService: VerificationsService,
    private readonly mtnService: MtnService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userService.findOne(loginDto.mobile);
    if (!user) throw new UnauthorizedException('Credentials incorrect');
    if (!bcrypt.compareSync(loginDto.password, user.password))
      throw new UnauthorizedException('Credentials incorrect');

    return {
      user,
      token: this.genToken(
        user.user_id,
        user.mobile,
        user.role,
        user.is_verified,
      ),
    };
  }

  async signup(authDto: AuthDto): Promise<UserEntity> {
    const provider = authDto.mobile.substring(4, 5);

    let simProvider: SimProviderEnum;
    let simType: boolean;
    if (provider === '3' || provider === '8' || provider === '9')
      simProvider = SimProviderEnum.SYRIATEL;
    else {
      simProvider = SimProviderEnum.MTN;
      simType = await this.mtnService.checkNumberType(authDto.mobile);
    }

    const createdUser = await this.userService.createUser(
      authDto,
      simProvider,
      simType,
    );
    return createdUser;
  }

  async sendMobileVerification(mobile: string) {
    const user = await this.userService.findOne(mobile);

    if (!user)
      throw new HttpException(
        'User with provided phone number not found',
        HttpStatus.NOT_FOUND,
      );

    if (user.is_verified === true)
      throw new HttpException('User already verified', HttpStatus.BAD_REQUEST);

    return this.verificationService.sendMobileVerification(user);
  }

  async verifyMobile(verifyDto: VerifyDto) {
    const user = await this.userService.findOne(verifyDto.mobile);
    if (!user)
      throw new HttpException(
        'User with provided phone number not found',
        HttpStatus.NOT_FOUND,
      );
    if (user.is_verified === true)
      throw new HttpException('User already verified', HttpStatus.BAD_REQUEST);
    const verifyUser = this.verificationService.verifyMobile(
      user,
      verifyDto.code,
    );
    return verifyUser;
  }
  async requestPasswordReset(reqPasswordResetDto: RequestPasswordResetDto) {
    const user = await this.userService.findOne(reqPasswordResetDto.mobile);
    if (!user)
      throw new HttpException(
        'User with provided phone number not found',
        HttpStatus.NOT_FOUND,
      );
    return this.verificationService.requestPasswordReset(user);
  }

  async verifyPasswordReset(passwordResetDto: PasswordResetDto) {
    const user = await this.userService.findOne(passwordResetDto.mobile);
    if (!user)
      throw new HttpException(
        'User with provided phone number not found',
        HttpStatus.NOT_FOUND,
      );
    return this.verificationService.verifyPasswordReset(
      user,
      passwordResetDto.newPassword,
      passwordResetDto.code,
    );
  }

  // helper methods

  private genToken(
    userID: number,
    mobile: string,
    role: string,
    is_verified: boolean,
  ): string {
    return this.jwtService.sign(
      {
        sub: userID,
        mobile,
        role,
        is_verified,
      },
      {
        secret: process.env.JWT_SECRET,
      },
    );
  }
}
