import { IsPhoneNumber } from 'class-validator';

export class RequestPasswordResetDto {
  @IsPhoneNumber('SY')
  readonly mobile: string;
}
