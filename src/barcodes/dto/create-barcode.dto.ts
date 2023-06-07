import { IsString } from 'class-validator';
import { AwardEntity } from '../entities/award.entity';

export class CreateBarcodeDto {
  @IsString()
  award: string;
}
