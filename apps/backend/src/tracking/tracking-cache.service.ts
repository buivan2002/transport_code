import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TrackingResponseDto } from './dto/tracking.response.dto';
import { CarrierCode } from './enums/carrier-code.enum';
import { TrackingStatus } from './enums/tracking-status.enum';

type CacheEntry = {
  expiresAt: number;
  value: TrackingResponseDto;
};

@Injectable()
export class TrackingCacheService {
  private readonly logger = new Logger(TrackingCacheService.name);
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly config: ConfigService) {}

  get(carrier: CarrierCode, trackingCode: string): TrackingResponseDto | undefined {
    const key = this.buildKey(carrier, trackingCode);
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return undefined;
    }

    return {
      ...entry.value,
      cached: true,
    };
  }

  set(value: TrackingResponseDto, requestedTrackingCode = value.trackingCode): TrackingResponseDto {
    console.log(`Caching tracking result for carrier ${value.carrier} code ${requestedTrackingCode} with status ${value.status}`);
    const ttlSeconds = this.resolveTtlSeconds(value.status);
    const cacheValue = {
      ...value,
      cached: false,
    };

    this.write(value.carrier, requestedTrackingCode, ttlSeconds, cacheValue);

    if (requestedTrackingCode.trim().toUpperCase() !== value.trackingCode.trim().toUpperCase()) {
      this.write(value.carrier, value.trackingCode, ttlSeconds, cacheValue);
    }

    return {
      ...value,
      cached: false,
    };
  }

  private write(
    carrier: CarrierCode,
    trackingCode: string,
    ttlSeconds: number,
    value: TrackingResponseDto,
  ): void {
    const key = this.buildKey(carrier, trackingCode);
    this.logger.debug(
      `cache_set carrier=${carrier} trackingCode=${trackingCode} key=${key} ttlSeconds=${ttlSeconds}`,
    );
    this.cache.set(key, {
      expiresAt: Date.now() + ttlSeconds * 1000,
      value,
    });
  }

  private buildKey(carrier: CarrierCode, trackingCode: string): string {
    return `tracking:${carrier}:${trackingCode.trim().toUpperCase()}`;
  }

  private resolveTtlSeconds(status: TrackingStatus): number {
    if (status === TrackingStatus.NOT_FOUND) {
      return this.config.get<number>('TRACKING_CACHE_NOT_FOUND_TTL_SECONDS', 300);
    }

    if (
      status === TrackingStatus.DELIVERED ||
      status === TrackingStatus.RETURNED ||
      status === TrackingStatus.CANCELLED
    ) {
      return this.config.get<number>('TRACKING_CACHE_FINAL_TTL_SECONDS', 186400);
    }

    return this.config.get<number>('TRACKING_CACHE_IN_TRANSIT_TTL_SECONDS', 300);
  }
}
