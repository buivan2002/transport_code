import { SearchTrackingRequestDto } from '../dto/search-tracking.request.dto';
import { TrackingResponseDto } from '../dto/tracking.response.dto';
import { CarrierCode } from '../enums/carrier-code.enum';

export interface CarrierStrategy {
  carrier: CarrierCode;
  name: string;
  isEnabled(): boolean;
  track(input: SearchTrackingRequestDto): Promise<TrackingResponseDto>;
}
