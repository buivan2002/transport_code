import { CarrierCode } from '../enums/carrier-code.enum';
import { TrackingStatus } from '../enums/tracking-status.enum';
import { TrackingResponseDto } from '../dto/tracking.response.dto';

type HistoryCandidate = {
  time?: unknown;
  status?: unknown;
  statusText?: unknown;
  location?: unknown;
  description?: unknown;
};

const HISTORY_KEYS = [
  'history',
  'histories',
  'trackingHistory',
  'tracking_history',
  'tracking_list',
  'trackings',
  'logs',
  'journey',
  'events',
];

export function normalizePublicTracking(
  carrier: CarrierCode,
  carrierName: string,
  trackingCode: string,
  source: string,
  raw: unknown,
): TrackingResponseDto | undefined {
  if (isEmptyResult(raw)) {
    return undefined;
  }

  const root = pickDataRoot(raw);
  const historyRaw = findFirstArray(root, HISTORY_KEYS);
  const history = historyRaw.map((item) => normalizeHistoryItem(item)).filter((item) => item.time || item.statusText);
  const latest = history[0];
  const statusText =
    readString(root, ['statusText', 'status_text', 'status_desc', 'status_description', 'message']) ??
    latest?.statusText ??
    'Không xác định';
  const status = normalizeStatus(readString(root, ['status', 'status_code', 'state']) ?? statusText);

  return {
    carrier,
    carrierName,
    trackingCode,
    status,
    statusText,
    currentLocation:
      readString(root, ['currentLocation', 'current_location', 'location', 'current_station']) ??
      latest?.location,
    estimatedDeliveryTime: readString(root, [
      'estimatedDeliveryTime',
      'estimated_delivery_time',
      'estimate_delivery_time',
      'expected_delivery_time',
    ]),
    lastUpdatedAt:
      readString(root, ['lastUpdatedAt', 'last_updated_at', 'updated_at', 'update_time']) ?? latest?.time,
    source,
    cached: false,
    history,
  };
}

export function normalizeSpxVnPublicTracking(
  trackingCode: string,
  source: string,
  raw: unknown,
): TrackingResponseDto | undefined {
  const response = asRecord(raw);
  const retcode = response.retcode;

  if (retcode !== undefined && retcode !== 0 && retcode !== '0') {
    return undefined;
  }

  const data = asRecord(response.data);
  const slsTrackingInfo = asRecord(data.sls_tracking_info);
  const records = Array.isArray(slsTrackingInfo.records) ? slsTrackingInfo.records : [];

  if (records.length === 0) {
    return undefined;
  }

  const visibleRecords = records
    .map((record) => asRecord(record))
    .filter((record) => record.display_flag === 1 || record.display_flag === '1');
  const timelineRecords = visibleRecords.length > 0 ? visibleRecords : records.map((record) => asRecord(record));
  const history = timelineRecords.map((record) => normalizeSpxRecord(record));
  const latest = history[0];
  const latestRaw = timelineRecords[0];

  return {
    carrier: CarrierCode.SPX,
    carrierName: 'SPX Express',
    trackingCode: readString(slsTrackingInfo, ['sls_tn']) ?? trackingCode,
    status: latest?.status ?? TrackingStatus.UNKNOWN,
    statusText:
      readString(latestRaw, ['buyer_description', 'description', 'tracking_name', 'milestone_name']) ??
      latest?.statusText ??
      'Không xác định',
    currentLocation: latest?.location,
    lastUpdatedAt: latest?.time,
    source,
    cached: false,
    history,
  };
}

function normalizeSpxRecord(record: Record<string, unknown>): {
  time: string;
  status: TrackingStatus;
  statusText: string;
  location?: string;
  description?: string;
} {
  const milestoneName = readString(record, ['milestone_name']);
  const trackingName = readString(record, ['tracking_name']);
  const trackingCode = readString(record, ['tracking_code']);
  const buyerDescription = readString(record, ['buyer_description']);
  const description = readString(record, ['description']);
  const currentLocation = asRecord(record.current_location);
  const location =
    readString(currentLocation, ['location_name']) ??
    readString(currentLocation, ['full_address']);

  return {
    time: normalizeSpxTime(record.actual_time),
    status: normalizeSpxStatus({
      milestoneName,
      trackingName,
      trackingCode,
      description: buyerDescription ?? description,
    }),
    statusText: buyerDescription ?? description ?? trackingName ?? milestoneName ?? 'Không xác định',
    location,
    description: description ?? trackingName ?? milestoneName,
  };
}

function normalizeSpxStatus(input: {
  milestoneName?: string;
  trackingName?: string;
  trackingCode?: string;
  description?: string;
}): TrackingStatus {
  const text = `${input.milestoneName ?? ''} ${input.trackingName ?? ''} ${input.description ?? ''}`.toLowerCase();
  const code = input.trackingCode?.toUpperCase();

  if (code === 'F980' || includesAny(text, ['delivered', 'giao hàng thành công', 'giao hang thanh cong'])) {
    return TrackingStatus.DELIVERED;
  }

  if (code === 'F600' || includesAny(text, ['out for delivery', 'đang giao', 'dang giao'])) {
    return TrackingStatus.OUT_FOR_DELIVERY;
  }

  if (includesAny(text, ['return', 'returned', 'hoàn', 'hoan'])) {
    return TrackingStatus.RETURNED;
  }

  if (includesAny(text, ['cancel', 'hủy', 'huy'])) {
    return TrackingStatus.CANCELLED;
  }

  if (
    code === 'F000' ||
    code === 'A000' ||
    includesAny(text, ['manifested', 'preparing to ship', 'chuẩn bị', 'chuan bi', 'created'])
  ) {
    return TrackingStatus.INFO_RECEIVED;
  }

  if (
    code?.startsWith('F') ||
    includesAny(text, ['in transit', 'pickup', 'sorting', 'hub', 'truck', 'đã đến', 'da den', 'trung chuyển'])
  ) {
    return TrackingStatus.IN_TRANSIT;
  }

  return TrackingStatus.UNKNOWN;
}

function normalizeSpxTime(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value * 1000).toISOString();
  }

  if (typeof value === 'string' && value.trim()) {
    const numericValue = Number(value);

    if (Number.isFinite(numericValue)) {
      return new Date(numericValue * 1000).toISOString();
    }

    return value;
  }

  return '';
}

export function buildNotFoundTracking(
  carrier: CarrierCode,
  carrierName: string,
  trackingCode: string,
  source: string,
): TrackingResponseDto {
  return {
    carrier,
    carrierName,
    trackingCode,
    status: TrackingStatus.NOT_FOUND,
    statusText: 'Không tìm thấy mã vận đơn',
    source,
    cached: false,
    history: [],
  };
}

function normalizeHistoryItem(raw: unknown): {
  time: string;
  status: TrackingStatus;
  statusText: string;
  location?: string;
  description?: string;
} {
  const item = asRecord(raw);
  const candidate: HistoryCandidate = {
    time: readString(item, ['time', 'created_at', 'updated_at', 'update_time', 'date', 'datetime']),
    status: readString(item, ['status', 'status_code', 'state']),
    statusText: readString(item, ['statusText', 'status_text', 'status_desc', 'message', 'description', 'desc', 'content']),
    location: readString(item, ['location', 'station', 'warehouse', 'hub', 'current_location']),
    description: readString(item, ['description', 'desc', 'content', 'message']),
  };
  const statusText = String(candidate.statusText ?? candidate.status ?? 'Không xác định');

  return {
    time: String(candidate.time ?? ''),
    status: normalizeStatus(String(candidate.status ?? statusText)),
    statusText,
    location: candidate.location ? String(candidate.location) : undefined,
    description: candidate.description ? String(candidate.description) : undefined,
  };
}

function normalizeStatus(value?: string): TrackingStatus {
  const text = (value ?? '').toLowerCase();

  if (includesAny(text, ['not found', 'không tìm', 'khong tim', 'no data'])) {
    return TrackingStatus.NOT_FOUND;
  }

  if (includesAny(text, ['delivered', 'giao thành công', 'giao thanh cong', 'đã giao', 'da giao'])) {
    return TrackingStatus.DELIVERED;
  }

  if (includesAny(text, ['out for delivery', 'đang giao', 'dang giao'])) {
    return TrackingStatus.OUT_FOR_DELIVERY;
  }

  if (includesAny(text, ['returned', 'return', 'hoàn', 'hoan'])) {
    return TrackingStatus.RETURNED;
  }

  if (includesAny(text, ['cancel', 'hủy', 'huy'])) {
    return TrackingStatus.CANCELLED;
  }

  if (includesAny(text, ['picked', 'received', 'đã lấy', 'da lay', 'đã nhận', 'da nhan'])) {
    return TrackingStatus.INFO_RECEIVED;
  }

  if (includesAny(text, ['shipping', 'transport', 'transit', 'đang vận chuyển', 'dang van chuyen'])) {
    return TrackingStatus.IN_TRANSIT;
  }

  if (includesAny(text, ['pending', 'created', 'tạo đơn', 'tao don'])) {
    return TrackingStatus.PENDING;
  }

  return TrackingStatus.UNKNOWN;
}

function includesAny(text: string, values: string[]): boolean {
  return values.some((value) => text.includes(value));
}

function isEmptyResult(raw: unknown): boolean {
  if (raw === undefined || raw === null || raw === '') {
    return true;
  }

  if (typeof raw === 'string') {
    const text = raw.toLowerCase();
    return includesAny(text, ['not found', 'không tìm', 'khong tim', 'no data']);
  }

  const root = pickDataRoot(raw);
  const message = readString(root, ['message', 'msg', 'error', 'statusText', 'status_text']);
  const code = readString(root, ['code', 'retcode', 'status']);

  return includesAny(`${message ?? ''} ${code ?? ''}`.toLowerCase(), [
    'not found',
    'không tìm',
    'khong tim',
    'no data',
    '404',
  ]);
}

function pickDataRoot(raw: unknown): Record<string, unknown> {
  const record = asRecord(raw);

  for (const key of ['data', 'result', 'order_info', 'order', 'shipment']) {
    const value = record[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return pickDataRoot(value);
    }
  }

  return record;
}

function findFirstArray(root: Record<string, unknown>, keys: string[]): unknown[] {
  for (const key of keys) {
    const value = root[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  for (const value of Object.values(root)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = findFirstArray(asRecord(value), keys);
      if (nested.length > 0) {
        return nested;
      }
    }
  }

  return [];
}

function readString(root: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = root[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (typeof value === 'number') {
      return String(value);
    }
  }

  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}
