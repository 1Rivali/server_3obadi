import { IsString, Length } from 'class-validator';
import { Express } from 'express';

export class ConsumeBarcodeDto {
  @Length(36, 36)
  @IsString()
  code: string;
}
