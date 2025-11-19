import { IsString, IsPhoneNumber, Length } from 'class-validator';

export class AuthDto {
  @IsString()
  readonly name: string;

  @IsPhoneNumber('SY')
  mobile: string;

  @IsString()
  @Length(8, 35)
  readonly password: string;
}
