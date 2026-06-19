import { IsOptional, IsString } from "class-validator";

export class UpdateAgentDto {
  @IsOptional()
  @IsString()
  agent_name?: string;

  @IsOptional()
  @IsString()
  agent_logo?: string;

  @IsOptional()
  @IsString()
  agent_primary_color?: string;
}
