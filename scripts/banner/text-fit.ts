export interface FitFontSizeOptions {
  minSize?: number;
  maxSize?: number;
  tolerance?: number;
}

/**
 * Binary search for the largest font size such that `measure(size) <= maxWidth`.
 *
 * Mirrors `_detail_resize_banner_text.py::find_optimal_font_size`. The Inkscape
 * subprocess is hidden behind `measure`, so this function is pure and unit-testable.
 *
 * Returns the largest size that fits within tolerance, or `minSize` if even
 * that is too wide.
 */
export async function fitFontSize(
  measure: (sizePx: number) => Promise<number>,
  maxWidth: number,
  opts: FitFontSizeOptions = {}
): Promise<number> {
  const minSize = opts.minSize ?? 1;
  const maxSize = opts.maxSize ?? 200;
  const tolerance = opts.tolerance ?? 0.1;

  if (!(maxWidth > 0)) {
    throw new Error(`fitFontSize: maxWidth must be > 0 (got ${maxWidth})`);
  }
  if (minSize >= maxSize) {
    throw new Error(`fitFontSize: minSize (${minSize}) must be < maxSize (${maxSize})`);
  }

  let lo = minSize;
  let hi = maxSize;
  let best = minSize;

  while (hi - lo > tolerance) {
    const mid = (lo + hi) / 2;
    const w = await measure(mid);
    if (w <= maxWidth) {
      best = mid;
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return best;
}
