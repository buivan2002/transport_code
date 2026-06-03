import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SearchTrackingRequestDto } from '../dto/search-tracking.request.dto';
import { TrackingResponseDto } from '../dto/tracking.response.dto';
import { CarrierCode } from '../enums/carrier-code.enum';
import { TrackingStatus } from '../enums/tracking-status.enum';
import { CarrierStrategy } from './carrier-strategy.interface';

type RawGhtkTracking = {
  status?: string;
  status_text?: string;
  current_location?: string;
  estimated_delivery_time?: string;
  updated_at?: string;
  history?: Array<{
    time: string;
    status: string;
    status_text?: string;
    location?: string;
    description?: string;
  }>;
};

@Injectable()
export class GhtkTrackingProvider implements CarrierStrategy {
  carrier = CarrierCode.GHTK;
  name = 'Giao Hàng Tiết Kiệm';

  constructor(private config: ConfigService) {}

  isEnabled(): boolean {
    return this.config.get<boolean>('GHTK_ENABLED', true);
  }

  async track(input: SearchTrackingRequestDto): Promise<TrackingResponseDto> {
    if (this.config.get<boolean>('GHTK_MOCK_MODE', true)) {
      return this.mapToTrackingResponse(input.trackingCode, this.getMockTracking(input.trackingCode));
    }

    const baseUrl = this.config.get<string>('GHTK_API_BASE_URL');
    const token = this.config.get<string>('GHTK_API_TOKEN');

    if (!baseUrl || !token) {
      throw new ServiceUnavailableException({
        error: {
          code: 'CARRIER_CONFIG_MISSING',
          message: 'Thiếu cấu hình API nhà vận chuyển',
          carrier: this.carrier,
        },
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.get<number>('CARRIER_API_TIMEOUT_MS', 5000),
    );

    try {
      const response = await fetch(`${baseUrl}/tracking/${encodeURIComponent(input.trackingCode)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      if (response.status === 404) {
        throw new NotFoundException({
          error: {
            code: 'TRACKING_NOT_FOUND',
            message: 'Không tìm thấy mã vận đơn',
            carrier: this.carrier,
            trackingCode: input.trackingCode,
          },
        });
      }

      if (!response.ok) {
        throw new ServiceUnavailableException({
          error: {
            code: 'CARRIER_API_ERROR',
            message: 'API nhà vận chuyển đang lỗi',
            carrier: this.carrier,
          },
        });
      }

      const raw = (await response.json()) as RawGhtkTracking;
      return this.mapToTrackingResponse(input.trackingCode, raw);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ServiceUnavailableException) {
        throw error;
      }

      throw new ServiceUnavailableException({
        error: {
          code: 'CARRIER_TIMEOUT_OR_UNAVAILABLE',
          message: 'Không thể kết nối API nhà vận chuyển',
          carrier: this.carrier,
        },
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private mapToTrackingResponse(
    trackingCode: string,
    raw: RawGhtkTracking,
  ): TrackingResponseDto {
    const status = this.mapStatus(raw.status);

    return {
      carrier: this.carrier,
      carrierName: this.name,
      trackingCode,
      status,
      statusText: raw.status_text ?? this.getStatusText(status),
      currentLocation: raw.current_location,
      estimatedDeliveryTime: raw.estimated_delivery_time,
      lastUpdatedAt: raw.updated_at,
      history: (raw.history ?? []).map((item) => {
        const itemStatus = this.mapStatus(item.status);

        return {
          time: item.time,
          status: itemStatus,
          statusText: item.status_text ?? this.getStatusText(itemStatus),
          location: item.location,
          description: item.description,
        };
      }),
    };
  }

  private mapStatus(rawStatus?: string): TrackingStatus {
    const map: Record<string, TrackingStatus> = {
      created: TrackingStatus.CREATED,
      picked: TrackingStatus.PICKED_UP,
      shipping: TrackingStatus.IN_TRANSIT,
      delivering: TrackingStatus.OUT_FOR_DELIVERY,
      delivered: TrackingStatus.DELIVERED,
      failed: TrackingStatus.DELIVERY_FAILED,
      returned: TrackingStatus.RETURNED,
      cancelled: TrackingStatus.CANCELLED,
    };

    return rawStatus ? map[rawStatus] ?? TrackingStatus.UNKNOWN : TrackingStatus.UNKNOWN;
  }

  private getStatusText(status: TrackingStatus): string {
    const map: Partial<Record<TrackingStatus, string>> = {
      [TrackingStatus.CREATED]: 'Đã tạo đơn',
      [TrackingStatus.PICKED_UP]: 'Đã lấy hàng',
      [TrackingStatus.IN_TRANSIT]: 'Đang vận chuyển',
      [TrackingStatus.OUT_FOR_DELIVERY]: 'Đang giao hàng',
      [TrackingStatus.DELIVERED]: 'Đã giao hàng',
      [TrackingStatus.DELIVERY_FAILED]: 'Giao hàng thất bại',
      [TrackingStatus.RETURNING]: 'Đang hoàn hàng',
      [TrackingStatus.RETURNED]: 'Đã hoàn hàng',
      [TrackingStatus.CANCELLED]: 'Đã hủy',
      [TrackingStatus.UNKNOWN]: 'Không xác định',
    };

    return map[status] ?? 'Khong xac dinh';
  }

  private getMockTracking(trackingCode: string): RawGhtkTracking {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return {
      status: 'shipping',
      status_text: 'Đang vận chuyển',
      current_location: 'Kho trung chuyển Hà Nội',
      estimated_delivery_time: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      updated_at: now.toISOString(),
      history: [
        {
          time: yesterday.toISOString(),
          status: 'created',
          status_text: 'Đã tạo đơn hàng',
          location: 'Hà Nội',
          description: `Đơn ${trackingCode} đã được ghi nhận trên hệ thống`,
        },
        {
          time: oneHourAgo.toISOString(),
          status: 'picked',
          status_text: 'Đã lấy hàng',
          location: 'Hà Nội',
        },
        {
          time: now.toISOString(),
          status: 'shipping',
          status_text: 'Đang vận chuyển',
          location: 'Kho trung chuyển Hà Nội',
        },
      ],
    };
  }
}
