import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class SelectWorldDto {
  @IsString()
  worldSource: string;

  @IsString()
  worldLevelName: string;

  @IsBoolean()
  @IsOptional()
  forceWorldCopy?: boolean;

  @IsBoolean()
  @IsOptional()
  restartIfRunning?: boolean;
}
