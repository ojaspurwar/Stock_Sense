import { Platform } from 'react-native';

const STOCKSENSE_CSS = `
/* =========================================================
   StockSense — shared styles (tokens, app shell, components)
   Palette: white, light grey, sky blue. Ink for text. No green anywhere.
   ========================================================= */
:root {
  --sky-900: #0B5A9C;
  --sky-700: #1269AF;   /* primary sky */
  --sky-500: #3C8CC7;
  --sky-300: #7DB6E3;
  --sky-100: #CAE4F5;
  --sky-50:  #EAF4FB;
  --white:   #FFFFFF;
  --grey-50: #F4F6F9;
  --grey-100:#E8ECF2;
  --grey-200:#D5DBE4;
  --muted:   #8A94A6;
  --ink-2:   #3A4458;
  --ink:     #000C23;
  --coral:   #E4573D;     /* low stock, out of stock, damage, canceled */
  --amber:   #E9A23B;     /* waiting */

  --font-sans: "Inter Tight", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  --font-mono: "DM Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;
  --font-serif: "Instrument Serif", Georgia, "Times New Roman", serif;

  --r-panel: 6px;
  --gap: 10px;
  --sidebar: 220px;

  /* Motion tokens — shared motion system */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --dur-xs: 140ms;
  --dur-sm: 200ms;
  --dur-md: 320ms;
  --dur-lg: 420ms;
  --shift-page: 16px;
  --shift-tab: 24px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; min-height: 100%; width: 100%; }
#root { width: 100%; height: 100%; min-height: 100vh; display: flex; flex-direction: column; }
body {
  font-family: var(--font-sans);
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
  background:
    radial-gradient(ellipse 38% 22% at 88% 94%, rgba(255,255,255,.5), transparent 70%),
    radial-gradient(ellipse 30% 18% at 66% 102%, rgba(255,255,255,.4), transparent 70%),
    linear-gradient(180deg, var(--sky-700) 0%, var(--sky-500) 55%, var(--sky-300) 100%);
  background-attachment: fixed;
}
button { font-family: inherit; }
.mono { font-family: var(--font-mono); }

/* ---------- App shell: left sidebar + content ---------- */
.app {
  width: 100%;
  height: 100vh;
  padding: 14px;
  display: grid;
  grid-template-columns: var(--sidebar) 1fr;
  gap: var(--gap);
  overflow: hidden;
}
.sidebar {
  display: grid;
  grid-template-rows: 56px 1fr;
  gap: var(--gap);
  min-height: 0;
}
.logo-tile {
  background: var(--white);
  border-radius: var(--r-panel);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 0 20px;
  user-select: none;
  cursor: pointer;
}
.logo {
  font-weight: 600;
  font-size: 20px;
  letter-spacing: -.02em;
  color: var(--ink);
}
.logo-mark {
  display: grid;
  grid-template-columns: repeat(3, 6px);
  gap: 2px;
}
.logo-mark i {
  width: 6px;
  height: 6px;
  background: var(--ink);
  display: block;
}
.logo-mark i.o {
  background: transparent;
}

.side {
  border-radius: var(--r-panel);
  background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.22);
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  color: var(--white);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.side-label {
  font-size: 12px;
  opacity: .6;
  padding: 16px 12px 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.side a, .side-item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 38px;
  padding: 0 12px;
  border-radius: 4px;
  color: rgba(255,255,255,.8);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  transition: color var(--dur-sm) var(--ease-out);
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
}
.side a:hover, .side-item:hover {
  background: rgba(255,255,255,.08);
  color: #fff;
}
.side a svg, .side-item svg {
  width: 16px;
  height: 16px;
  flex: none;
  stroke: currentColor;
  fill: none;
  stroke-width: 1.8;
}
.side a .count, .side-item .count {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 12px;
  opacity: .8;
}
.side a.active, .side-item.active {
  background: var(--white);
  color: var(--ink);
}
.side a.active svg, .side-item.active svg {
  stroke: var(--ink);
}
.side a.active .count, .side-item.active .count {
  opacity: .55;
  color: var(--ink);
}
.profile {
  margin-top: auto;
  border-top: 1px solid rgba(255,255,255,.22);
  padding-top: 12px;
}
.me {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 12px 10px;
}
.me .av {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--white);
  color: var(--sky-700);
  display: grid;
  place-items: center;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
}
.me b {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
}
.me span {
  font-size: 12px;
  opacity: .7;
  color: rgba(255,255,255,.8);
}
.profile a, .profile .side-item {
  height: 32px;
  font-size: 13px;
}

.content {
  display: grid;
  gap: var(--gap);
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  position: relative;
}

/* ---------- Top bar on the sky: search + dynamic filters ---------- */
.topbar {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  height: 44px;
  flex-shrink: 0;
}
.search {
  width: 340px;
  height: 44px;
  background: var(--white);
  border-radius: 4px;
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  color: var(--muted);
  font-size: 14px;
}
.search input {
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  color: var(--ink);
  flex: 1;
}
.search input::placeholder {
  color: var(--muted);
}
.search kbd {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 11px;
  border: 1px solid var(--grey-100);
  border-radius: 3px;
  padding: 1px 6px;
  color: var(--muted);
}
.fchip-sky {
  height: 44px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  white-space: nowrap;
  cursor: pointer;
  color: var(--white);
  font-size: 14px;
  font-weight: 500;
  background: rgba(255,255,255,.14);
  border: 1px solid rgba(255,255,255,.28);
  user-select: none;
  transition: background 0.15s ease;
  position: relative;
}
.fchip-sky:hover {
  background: rgba(255,255,255,.22);
}
.fchip-sky small {
  opacity: .7;
  font-weight: 400;
}
.fchip-sky svg {
  width: 12px;
  height: 12px;
  stroke: #fff;
  fill: none;
  stroke-width: 2.4;
}
.topbar .spacer {
  flex: 1;
}
.btn-white {
  height: 44px;
  border: 0;
  border-radius: 4px;
  background: var(--white);
  color: var(--ink);
  font-size: 14px;
  font-weight: 600;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease;
}
.btn-white:hover {
  background: var(--grey-50);
}

/* ---------- Panels ---------- */
.panel {
  border-radius: var(--r-panel);
  padding: 26px 30px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  position: relative;
}
.panel.white {
  background: var(--white);
}
.panel.grey {
  background: var(--grey-50);
}
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  margin-bottom: 16px;
}
.panel-title {
  font-size: 24px;
  font-weight: 400;
  letter-spacing: -.01em;
  color: var(--ink);
}
.link {
  color: var(--sky-700);
  font-weight: 500;
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
}
.link:hover {
  text-decoration: underline;
}

/* ---------- Buttons ---------- */
.btn {
  font: 500 14px var(--font-sans);
  border-radius: 3px;
  padding: 11px 16px;
  border: 1px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform var(--dur-xs) var(--ease-out), background-color var(--dur-xs) var(--ease-out), color var(--dur-xs) var(--ease-out), border-color var(--dur-xs) var(--ease-out), opacity var(--dur-xs) var(--ease-out);
}
.btn:active:not(:disabled) {
  transform: scale(0.97);
}
.btn.primary {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: .06em;
  text-transform: uppercase;
  background: var(--ink);
  color: #fff;
}
.btn.primary:hover {
  opacity: 0.9;
}
.btn.secondary {
  background: #fff;
  border-color: var(--grey-200);
  color: var(--ink);
}
.btn.secondary:hover {
  background: var(--grey-50);
}
.btn.danger {
  background: #fff;
  border-color: #F3C3B9;
  color: var(--coral);
}
.btn.danger:hover {
  background: #FDEEEA;
}
.btn.block {
  width: 100%;
  padding: 14px;
}

/* ---------- Inputs & Fields ---------- */
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field label {
  font-size: 12px;
  color: var(--muted);
  font-weight: 500;
}
.field label .opt {
  opacity: .8;
}
.input {
  height: 42px;
  border: 1px solid var(--grey-200);
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-size: 14px;
  background: #fff;
  color: var(--ink);
  gap: 8px;
  position: relative;
}
.input input, .input select {
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  font-family: inherit;
  font-size: 14px;
  color: var(--ink);
}
.input.placeholder {
  color: var(--muted);
}
.input:focus-within, .input.focus {
  border-color: var(--sky-700);
  box-shadow: 0 0 0 3px var(--sky-50);
}
.input .suffix {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
}
.input .chev {
  margin-left: auto;
  width: 12px;
  height: 12px;
  stroke: var(--muted);
  fill: none;
  stroke-width: 2.4;
  pointer-events: none;
}

/* ---------- Badges ---------- */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid;
  white-space: nowrap;
}
.badge i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  display: inline-block;
}
.b-draft { color: var(--ink-2); background: var(--grey-50); border-color: var(--grey-200); }
.b-wait  { color: #9A6410; background: #FDF3E2; border-color: #F4D9A8; }
.b-ready { color: var(--sky-700); background: var(--sky-50); border-color: var(--sky-100); }
.b-done  { color: #fff; background: var(--ink); border-color: var(--ink); }
.b-cancel{ color: var(--coral); background: #FDEEEA; border-color: #F3C3B9; }
.b-low   { color: var(--coral); background: #FDEEEA; border-color: #F3C3B9; }
.b-out   { color: #fff; background: var(--coral); border-color: var(--coral); }
.b-ok    { color: var(--sky-700); background: #fff; border-color: var(--sky-100); }

.q-in  { color: var(--sky-700); font-family: var(--font-mono); font-weight: 500; }
.q-out { color: var(--ink); font-family: var(--font-mono); font-weight: 500; }
.q-adj { color: var(--coral); font-family: var(--font-mono); font-weight: 500; }

/* ---------- Tables ---------- */
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
th {
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  text-align: left;
  padding: 0 12px 10px;
  border-bottom: 1px solid var(--grey-100);
  white-space: nowrap;
}
td {
  padding: 13px 12px;
  border-bottom: 1px solid var(--grey-100);
  vertical-align: middle;
  color: var(--ink);
}
td.ref {
  font-family: var(--font-mono);
  font-size: 13px;
  white-space: nowrap;
}
td.num, th.num {
  text-align: right;
}
td.num {
  font-family: var(--font-mono);
}
tr.sel td {
  background: var(--sky-50);
}
.sku {
  display: block;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  margin-top: 2px;
}
.pill {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-2);
  background: var(--grey-50);
  border: 1px solid var(--grey-100);
  border-radius: 3px;
  padding: 2px 6px;
  margin-right: 4px;
}

/* ---------- Sky window + glass (video component) ---------- */
.window {
  position: relative;
  border-radius: var(--r-panel);
  overflow: hidden;
  padding: 24px;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 0;
  background:
    radial-gradient(ellipse 60% 40% at 70% 22%, rgba(255,255,255,.5), transparent 70%),
    radial-gradient(ellipse 50% 30% at 20% 45%, rgba(255,255,255,.3), transparent 70%),
    linear-gradient(180deg,#1A70B4 0%,#4A95CF 60%,#8CC0E8 100%);
}
.window::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: radial-gradient(rgba(255,255,255,.28) 1px, transparent 1.2px);
  background-size: 9px 9px;
  -webkit-mask-image: radial-gradient(ellipse 70% 55% at 60% 30%, #000 20%, transparent 75%);
          mask-image: radial-gradient(ellipse 70% 55% at 60% 30%, #000 20%, transparent 75%);
}
.glass {
  position: relative;
  border-radius: 4px;
  padding: 18px 18px 16px;
  color: #fff;
  background: rgba(255,255,255,.18);
  border: 1px solid rgba(255,255,255,.35);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  transition: opacity 0.3s ease-out, transform 0.3s ease-out;
}
.glass h4 {
  font-family: var(--font-mono);
  font-weight: 400;
  font-size: 15px;
  letter-spacing: .04em;
  text-transform: uppercase;
}
.glass p {
  font-size: 13px;
  opacity: .92;
  margin-top: 6px;
  line-height: 1.45;
}
.pix {
  display: grid;
  grid-template-columns: repeat(3, 8px);
  gap: 3px;
}
.pix i {
  width: 8px;
  height: 8px;
  background: #fff;
  display: block;
}
.pix i.off {
  background: rgba(255,255,255,.35);
}
.pix i.hot {
  background: var(--coral);
}
.glass-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 14px;
}
.glass-foot span {
  font-family: var(--font-mono);
  font-size: 12px;
  opacity: .85;
}
.arrows {
  display: flex;
  gap: 4px;
}
.arrows button {
  width: 36px;
  height: 32px;
  border-radius: 3px;
  border: 1px solid rgba(255,255,255,.35);
  background: rgba(255,255,255,.18);
  color: #fff;
  font-size: 15px;
  cursor: pointer;
  display: grid;
  place-items: center;
}
.arrows button:hover {
  background: rgba(255,255,255,.3);
}

/* ---------- Dashboard Specifics ---------- */
.kpis {
  background: var(--white);
  border-radius: var(--r-panel);
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  padding: 20px 0;
}
.kpi {
  padding: 0 26px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: opacity 0.15s ease;
}
.kpi:hover {
  opacity: 0.85;
}
.kpi + .kpi {
  border-left: 1px solid var(--grey-100);
}
.kpi small {
  font-size: 13px;
  color: var(--muted);
}
.kpi b {
  font-family: var(--font-mono);
  font-weight: 300;
  font-size: 40px;
  line-height: 1;
  letter-spacing: -.03em;
  margin: 6px 0;
}
.kpi b .of {
  color: var(--coral);
}
.kpi span {
  font-size: 12px;
  color: var(--muted);
}
.kpi span.alert {
  color: var(--coral);
}

.main-chart-card {
  background: var(--white);
  border-radius: var(--r-panel);
  padding: 26px 0 14px 34px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-right: 34px;
}
.hero-left {
  display: flex;
  align-items: flex-end;
  gap: 22px;
}
.big {
  font-weight: 300;
  font-size: 104px;
  line-height: .84;
  letter-spacing: -.045em;
  color: var(--ink);
}
.big em {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 64px;
  letter-spacing: 0;
  color: var(--muted);
  margin-left: 8px;
}
.hero-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 2px;
}
.badge-up {
  align-self: flex-start;
  display: inline-flex;
  gap: 5px;
  background: var(--sky-50);
  color: var(--sky-700);
  border: 1px solid var(--sky-100);
  font-size: 12px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 999px;
}
.picker {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 30px;
  font-weight: 400;
  letter-spacing: -.01em;
  cursor: pointer;
  color: var(--ink);
}
.picker svg {
  width: 18px;
  height: 18px;
  stroke: var(--ink);
  fill: none;
  stroke-width: 2;
}
.hero-sub {
  display: flex;
  gap: 6px;
  align-items: center;
}
.hero-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 14px;
}
.segmented {
  display: flex;
  border: 1px solid var(--grey-100);
  border-radius: 4px;
  overflow: hidden;
}
.segmented button {
  font: 500 14px var(--font-sans);
  color: var(--ink-2);
  background: #fff;
  border: 0;
  border-left: 1px solid var(--grey-100);
  padding: 9px 15px;
  cursor: pointer;
}
.segmented button:first-child {
  border-left: 0;
}
.segmented button.on {
  background: var(--ink);
  color: #fff;
}
.legend {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--muted);
}
.legend span {
  display: flex;
  align-items: center;
  gap: 7px;
}
.legend i {
  display: inline-block;
  width: 16px;
  height: 0;
  border-top: 2px solid var(--sky-700);
}
.legend i.ro { border-top: 2px dotted var(--coral); }
.legend i.bi { width: 8px; height: 10px; border: 0; background: var(--sky-300); }
.legend i.bo { width: 8px; height: 10px; border: 0; background: var(--grey-200); }

.chart {
  position: relative;
  flex: 1;
  margin-top: 8px;
  min-height: 200px;
}
.chart svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.axis {
  font-family: var(--font-mono);
  font-size: 11px;
  fill: var(--muted);
}

.bottom {
  display: grid;
  grid-template-columns: 1.55fr 1fr .95fr;
  gap: var(--gap);
  min-height: 0;
}
.ops table td { padding: 8px 10px; }
.ops .rt { display: flex; align-items: center; gap: 10px; }
.ops .rt i { width: 7px; height: 7px; border-radius: 50%; flex: none; }
.ops .rt small { display: block; font-family: var(--font-sans); font-size: 12px; color: var(--muted); margin-top: 1px; }
.ops table th { padding: 0 10px 8px; }
.ops .type { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ink-2); white-space: nowrap; }
.ops .type i { width: 7px; height: 7px; border-radius: 50%; }
.ops .when { color: var(--muted); font-size: 13px; white-space: nowrap; }
.ops tr:last-child td { border-bottom: 0; }

.wh-stats { display: grid; grid-template-columns: 1.3fr 1fr .9fr; margin-top: 20px; }
.wh-stats small { display: block; font-size: 12px; white-space: nowrap; color: var(--muted); margin-bottom: 6px; }
.wh-stats b { font-family: var(--font-mono); font-weight: 300; font-size: 30px; letter-spacing: -.03em; }
.wh-stats b span { font-size: 13px; color: var(--muted); letter-spacing: 0; margin-left: 4px; font-family: var(--font-sans); }
.wh-bars { margin-top: auto; display: grid; grid-template-columns: 1.3fr 1fr .9fr; align-items: end; }
.hatch { height: var(--h); margin-right: 10px; background: repeating-linear-gradient(90deg, var(--c) 0 2px, transparent 2px 5px); }
.wh-foot { display: flex; justify-content: space-between; margin-top: 14px; font-size: 13px; color: var(--muted); }

.win-head { position: relative; display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
.win-head .panel-title { color: #fff; }
.win-head span { font-family: var(--font-mono); font-size: 12px; opacity: .9; }
.glass .pix { margin-bottom: 22px; }
.meter { height: 3px; background: rgba(255,255,255,.28); margin-top: 12px; border-radius: 2px; overflow: hidden; }
.meter i { display: block; height: 100%; width: 10%; background: var(--coral); }
.reorder { margin-top: 12px; display: inline-block; font-size: 13px; font-weight: 600; color: var(--ink); background: #fff; border-radius: 3px; padding: 7px 11px; cursor: pointer; }

/* ---------- Products Specifics ---------- */
.list {
  background: var(--white);
  border-radius: var(--r-panel);
  padding: 26px 30px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.list-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.list-head h1 {
  font-size: 30px;
  font-weight: 400;
  letter-spacing: -.015em;
}
.list-head h1 span {
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--muted);
  margin-left: 10px;
  letter-spacing: 0;
}
.tabs {
  display: flex;
  gap: 8px;
}
.tab {
  font-size: 13px;
  padding: 7px 12px;
  border: 1px solid var(--grey-200);
  border-radius: 999px;
  color: var(--ink-2);
  display: flex;
  gap: 6px;
  cursor: pointer;
  user-select: none;
}
.tab b {
  font-family: var(--font-mono);
  font-weight: 400;
  color: var(--muted);
}
.tab.on {
  background: var(--ink);
  border-color: var(--ink);
  color: #fff;
}
.tab.on b {
  color: rgba(255,255,255,.7);
}
.tab.low b {
  color: var(--coral);
}
td .name {
  font-weight: 500;
}
td.onhand {
  font-family: var(--font-mono);
  text-align: right;
  white-space: nowrap;
}
td.onhand small {
  color: var(--muted);
  margin-left: 4px;
}
td.onhand.zero {
  color: var(--coral);
}
td.rule {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--ink-2);
  white-space: nowrap;
}
td.cat {
  color: var(--ink-2);
}
tbody tr:hover td {
  background: var(--grey-50);
}
.pager {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 14px;
  font-size: 13px;
  color: var(--muted);
}
.pager .arrows button {
  border-color: var(--grey-200);
  background: #fff;
  color: var(--ink);
}

/* Scrim & Drawer */
.scrim {
  position: fixed;
  inset: 0;
  background: rgba(0, 12, 35, .28);
  backdrop-filter: blur(2px);
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}
.drawer-container {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 460px;
  max-width: 90vw;
  background: #fff;
  box-shadow: 0 24px 60px -20px rgba(0,12,35,.45);
  display: flex;
  flex-direction: column;
  z-index: 1001;
  animation: slideIn 0.22s ease-out;
}
@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.d-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 26px 28px 18px;
  border-bottom: 1px solid var(--grey-100);
}
.d-head h2 {
  font-size: 24px;
  font-weight: 400;
}
.d-head p {
  font-size: 13px;
  color: var(--muted);
  margin-top: 4px;
}
.x {
  width: 32px;
  height: 32px;
  border: 1px solid var(--grey-100);
  border-radius: 3px;
  display: grid;
  place-items: center;
  color: var(--muted);
  cursor: pointer;
}
.x:hover {
  background: var(--grey-50);
  color: var(--ink);
}
.d-body {
  padding: 22px 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  flex: 1;
}
.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.group {
  border-top: 1px solid var(--grey-100);
  padding-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.group h3 {
  font-size: 15px;
  font-weight: 500;
}
.group h3 span {
  font-weight: 400;
  color: var(--muted);
  font-size: 13px;
  margin-left: 6px;
}
.note {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.45;
}
.d-foot {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 18px 28px;
  border-top: 1px solid var(--grey-100);
  background: #fff;
}

/* ---------- Auth Screens ---------- */
.auth {
  width: 100%;
  height: 100vh;
  padding: 14px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 56px 1fr;
  gap: var(--gap);
  overflow: hidden;
}
.auth .logo-tile {
  padding: 0 18px 0 24px;
}
.bar {
  border-radius: var(--r-panel);
  background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.22);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 0 24px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(10px);
}
.bar span {
  opacity: .8;
}
.bar .btn-white {
  height: 40px;
}
.auth-left {
  background: var(--white);
  border-radius: var(--r-panel);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  overflow-y: auto;
}
.col {
  width: 380px;
  max-width: 100%;
}
.dots {
  display: flex;
  gap: 5px;
  justify-content: center;
  margin-bottom: 26px;
}
.dots i {
  width: 8px;
  height: 8px;
  background: var(--ink);
  display: block;
}
.headline {
  text-align: center;
  line-height: .98;
}
.headline .m {
  display: block;
  font-family: var(--font-mono);
  font-weight: 400;
  font-size: 50px;
  letter-spacing: -.01em;
}
.headline .s {
  display: block;
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 58px;
  line-height: .9;
}
.lede {
  text-align: center;
  font-size: 14px;
  color: var(--ink-2);
  line-height: 1.5;
  margin: 18px auto 30px;
  max-width: 330px;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}
.check {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ink-2);
  cursor: pointer;
}
.check i {
  width: 16px;
  height: 16px;
  border: 1px solid var(--grey-200);
  border-radius: 3px;
  display: grid;
  place-items: center;
  background: var(--ink);
  border-color: var(--ink);
  color: #fff;
  font-size: 11px;
  font-style: normal;
}
.alt {
  text-align: center;
  font-size: 13px;
  color: var(--muted);
  margin-top: 18px;
}
.seg2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 1px solid var(--grey-200);
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}
.seg2 span {
  padding: 11px 12px;
  font-size: 14px;
  text-align: center;
  color: var(--ink-2);
  user-select: none;
}
.seg2 span.on {
  background: var(--ink);
  color: #fff;
}
.steps {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 26px;
  font-size: 12px;
  color: var(--muted);
}
.steps span {
  display: flex;
  align-items: center;
  gap: 6px;
}
.steps b {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid var(--grey-200);
  display: grid;
  place-items: center;
  font-family: var(--font-mono);
  font-weight: 400;
  font-size: 11px;
}
.steps .done b {
  background: var(--sky-50);
  border-color: var(--sky-100);
  color: var(--sky-700);
}
.steps .now {
  color: var(--ink);
}
.steps .now b {
  background: var(--ink);
  border-color: var(--ink);
  color: #fff;
}
.steps .line {
  width: 24px;
  height: 1px;
  background: var(--grey-200);
}
.otp {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}
.otp input {
  height: 58px;
  width: 100%;
  border: 1px solid var(--grey-200);
  border-radius: 4px;
  display: grid;
  place-items: center;
  font-family: var(--font-mono);
  font-size: 26px;
  text-align: center;
  outline: none;
}
.otp input:focus {
  border-color: var(--sky-700);
  box-shadow: 0 0 0 3px var(--sky-50);
}
.hint {
  font-size: 13px;
  color: var(--muted);
  text-align: center;
}
.hint b {
  font-family: var(--font-mono);
  font-weight: 400;
  color: var(--ink);
}
.auth-right {
  position: relative;
  border-radius: var(--r-panel);
  overflow: hidden;
  background:
    radial-gradient(ellipse 45% 30% at 55% 38%, rgba(255,255,255,.55), transparent 70%),
    radial-gradient(ellipse 35% 22% at 25% 60%, rgba(255,255,255,.35), transparent 70%),
    radial-gradient(ellipse 40% 25% at 85% 70%, rgba(255,255,255,.3), transparent 70%);
}
.auth-right canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.auth-right .glass {
  position: absolute;
  left: 18px;
  bottom: 18px;
  width: 300px;
}
.auth-right .glass .pix {
  margin-bottom: 46px;
}
.auth-right .arrows {
  position: absolute;
  right: 18px;
  bottom: 18px;
}

/* ---------- Operations, UI Kit & Stage ---------- */
.stage {
  border-radius: var(--r-panel);
  padding: 26px;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(ellipse 60% 35% at 80% 10%, rgba(255,255,255,.5), transparent 70%),
    linear-gradient(180deg, #1A70B4, #4A95CF 60%, #8CC0E8);
}
.modal {
  background: #fff;
  border-radius: 6px;
  padding: 24px;
  box-shadow: 0 24px 60px -20px rgba(0,12,35,.45);
}
.doc-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
}
.doc-head h3 {
  font-family: var(--font-mono);
  font-weight: 400;
  font-size: 18px;
}
.doc-head p {
  font-size: 13px;
  color: var(--muted);
  margin-top: 4px;
}
.lines {
  border: 1px solid var(--grey-100);
  border-radius: 4px;
  margin: 16px 0;
}
.line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px 14px;
  font-size: 14px;
  gap: 12px;
}
.line + .line {
  border-top: 1px solid var(--grey-100);
}
.line .l {
  display: flex;
  align-items: center;
  gap: 10px;
}
.cb {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid var(--grey-200);
  display: grid;
  place-items: center;
  font-size: 11px;
  cursor: pointer;
  user-select: none;
}
.cb.on {
  background: var(--ink);
  border-color: var(--ink);
  color: #fff;
}
.effect {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--grey-50);
  border-radius: 4px;
  padding: 14px;
  font-size: 13px;
  color: var(--ink-2);
  line-height: 1.4;
}
.effect b {
  font-family: var(--font-mono);
  font-weight: 400;
  font-size: 20px;
  white-space: nowrap;
}
.foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}
.diff {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-top: 4px;
}
.diff b {
  font-family: var(--font-mono);
  font-weight: 300;
  font-size: 40px;
  color: var(--coral);
  letter-spacing: -.03em;
}
.diff span {
  font-size: 13px;
  color: var(--muted);
}
.arrow-mid {
  display: grid;
  grid-template-columns: 1fr 28px 1fr;
  align-items: end;
  gap: 8px;
}
.arrow-mid i {
  font-style: normal;
  text-align: center;
  padding-bottom: 12px;
  color: var(--muted);
}
.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--ink);
  color: #fff;
  border-radius: 4px;
  padding: 12px 14px;
  font-size: 13px;
  margin-top: 12px;
  animation: toastRise 0.3s ease-out;
}
.toast i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--sky-300);
}
@keyframes toastRise {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.wh {
  border: 1px solid var(--grey-100);
  border-radius: 4px;
  padding: 16px 18px;
}
.wh + .wh {
  margin-top: 10px;
}
.wh-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.wh-top b {
  font-weight: 500;
  font-size: 16px;
}
.wh-top .pill {
  margin: 0;
}
.wh p {
  font-size: 13px;
  color: var(--muted);
  margin: 4px 0 10px;
}
.loc {
  display: inline-block;
  font-size: 12px;
  border: 1px dashed var(--grey-200);
  border-radius: 3px;
  padding: 3px 8px;
  margin: 0 4px 4px 0;
  color: var(--ink-2);
}
.loc.add {
  color: var(--sky-700);
  border-color: var(--sky-100);
  cursor: pointer;
}
.route {
  font-size: 13px;
  color: var(--ink-2);
  white-space: nowrap;
}
.route span {
  color: var(--muted);
}
.who {
  font-size: 13px;
  color: var(--ink-2);
  white-space: nowrap;
}
td.when {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-2);
  white-space: nowrap;
}
.reason {
  font-size: 12px;
  color: var(--muted);
  display: block;
}

/* ---------- Stepper ---------- */
.stepper {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.st {
  border-top: 3px solid var(--grey-100);
  padding-top: 10px;
  font-size: 13px;
  color: var(--muted);
}
.st b {
  display: block;
  font-family: var(--font-mono);
  font-weight: 400;
  font-size: 11px;
  margin-bottom: 2px;
}
.st.done {
  border-color: var(--sky-700);
  color: var(--ink);
}
.st.now {
  border-color: var(--ink);
  color: var(--ink);
  font-weight: 600;
}

/* ---------- UI Kit specific ---------- */
.swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 8px;
}
.sw .chip {
  height: 70px;
  border-radius: 4px;
  border: 1px solid var(--grey-100);
}
.sw b {
  display: block;
  font-size: 12px;
  font-weight: 600;
  margin-top: 8px;
}
.sw span {
  display: block;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  margin-top: 2px;
}
.sw em {
  display: block;
  font-style: normal;
  font-size: 11px;
  color: var(--ink-2);
  margin-top: 4px;
  line-height: 1.3;
}
.type-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr 1fr;
  gap: 28px;
  align-items: end;
}
.type-grid > div {
  border-top: 1px solid var(--grey-100);
  padding-top: 12px;
}
.spec {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  margin-top: 10px;
}
.cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap);
}

/* =========================================================
   Apple-grade Fluid Motion & Micro-interactions
/* =========================================================
   Unified Shared Motion System
   ========================================================= */

/* Scrim / Backdrop: fade in 320ms (--dur-md, ease-out), fade out 200ms (--dur-sm, ease-in) */
.scrim {
  position: fixed;
  inset: 0;
  background: rgba(0, 12, 35, 0.32);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 1000;
  opacity: 1;
  animation: scrimFadeIn var(--dur-md) var(--ease-out) forwards;
  will-change: opacity;
}
.scrim.closing {
  animation: scrimFadeOut var(--dur-sm) var(--ease-in) forwards;
}
@keyframes scrimFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes scrimFadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* 460px Right Drawer: slide in from right 420ms (--dur-lg, ease-out), close 270ms (--ease-in) */
.drawer-container {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 460px;
  max-width: 92vw;
  background: #fff;
  box-shadow: -16px 0 64px -12px rgba(0, 12, 35, 0.35);
  display: flex;
  flex-direction: column;
  z-index: 1001;
  transform: translate3d(0, 0, 0);
  animation: drawerSlideIn var(--dur-lg) var(--ease-out) forwards;
  will-change: transform;
}
.drawer-container.closing {
  animation: drawerSlideOut 270ms var(--ease-in) forwards;
}
@keyframes drawerSlideIn {
  from { transform: translate3d(100%, 0, 0); }
  to { transform: translate3d(0, 0, 0); }
}
@keyframes drawerSlideOut {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(100%, 0, 0); }
}

/* Modal Box: fade + rise 8px + scale 0.97→1 (--dur-md 320ms, ease-out), close 200ms (--dur-sm, ease-in) */
.modal {
  background: #fff;
  border-radius: 8px;
  padding: 26px 28px;
  box-shadow: 0 32px 72px -16px rgba(0, 12, 35, 0.38), 0 0 0 1px rgba(0, 12, 35, 0.06);
  transform: translate3d(0, 0, 0) scale(1);
  animation: modalEnter var(--dur-md) var(--ease-out) forwards;
  will-change: transform, opacity;
  transform-origin: center center;
}
.modal.closing {
  animation: modalExit var(--dur-sm) var(--ease-in) forwards;
}
@keyframes modalEnter {
  from {
    opacity: 0;
    transform: translate3d(0, 8px, 0) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
}
@keyframes modalExit {
  from {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
  to {
    opacity: 0;
    transform: translate3d(0, 8px, 0) scale(0.97);
  }
}

/* Dropdowns / Filter Menus: fade + 4px drop + scale 0.98→1 (200ms --dur-sm, ease-out), close 140ms (--dur-xs, ease-in) */
.dropdown-menu, .apple-popover {
  animation: dropdownEnter var(--dur-sm) var(--ease-out) forwards;
  transform-origin: top right;
  will-change: transform, opacity;
  box-shadow: 0 16px 40px -8px rgba(0, 12, 35, 0.22), 0 0 0 1px rgba(0, 12, 35, 0.06);
}
.dropdown-menu.closing, .apple-popover.closing {
  animation: dropdownExit var(--dur-xs) var(--ease-in) forwards;
}
@keyframes dropdownEnter {
  from {
    opacity: 0;
    transform: translate3d(0, -4px, 0) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
}
@keyframes dropdownExit {
  from {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
  to {
    opacity: 0;
    transform: translate3d(0, -4px, 0) scale(0.98);
  }
}

/* Dropdown chevron rotates 180° (--dur-md, ease-out) */
.dropdown-chevron {
  display: inline-block;
  transition: transform var(--dur-md) var(--ease-out);
}
.dropdown-chevron.open {
  transform: rotate(180deg);
}

/* Expandable rows / accordions: grid-template-rows 0fr→1fr (--dur-md), inner content fades in with 60ms delay, chevron rotates 90° */
.accordion-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--dur-md) var(--ease-out);
}
.accordion-wrapper.open {
  grid-template-rows: 1fr;
}
.accordion-content {
  overflow: hidden;
  min-height: 0;
  opacity: 0;
  transition: opacity var(--dur-md) var(--ease-out) 60ms;
}
.accordion-wrapper.open .accordion-content {
  opacity: 1;
}
.accordion-chevron {
  display: inline-block;
  transition: transform var(--dur-md) var(--ease-out);
}
.accordion-chevron.open {
  transform: rotate(90deg);
}

/* Toasts: rise 16px + fade in (--dur-md), auto-hide 3.5s, exit 200ms (--dur-sm) */
.toast-wrapper {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 2000;
  animation: toastEnter var(--dur-md) var(--ease-out) forwards;
  will-change: transform, opacity;
}
.toast-wrapper.closing {
  animation: toastExit var(--dur-sm) var(--ease-in) forwards;
}
@keyframes toastEnter {
  from {
    opacity: 0;
    transform: translate3d(0, 16px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}
@keyframes toastExit {
  from {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
  to {
    opacity: 0;
    transform: translate3d(0, 16px, 0);
  }
}

/* Delivery stepper progress line fills with --dur-md */
.stepper-progress {
  transition: width var(--dur-md) var(--ease-out);
}

/* Buttons: scale 0.97 on press (--dur-xs), hover colour changes --dur-xs */
button, .btn, .btn-white {
  transition: transform var(--dur-xs) var(--ease-out), background-color var(--dur-xs) var(--ease-out), color var(--dur-xs) var(--ease-out), border-color var(--dur-xs) var(--ease-out), opacity var(--dur-xs) var(--ease-out);
}
button:active:not(:disabled), .btn:active:not(:disabled), .btn-white:active:not(:disabled) {
  transform: scale(0.97);
}

/* Sidebar active white pill: slides to clicked item (translateY, --dur-md, --ease-out) */
.side {
  position: relative;
}
.side-pill {
  position: absolute;
  left: 6px;
  right: 6px;
  top: 0;
  background: var(--white);
  border-radius: var(--r-panel);
  z-index: 0;
  pointer-events: none;
  transition: transform var(--dur-md) var(--ease-out), height var(--dur-md) var(--ease-out), opacity var(--dur-sm) var(--ease-out);
}
.side-item {
  position: relative;
  z-index: 1;
  background: transparent !important;
  transition: color var(--dur-sm) var(--ease-out);
}
.side-item svg {
  transition: stroke var(--dur-sm) var(--ease-out);
}
.side-item.active {
  color: var(--ink);
  font-weight: 500;
}

/* Segmented controls & filter tabs: sliding ink pill (--dur-md, --ease-out) */
.segmented {
  position: relative;
}
.seg-pill {
  position: absolute;
  top: 3px;
  bottom: 3px;
  background: var(--ink);
  border-radius: 999px;
  pointer-events: none;
  z-index: 0;
  transition: transform var(--dur-md) var(--ease-out), width var(--dur-md) var(--ease-out);
}
.segmented button {
  position: relative;
  z-index: 1;
  background: transparent !important;
  transition: color var(--dur-sm) var(--ease-out);
}
.segmented button.on {
  color: #fff !important;
}

.tabs {
  position: relative;
}
.tab-pill {
  position: absolute;
  top: 0;
  bottom: 0;
  background: var(--ink);
  border-radius: 999px;
  pointer-events: none;
  z-index: 0;
  transition: transform var(--dur-md) var(--ease-out), width var(--dur-md) var(--ease-out);
}
.tab {
  position: relative;
  z-index: 1;
  background: transparent;
  transition: color var(--dur-sm) var(--ease-out), border-color var(--dur-xs) var(--ease-out);
  cursor: pointer;
}
.tab.on {
  color: #fff;
  border-color: var(--ink);
}
.tab.on b {
  color: rgba(255, 255, 255, 0.7);
}

/* Chart range change: bars/lines transition with --dur-lg ease-out, no stagger */
.chart-bar, .chart-path, .chart-step-line {
  transition: transform var(--dur-lg) var(--ease-out), height var(--dur-lg) var(--ease-out), d var(--dur-lg) var(--ease-out);
}

/* Glass element rule: never animate transform on glass, only opacity */
.glass {
  transition: opacity var(--dur-sm) var(--ease-out);
}

/* Page and Tab Content swap wrappers */
.page-swap-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
.tab-swap-container {
  width: 100%;
  position: relative;
}

/* ---------- Responsive ---------- */
@media (max-width: 1200px) {
  :root {
    --sidebar: 64px;
  }
  .side a span, .side-item span, .side-label, .me div, .logo, .search {
    display: none;
  }
  .logo-tile {
    padding: 0;
    justify-content: center;
  }
  .bottom {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .app {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 60px;
    padding: 8px;
  }
  .sidebar {
    display: none;
  }
  .kpis {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .bottom {
    grid-template-columns: 1fr;
  }
  .auth {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
  .auth-right {
    display: none;
  }
  .cols {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --dur-xs: 1ms !important;
    --dur-sm: 1ms !important;
    --dur-md: 1ms !important;
    --dur-lg: 1ms !important;
    --shift-page: 0px !important;
    --shift-tab: 0px !important;
  }
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
}
`;

export function injectGlobalStyles() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  // 1. Inject Google Fonts
  const fontLinkId = 'stocksense-google-fonts';
  if (!document.getElementById(fontLinkId)) {
    const link = document.createElement('link');
    link.id = fontLinkId;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@300;400;500;600&display=swap';
    document.head.appendChild(link);
  }

  // 2. Inject StockSense CSS Tokens & Classes
  const styleId = 'stocksense-stylesheet';
  let styleEl = document.getElementById(styleId);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  styleEl.innerHTML = STOCKSENSE_CSS;
}
