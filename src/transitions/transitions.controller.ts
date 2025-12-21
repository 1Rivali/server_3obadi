import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  UseFilters,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from "@nestjs/common";
import { Get } from "@nestjs/common/decorators";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { HttpExceptionFilter } from "src/http-exception.filter";
import { SimProviderEnum } from "src/users/users.entity";
import { UsersService } from "src/users/users.service";
import { GetCurrentUser } from "src/utils";
import { StartTransitionDto } from "./dto/start-transition.dto";

import { MtnService } from "./services/mtn.service";
import { SyriatelService } from "./services/syriatel.service";
import { TransitionService } from "./services/transition.service";

@UseInterceptors(ClassSerializerInterceptor)
@UseFilters(new HttpExceptionFilter())
@Controller("api/v1/transitions")
export class TransitionsController {
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
    @GetCurrentUser() reqUser: any
  ) {
    const userMobile: string = reqUser.mobile;
    const user = await this.userService.findOne(userMobile);
    const amountType = await this.transitionServices.findAmountType(
      transitionDto.amount
    );

    if (user.sim_provider === SimProviderEnum.SYRIATEL) {
      const isPrepaid = await this.syriatelService.checkType(userMobile, user);
      if (isPrepaid === false) {
        await this.userService.setUserPostPaid(user.user_id);
      }
      return await this.syriatelService.recharge(
        userMobile,
        amountType.syr_id,
        transitionDto.location
      );
    }
    if (user.sim_provider === SimProviderEnum.MTN) {
      // const isPostpaid = await this.mtnService.checkNumberType(userMobile);

      // if (isPostpaid === false) {
      //   await this.userService.setUserPostPaid(user.user_id);
      // }
      return await this.mtnService.rechargeV2(userMobile, amountType.mtn_id);
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

  @Get("amount-types")
  async getAllAmountTypes() {
    const amountTypes = await this.transitionServices.findAllAmountTypes();
    return { data: amountTypes };
  }
}
