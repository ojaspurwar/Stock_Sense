export type StockCubeEvent = 'receipt' | 'delivery' | 'transfer' | 'adjustment';

export interface StockCubeOptions {
  color?: string;
  alert?: string;
  font?: string;
  cellW?: number;
  cellH?: number;
  fontPx?: number;
  spin?: number;
  tilt?: number;
  fps?: number;
}

export interface StockCubeInstance {
  play: (type: StockCubeEvent) => void;
  destroy: () => void;
}

export function createStockCube(
  canvas: HTMLCanvasElement,
  opts: StockCubeOptions = {}
): StockCubeInstance {
  const o = Object.assign(
    {
      color: '255,255,255', // chars (white)
      alert: '228,87,61', // coral #E4573D for adjustment
      font: "'DM Mono', ui-monospace, monospace",
      cellW: 8.4,
      cellH: 13,
      fontPx: 12,
      spin: 0.16, // radians per second around Y
      tilt: 0.52, // fixed X tilt (looking down at the top)
      fps: 30,
    },
    opts
  );

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      play: () => {},
      destroy: () => {},
    };
  }

  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const RAMP = '.:-=+*#%@'; // dark → bright
  const SLOT = [1, 1, 1]; // top-front-right crate used by receipt/delivery
  const GLITCH = [-1, 1, 0]; // top-edge crate used by adjustment (always visible)
  let W = 0,
    H = 0,
    cols = 0,
    rows = 0,
    dpr = 1;
  let raf = 0,
    last = 0,
    clock = 0,
    alive = true;
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // state
  let slotVisible = false;
  let ev: { type: StockCubeEvent; t0: number; dur: number } | null = null;
  let parX = 0,
    parY = 0,
    tgtX = 0,
    tgtY = 0;
  let noise: { x: number; y: number; ch: string; a: number }[] = [];

  // ---------- math ----------
  const rotY = (p: number[], a: number) => {
    const c = Math.cos(a),
      s = Math.sin(a);
    return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
  };
  const rotX = (p: number[], a: number) => {
    const c = Math.cos(a),
      s = Math.sin(a);
    return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
  };
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const bounce = (t: number) => {
    const n = 7.5625,
      d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  };
  const L = (() => {
    const v = [-0.4, 0.45, 0.8],
      m = Math.hypot(...v);
    return v.map((x) => x / m);
  })();

  const FACES: [number[], number[][]][] = [
    // normal, 4 corners (unit cube -1..1)
    [
      [1, 0, 0],
      [
        [1, -1, -1],
        [1, 1, -1],
        [1, 1, 1],
        [1, -1, 1],
      ],
    ],
    [
      [-1, 0, 0],
      [
        [-1, -1, 1],
        [-1, 1, 1],
        [-1, 1, -1],
        [-1, -1, -1],
      ],
    ],
    [
      [0, 1, 0],
      [
        [-1, 1, -1],
        [-1, 1, 1],
        [1, 1, 1],
        [1, 1, -1],
      ],
    ],
    [
      [0, -1, 0],
      [
        [-1, -1, 1],
        [-1, -1, -1],
        [1, -1, -1],
        [1, -1, 1],
      ],
    ],
    [
      [0, 0, 1],
      [
        [-1, -1, 1],
        [1, -1, 1],
        [1, 1, 1],
        [-1, 1, 1],
      ],
    ],
    [
      [0, 0, -1],
      [
        [1, -1, -1],
        [-1, -1, -1],
        [-1, 1, -1],
        [1, 1, -1],
      ],
    ],
  ];

  function resize() {
    if (!ctx) return;
    const r = canvas.getBoundingClientRect();
    dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    W = r.width;
    H = r.height;
    if (W === 0 || H === 0) return;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(W / o.cellW);
    rows = Math.ceil(H / o.cellH);
    // twinkling dust around the cube
    noise = [];
    for (let k = 0; k < 170; k++) {
      const a = rnd() * Math.PI * 2,
        rr = Math.sqrt(rnd());
      noise.push({
        x: W * 0.52 + Math.cos(a) * rr * W * 0.44,
        y: H * 0.42 + Math.sin(a) * rr * H * 0.34,
        ch: '-=+*.:'[Math.floor(rnd() * 6)],
        a: 0.15 + rnd() * 0.4,
      });
    }
  }

  // ---------- one frame ----------
  function frame(dt: number) {
    if (!ctx || W === 0 || H === 0) return;
    clock += dt;
    parX += (tgtX - parX) * 0.06;
    parY += (tgtY - parY) * 0.06;
    const spinA = 0.7 + (reduce ? 0 : clock * o.spin) + parY;
    const tiltA = o.tilt + parX;
    const S = Math.min(W, H) * 0.12; // size of one crate on screen
    const cx = W * 0.54,
      cy = H * 0.37;

    // event progress
    let p = 0,
      type: StockCubeEvent | null = null;
    if (ev) {
      p = Math.min(1, (clock - ev.t0) / ev.dur);
      type = ev.type;
      if (p >= 1) {
        if (type === 'receipt') slotVisible = true;
        if (type === 'delivery') slotVisible = false;
        ev = null;
        type = null;
      }
    }

    // collect visible quads
    const quads: {
      scr: number[][];
      depth: number;
      light: number;
      alpha: number;
      hot: boolean;
    }[] = [];

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        for (let k = -1; k <= 1; k++) {
          const isSlot = i === SLOT[0] && j === SLOT[1] && k === SLOT[2];
          const isGlitch = i === GLITCH[0] && j === GLITCH[1] && k === GLITCH[2];
          let off = [0, 0, 0],
            alpha = 1,
            twist = 0,
            hot = false;

          if (isSlot) {
            if (type === 'receipt') {
              off = [0, (1 - bounce(p)) * 4.5, 0];
              alpha = Math.min(1, p * 3);
            } else if (type === 'delivery') {
              const e = ease(p);
              off = [e * 5, 0, 0];
              alpha = 1 - e;
            } else if (!slotVisible) {
              continue;
            }
          }
          if (type === 'transfer' && j === 0) twist = (ease(p) * Math.PI) / 2;
          if (type === 'adjustment' && isGlitch && p < 0.8) hot = true;

          const h = 0.44; // half size: leaves gaps so each crate reads on its own
          for (const [n, pts] of FACES) {
            // skip faces hidden inside the cube (keeps the gaps between crates clean)
            const ni = i + n[0],
              nj = j + n[1],
              nk = k + n[2];
            const inCube = Math.abs(ni) <= 1 && Math.abs(nj) <= 1 && Math.abs(nk) <= 1;
            const nIsSlot = ni === SLOT[0] && nj === SLOT[1] && nk === SLOT[2];
            const nMissing =
              nIsSlot && (!slotVisible || type === 'receipt' || type === 'delivery');
            const layerSeam = type === 'transfer' && (j === 0 || nj === 0) && n[1] !== 0;
            const moving = isSlot && (type === 'receipt' || type === 'delivery');
            if (inCube && !nMissing && !layerSeam && !moving) continue;

            let nn = rotY(n, twist);
            nn = rotX(rotY(nn, spinA), tiltA);
            if (nn[2] <= 0.02) continue; // facing away

            const scr = pts.map((v) => {
              let q = [i + v[0] * h, j + v[1] * h, k + v[2] * h];
              q = rotY(q, twist);
              q = [q[0] + off[0], q[1] + off[1], q[2] + off[2]];
              q = rotX(rotY(q, spinA), tiltA);
              const persp = 7 / (7 - q[2]);
              return [cx + q[0] * S * persp, cy - q[1] * S * persp, q[2]];
            });
            const depth = scr.reduce((a, s) => a + s[2], 0) / 4;
            const light = Math.max(0, nn[0] * L[0] + nn[1] * L[1] + nn[2] * L[2]);
            quads.push({ scr, depth, light, alpha, hot });
          }
        }
      }
    }
    quads.sort((a, b) => a.depth - b.depth);

    // rasterise quads into the character grid (painter's order)
    const grid: (typeof quads)[0][] = new Array(cols * rows);
    const inside = (x: number, y: number, q: number[][]) => {
      let sign = 0;
      for (let a = 0; a < 4; a++) {
        const [x1, y1] = q[a],
          [x2, y2] = q[(a + 1) % 4];
        const c = (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1);
        const s = c > 0 ? 1 : -1;
        if (sign === 0) sign = s;
        else if (s !== sign) return false;
      }
      return true;
    };

    for (const qd of quads) {
      const xs = qd.scr.map((s) => s[0]),
        ys = qd.scr.map((s) => s[1]);
      const gx0 = Math.max(0, Math.floor(Math.min(...xs) / o.cellW)),
        gx1 = Math.min(cols - 1, Math.ceil(Math.max(...xs) / o.cellW));
      const gy0 = Math.max(0, Math.floor(Math.min(...ys) / o.cellH)),
        gy1 = Math.min(rows - 1, Math.ceil(Math.max(...ys) / o.cellH));
      for (let gy = gy0; gy <= gy1; gy++) {
        for (let gx = gx0; gx <= gx1; gx++) {
          if (inside(gx * o.cellW + o.cellW / 2, gy * o.cellH + o.cellH / 2, qd.scr)) {
            grid[gy * cols + gx] = qd;
          }
        }
      }
    }

    // draw
    ctx.clearRect(0, 0, W, H);
    ctx.font = `${o.fontPx}px ${o.font}`;
    ctx.textBaseline = 'top';
    for (const d of noise) {
      if (!reduce && rnd() < 0.03) d.ch = '-=+*.:'[Math.floor(rnd() * 6)];
      ctx.fillStyle = `rgba(${o.color},${d.a})`;
      ctx.fillText(d.ch, d.x, d.y);
    }
    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        const qd = grid[gy * cols + gx];
        if (!qd) continue;
        let b = 0.22 + Math.pow(qd.light, 1.2) * 0.78,
          ch: string;
        if (qd.hot) {
          ch = '#$%&@!?*'[Math.floor(rnd() * 8)];
          ctx.fillStyle = `rgba(${o.alert},${0.95 * qd.alpha})`;
        } else {
          ch = RAMP[Math.min(RAMP.length - 1, Math.max(0, Math.round(b * (RAMP.length - 1))))];
          ctx.fillStyle = `rgba(${o.color},${(0.35 + b * 0.65) * qd.alpha})`;
        }
        ctx.fillText(ch, gx * o.cellW, gy * o.cellH);
      }
    }

    // floating label for the current event
    if (ev) {
      const labels: Record<StockCubeEvent, string> = {
        receipt: '+100 kg',
        delivery: '−20 kg',
        transfer: 'Main → Production',
        adjustment: '−3 kg damaged',
      };
      const fade = p < 0.15 ? p / 0.15 : p > 0.8 ? (1 - p) / 0.2 : 1;
      ctx.font = `500 14px ${o.font}`;
      ctx.textAlign = 'center';
      ctx.fillStyle =
        ev.type === 'adjustment'
          ? `rgba(${o.alert},${fade})`
          : `rgba(${o.color},${fade})`;
      ctx.fillText(labels[ev.type], cx, cy - S * 2.9 - p * 12);
      ctx.textAlign = 'start';
    }
  }

  function loop(ts: number) {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    if (ts - last < 1000 / o.fps) return;
    const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0;
    last = ts;
    frame(dt);
  }

  const DUR: Record<StockCubeEvent, number> = {
    receipt: 1.1,
    delivery: 1.0,
    transfer: 1.1,
    adjustment: 1.4,
  };

  function play(type: StockCubeEvent) {
    if (reduce) return;
    if (type === 'receipt') slotVisible = false; // crate must be missing before it drops in
    if (type === 'delivery') slotVisible = true; // crate must be there before it leaves
    ev = { type, t0: clock, dur: DUR[type] };
  }

  const parentEl = canvas.parentElement;

  const onMove = (e: MouseEvent) => {
    const r = canvas.getBoundingClientRect();
    tgtY = ((e.clientX - r.left) / r.width - 0.5) * 0.5;
    tgtX = ((e.clientY - r.top) / r.height - 0.5) * 0.25;
  };
  const onLeave = () => {
    tgtX = 0;
    tgtY = 0;
  };

  const ro =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          resize();
          if (reduce) frame(0);
        })
      : null;

  if (ro) ro.observe(canvas);
  if (parentEl) {
    parentEl.addEventListener('mousemove', onMove);
    parentEl.addEventListener('mouseleave', onLeave);
  }

  // pause when the tab is hidden (saves battery), resume when visible
  const onVis = () => {
    if (reduce) return;
    cancelAnimationFrame(raf);
    if (typeof document !== 'undefined' && !document.hidden) {
      last = 0;
      raf = requestAnimationFrame(loop);
    }
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVis);
  }

  resize();
  if (reduce) {
    slotVisible = true;
    frame(0);
  } else {
    raf = requestAnimationFrame(loop);
  }

  return {
    play,
    destroy() {
      alive = false;
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVis);
      }
      if (parentEl) {
        parentEl.removeEventListener('mousemove', onMove);
        parentEl.removeEventListener('mouseleave', onLeave);
      }
    },
  };
}
