'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { getCarriers, searchTracking } from '@/lib/api/tracking-api';
import { CarrierOption, TrackingResponse } from '@/types/tracking';
import { TrackingResult } from './TrackingResult';

export function TrackingSearchForm() {
  const [trackingCode, setTrackingCode] = useState('');
  const [carrier, setCarrier] = useState('');
  const [carriers, setCarriers] = useState<CarrierOption[]>([]);
  const [result, setResult] = useState<TrackingResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCarriers()
      .then((items) => {
        setCarriers(items);
        setCarrier(items[0]?.code ?? '');
      })
      .catch(() => setError('Không thể tải danh sách nhà vận chuyển'));
  }, []);

  const canSubmit = useMemo(() => {
    return !loading && Boolean(carrier) && trackingCode.trim().length >= 6;
  }, [carrier, loading, trackingCode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await searchTracking({
        carrier,
        trackingCode: trackingCode.trim(),
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tra cứu');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold">Tra cứu vận đơn</h1>
          <p className="mt-2 text-sm text-slate-600">
            Nhập mã vận đơn và chọn nhà vận chuyển để xem trạng thái mới nhất.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_220px_120px]"
        >
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Mã vận đơn</span>
            <input
              value={trackingCode}
              onChange={(event) => setTrackingCode(event.target.value)}
              placeholder="VD: S123456789"
              className="h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-slate-900"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Nhà vận chuyển</span>
            <select
              value={carrier}
              onChange={(event) => setCarrier(event.target.value)}
              className="h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-slate-900"
            >
              {carriers.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <button
            disabled={!canSubmit}
            className="mt-6 h-11 rounded-md bg-slate-950 px-4 font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? 'Đang tìm' : 'Tìm kiếm'}
          </button>
        </form>

        {!result && !error && (
          <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
            Kết quả tra cứu sẽ hiển thị tại đây.
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && <TrackingResult result={result} />}
      </div>
    </main>
  );
}
