import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TrackingResponseDto } from '../dto/tracking.response.dto';
import {
  normalizeSpxVnPublicTracking,
} from './tracking-normalizer.util';
import { TrackingSource, TrackingSourceEmptyResultError } from './tracking-source.interface';
import { fetchJsonWithTimeout } from './source-http.util';

@Injectable()
export class SpxVnPublicSource implements TrackingSource {
  readonly name = 'spx.vn';

  constructor(private readonly config: ConfigService) {}

  isEnabled(): boolean {
    return this.config.get<boolean>('SPX_PUBLIC_SOURCE_ENABLED', true);
  }

  async track(trackingCode: string): Promise<TrackingResponseDto> {
    const baseUrl = this.config.get<string>(
      'SPX_PUBLIC_SOURCE_URL',
      'https://spx.vn/shipment/order/open/order/get_order_info',
    );
    const url = new URL(baseUrl);
    url.searchParams.set('spx_tn', trackingCode);
    url.searchParams.set('language_code', 'vi');

    const raw = await fetchJsonWithTimeout(
      url.toString(),
      this.name,
      this.config.get<number>('CARRIER_API_TIMEOUT_MS', 5000),
    );
    const normalized = normalizeSpxVnPublicTracking(trackingCode, this.name, raw);
    console.log(`Fetched tracking data from ${this.name} for code ${trackingCode}:`, normalized);

    if (!normalized) {
      throw new TrackingSourceEmptyResultError(this.name);
    }

    return normalized;
  }
}
