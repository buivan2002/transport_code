import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SearchTrackingRequestDto } from '../dto/search-tracking.request.dto';
import { TrackingResponseDto } from '../dto/tracking.response.dto';
import { CarrierCode } from '../enums/carrier-code.enum';
import { TrackingStatus } from '../enums/tracking-status.enum';
import { JtTramavandonSource } from '../sources/jt-tramavandon.source';
import { buildNotFoundTracking } from '../sources/tracking-normalizer.util';
import { TrackingSourceEmptyResultError } from '../sources/tracking-source.interface';
import { CarrierStrategy } from './carrier-strategy.interface';

@Injectable()
export class JtHybridProvider implements CarrierStrategy {
  carrier = CarrierCode.JT;
  name = 'J&T Express';
  private readonly logger = new Logger(JtHybridProvider.name);

  constructor(
    private readonly config: ConfigService,
    private readonly jtTramavandonSource: JtTramavandonSource,
  ) {}

  isEnabled(): boolean {
    return this.config.get<boolean>('JT_ENABLED', true);
  }

  async track(input: SearchTrackingRequestDto): Promise<TrackingResponseDto> {
    if (!this.jtTramavandonSource.isEnabled()) {
      return this.buildSoftError(input.trackingCode, 'not-enabled');
    }

    try {
      const startedAt = Date.now();
      const result = await this.jtTramavandonSource.track(input.trackingCode);
      this.logger.log(
        `source_success carrier=${this.carrier} source=${result.source} latencyMs=${Date.now() - startedAt}`,
      );
      return result;
    } catch (error) {
      if (error instanceof TrackingSourceEmptyResultError) {
        return buildNotFoundTracking(
          this.carrier,
          this.name,
          input.trackingCode,
          this.jtTramavandonSource.name,
        );
      }

      this.logger.warn(`source_failed carrier=${this.carrier} source=${this.jtTramavandonSource.name}`);
      return this.buildSoftError(input.trackingCode, this.jtTramavandonSource.name);
    }
  }

  private buildSoftError(trackingCode: string, source: string): TrackingResponseDto {
    return {
      carrier: this.carrier,
      carrierName: this.name,
      trackingCode,
      status: TrackingStatus.UNKNOWN,
      statusText: 'Nguồn tra cứu J&T đang tạm thời lỗi, vui lòng thử lại sau',
      source,
      cached: false,
      history: [],
    };
  }
}
