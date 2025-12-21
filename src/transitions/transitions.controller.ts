import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Logger,
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
    @GetCurrentUser() reqUser: any
  ) {
    this.logger.log(
      `Starting points transition - userId: ${reqUser.userId}, mobile: ${reqUser.mobile}, amount: ${transitionDto.amount}, location: ${transitionDto.location}`
    );

    const userMobile: string = reqUser.mobile;
    this.logger.log(`Looking up user by mobile: ${userMobile}`);

    const user = await this.userService.findOne(userMobile);
    this.logger.log(
      `User found - userId: ${user.user_id}, sim_provider: ${user.sim_provider}, points: ${user.points}`
    );

    this.logger.log(
      `Looking up amount type for amount: ${transitionDto.amount}`
    );
    const amountType: AmountTypesEntity =
      await this.transitionServices.findAmountType(transitionDto.amount);
    this.logger.log(
      `Amount type found - amountTypeId: ${amountType.amount_type_id}, amount: ${amountType.amount}, syr_id: ${amountType.syr_id}, mtn_id: ${amountType.mtn_id}, is_active: ${amountType.is_active}`
    );

    if (user.sim_provider === SimProviderEnum.SYRIATEL) {
      this.logger.log(`Processing SYRIATEL recharge for mobile: ${userMobile}`);

      this.logger.log(`Checking if user is prepaid...`);
      const isPrepaid = await this.syriatelService.checkType(userMobile, user);
      this.logger.log(`User prepaid status: ${isPrepaid}`);

      if (isPrepaid === false) {
        this.logger.log(`User is postpaid, updating user status...`);
        await this.userService.setUserPostPaid(user.user_id);
        this.logger.log(`User status updated to postpaid`);
      }

      this.logger.log(
        `Calling syriatelService.recharge - mobile: ${userMobile}, amountType: ${amountType.amount}, location: ${transitionDto.location}`
      );
      const result = await this.syriatelService.recharge(
        userMobile,
        amountType,
        transitionDto.location
      );
      this.logger.log(
        `SYRIATEL recharge completed - result: ${JSON.stringify(result)}`
      );
      return result;
    }

    if (user.sim_provider === SimProviderEnum.MTN) {
      this.logger.log(`Processing MTN recharge for mobile: ${userMobile}`);
      // const isPostpaid = await this.mtnService.checkNumberType(userMobile);

      // if (isPostpaid === false) {
      //   await this.userService.setUserPostPaid(user.user_id);
      // }

      this.logger.log(
        `Calling mtnService.rechargeV2 - mobile: ${userMobile}, amountType: ${amountType.amount}`
      );
      const result = await this.mtnService.rechargeV2(userMobile, amountType);
      this.logger.log(
        `MTN recharge completed - result: ${JSON.stringify(result)}`
      );
      return result;
    }

    this.logger.warn(
      `Unknown or unsupported SIM provider: ${user.sim_provider} for user: ${user.user_id}`
    );
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
