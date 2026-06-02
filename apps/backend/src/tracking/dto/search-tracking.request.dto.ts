import { IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';
import { CarrierCode } from '../enums/carrier-code.enum';

export class SearchTrackingRequestDto {
  @IsEnum(CarrierCode)
  carrier!: CarrierCode;

  @IsString()
  @Length(6, 64)
  @Matches(/^[A-Za-z0-9._-]+$/)
  trackingCode!: string;

  @IsOptional()
  @IsString()
  locale?: 'vi' | 'en';
}
