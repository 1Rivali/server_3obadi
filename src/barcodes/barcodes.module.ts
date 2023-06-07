import { Module } from '@nestjs/common';
import { BarcodesService } from './services/barcodes.service';
import { BarcodesController } from './barcodes.controller';
import { AwardService } from './services/award.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BarcodesEntity } from './entities/barcodes.entity';
import { AwardEntity } from './entities/award.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BarcodesEntity, AwardEntity]),
    UsersModule,
  ],
  providers: [BarcodesService, AwardService],
  controllers: [BarcodesController],
})
export class BarcodesModule {}
