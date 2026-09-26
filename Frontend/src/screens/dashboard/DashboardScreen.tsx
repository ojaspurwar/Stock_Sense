import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MobileStorage } from '../../services/storage';
import { ProductStockSummary, Document, Location } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Pill } from '../../components/ui/Pill';
import { GlassCard } from '../../components/ui/GlassCard';
import { SegmentedControl } from '../../components/ui/SegmentedControl';

export interface DashboardScreenProps {
  searchQuery?: string;
  filterType?: string;
  filterStatus?: string;
  filterWarehouse?: string;
  filterCategory?: string;
  onNavigate?: (route: any, params?: any) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  searchQuery = '',
  filterType = 'All',
  filterStatus = 'All',
  filterWarehouse = 'All',
  filterCategory = 'All',
  onNavigate,
}) => {
  const [products, setProducts] = useState<ProductStockSummary[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedRange, setSelectedRange] = useState<'Week' | 'Month' | 'Quarter' | 'Year'>('Month');
  const [productPickerOpen, setProductPickerOpen] = useState(false);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 800, height: 260 });

  // Load live data from storage
  const loadData = async () => {
    try {
      const locs = await MobileStorage.getLocations();
      setLocations(locs);

      let locIdFilter: string | undefined = undefined;
      if (filterWarehouse !== 'All') {
        const matched = locs.find((l) => l.name === filterWarehouse);
        if (matched) locIdFilter = matched.id;
      }

      const summaries = await MobileStorage.getProductStockSummaries(locIdFilter);
      setProducts(summaries);

      if (!selectedProductId && summaries.length > 0) {
        // Default: product with the most stock or moves
        const defaultProd =
          summaries.find((p) => p.sku === 'STL-ROD-012') || summaries[0];
        setSelectedProductId(defaultProd.id);
      }

      const docs = await MobileStorage.getDocuments(undefined, undefined, locIdFilter);
      setDocuments(docs);
    } catch (e) {
      console.error('Error loading dashboard data', e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 6000);
    return () => clearInterval(interval);
  }, [filterWarehouse]);

  // Handle Chart Resize
  useEffect(() => {
    const updateSize = () => {
      if (chartContainerRef.current) {
        setChartDimensions({
          width: chartContainerRef.current.clientWidth || 800,
          height: chartContainerRef.current.clientHeight || 260,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Selected Product
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || products[0];
  }, [products, selectedProductId]);

  // Filtered documents for recent operations table
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = doc.code.toLowerCase().includes(q);
        const matchesPartner = (doc.partner_name || '').toLowerCase().includes(q);
        const matchesLines = doc.lines.some(
          (l) => l.product_name.toLowerCase().includes(q) || l.sku.toLowerCase().includes(q)
        );
        if (!matchesCode && !matchesPartner && !matchesLines) return false;
      }

      // Type
      if (filterType !== 'All') {
        const map: { [key: string]: string } = {
          Receipts: 'RECEIPT',
          Delivery: 'DELIVERY',
          Internal: 'TRANSFER',
          Adjustments: 'ADJUSTMENT',
        };
        if (doc.type !== map[filterType]) return false;
      }

      // Status
      if (filterStatus !== 'All') {
        if (doc.status !== filterStatus.toUpperCase()) return false;
      }

      return true;
    });
  }, [documents, searchQuery, filterType, filterStatus]);

  // KPIs
  const totalProducts = products.length;
  const inStockCount = products.filter((p) => p.total_stock > 0).length;
  const lowStockProducts = products.filter((p) => p.is_low_stock);
  const outOfStockProducts = products.filter((p) => p.is_out_of_stock);
  const lowCount = lowStockProducts.length;
  const outCount = outOfStockProducts.length;

  const pendingReceipts = documents.filter(
    (d) => d.type === 'RECEIPT' && d.status !== 'DONE' && d.status !== 'CANCELED'
  ).length;
  const pendingDeliveries = documents.filter(
    (d) => d.type === 'DELIVERY' && d.status !== 'DONE' && d.status !== 'CANCELED'
  ).length;
  const scheduledTransfers = documents.filter(
    (d) => d.type === 'TRANSFER' && d.status !== 'DONE' && d.status !== 'CANCELED'
  ).length;

  // Multi-warehouse counts
  const warehouseBreakdown = useMemo(() => {
    const map: { [locId: string]: { name: string; count: number } } = {};
    locations.forEach((l) => {
      map[l.id] = { name: l.name, count: 0 };
    });

    products.forEach((prod) => {
      prod.location_breakdown.forEach((lb) => {
        if (lb.quantity > 0 && map[lb.location_id]) {
          map[lb.location_id].count += 1;
        }
      });
    });

    return Object.values(map);
  }, [locations, products]);

  // Low stock glass slides
  const lowStockSlides = useMemo(() => {
    const combined = [...lowStockProducts, ...outOfStockProducts];
    if (combined.length === 0) {
      return [
        {
          title: 'Stock Healthy',
          description: 'All items are currently at or above safe reorder levels.',
          meterPercent: 100,
          meterHot: false,
        },
      ];
    }

    return combined.map((p) => {
      const min = p.min_reorder_level || 50;
      const pct = Math.round((p.total_stock / (min * 2)) * 100);
      return {
        title: p.name,
        description: `${p.total_stock} ${p.unit_of_measure} left in stock. Reorder at ${min}.`,
        meterPercent: Math.max(5, pct),
        meterHot: true,
        actionText: 'Reorder',
        onAction: () => onNavigate?.('receipts'),
      };
    });
  }, [lowStockProducts, outOfStockProducts, onNavigate]);

  // Generate SVG Step Stock Chart for Selected Product
  const chartSvgContent = useMemo(() => {
    const W = chartDimensions.width;
    const H = chartDimensions.height;
    if (W <= 0 || H <= 0) return '';

    const padR = 96,
      padB = 28,
      top = 6;
    const plotW = Math.max(100, W - padR);
    const plotH = Math.max(50, H - padB - top);

    const onHand = selectedProduct ? selectedProduct.total_stock : 412;
    const reorderMin = selectedProduct ? selectedProduct.min_reorder_level : 150;
    const yMax = Math.max(600, Math.ceil((Math.max(onHand, reorderMin) * 1.5) / 100) * 100);
    const yMin = 0;

    const y = (v: number) => top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
    const histDays = 30,
      futureDays = 6,
      totalDays = histDays + futureDays;
    const xDay = (d: number) => (d / totalDays) * plotW;

    // Deterministic simulation based on product on-hand
    let seed = 11;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

    const events: any[] = [];
    let v = Math.round(onHand * 0.85);
    const receiptsMap: { [day: number]: number } = {
      3: 150,
      9: 200,
      15: 120,
      21: 180,
      26: 150,
      29: 50,
    };

    for (let d = 0; d < histDays; d++) {
      const moves = 1 + Math.floor(rnd() * 3);
      let recv = receiptsMap[d] || 0;
      let deliv = 0;
      for (let m = 0; m < moves; m++) {
        const t = d + (m + 1) / (moves + 1);
        const q = 8 + Math.round(rnd() * 28);
        deliv += q;
        v = Math.max(0, v - q);
        events.push([t, v]);
      }
      if (recv) {
        v += recv;
        events.push([d + 0.92, v]);
      }
      if (d === 24) {
        v = Math.max(0, v - 3);
        events.push([d + 0.95, v]);
      }
      events.push({ day: d, recv, deliv });
    }

    const pts = events.filter((e) => Array.isArray(e));
    const days = events.filter((e) => !Array.isArray(e));

    if (pts.length > 0) {
      const shift = onHand - pts[pts.length - 1][1];
      pts.forEach((p, i) => (p[1] += shift * (i / (pts.length - 1))));
      pts[pts.length - 1][1] = onHand;
    }

    let s = `
      <defs>
        <pattern id="hatch" width="5" height="10" patternUnits="userSpaceOnUse">
          <rect width="1" height="10" fill="#7DB6E3"/>
        </pattern>
        <linearGradient id="fade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#fff" stop-opacity=".5"/>
          <stop offset=".85" stop-color="#fff" stop-opacity=".04"/>
          <stop offset="1" stop-color="#fff" stop-opacity="0"/>
        </linearGradient>
        <mask id="m">
          <rect width="${W}" height="${H}" fill="url(#fade)"/>
        </mask>
      </defs>
    `;

    // Horizontal gridlines & axis labels
    const step = yMax <= 500 ? 100 : yMax <= 1000 ? 200 : 500;
    for (let t = 0; t <= yMax; t += step) {
      s += `<line x1="0" x2="${plotW + 16}" y1="${y(t)}" y2="${y(t)}" stroke="#E8ECF2"/>`;
      s += `<text class="axis" x="${plotW + 30}" y="${y(t) + 4}">${t} ${selectedProduct?.unit_of_measure || 'kg'}</text>`;
    }

    // Daily volume bars
    const bs = 0.32;
    days.forEach((d) => {
      const bw = Math.max(2, plotW / totalDays / 2 - 3);
      const bx = xDay(d.day) + 2;
      if (d.recv) {
        s += `<rect class="chart-bar" x="${bx}" y="${y(d.recv * bs)}" width="${bw}" height="${y(0) - y(d.recv * bs)}" fill="#7DB6E3"/>`;
      }
      if (d.deliv) {
        s += `<rect class="chart-bar" x="${bx + bw + 2}" y="${y(d.deliv * bs * 1.4)}" width="${bw}" height="${y(0) - y(d.deliv * bs * 1.4)}" fill="#D5DBE4"/>`;
      }
    });

    // Step line path
    if (pts.length > 0) {
      let path = `M0 ${y(pts[0][1])}`;
      let prevY = y(pts[0][1]);
      pts.forEach(([t, val]) => {
        const x = xDay(t);
        path += ` L${x.toFixed(1)} ${prevY.toFixed(1)} L${x.toFixed(1)} ${y(val).toFixed(1)}`;
        prevY = y(val);
      });
      const endX = xDay(histDays);
      path += ` L${endX} ${prevY}`;

      s += `<path class="chart-path" d="${path} L${endX} ${y(0)} L0 ${y(0)} Z" fill="url(#hatch)" mask="url(#m)"/>`;
      s += `<path class="chart-step-line chart-path" d="${path}" fill="none" stroke="#1269AF" stroke-width="1.8" stroke-linejoin="round"/>`;

      // Coral dotted reorder minimum line
      s += `<line x1="0" x2="${plotW + 16}" y1="${y(reorderMin)}" y2="${y(reorderMin)}" stroke="#E4573D" stroke-opacity=".7" stroke-dasharray="2 4"/>`;
      s += `<text class="axis" x="6" y="${y(reorderMin) - 7}" style="fill:#E4573D">Reorder at ${reorderMin} ${selectedProduct?.unit_of_measure || 'kg'}</text>`;

      // Ink Today Marker + Diamond + Value Pill
      const ty = y(onHand);
      s += `<line x1="0" x2="${plotW}" y1="${ty}" y2="${ty}" stroke="#000C23" stroke-opacity=".3" stroke-dasharray="2 3"/>`;
      s += `<line x1="${endX}" x2="${endX}" y1="${ty}" y2="${y(0)}" stroke="#000C23" stroke-width="2.5"/>`;
      s += `<rect x="${endX - 10}" y="${ty - 10}" width="20" height="20" transform="rotate(45 ${endX} ${ty})" fill="#000C23"/>`;
      s += `<circle cx="${endX}" cy="${ty}" r="2.4" fill="#fff"/>`;

      const unitStr = selectedProduct?.unit_of_measure || 'kg';
      const pw = Math.max(108, 60 + String(onHand).length * 10 + unitStr.length * 8);
      const px = Math.min(plotW - pw + 4, endX + 16);
      s += `<rect x="${px}" y="${ty - 17}" width="${pw}" height="34" rx="17" fill="#000C23"/>`;
      s += `<circle cx="${px + 17}" cy="${ty}" r="4" fill="#7DB6E3"/>`;
      s += `<text x="${px + 29}" y="${ty + 5}" fill="#fff" style="font:500 14px 'DM Mono',monospace">${onHand} ${unitStr}</text>`;
    }

    // Date axis ticks
    const start = new Date();
    start.setDate(start.getDate() - histDays);
    for (let d = histDays % 3; d <= totalDays; d += 3) {
      const dt = new Date(start);
      dt.setDate(start.getDate() + d);
      const lbl =
        d === histDays
          ? 'Today'
          : dt.toLocaleString('en-US', { month: 'short' }) + ' ' + dt.getDate();
      s += `<text class="axis" x="${xDay(d)}" y="${H - 4}" text-anchor="middle" ${
        d === histDays ? 'style="fill:#000C23;font-weight:500"' : ''
      }>${lbl}</text>`;
    }

    return s;
  }, [chartDimensions, selectedProduct]);

  return (
    <div style={{ display: 'grid', gridTemplateRows: '116px 1fr 316px', gap: 'var(--gap)', minHeight: 0 }}>
      {/* 5-Column Hairline KPI Strip */}
      <section className="kpis">
        <div className="kpi" onClick={() => onNavigate?.('products')}>
          <small>Products in stock</small>
          <b>{inStockCount}</b>
          <span>of {totalProducts} products</span>
        </div>

        <div className="kpi" onClick={() => onNavigate?.('products')}>
          <small>Low / out of stock</small>
          <b>
            {lowCount}
            <span className="of"> / {outCount}</span>
          </b>
          <span className="alert">{lowCount + outCount} need reorder</span>
        </div>

        <div className="kpi" onClick={() => onNavigate?.('receipts')}>
          <small>Pending receipts</small>
          <b>{pendingReceipts}</b>
          <span>{pendingReceipts > 0 ? `${pendingReceipts} due soon` : 'All clear'}</span>
        </div>

        <div className="kpi" onClick={() => onNavigate?.('deliveries')}>
          <small>Pending deliveries</small>
          <b>{pendingDeliveries}</b>
          <span>{pendingDeliveries > 0 ? `${pendingDeliveries} ready to ship` : 'All shipped'}</span>
        </div>

        <div className="kpi" onClick={() => onNavigate?.('transfers')}>
          <small>Transfers scheduled</small>
          <b>{scheduledTransfers}</b>
          <span>{scheduledTransfers > 0 ? 'Next today, 16:00' : 'None scheduled'}</span>
        </div>
      </section>

      {/* Main Stock Level Chart Card */}
      <main className="main-chart-card">
        <div className="hero">
          <div className="hero-left">
            <div className="big">
              {selectedProduct ? selectedProduct.total_stock : 0}
              <em>{selectedProduct ? selectedProduct.unit_of_measure : 'kg'}</em>
            </div>
            <div className="hero-meta">
              <span className="badge-up">▲ +50 {selectedProduct?.unit_of_measure || 'kg'} today</span>
              <div
                className="picker"
                style={{ position: 'relative' }}
                onClick={() => setProductPickerOpen(!productPickerOpen)}
              >
                <span>{selectedProduct ? selectedProduct.name : 'Select product'}</span>
                <svg viewBox="0 0 24 24">
                  <path d="m6 9 6 6 6-6" />
                </svg>

                {/* Dropdown Product Picker */}
                {productPickerOpen && (
                  <div
                    className="apple-popover"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: 8,
                      background: '#fff',
                      borderRadius: 6,
                      zIndex: 300,
                      maxHeight: 280,
                      overflowY: 'auto',
                      minWidth: 260,
                      border: '1px solid var(--grey-100)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {products.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          padding: '10px 14px',
                          fontSize: 14,
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid var(--grey-50)',
                          background: p.id === selectedProductId ? 'var(--sky-50)' : '#fff',
                        }}
                        onClick={() => {
                          setSelectedProductId(p.id);
                          setProductPickerOpen(false);
                        }}
                      >
                        <div>
                          <div>{p.name}</div>
                          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                            {p.sku}
                          </span>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                          {p.total_stock} {p.unit_of_measure}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="hero-sub">
                <Pill>{selectedProduct ? selectedProduct.sku : 'SKU'}</Pill>
                <Pill>{selectedProduct ? selectedProduct.category : 'Category'}</Pill>
                <Pill>{filterWarehouse === 'All' ? 'All warehouses' : filterWarehouse}</Pill>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <SegmentedControl
              options={['Week', 'Month', 'Quarter', 'Year'] as const}
              value={selectedRange}
              onChange={setSelectedRange}
            />
            <div className="legend">
              <span>
                <i></i>On hand
              </span>
              <span>
                <i className="ro"></i>Reorder minimum
              </span>
              <span>
                <i className="bi"></i>Received
              </span>
              <span>
                <i className="bo"></i>Delivered
              </span>
            </div>
          </div>
        </div>

        {/* SVG Step Chart Container */}
        <div className="chart" ref={chartContainerRef}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${chartDimensions.width} ${chartDimensions.height}`}
            dangerouslySetInnerHTML={{ __html: chartSvgContent }}
          />
        </div>
      </main>

      {/* Bottom Row: Operations (1.55fr) + Warehouse stats (1fr) + Low stock sky window (0.95fr) */}
      <section className="bottom">
        {/* Recent Operations */}
        <div className="panel white ops">
          <div className="panel-head">
            <h3 className="panel-title">Operations</h3>
            <span
              className="link"
              onClick={() => onNavigate?.('receipts')}
            >
              View all
            </span>
          </div>
          <table style={{ marginTop: 10 }}>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Partner / route</th>
                <th>Status</th>
                <th>Scheduled</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.slice(0, 4).map((doc) => {
                let dotColor = 'var(--sky-500)';
                let typeLabel = 'Receipt';
                if (doc.type === 'DELIVERY') {
                  dotColor = 'var(--ink)';
                  typeLabel = 'Delivery';
                } else if (doc.type === 'TRANSFER') {
                  dotColor = 'var(--sky-300)';
                  typeLabel = 'Internal transfer';
                } else if (doc.type === 'ADJUSTMENT') {
                  dotColor = 'var(--coral)';
                  typeLabel = 'Adjustment';
                }

                const partnerOrRoute =
                  doc.partner_name ||
                  (doc.source_location_name && doc.destination_location_name
                    ? `${doc.source_location_name} → ${doc.destination_location_name}`
                    : doc.notes || 'Internal');

                return (
                  <tr key={doc.id}>
                    <td className="ref">
                      <span className="rt">
                        <i style={{ background: dotColor }}></i>
                        <span>
                          {doc.code}
                          <small>{typeLabel}</small>
                        </span>
                      </span>
                    </td>
                    <td>{partnerOrRoute}</td>
                    <td>
                      <Badge status={doc.status} />
                    </td>
                    <td className="when">
                      {new Date(doc.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                );
              })}
              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 0' }}>
                    No operations match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Multi-Warehouse Stats */}
        <div className="panel grey">
          <div className="panel-head">
            <h3 className="panel-title">Stock by warehouse</h3>
          </div>
          <div className="wh-stats">
            {warehouseBreakdown.slice(0, 3).map((w) => (
              <div key={w.name}>
                <small>{w.name}</small>
                <b>{w.count}</b>
              </div>
            ))}
          </div>
          <div className="wh-bars">
            <div className="hatch" style={{ ['--h' as any]: '84px', ['--c' as any]: 'var(--sky-700)' }}></div>
            <div className="hatch" style={{ ['--h' as any]: '46px', ['--c' as any]: 'var(--sky-500)' }}></div>
            <div className="hatch" style={{ ['--h' as any]: '28px', ['--c' as any]: 'var(--sky-300)' }}></div>
          </div>
          <div className="wh-foot">
            <span>Products held in each</span>
            <span
              className="link"
              onClick={() => onNavigate?.('warehouses')}
            >
              Manage
            </span>
          </div>
        </div>

        {/* Low Stock Sky Window Carousel */}
        <div className="window">
          <div className="win-head">
            <h3 className="panel-title">Low stock</h3>
            <span>
              {lowCount} LOW {outCount} OUT
            </span>
          </div>

          <GlassCard slides={lowStockSlides} />
        </div>
      </section>
    </div>
  );
};
