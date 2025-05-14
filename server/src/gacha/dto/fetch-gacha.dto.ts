import { IsUrl, IsOptional, IsInt, Min, Max } from 'class-validator';

export class FetchGachaDto {
  @IsUrl()
  url: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  size?: number;
}