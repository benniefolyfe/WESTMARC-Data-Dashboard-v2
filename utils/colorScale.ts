// colorScale.ts

/**
 * 5-color choropleth scale:
 *   0: No data/zero     -> Gray
 *   1: Very low         -> Red
 *   2: Low              -> Orange
 *   3: Moderate         -> Yellow
 *   4: High             -> Light Green
 *   5: Very high        -> Green
 */
const COLOR_SCALE = [
  '#D0D0D0', // 0: no data or zero
  '#C0392B', // 1: very low
  '#E67E22', // 2: low
  '#F1C40F', // 3: moderate
  '#82E0AA', // 4: high
  '#27AE60', // 5: very high
];

export function getChoroplethColor(
  value: number | null | undefined,
  domain: [number, number] | null
): string {
  if (value == null || domain == null) return COLOR_SCALE[0]; // gray
  if (value === 0) return COLOR_SCALE[0];

  const [min, max] = domain;
  if (max <= min) return COLOR_SCALE[3]; // fallback to mid

  // Normalize value to 0–1
  const t = (value - min) / (max - min);

  // Convert normalized t to 1–5 buckets
  // e.g., t = 0.00–0.20 => bucket 1
  //       t = 0.20–0.40 => bucket 2, etc.
  const bucket = Math.min(5, Math.max(1, Math.ceil(t * 5)));

  return COLOR_SCALE[bucket];
}