import { CacheModule } from "@nestjs/cache-manager";
import { MiddlewareConsumer, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AgentsModule } from "./agents/agents.module";
import { AgentsEntity } from "./agents/entities/agents.entity";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { BarcodesModule } from "./barcodes/barcodes.module";
import { AwardEntity } from "./barcodes/entities/award.entity";
import { BarcodesEntity } from "./barcodes/entities/barcodes.entity";
import { AmountTypesEntity } from "./transitions/entities/amount-types.entity";
import { TransitionEntity } from "./transitions/entities/transitions.entity";
import { TransitionsModule } from "./transitions/transitions.module";
import { UserEntity } from "./users/users.entity";
import { UsersModule } from "./users/users.module";
import { LoggerMiddleware } from "./utils/logger/logger.middleware";
import { MobileVerificationEntity } from "./verifications/entities/mobile-verification.entity";
import { PasswordVerificationEntity } from "./verifications/entities/password-verification.entity";
import { VerificationsModule } from "./verifications/verifications.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: "mysql",
      host: process.env.DATABASE_HOST,
      port: +process.env.DATABASE_PORT,
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
        AgentsEntity,
      ],
      // autoLoadEntities: true,
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
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}
