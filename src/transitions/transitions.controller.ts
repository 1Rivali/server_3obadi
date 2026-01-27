import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Req,
  UseFilters,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from "@nestjs/common";
import { Get } from "@nestjs/common/decorators";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { HttpExceptionFilter } from "src/http-exception.filter";
import { SimProviderEnum } from "src/users/users.entity";
import { UsersService } from "src/users/users.service";
import { GetCurrentUser } from "src/utils";
import { StartTransitionDto } from "./dto/start-transition.dto";

import { AmountTypesEntity } from "./entities/amount-types.entity";
import { MtnService } from "./services/mtn.service";
import { SyriatelService } from "./services/syriatel.service";
import { TransitionService } from "./services/transition.service";

@UseInterceptors(ClassSerializerInterceptor)
@UseFilters(new HttpExceptionFilter())
@Controller("api/v1/transitions")
export class TransitionsController {
  private readonly logger = new Logger(TransitionsController.name);

  constructor(
    private readonly syriatelService: SyriatelService,
    private readonly userService: UsersService,
    private readonly mtnService: MtnService,
    private readonly transitionServices: TransitionService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post("/start")
  async startPointsTransition(
    @Body(new ValidationPipe()) transitionDto: StartTransitionDto,
    @GetCurrentUser() reqUser: any,
    @Req() request: Request
  ) {
    const userMobile: string = reqUser.mobile;
    const user = await this.userService.findOne(userMobile);
    const amountType: AmountTypesEntity =
      await this.transitionServices.findAmountType(
        transitionDto.amount,
        user.sim_provider
      );

    if (!amountType) {
      throw new HttpException(
        "Invalid amount type for your provider",
        HttpStatus.BAD_REQUEST
      );
    }

    // Extract client IP from request
    const clientIp = this.getClientIp(request);

    // Log user location and IP
    this.logger.log(
      `Transition request - User: ${userMobile}, Location: ${transitionDto.location}, IP: ${clientIp}`
    );

    if (user.sim_provider === SimProviderEnum.SYRIATEL) {
      const isPrepaid = await this.syriatelService.checkType(userMobile, user);
      if (isPrepaid === false) {
        await this.userService.setUserPostPaid(user.user_id);
      }
      return await this.syriatelService.recharge(
        userMobile,
        amountType,
        transitionDto.location,
        clientIp
      );
    }
    if (user.sim_provider === SimProviderEnum.MTN) {
      // const isPostpaid = await this.mtnService.checkNumberType(userMobile);

      // if (isPostpaid === false) {
      //   await this.userService.setUserPostPaid(user.user_id);
      // }
      return await this.mtnService.rechargeV2(
        userMobile,
        amountType,
        clientIp,
        transitionDto.location
      );
    }
  }
  @UseGuards(JwtAuthGuard)
  @Get()
  async getPreviousTransitions(@GetCurrentUser() reqUser: any) {
    const transitions = await this.transitionServices.fetchPreviousTransitions(
      reqUser.userId
    );
    return { data: transitions };
  }
  @UseGuards(JwtAuthGuard)
  @Get("points")
  async getUserPoints(@GetCurrentUser() reqUser: any) {
    const userId = reqUser.userId;
    const user = await this.userService.getUserPoints(userId);
    return {
      data: {
        points: user.points,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get("amount-types")
  async getAllAmountTypes(@GetCurrentUser() reqUser: any) {
    const userMobile: string = reqUser.mobile;
    const user = await this.userService.findOne(userMobile);
    const amountTypes = await this.transitionServices.findAllAmountTypes(
      user.sim_provider
    );
    return { data: amountTypes };
  }

  /**
   * Extract client IP from request, handling proxies/load balancers
   */
  private getClientIp(request: Request): string {
    // Check for forwarded IP (if behind proxy/load balancer)
    const forwarded = request.headers["x-forwarded-for"] as string;
    if (forwarded) {
      // x-forwarded-for can contain multiple IPs, take the first one
      return forwarded.split(",")[0].trim();
    }

    // Check for real IP header
    const realIp = request.headers["x-real-ip"] as string;
    if (realIp) {
      return realIp;
    }

    // Fallback to Express's request.ip
    return request.ip || request.socket.remoteAddress || "unknown";
  }
}
