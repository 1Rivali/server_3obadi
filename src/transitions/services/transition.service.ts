import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransitionEntity } from '../entities/transitions.entity';
import { Repository } from 'typeorm';
import { MtnService } from './mtn.service';
import { UsersService } from 'src/users/users.service';
import { UserEntity } from 'src/users/users.entity';

@Injectable()
export class TransitionService {
  constructor(
    @InjectRepository(TransitionEntity)
    private readonly transitionRepo: Repository<TransitionEntity>,
    private readonly mtnService: MtnService,
    private readonly userService: UsersService
  ) {}

  async fetchPreviousTransitions(userId: number): Promise<TransitionEntity[]> {
    const transitionsList = [];
    const transitions: TransitionEntity[] = await this.transitionRepo.find({
      select: { amount: { amount: true }, sent_at: true },
      where: { user: { user_id: userId }, is_accepted: true, is_success: true },
      relations: {
        amount: true,
      },
    });
    transitions.forEach((transition) => {
      transitionsList.push({
        points: transition.amount.amount,
        sentAt: transition.sent_at,
      });
    });
    return transitionsList;
  }
  async fixMtnPrePaid() {
    const users: UserEntity[] = await this.userService.getAllMtn();
    users.forEach(async (user) => {
      const isPrePaid = await this.mtnService.checkNumberType(user.mobile);
      if (isPrePaid === false) {
        await this.userService.setUserPostPaid(user.user_id);
      }
    });
  }
}
