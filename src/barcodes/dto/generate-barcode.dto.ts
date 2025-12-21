import { IsBoolean, IsNotEmpty, IsOptional } from "class-validator";

export class GenerateBarcodeDto {
  @IsNotEmpty()
  count: number;
  @IsNotEmpty()
  agent_id: number;
  @IsNotEmpty()
  award_id: number;
  @IsOptional()
  @IsBoolean()
  isMetalized?: boolean;
}
