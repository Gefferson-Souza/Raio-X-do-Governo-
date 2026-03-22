import { Type } from 'class-transformer'
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator'

export class SearchPoliticiansDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string

  @IsOptional()
  @IsIn(['camara', 'senado', 'all'])
  house?: string = 'all'

  @IsOptional()
  @IsString()
  @MaxLength(200)
  party?: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  state?: string

  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  @Type(() => Number)
  year?: number

  @IsOptional()
  @IsIn(['spending_desc', 'spending_asc', 'name_asc', 'name_desc'])
  sort?: string = 'spending_desc'

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 20
}

export class PoliticianYearDto {
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  @Type(() => Number)
  year?: number
}
