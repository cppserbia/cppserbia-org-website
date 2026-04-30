// @vitest-environment node
import { describe, expect, it } from "vitest";

import { fitFontSize } from "./text-fit";

describe("fitFontSize", () => {
  // A measurer where width is linearly proportional to font size: w = k * size.
  const linear = (k: number) => async (size: number) => k * size;

  it("finds the size at which width = maxWidth (within tolerance)", async () => {
    // w = 10 * size. maxWidth = 100 → optimal size = 10.
    const size = await fitFontSize(linear(10), 100, { tolerance: 0.01 });
    expect(size).toBeCloseTo(10, 1);
  });

  it("respects minSize when nothing fits", async () => {
    // Width grows fast. At minSize=1 it's already 1000. maxWidth=10.
    const size = await fitFontSize(linear(1000), 10, { minSize: 1, maxSize: 200 });
    expect(size).toBe(1);
  });

  it("returns near maxSize when everything fits", async () => {
    // Width is tiny. Should converge near maxSize.
    const size = await fitFontSize(linear(0.01), 1000, {
      minSize: 1,
      maxSize: 50,
      tolerance: 0.01,
    });
    expect(size).toBeGreaterThan(49.9);
    expect(size).toBeLessThanOrEqual(50);
  });

  it("converges within the requested tolerance", async () => {
    let calls = 0;
    const measure = async (size: number) => {
      calls++;
      return 5 * size;
    };
    const size = await fitFontSize(measure, 100, {
      minSize: 1,
      maxSize: 200,
      tolerance: 0.05,
    });
    // Optimal is 20. With tolerance 0.05 we expect ~13 iterations log2(199 / 0.05).
    expect(size).toBeCloseTo(20, 1);
    expect(calls).toBeLessThan(20);
  });

  it("never returns a size whose width exceeds maxWidth (unless even minSize is too wide)", async () => {
    // Mock real-ish measurer that's nonlinear.
    const measure = async (size: number) => Math.pow(size, 1.3);
    const maxWidth = 50;
    const size = await fitFontSize(measure, maxWidth, { tolerance: 0.001 });
    expect(await measure(size)).toBeLessThanOrEqual(maxWidth);
  });

  it("rejects bad inputs", async () => {
    await expect(fitFontSize(linear(1), 0)).rejects.toThrow(/maxWidth/);
    await expect(fitFontSize(linear(1), -5)).rejects.toThrow(/maxWidth/);
    await expect(fitFontSize(linear(1), 100, { minSize: 50, maxSize: 50 })).rejects.toThrow(
      /minSize/
    );
  });
});
