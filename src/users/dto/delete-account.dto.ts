import { IsString, Length } from "class-validator";

export class DeleteAccountDto {
  @IsString()
  @Length(8, 35)
  readonly password: string;
}
