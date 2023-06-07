import { IsString } from 'class-validator';

export class StartTransitionDto {
  @IsString()
  readonly location: string;

  readonly amount: number;
}
