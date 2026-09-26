/**
 * StockSense Design Tokens
 * Source: styles.css :root
 * Palette: white, light grey, sky blue, navy-black ink. Coral & amber for status only.
 * No green anywhere.
 */

export const colors = {
  // Sky scale
  sky900: '#0B5A9C',
  sky700: '#1269AF', // Primary sky (page field, stock line, links)
  sky500: '#3C8CC7', // Receipts
  sky300: '#7DB6E3', // Chart hatch, transfers
  sky100: '#CAE4F5', // Soft borders
  sky50: '#EAF4FB',  // Selected row, focus ring

  // Neutrals
  white: '#FFFFFF',
  grey50: '#F4F6F9', // Secondary panels, read-only
  grey100: '#E8ECF2', // Borders, gridlines
  grey200: '#D5DBE4',
  muted: '#8A94A6',  // Labels, axis text
  ink2: '#3A4458',
  ink: '#000C23',    // Text, primary button, deliveries

  // Status (Never use green)
  coral: '#E4573D',  // Low stock, out of stock, damage, canceled
  amber: '#E9A23B',  // Waiting status only

  // Operation color codes
  receipt: '#3C8CC7',       // sky-500
  delivery: '#000C23',      // ink
  transfer: '#7DB6E3',      // sky-300
  adjustment: '#E4573D',    // coral
};

export const fonts = {
  sans: '"Inter Tight", "Segoe UI", system-ui, sans-serif',
  mono: '"DM Mono", ui-monospace, "SFMono-Regular", Menlo, monospace',
  serif: '"Instrument Serif", Georgia, "Times New Roman", serif',
};

export const layout = {
  radiusPanel: 6,
  gap: 10,
  sidebarWidth: 220,
};

export const backgroundGradient = `
  radial-gradient(ellipse 38% 22% at 88% 94%, rgba(255,255,255,.5), transparent 70%),
  radial-gradient(ellipse 30% 18% at 66% 102%, rgba(255,255,255,.4), transparent 70%),
  linear-gradient(180deg, #1269AF 0%, #3C8CC7 55%, #7DB6E3 100%)
`;
