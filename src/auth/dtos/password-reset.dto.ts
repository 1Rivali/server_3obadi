import { IsPhoneNumber, IsString, Length } from 'class-validator';

export class PasswordResetDto {
  @IsPhoneNumber('SY')
  readonly mobile: string;

  @IsString()
  @Length(6, 6)
  readonly code: string;

  @IsString()
  @Length(8, 50)
  readonly newPassword: string;
}
