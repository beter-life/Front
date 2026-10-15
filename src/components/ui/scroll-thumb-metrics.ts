export function scrollThumbMetrics(viewport: number, content: number, scrollTop: number) {
  const inset = Math.min(24, viewport / 4);
  const track = Math.max(0, viewport - inset * 2);
  const range = Math.max(0, content - viewport);
  const height = Math.min(track, 96, Math.max(36, track * viewport / Math.max(content, 1)));
  const travel = Math.max(0, track - height);
  const progress = range ? Math.min(1, Math.max(0, scrollTop / range)) : 0;
  return { range, height, travel, top: inset + travel * progress, progress };
}
