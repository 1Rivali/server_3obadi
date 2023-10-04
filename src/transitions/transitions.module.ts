import { Module } from '@nestjs/common';
import { TransitionsController } from './transitions.controller';
import { SyriatelService } from './services/syriatel.service';
import { MtnService } from './services/mtn.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmountTypesEntity } from './entities/amount-types.entity';
import { TransitionEntity } from './entities/transitions.entity';
import { UsersModule } from 'src/users/users.module';
import { TransitionService } from './services/transition.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AmountTypesEntity, TransitionEntity]),
    UsersModule,
  ],
  providers: [SyriatelService, MtnService, TransitionService],
  controllers: [TransitionsController],
  exports: [MtnService],
})
export class TransitionsModule {}
