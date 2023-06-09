import {
  Injectable,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AwardEntity } from '../entities/award.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AwardService {
  constructor(
    @InjectRepository(AwardEntity)
    private readonly awardRepo: Repository<AwardEntity>,
  ) {}

  async findAward(awardValue: string): Promise<AwardEntity> {
    const award: AwardEntity = await this.awardRepo.findOne({
      where: {
        award_value: awardValue,
      },
    });
    if (award) return award;
    throw new HttpException('Award not found', HttpStatus.BAD_REQUEST);
  }

  async findAwardById(awardId: number): Promise<AwardEntity> {
    const award: AwardEntity = await this.awardRepo.findOne({
      where: {
        award_id: awardId,
      },
    });
    if (award) return award;
    throw new HttpException('Award not found', HttpStatus.BAD_REQUEST);
  }

  async fetchAwards(): Promise<AwardEntity[]> {
    const awards: AwardEntity[] = await this.awardRepo.find({
      select: { award_value: true, percentage: true },
    });
   
    if (awards) return awards;
    throw new InternalServerErrorException();
  }
}
