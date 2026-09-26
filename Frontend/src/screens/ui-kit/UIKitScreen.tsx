import React, { useState } from 'react';
import { Button, Input, Badge, Pill, Stepper, Toast } from '../../components/ui';

export const UIKitScreen: React.FC = () => {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [checkedLines, setCheckedLines] = useState<{ [key: string]: boolean }>({
    line1: true,
    line2: true,
  });

  const toggleLine = (key: string) => {
    setCheckedLines((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{ padding: 14, overflowY: 'auto' }}>
      <div style={{ display: 'grid', gap: 'var(--gap)' }}>
        {/* Colors */}
        <section className="panel white">
          <div className="panel-head">
            <h2 className="panel-title">Colour Tokens (Strict — No Green Anywhere)</h2>
          </div>
          <div className="swatches">
            <div className="sw">
              <div className="chip" style={{ background: '#1269AF' }}></div>
              <b>Sky 700</b>
              <span>#1269AF</span>
              <em>Primary. Page field, stock line, links</em>
            </div>
            <div className="sw">
              <div className="chip" style={{ background: '#3C8CC7' }}></div>
              <b>Sky 500</b>
              <span>#3C8CC7</span>
              <em>Receipts</em>
            </div>
            <div className="sw">
              <div className="chip" style={{ background: '#7DB6E3' }}></div>
              <b>Sky 300</b>
              <span>#7DB6E3</span>
              <em>Chart hatch, transfers</em>
            </div>
            <div className="sw">
              <div className="chip" style={{ background: '#CAE4F5' }}></div>
              <b>Sky 100</b>
              <span>#CAE4F5</span>
              <em>Soft borders</em>
            </div>
            <div className="sw">
              <div className="chip" style={{ background: '#EAF4FB' }}></div>
              <b>Sky 50</b>
              <span>#EAF4FB</span>
              <em>Selected row, focus ring</em>
            </div>
            <div className="sw">
              <div className="chip" style={{ background: '#FFFFFF' }}></div>
              <b>White</b>
              <span>#FFFFFF</span>
              <em>Main panels, inputs</em>
            </div>
            <div className="sw">
              <div className="chip" style={{ background: '#F4F6F9' }}></div>
              <b>Grey 50</b>
              <span>#F4F6F9</span>
              <em>Secondary panels, read-only</em>
            </div>
            <div className="sw">
              <div className="chip" style={{ background: '#E8ECF2' }}></div>
              <b>Grey 100</b>
              <span>#E8ECF2</span>
              <em>Borders, gridlines</em>
            </div>
            <div className="sw">
              <div className="chip" style={{ background: '#8A94A6' }}></div>
              <b>Muted</b>
              <span>#8A94A6</span>
              <em>Labels, axis text</em>
            </div>
            <div className="sw">
              <div className="chip" style={{ background: '#000C23' }}></div>
              <b>Ink</b>
              <span>#000C23</span>
              <em>Text, primary button, deliveries</em>
            </div>
            <div className="sw">
              <div className="chip" style={{ background: '#E4573D' }}></div>
              <b>Coral</b>
              <span>#E4573D</span>
              <em>Low/out of stock, damage, canceled</em>
            </div>
            <div className="sw">
              <div className="chip" style={{ background: '#E9A23B' }}></div>
              <b>Amber</b>
              <span>#E9A23B</span>
              <em>Waiting status only</em>
            </div>
          </div>
        </section>

        {/* Type */}
        <section className="panel white">
          <div className="panel-head">
            <h2 className="panel-title">Typography</h2>
          </div>
          <div className="type-grid">
            <div>
              <div style={{ fontWeight: 300, fontSize: 84, lineHeight: 0.9, letterSpacing: '-0.045em' }}>
                412
                <em
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 52,
                    color: 'var(--muted)',
                    marginLeft: 6,
                    letterSpacing: 0,
                    fontStyle: 'italic',
                  }}
                >
                  kg
                </em>
              </div>
              <p className="spec">Inter Tight 300 · hero number + serif unit</p>
            </div>
            <div>
              <div style={{ fontSize: 24 }}>Stock by warehouse</div>
              <div style={{ fontSize: 14, marginTop: 10, color: 'var(--ink-2)' }}>
                5 pcs left in Main warehouse. Reorder at 50.
              </div>
              <p className="spec">Inter Tight 400 · 24px titles / 14px body</p>
            </div>
            <div>
              <div className="mono" style={{ fontWeight: 300, fontSize: 40, letterSpacing: '-0.03em' }}>
                14
              </div>
              <div className="mono" style={{ fontSize: 13, marginTop: 6 }}>
                WH/OUT/00118 · STL-ROD-012
              </div>
              <p className="spec">DM Mono · KPIs, refs, SKUs, qty, buttons</p>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, justifyContent: 'center' }}>
                <span className="mono" style={{ fontSize: 22 }}>
                  INVENTORY
                </span>
                <em style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontStyle: 'italic' }}>
                  without
                </em>
              </div>
              <p className="spec">Serif italic · login headlines, units only</p>
            </div>
          </div>
        </section>

        {/* Controls & Operations Preview */}
        <div className="cols">
          <section className="panel white">
            <div className="panel-head">
              <h2 className="panel-title">Controls</h2>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button variant="primary" onClick={() => setToastMsg('Validation triggered')}>
                Validate
              </Button>
              <Button variant="secondary">Save draft</Button>
              <Button variant="danger">Cancel</Button>
              <a className="link" href="#receipts">
                Open receipts
              </a>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ width: 220 }}>
                <Input label="Product" defaultValue="Steel rod 12mm" suffix="STL-ROD-012" readOnly />
              </div>
              <div style={{ width: 140 }}>
                <Input label="Quantity" defaultValue="50" suffix="kg" />
              </div>
              <div style={{ width: 160 }}>
                <Input label="Warehouse" defaultValue="Main" hasChevron readOnly />
              </div>
            </div>

            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '18px 0 8px' }}>
              Document status (every operation)
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Badge status="draft" />
              <Badge status="wait" />
              <Badge status="ready" />
              <Badge status="done" />
              <Badge status="cancel" />
            </div>

            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '18px 0 8px' }}>
              Stock status (products)
            </p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <Badge status="ok" />
              <Badge status="low" />
              <Badge status="out" />
              <span style={{ marginLeft: 14 }} className="q-in">
                +50 kg
              </span>
              <span className="q-out">−20 pcs</span>
              <span className="q-adj">−3 kg</span>
            </div>
          </section>

          {/* Receipt Modal Card */}
          <section className="stage">
            <div className="modal">
              <div className="doc-head">
                <div>
                  <h3>WH/IN/00042</h3>
                  <p>Receipt from Tata Steel, into Main warehouse</p>
                </div>
                <span className="x">✕</span>
              </div>
              <div className="lines">
                <div className="line">
                  <span>
                    Steel rod 12mm<span className="sku">STL-ROD-012</span>
                  </span>
                  <span className="q-in">+50 kg</span>
                </div>
                <div className="line">
                  <span>
                    Hex bolt M8<span className="sku">BLT-HEX-M8</span>
                  </span>
                  <span className="q-in">+250 pcs</span>
                </div>
              </div>
              <div className="effect">
                Validating adds 50 kg and 250 pcs to Main warehouse and writes both lines to move history.
              </div>
              <div className="foot">
                <Button variant="secondary">Back</Button>
                <Button
                  variant="primary"
                  onClick={() =>
                    setToastMsg('WH/IN/00042 validated. Steel rod 12mm is now 412 kg.')
                  }
                >
                  Validate receipt
                </Button>
              </div>
            </div>
          </section>
        </div>

        {/* Delivery & Adjustment */}
        <div className="cols">
          <section className="panel white">
            <div className="doc-head">
              <div>
                <h3>WH/OUT/00118</h3>
                <p>Delivery to Sharma Furniture, from Main warehouse</p>
              </div>
              <Badge status="ready" />
            </div>
            <Stepper
              steps={[
                { number: 1, label: 'Pick' },
                { number: 2, label: 'Pack' },
                { number: 3, label: 'Validate' },
              ]}
              currentStep={2}
            />
            <div className="lines">
              <div className="line">
                <span className="l">
                  <span
                    className={`cb ${checkedLines.line1 ? 'on' : ''}`}
                    onClick={() => toggleLine('line1')}
                  >
                    ✓
                  </span>
                  <span>
                    Hex bolt M8<span className="sku">BLT-HEX-M8 · Rack A-101</span>
                  </span>
                </span>
                <span className="q-out">−200 pcs</span>
              </div>
              <div className="line">
                <span className="l">
                  <span
                    className={`cb ${checkedLines.line2 ? 'on' : ''}`}
                    onClick={() => toggleLine('line2')}
                  >
                    ✓
                  </span>
                  <span>
                    Wooden pallet 1200<span className="sku">PKG-PAL-120 · Dispatch bay</span>
                  </span>
                </span>
                <span className="q-out">−2 pcs</span>
              </div>
            </div>
            <div className="effect">
              <b>−202</b> pcs leave Main warehouse when you validate.
            </div>
            <div className="foot">
              <Button variant="secondary">Back to picking</Button>
              <Button
                variant="primary"
                onClick={() => setToastMsg('Marked as packed')}
              >
                Mark as packed
              </Button>
            </div>
          </section>

          <section className="panel white">
            <div className="doc-head">
              <div>
                <h3>New adjustment</h3>
                <p>Match the system to what you counted</p>
              </div>
              <Badge status="draft" />
            </div>
            <div className="two">
              <Input label="Product" defaultValue="Steel rod 12mm" hasChevron readOnly />
              <Input label="Location" defaultValue="Main warehouse" hasChevron readOnly />
              <div className="field">
                <label>In the system</label>
                <div className="input" style={{ background: 'var(--grey-50)', color: 'var(--ink-2)' }}>
                  320<span className="suffix">kg</span>
                </div>
              </div>
              <Input label="Counted" defaultValue="317" suffix="kg" />
            </div>
            <div className="two" style={{ marginTop: 12, alignItems: 'end' }}>
              <div className="diff">
                <b>−3</b>
                <span>kg difference</span>
              </div>
              <Input label="Reason" defaultValue="Damaged" hasChevron readOnly />
            </div>
            <div className="foot">
              <Button variant="secondary">Cancel</Button>
              <Button
                variant="primary"
                onClick={() => setToastMsg('Adjustment applied and recorded')}
              >
                Apply adjustment
              </Button>
            </div>
          </section>
        </div>

        {/* Warehouses & Transfers */}
        <div className="cols">
          <section className="panel white">
            <div className="doc-head">
              <div>
                <h3>WH/INT/00031</h3>
                <p>Internal transfer</p>
              </div>
              <Badge status="draft" />
            </div>
            <div className="arrow-mid">
              <Input label="From" defaultValue="Main / Rack A-101" hasChevron readOnly />
              <i>→</i>
              <Input label="To" defaultValue="Production floor" hasChevron readOnly />
            </div>
            <div className="two" style={{ marginTop: 12 }}>
              <Input label="Product" defaultValue="Steel rod 12mm" hasChevron readOnly />
              <Input label="Quantity" defaultValue="92" suffix="kg" />
            </div>
            <div className="effect" style={{ marginTop: 16 }}>
              Total stock stays the same. Only the location changes, and the move is logged.
            </div>
            <div className="foot">
              <Button variant="secondary">Save draft</Button>
              <Button
                variant="primary"
                onClick={() => setToastMsg('Transfer validated')}
              >
                Validate transfer
              </Button>
            </div>
          </section>

          <section className="panel white">
            <div className="doc-head" style={{ alignItems: 'center' }}>
              <h2 className="panel-title" style={{ margin: 0 }}>
                Warehouses
              </h2>
              <Button variant="secondary">+ Add warehouse</Button>
            </div>
            <div className="wh">
              <div className="wh-top">
                <b>Main warehouse</b>
                <Pill>MAIN</Pill>
              </div>
              <p>Plot 14, Okhla Phase II, New Delhi</p>
              <span className="loc">Rack A-101</span>
              <span className="loc">Rack A-102</span>
              <span className="loc">Rack B-201</span>
              <span className="loc">Dispatch bay</span>
              <span className="loc add">+ Location</span>
            </div>
            <div className="wh">
              <div className="wh-top">
                <b>Production floor</b>
                <Pill>PROD</Pill>
              </div>
              <p>Same site, Building 2</p>
              <span className="loc">Line 1</span>
              <span className="loc">Line 2</span>
              <span className="loc add">+ Location</span>
            </div>
          </section>
        </div>
      </div>

      <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />
    </div>
  );
};
