import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { createPortal } from 'react-dom';
import { scrollThumbMetrics } from './scroll-thumb-metrics';

/** Overlay only: the window or target element's native scrolling stays authoritative. */
export function FloatingScrollThumb({ targetRef, label = 'Rolagem da página', controls = 'root' }: {
  targetRef?: RefObject<HTMLElement | null>; label?: string; controls?: string;
}) {
  const [metrics, setMetrics] = useState(() => ({ ...scrollThumbMetrics(0, 0, 0), enabled: false, blocked: false, viewport: 0, topEdge: 0, rightEdge: 0 }));
  const [near, setNear] = useState(false), [dragging, setDragging] = useState(false);
  const drag = useRef<{ y: number; scroll: number } | null>(null);
  const bounds = useRef({ top: 0, right: 0, height: 0 });
  useEffect(() => {
    if (!window.matchMedia || !window.ResizeObserver) return;
    const media = window.matchMedia('(hover: hover) and (pointer: fine) and (forced-colors: none)');
    const root = document.documentElement;
    const target = targetRef?.current;
    if (targetRef && !target) return;
    const source = target ?? root;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (media.matches) source.dataset.floatingScroll = 'true';
      else delete source.dataset.floatingScroll;
      const viewport = target ? target.clientHeight : window.innerHeight;
      const rect = target?.getBoundingClientRect();
      bounds.current = { top: rect?.top ?? 0, right: rect?.right ?? window.innerWidth, height: viewport };
      setMetrics({ ...scrollThumbMetrics(viewport, source.scrollHeight, target ? target.scrollTop : window.scrollY), enabled: media.matches, blocked: document.body.style.overflow === 'hidden', viewport, topEdge: bounds.current.top, rightEdge: bounds.current.right });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const pointer = (event: PointerEvent) => {
      const edge = bounds.current;
      if (event.pointerType !== 'touch') setNear(event.clientX >= edge.right - 32 && event.clientX <= edge.right + 16 && event.clientY >= edge.top && event.clientY <= edge.top + edge.height);
    };
    const leave = () => setNear(false);
    const out = (event: PointerEvent) => { if (!event.relatedTarget) leave(); };
    const resize = new ResizeObserver(schedule);
    resize.observe(target ?? document.body);
    if (target) for (const child of target.children) resize.observe(child);
    else { const app = document.getElementById('root'); if (app) resize.observe(app); }
    const body = new MutationObserver(schedule);
    body.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    window.addEventListener('scroll', schedule, { passive: true });
    target?.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('pointermove', pointer, { passive: true });
    window.addEventListener('pointerout', out);
    window.addEventListener('blur', leave);
    media.addEventListener('change', schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame); resize.disconnect(); body.disconnect();
      window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule);
      target?.removeEventListener('scroll', schedule);
      window.removeEventListener('pointermove', pointer); window.removeEventListener('pointerout', out);
      window.removeEventListener('blur', leave); media.removeEventListener('change', schedule);
      delete source.dataset.floatingScroll;
    };
  }, [targetRef]);
  const scrollPosition = () => targetRef ? targetRef.current?.scrollTop ?? 0 : window.scrollY;
  const scrollTo = (top: number) => {
    const options = { top: Math.max(0, Math.min(metrics.range, top)), behavior: 'instant' as const };
    if (targetRef) targetRef.current?.scrollTo(options); else window.scrollTo(options);
  };
  if (!metrics.enabled || metrics.blocked || metrics.range <= 0) return null;
  return createPortal(<div className="floating-scroll-overlay" style={{ top: metrics.topEdge, left: metrics.rightEdge - 32, height: metrics.viewport }}>
    <div className="floating-scroll-thumb" role="scrollbar" aria-label={label} aria-controls={controls}
    aria-orientation="vertical" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(metrics.progress * 100)}
    tabIndex={0} data-revealed={near || dragging} data-dragging={dragging}
    style={{ top: metrics.top, height: metrics.height }}
    onPointerDown={event => {
      if (event.button !== 0) return;
      event.preventDefault(); event.currentTarget.focus({ preventScroll: true });
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = { y: event.clientY, scroll: scrollPosition() }; setDragging(true);
    }}
    onPointerMove={event => {
      if (!drag.current || !metrics.travel) return;
      scrollTo(drag.current.scroll + (event.clientY - drag.current.y) * metrics.range / metrics.travel);
    }}
    onPointerUp={event => { drag.current = null; setDragging(false); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
    onPointerCancel={() => { drag.current = null; setDragging(false); }}
    onLostPointerCapture={() => { drag.current = null; setDragging(false); }}
    onKeyDown={event => {
      const steps: Record<string, number> = { ArrowDown: 48, ArrowUp: -48, PageDown: metrics.viewport * .9, PageUp: -metrics.viewport * .9, Home: -metrics.range, End: metrics.range };
      const step = steps[event.key];
      if (step === undefined) return;
      event.preventDefault(); scrollTo(scrollPosition() + step);
    }} />
  </div>, document.body);
}
