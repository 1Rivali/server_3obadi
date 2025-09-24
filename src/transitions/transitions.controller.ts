import {
  Body,
  Controller,
  Post,
  UseGuards,
  ValidationPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseFilters,
} from "@nestjs/common";
import { StartTransitionDto } from "./dto/start-transition.dto";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { GetCurrentUser } from "src/utils";
import { SyriatelService } from "./services/syriatel.service";
import { HttpExceptionFilter } from "src/http-exception.filter";
import { UsersService } from "src/users/users.service";
import { MtnService } from "./services/mtn.service";
import { SimProviderEnum } from "src/users/users.entity";
import { Get } from "@nestjs/common/decorators";
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

    if (user.sim_provider === SimProviderEnum.SYRIATEL) {
      const simType = await this.syriatelService.checkType(userMobile, user);
      if (simType === false) {
        await this.userService.setUserPostPaid(user.user_id);
      }
      return await this.syriatelService.recharge(
        userMobile,
        transitionDto.amount,

        transitionDto.location
      );
    }
    if (user.sim_provider === SimProviderEnum.MTN) {
      const simtype = await this.mtnService.checkNumberType(userMobile);

      if (simtype === false) {
        await this.userService.setUserPostPaid(user.user_id);
      }
      return await this.mtnService.recharge(userMobile, transitionDto.amount);
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
}
