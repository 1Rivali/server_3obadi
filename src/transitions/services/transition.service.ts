import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UsersService } from "src/users/users.service";
import { Repository } from "typeorm";
import { AmountTypesEntity } from "../entities/amount-types.entity";
import { TransitionEntity } from "../entities/transitions.entity";
import { MtnService } from "./mtn.service";

@Injectable()
export class TransitionService {
  constructor(
    @InjectRepository(TransitionEntity)
    private readonly transitionRepo: Repository<TransitionEntity>,
    @InjectRepository(AmountTypesEntity)
    private readonly amountTypesRepo: Repository<AmountTypesEntity>,
    private readonly mtnService: MtnService,
    private readonly userService: UsersService
  ) {}

  async findAmountType(amount: number): Promise<AmountTypesEntity> {
    return await this.amountTypesRepo.findOne({
      where: { amount_type_id: amount },
    });
  }

  async findAllAmountTypes(): Promise<AmountTypesEntity[]> {
    return await this.amountTypesRepo.find({
      where: { is_active: true },
    });
  }

  async fetchPreviousTransitions(userId: number): Promise<TransitionEntity[]> {
    const transitionsList = [];
    const transitions: TransitionEntity[] = await this.transitionRepo.find({
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
}
