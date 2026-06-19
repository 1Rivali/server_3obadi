import { Module } from "@nestjs/common";
import { BarcodesService } from "./services/barcodes.service";
import { BarcodesController } from "./barcodes.controller";
import { AwardService } from "./services/award.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BarcodesEntity } from "./entities/barcodes.entity";
import { AwardEntity } from "./entities/award.entity";
import { AgentsEntity } from "src/agents/entities/agents.entity";
import { UsersModule } from "src/users/users.module";
import { RolesGuard } from "src/auth/roles/roles.guard";

@Module({
  imports: [
    TypeOrmModule.forFeature([BarcodesEntity, AwardEntity, AgentsEntity]),
    UsersModule,
  ],
  providers: [BarcodesService, AwardService, RolesGuard],
  controllers: [BarcodesController],
})
export class BarcodesModule {}
