import { IsEnum, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { AwardTypeEnum } from "src/barcodes/entities/award.entity";

export class CreateAwardDto {
  @IsEnum(AwardTypeEnum)
  award_type: AwardTypeEnum;

  @IsString()
  @IsNotEmpty()
  award_value: string;

  @IsNumber()
  percentage: number;

  @IsString()
  @IsNotEmpty()
  award_description: string;
}
