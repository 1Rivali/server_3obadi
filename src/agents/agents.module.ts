import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AgentsEntity } from "./entities/agents.entity";

@Module({
  imports: [TypeOrmModule.forFeature([AgentsEntity])],
})
export class AgentsModule {}
