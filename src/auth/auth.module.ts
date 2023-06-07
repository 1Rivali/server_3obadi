import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';
import { JwtStrategy } from './strategy/jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationsModule } from 'src/verifications/verifications.module';
import { TransitionsModule } from 'src/transitions/transitions.module';
import { MtnService } from 'src/transitions/services/mtn.service';

@Module({
  imports: [
    UsersModule,
    VerificationsModule,
    TransitionsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
