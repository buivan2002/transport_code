import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SearchTrackingRequestDto } from '../dto/search-tracking.request.dto';
import { TrackingResponseDto } from '../dto/tracking.response.dto';
import { CarrierCode } from '../enums/carrier-code.enum';
import { buildNotFoundTracking } from '../sources/tracking-normalizer.util';
import { SpxTramavandonSource } from '../sources/spx-tramavandon.source';
import { SpxVnPublicSource } from '../sources/spx-vn-public.source';
import { TrackingSource, TrackingSourceEmptyResultError } from '../sources/tracking-source.interface';
import { CarrierStrategy } from './carrier-strategy.interface';

@Injectable()
export class SpxHybridProvider implements CarrierStrategy {
  carrier = CarrierCode.SPX;
  name = 'SPX Express';
  private readonly logger = new Logger(SpxHybridProvider.name);

  constructor(
    private readonly config: ConfigService,
    private readonly spxVnPublicSource: SpxVnPublicSource,
    private readonly spxTramavandonSource: SpxTramavandonSource,
  ) {}

  isEnabled(): boolean {
    return this.config.get<boolean>('SPX_ENABLED', true);
  }

  async track(input: SearchTrackingRequestDto): Promise<TrackingResponseDto> {
    const sources = [this.spxVnPublicSource, this.spxTramavandonSource].filter((source) =>
      source.isEnabled(),
    );
    const emptySources: string[] = [];
    const errors: string[] = [];

    for (const source of sources) {
      try {
        return await this.trackWithSource(source, input.trackingCode);
      } catch (error) {
        if (error instanceof TrackingSourceEmptyResultError) {
          emptySources.push(source.name);
          continue;
        }

        errors.push(source.name);
        this.logger.warn(`source_failed carrier=${this.carrier} source=${source.name}`);
      }
    }

    if (emptySources.length > 0 && errors.length === 0) {
      return buildNotFoundTracking(
        this.carrier,
        this.name,
        input.trackingCode,
        emptySources.join(','),
      );
    }

    throw new ServiceUnavailableException({
      error: {
        code: 'ALL_TRACKING_SOURCES_FAILED',
        message: 'Các nguồn tra cứu SPX đang tạm thời lỗi',
        carrier: this.carrier,
        sources: errors,
      },
    });
  }

  private async trackWithSource(
    source: TrackingSource,
    trackingCode: string,
  ): Promise<TrackingResponseDto> {
    const startedAt = Date.now();
    const result = await source.track(trackingCode);
    this.logger.log(
      `source_success carrier=${this.carrier} source=${source.name} latencyMs=${Date.now() - startedAt}`,
    );
    return result;
  }
}
