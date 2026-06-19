import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { AwardTypeEnum } from "src/barcodes/entities/award.entity";

export class UpdateAwardDto {
  @IsOptional()
  @IsEnum(AwardTypeEnum)
  award_type?: AwardTypeEnum;

  @IsOptional()
  @IsString()
  award_value?: string;

  @IsOptional()
  @IsNumber()
  percentage?: number;

  @IsOptional()
  @IsString()
  award_description?: string;
}
