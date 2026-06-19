import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateAgentDto {
  @IsString()
  @IsNotEmpty()
  agent_name: string;

  @IsOptional()
  @IsString()
  agent_logo?: string;

  @IsOptional()
  @IsString()
  agent_primary_color?: string;
}
