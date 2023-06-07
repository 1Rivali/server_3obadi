import { IsString, Length } from 'class-validator';

export class ConsumeBarcodeDto {
  @Length(36, 36)
  @IsString()
  code: string;
}
