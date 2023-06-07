import { IsPhoneNumber, IsString, Length } from 'class-validator';

export class RequestPasswordResetDto {
  @IsPhoneNumber('SY')
  readonly mobile: string;
}
