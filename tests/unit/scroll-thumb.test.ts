import { describe, expect, it } from 'vitest';
import { scrollThumbMetrics } from '../../src/components/ui/scroll-thumb-metrics';

describe('floating scroll thumb geometry', () => {
  it('caps the indicator and keeps top/bottom margins across the whole scroll range', () => {
    const start = scrollThumbMetrics(800, 1600, 0), end = scrollThumbMetrics(800, 1600, 800);
    expect(start.height).toBe(96); expect(start.top).toBe(24);
    expect(end.top + end.height).toBe(776); expect(end.progress).toBe(1);
  });
  it('clamps overscroll, adapts to tiny windows and avoids invalid geometry', () => {
    expect(scrollThumbMetrics(800, 1600, -100).progress).toBe(0);
    expect(scrollThumbMetrics(800, 1600, 900).progress).toBe(1);
    expect(scrollThumbMetrics(40, 5000, 0).height).toBe(20);
    expect(scrollThumbMetrics(800, 800, 0).range).toBe(0);
    expect(scrollThumbMetrics(0, 0, 0).top).toBe(0);
  });
});
