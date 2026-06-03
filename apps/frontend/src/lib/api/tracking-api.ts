import { CarrierOption, TrackingResponse } from '@/types/tracking';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

function apiUrl(path: string) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

export async function getCarriers(): Promise<CarrierOption[]> {
  const response = await fetch(apiUrl('/tracking/carriers'));

  if (!response.ok) {
    throw new Error('Không thể tải danh sách nhà vận chuyển');
  }

  return response.json();
}

export async function searchTracking(input: {
  carrier: string;
  trackingCode: string;
}): Promise<TrackingResponse> {
  const response = await fetch(apiUrl('/tracking/search'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => undefined);
    throw new Error(payload?.error?.message ?? 'Không thể tra cứu vận đơn');
  }

  return response.json();
}
