import {MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './users/users.entity';
import { ConfigModule } from '@nestjs/config';
import { VerificationsModule } from './verifications/verifications.module';
import { MobileVerificationEntity } from './verifications/entities/mobile-verification.entity';
import { PasswordVerificationEntity } from './verifications/entities/password-verification.entity';
import { BarcodesModule } from './barcodes/barcodes.module';
import { BarcodesEntity } from './barcodes/entities/barcodes.entity';
import { AwardEntity } from './barcodes/entities/award.entity';
import { TransitionsModule } from './transitions/transitions.module';
import { TransitionEntity } from './transitions/entities/transitions.entity';
import { AmountTypesEntity } from './transitions/entities/amount-types.entity';
import { AgentsModule } from './agents/agents.module';
import { AgentsEntity } from './agents/entities/agents.entity';
import { LoggerMiddleware } from './utils/logger/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [
        UserEntity,
        MobileVerificationEntity,
        PasswordVerificationEntity,
        BarcodesEntity,
        AwardEntity,
        TransitionEntity,
        AmountTypesEntity,
        AgentsEntity
      ],
      // Remove this in production
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    VerificationsModule,
    BarcodesModule,
    TransitionsModule,
    AgentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
