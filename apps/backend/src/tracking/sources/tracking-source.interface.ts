import { TrackingResponseDto } from '../dto/tracking.response.dto';

export interface TrackingSource {
  readonly name: string;
  isEnabled(): boolean;
  track(trackingCode: string): Promise<TrackingResponseDto>;
}

export class TrackingSourceEmptyResultError extends Error {
  constructor(source: string) {
    super(`No tracking data returned by ${source}`);
    this.name = 'TrackingSourceEmptyResultError';
  }
}
