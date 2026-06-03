import { Injectable } from '@nestjs/common';
import { CarrierRegistry } from './carriers/carrier-registry';
import { SearchTrackingRequestDto } from './dto/search-tracking.request.dto';
import { TrackingCacheService } from './tracking-cache.service';

@Injectable()
export class TrackingService {
  constructor(
    private carrierRegistry: CarrierRegistry,
    private trackingCacheService: TrackingCacheService,
  ) {}

  getCarriers() {
    return this.carrierRegistry.listEnabled();
  }

  search(input: SearchTrackingRequestDto) {
    const trackingCode = input.trackingCode.trim();
    const cached = this.trackingCacheService.get(input.carrier, trackingCode);
    console.log(`Cache ${cached ? 'hit' : 'miss'} for carrier ${cached} code ${trackingCode}`);
    if (cached) {
      return cached;
    }

    const provider = this.carrierRegistry.get(input.carrier);
    console.log(`Tracking with provider ${provider.name} for carrier ${input.carrier} code ${trackingCode}`);
    const result = provider.track({
      ...input,
      trackingCode,
    });

    return result.then((tracking) => this.trackingCacheService.set(tracking, trackingCode));
  }
}
