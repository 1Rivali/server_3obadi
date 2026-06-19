import { Module } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { TypeOrmModule } from "@nestjs/typeorm";
import { join } from "path";
import { AgentsEntity } from "src/agents/entities/agents.entity";
import { AwardEntity } from "src/barcodes/entities/award.entity";
import { BarcodesEntity } from "src/barcodes/entities/barcodes.entity";
import { RolesGuard } from "src/auth/roles/roles.guard";
import { TransitionEntity } from "src/transitions/entities/transitions.entity";
import { UserEntity } from "src/users/users.entity";
import { AdminController } from "./admin.controller";
import { AdminDashboardController } from "./admin-dashboard.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), "admin"),
      serveRoot: "/admin",
      serveStaticOptions: {
        index: false,
      },
    }),
    TypeOrmModule.forFeature([
      UserEntity,
      BarcodesEntity,
      AwardEntity,
      AgentsEntity,
      TransitionEntity,
    ]),
  ],
  providers: [AdminService, RolesGuard],
  controllers: [AdminController, AdminDashboardController],
})
export class AdminModule {}
