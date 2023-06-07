import { Module } from '@nestjs/common';
import { VerificationsService } from './verifications.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MobileVerificationEntity } from './entities/mobile-verification.entity';
import { PasswordVerificationEntity } from './entities/password-verification.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PasswordVerificationEntity,
      MobileVerificationEntity,
    ]),
    UsersModule,
  ],
  providers: [VerificationsService],
  exports: [VerificationsService],
})
export class VerificationsModule {}
