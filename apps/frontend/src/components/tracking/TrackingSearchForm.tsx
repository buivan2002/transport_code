'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { getCarriers, searchTracking } from '@/lib/api/tracking-api';
import { CarrierOption, TrackingResponse } from '@/types/tracking';
import { TrackingResult } from './TrackingResult';

const FALLBACK_CARRIER_NAME: Record<string, string> = {
  ghtk: 'Giao Hàng Tiết Kiệm',
  ghn: 'Giao Hàng Nhanh',
};

export function TrackingSearchForm() {
  const [trackingCode, setTrackingCode] = useState('');
  const [carrier, setCarrier] = useState('');
  const [carriers, setCarriers] = useState<CarrierOption[]>([]);
  const [result, setResult] = useState<TrackingResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [carrierLoading, setCarrierLoading] = useState(true);

  useEffect(() => {
    getCarriers()
      .then((items) => {
        setCarriers(items);
        setCarrier(items[0]?.code ?? '');
      })
      .catch(() => setError('Không thể tải danh sách nhà vận chuyển.'))
      .finally(() => setCarrierLoading(false));
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
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tra cứu.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Transport Express">
          <span className="brand-mark">TE</span>
          <span className="brand-name">Transport Express</span>
        </a>
        <nav className="topnav" aria-label="Điều hướng chính">
          <a href="#lookup">Tra cứu</a>
          <a href="#carriers">Nhà vận chuyển</a>
          <a href="#process">Quy trình</a>
        </nav>
      </header>

      <section id="top" className="hero">
        <div className="hero-backdrop" aria-hidden="true" />
        <div className="hero-content">
          <div className="hero-copy">
            <p className="eyebrow">Theo dõi đơn hàng nhanh</p>
            <h1>Tra cứu mã vận đơn trong một màn hình.</h1>
            <p>
              Chọn nhà vận chuyển, nhập mã vận đơn và xem trạng thái mới nhất từ API của hệ
              thống.
            </p>
            <div className="hero-points" aria-label="Điểm nổi bật">
              <span>Cập nhật theo thời gian API</span>
              <span>Hỗ trợ nhiều carrier</span>
              <span>Timeline rõ ràng</span>
            </div>
          </div>

          <section id="lookup" className="lookup-panel" aria-label="Tra cứu mã vận đơn">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Tracking</p>
                <h2>Theo dõi vận đơn</h2>
              </div>
              <span className="live-pill">Online</span>
            </div>

            <form onSubmit={handleSubmit} className="tracking-form">
              <label>
                <span>Mã vận đơn</span>
                <input
                  value={trackingCode}
                  onChange={(event) => setTrackingCode(event.target.value)}
                  placeholder="VD: S123456789"
                  autoComplete="off"
                />
              </label>

              <label>
                <span>Nhà vận chuyển</span>
                <select
                  value={carrier}
                  onChange={(event) => setCarrier(event.target.value)}
                  disabled={carrierLoading || carriers.length === 0}
                >
                  {carrierLoading && <option>Đang tải...</option>}
                  {!carrierLoading && carriers.length === 0 && <option>Chưa có carrier</option>}
                  {carriers.map((item) => (
                    <option key={item.code} value={item.code}>
                      {displayCarrierName(item)}
                    </option>
                  ))}
                </select>
              </label>

              <button type="submit" disabled={!canSubmit}>
                {loading ? 'Đang tra cứu' : 'Tra cứu ngay'}
              </button>
            </form>

            {error && <div className="alert alert-error">{error}</div>}

            {!result && !error && (
              <div className="empty-state">
                Kết quả sẽ hiển thị tại đây sau khi bạn tra cứu thành công.
              </div>
            )}
          </section>
        </div>
      </section>

      <div className="content-wrap">
        {result && <TrackingResult result={result} />}

        <section id="carriers" className="section-band">
          <div className="section-heading">
            <p className="eyebrow">Kết nối API</p>
            <h2>Nhà vận chuyển đang hỗ trợ</h2>
          </div>
          <div className="carrier-grid">
            {carriers.map((item) => (
              <article key={item.code} className="carrier-card">
                <span className="carrier-avatar">{item.code.slice(0, 2).toUpperCase()}</span>
                <div>
                  <h3>{displayCarrierName(item)}</h3>
                  <p>Sẵn sàng tra cứu qua endpoint tracking hiện có.</p>
                </div>
              </article>
            ))}
            {!carrierLoading && carriers.length === 0 && (
              <article className="carrier-card carrier-card-muted">
                <span className="carrier-avatar">API</span>
                <div>
                  <h3>Chưa có nhà vận chuyển</h3>
                  <p>Kiểm tra lại backend hoặc biến môi trường API.</p>
                </div>
              </article>
            )}
          </div>
        </section>

        <section id="process" className="process-strip" aria-label="Quy trình tra cứu">
          <div>
            <span>01</span>
            <strong>Chọn carrier</strong>
            <p>Lấy danh sách nhà vận chuyển từ API.</p>
          </div>
          <div>
            <span>02</span>
            <strong>Nhập mã vận đơn</strong>
            <p>Gửi yêu cầu tra cứu tới backend.</p>
          </div>
          <div>
            <span>03</span>
            <strong>Xem trạng thái</strong>
            <p>Hiển thị vị trí, dự kiến giao và lịch sử.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function displayCarrierName(item: CarrierOption) {
  return item.name || FALLBACK_CARRIER_NAME[item.code] || item.code.toUpperCase();
}
