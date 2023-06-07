import { IsMobilePhone } from 'class-validator';

export class MobileVerifyDto {
  @IsMobilePhone('ar-SY')
  readonly mobile: string;
}
