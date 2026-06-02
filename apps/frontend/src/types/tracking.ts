export type CarrierCode = 'ghtk' | 'ghn';

export type TrackingStatus =
  | 'created'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'delivery_failed'
  | 'returning'
  | 'returned'
  | 'cancelled'
  | 'unknown';

export type CarrierOption = {
  code: CarrierCode;
  name: string;
};

export type TrackingHistoryItem = {
  time: string;
  status: TrackingStatus;
  statusText: string;
  location?: string;
  description?: string;
};

export type TrackingResponse = {
  carrier: CarrierCode;
  carrierName: string;
  trackingCode: string;
  status: TrackingStatus;
  statusText: string;
  currentLocation?: string;
  estimatedDeliveryTime?: string;
  lastUpdatedAt?: string;
  history: TrackingHistoryItem[];
};
