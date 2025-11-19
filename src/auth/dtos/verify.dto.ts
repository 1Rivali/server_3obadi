import { IsPhoneNumber, IsString, Length } from 'class-validator';

export class VerifyDto {
  @IsPhoneNumber('SY')
  readonly mobile: string;

  @IsString()
  @Length(6, 6)
  readonly code: string;
}
