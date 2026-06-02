import { Injectable } from '@nestjs/common';
import { CarrierRegistry } from './carriers/carrier-registry';
import { SearchTrackingRequestDto } from './dto/search-tracking.request.dto';

@Injectable()
export class TrackingService {
  constructor(private carrierRegistry: CarrierRegistry) {}

  getCarriers() {
    return this.carrierRegistry.listEnabled();
  }

  search(input: SearchTrackingRequestDto) {
    const provider = this.carrierRegistry.get(input.carrier);

    return provider.track({
      ...input,
      trackingCode: input.trackingCode.trim(),
    });
  }
}
