import { IsPhoneNumber, IsString, Length } from "class-validator";

export class RedeemBarcodeByPhoneNumberDto {
  @Length(36, 36)
  @IsString()
  code: string;

  @IsPhoneNumber("SY")
  readonly mobile: string;
}
