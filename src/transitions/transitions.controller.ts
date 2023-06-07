import {
  Body,
  Controller,
  Post,
  UseGuards,
  ValidationPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseFilters,
} from '@nestjs/common';
import { StartTransitionDto } from './dto/start-transition.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { MobileVerificationGuard } from 'src/auth/guards/mobile-verification.guard';
import { GetCurrentUser } from 'src/utils';
import { SyriatelService } from './services/syriatel.service';
import { HttpExceptionFilter } from 'src/http-exception.filter';
import { UsersService } from 'src/users/users.service';
import { MtnService } from './services/mtn.service';
import { SimProviderEnum } from 'src/users/users.entity';
import { Get } from '@nestjs/common/decorators';
import { TransitionService } from './services/transition.service';

@UseInterceptors(ClassSerializerInterceptor)
@UseFilters(new HttpExceptionFilter())
@Controller('api/v1/transitions')
export class TransitionsController {
  constructor(
    private readonly syriatelService: SyriatelService,
    private readonly userService: UsersService,
    private readonly mtnService: MtnService,
    private readonly transitionServices: TransitionService
  ) {}

  @UseGuards(JwtAuthGuard, MobileVerificationGuard)
  @Post('/start')
  async startPointsTransition(
    @Body(new ValidationPipe()) transitionDto: StartTransitionDto,
    @GetCurrentUser() reqUser: any,
  ) {
    const userMobile: string = reqUser.mobile;
    const user = await this.userService.findOne(userMobile);
    console.log(user);
    if (user.sim_provider === SimProviderEnum.SYRIATEL)
      return await this.syriatelService.recharge(
        userMobile,
        transitionDto.amount,
        transitionDto.location,
        user,
      );
    return await this.mtnService.recharge(
      userMobile,
      transitionDto.amount,
      user,
    );
  }
  @UseGuards(JwtAuthGuard, MobileVerificationGuard)
  @Get()
  async getPreviousTransitions(@GetCurrentUser() reqUser:any){
    const transitions= await this.transitionServices
    .fetchPreviousTransitions(reqUser.user_id);
    return {data:transitions}; 
  }
  @UseGuards(JwtAuthGuard, MobileVerificationGuard)
  @Get('points')
  async getUserPoints(@GetCurrentUser() reqUser: any) {
    const userId = reqUser.sub;
    const user = await this.userService.getUserPoints(userId);
    return {
      data: {
        points: user.points,
      },
    };
  }
}
