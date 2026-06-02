import { CarrierCode } from '../enums/carrier-code.enum';
import { TrackingStatus } from '../enums/tracking-status.enum';

export class TrackingHistoryItemDto {
  time!: string;
  status!: TrackingStatus;
  statusText!: string;
  location?: string;
  description?: string;
}

export class TrackingResponseDto {
  carrier!: CarrierCode;
  carrierName!: string;
  trackingCode!: string;
  status!: TrackingStatus;
  statusText!: string;
  currentLocation?: string;
  estimatedDeliveryTime?: string;
  lastUpdatedAt?: string;
  history!: TrackingHistoryItemDto[];
}
