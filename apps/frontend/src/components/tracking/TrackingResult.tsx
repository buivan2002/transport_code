import { TrackingResponse, TrackingStatus } from '@/types/tracking';

type Props = {
  result: TrackingResponse;
};

const STATUS_CLASS: Record<TrackingStatus, string> = {
  created: 'status-neutral',
  picked_up: 'status-info',
  in_transit: 'status-warning',
  out_for_delivery: 'status-warning',
  delivered: 'status-success',
  delivery_failed: 'status-danger',
  returning: 'status-danger',
  returned: 'status-neutral',
  cancelled: 'status-danger',
  unknown: 'status-neutral',
};

export function TrackingResult({ result }: Props) {
  return (
    <section className="result-section" aria-label="Kết quả tra cứu">
      <div className="result-summary">
        <div>
          <p className="panel-kicker">{result.carrierName}</p>
          <div className="result-title-row">
            <h2>{result.trackingCode}</h2>
            <span className={`status-badge ${STATUS_CLASS[result.status]}`}>
              {result.statusText}
            </span>
          </div>
        </div>

        <dl className="result-meta">
          {result.currentLocation && (
            <div>
              <dt>Vị trí hiện tại</dt>
              <dd>{result.currentLocation}</dd>
            </div>
          )}
          {result.estimatedDeliveryTime && (
            <div>
              <dt>Dự kiến giao</dt>
              <dd>{formatDate(result.estimatedDeliveryTime)}</dd>
            </div>
          )}
          {result.lastUpdatedAt && (
            <div>
              <dt>Cập nhật lúc</dt>
              <dd>{formatDate(result.lastUpdatedAt)}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="timeline-panel">
        <div className="timeline-heading">
          <h3>Lịch sử vận chuyển</h3>
          <span>{result.history.length} cập nhật</span>
        </div>

        {result.history.length > 0 ? (
          <ol className="timeline">
            {result.history.map((item, index) => (
              <li key={`${item.time}-${index}`} className="timeline-item">
                <span className="timeline-dot" aria-hidden="true" />
                <div className="timeline-content">
                  <time>{formatDate(item.time)}</time>
                  <strong>{item.statusText}</strong>
                  {item.location && <p>{item.location}</p>}
                  {item.description && <p>{item.description}</p>}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="empty-state">Chưa có lịch sử vận chuyển cho mã này.</div>
        )}
      </div>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
