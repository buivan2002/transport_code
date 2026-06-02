import { TrackingResponse } from '@/types/tracking';

type Props = {
  result: TrackingResponse;
};

export function TrackingResult({ result }: Props) {
  return (
    <section className="mt-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-sm text-slate-500">{result.carrierName}</div>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold">{result.trackingCode}</h2>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            {result.statusText}
          </span>
        </div>

        <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          {result.currentLocation && <div>Vị trí hiện tại: {result.currentLocation}</div>}
          {result.estimatedDeliveryTime && (
            <div>Dự kiến giao: {formatDate(result.estimatedDeliveryTime)}</div>
          )}
          {result.lastUpdatedAt && <div>Cập nhật lúc: {formatDate(result.lastUpdatedAt)}</div>}
        </div>
      </div>

      <ol className="mt-5 space-y-4">
        {result.history.map((item, index) => (
          <li
            key={`${item.time}-${index}`}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="text-sm text-slate-500">{formatDate(item.time)}</div>
            <div className="mt-1 font-medium">{item.statusText}</div>
            {item.location && <div className="mt-1 text-sm text-slate-600">{item.location}</div>}
            {item.description && (
              <div className="mt-1 text-sm text-slate-600">{item.description}</div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
