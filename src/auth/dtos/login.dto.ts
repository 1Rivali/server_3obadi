import { IsPhoneNumber, IsString, Length } from 'class-validator';

export class LoginDto {
  @IsPhoneNumber('SY')
  readonly mobile: string;

  @IsString()
  @Length(8, 35)
  readonly password: string;
}
