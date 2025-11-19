import { SimProviderEnum } from 'src/users/users.entity';

export type Sms = {
  code: string;
  mobile: string;
  simProvider: SimProviderEnum;
};
