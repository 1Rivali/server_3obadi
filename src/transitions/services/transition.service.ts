import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransitionEntity } from '../entities/transitions.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TransitionService {
  constructor(
    @InjectRepository(TransitionEntity)
    private readonly transitionRepo: Repository<TransitionEntity>,
  ) {}

  async fetchPreviousTransitions(userId: string): Promise<TransitionEntity[]> {
    const transitionsList = [];
    const transitions:TransitionEntity[] = await this.transitionRepo.find({select:{amount:{amount:true}, sent_at:true},
      where: { user: { user_id: userId }, is_accepted: true, is_success: true },
      relations:{
        amount:true,
      }
    });
    transitions.forEach((transition) => {
      transitionsList.push({
        points: transition.amount.amount,
        sentAt: transition.sent_at,
      });
    });
    return transitionsList;
  }
}
