import { IsString } from 'class-validator';

export class CreateBarcodeDto {
  @IsString()
  award: string;
}
