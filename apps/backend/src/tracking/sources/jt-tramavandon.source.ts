import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TrackingResponseDto } from '../dto/tracking.response.dto';
import { CarrierCode } from '../enums/carrier-code.enum';
import { normalizePublicTracking } from './tracking-normalizer.util';
import { fetchJsonWithTimeout } from './source-http.util';
import { TrackingSource, TrackingSourceEmptyResultError } from './tracking-source.interface';

@Injectable()
export class JtTramavandonSource implements TrackingSource {
  readonly name = 'tramavandon-jt';
  private readonly carrierName = 'J&T Express';

  constructor(private readonly config: ConfigService) {}

  isEnabled(): boolean {
    return this.config.get<boolean>('JT_TRAMAVANDON_SOURCE_ENABLED', true);
  }

  async track(trackingCode: string): Promise<TrackingResponseDto> {
    const raw = await this.fetchTramavandon(trackingCode);
    const normalized = normalizePublicTracking(
      CarrierCode.JT,
      this.carrierName,
      trackingCode,
      this.name,
      raw,
    );

    if (!normalized) {
      throw new TrackingSourceEmptyResultError(this.name);
    }

    return normalized;
  }

  private async fetchTramavandon(trackingCode: string): Promise<unknown> {
    const baseUrl = this.config.get<string>(
      'JT_TRAMAVANDON_SOURCE_URL',
      'https://tramavandon.com/api/jtexpress.php',
    );
    const timeoutMs = this.config.get<number>('CARRIER_API_TIMEOUT_MS', 5000);
    const url = new URL(baseUrl);
    url.searchParams.set('tracking_code', trackingCode);

    try {
      return await fetchJsonWithTimeout(url.toString(), this.name, timeoutMs);
    } catch {
      const body = new URLSearchParams();
      body.set('tracking_code', trackingCode);
      body.set('bill', trackingCode);
      body.set('code', trackingCode);
      body.set('id', trackingCode);

      return fetchJsonWithTimeout(baseUrl, this.name, timeoutMs, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });
    }
  }
}
