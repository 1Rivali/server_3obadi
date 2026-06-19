import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseFilters,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { Roles } from "src/auth/roles/roles.decorator";
import { RolesGuard } from "src/auth/roles/roles.guard";
import { HttpExceptionFilter } from "src/http-exception.filter";
import { UserRole } from "src/users/users.entity";
import { AdminService } from "./admin.service";
import { CreateAgentDto } from "./dto/create-agent.dto";
import { CreateAwardDto } from "./dto/create-award.dto";
import { UpdateAgentDto } from "./dto/update-agent.dto";
import { UpdateAwardDto } from "./dto/update-award.dto";

@UseFilters(new HttpExceptionFilter())
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("api/v1/admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("stats")
  getStats() {
    return this.adminService.getStats();
  }

  @Get("users")
  getUsers(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string
  ) {
    return this.adminService.getUsers(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search
    );
  }

  @Get("barcodes")
  getBarcodes(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("status") status?: "used" | "unused" | "winner"
  ) {
    return this.adminService.getBarcodes(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
      status
    );
  }

  @Get("awards")
  getAwards() {
    return this.adminService.getAwards();
  }

  @Post("awards")
  createAward(@Body(new ValidationPipe()) dto: CreateAwardDto) {
    return this.adminService.createAward(dto);
  }

  @Put("awards/:id")
  updateAward(
    @Param("id", ParseIntPipe) id: number,
    @Body(new ValidationPipe()) dto: UpdateAwardDto
  ) {
    return this.adminService.updateAward(id, dto);
  }

  @Get("agents")
  getAgents() {
    return this.adminService.getAgents();
  }

  @Post("agents")
  createAgent(@Body(new ValidationPipe()) dto: CreateAgentDto) {
    return this.adminService.createAgent(dto);
  }

  @Put("agents/:id")
  updateAgent(
    @Param("id", ParseIntPipe) id: number,
    @Body(new ValidationPipe()) dto: UpdateAgentDto
  ) {
    return this.adminService.updateAgent(id, dto);
  }

  @Get("transitions")
  getTransitions(
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.adminService.getTransitions(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );
  }
}
