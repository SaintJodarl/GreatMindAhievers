'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, Minus, Plus } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Transform {
  scale: number;
  x: number;
  y: number;
}

interface ZoomableTreeViewportProps {
  children: React.ReactNode;
  ariaLabel: string;
  className?: string;
  viewportClassName?: string;
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
  fitPadding?: number;
  minScale?: number;
  maxScale?: number;
  resetKey?: React.Key;
  variant?: 'dark' | 'light';
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getDistance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

const getMidpoint = (a: Point, b: Point): Point => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

export default function ZoomableTreeViewport({
  children,
  ariaLabel,
  className = '',
  viewportClassName = '',
  contentClassName = '',
  contentStyle,
  fitPadding = 32,
  minScale = 0.03,
  maxScale = 3,
  resetKey,
  variant = 'light',
}: ZoomableTreeViewportProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const latestTransformRef = useRef<Transform>({ scale: 1, x: 0, y: 0 });
  const userAdjustedRef = useRef(false);
  const dragMovedRef = useRef(false);
  const activePointersRef = useRef(new Map<number, Point>());
  const dragStartRef = useRef<{ point: Point; transform: Transform } | null>(null);
  const pinchStartRef = useRef<{
    distance: number;
    scale: number;
    contentX: number;
    contentY: number;
  } | null>(null);

  const [transform, setTransform] = useState<Transform>({ scale: 1, x: 0, y: 0 });
  const [fitScale, setFitScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    latestTransformRef.current = transform;
  }, [transform]);

  const fitToContainer = useCallback(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;

    if (!viewport || !content) return;

    const viewportWidth = viewport.clientWidth;
    const viewportHeight = viewport.clientHeight;
    const contentWidth = content.offsetWidth;
    const contentHeight = content.offsetHeight;

    if (viewportWidth <= 0 || viewportHeight <= 0 || contentWidth <= 0 || contentHeight <= 0) {
      return;
    }

    const availableWidth = Math.max(1, viewportWidth - fitPadding);
    const availableHeight = Math.max(1, viewportHeight - fitPadding);
    const nextScale = clamp(
      Math.min(1, availableWidth / contentWidth, availableHeight / contentHeight),
      minScale,
      Math.min(1, maxScale)
    );
    const nextTransform = {
      scale: nextScale,
      x: (viewportWidth - contentWidth * nextScale) / 2,
      y: Math.max(12, (viewportHeight - contentHeight * nextScale) / 2),
    };

    setFitScale(nextScale);
    setTransform(nextTransform);
  }, [fitPadding, maxScale, minScale]);

  const requestFit = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      fitToContainer();
    });
  }, [fitToContainer]);

  useEffect(() => {
    userAdjustedRef.current = false;
    requestFit();
  }, [requestFit, resetKey]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;

    if (!viewport || !content || typeof ResizeObserver === 'undefined') {
      requestFit();
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      if (!userAdjustedRef.current) {
        requestFit();
      }
    });

    observer.observe(viewport);
    observer.observe(content);
    requestFit();

    return () => {
      observer.disconnect();
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [requestFit]);

  const zoomBy = useCallback(
    (factor: number, origin?: Point) => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const originInViewport = origin ?? {
        x: viewport.clientWidth / 2,
        y: viewport.clientHeight / 2,
      };

      userAdjustedRef.current = true;
      setTransform((previous) => {
        const nextScale = clamp(previous.scale * factor, minScale, maxScale);
        const contentX = (originInViewport.x - previous.x) / previous.scale;
        const contentY = (originInViewport.y - previous.y) / previous.scale;

        return {
          scale: nextScale,
          x: originInViewport.x - contentX * nextScale,
          y: originInViewport.y - contentY * nextScale,
        };
      });
    },
    [maxScale, minScale]
  );

  const resetToFit = useCallback(() => {
    userAdjustedRef.current = false;
    requestFit();
  }, [requestFit]);

  const startGestureFromPointers = useCallback(() => {
    const viewport = viewportRef.current;
    const points = Array.from(activePointersRef.current.values());

    if (!viewport || points.length === 0) {
      dragStartRef.current = null;
      pinchStartRef.current = null;
      return;
    }

    const currentTransform = latestTransformRef.current;

    if (points.length >= 2) {
      const rect = viewport.getBoundingClientRect();
      const center = getMidpoint(points[0], points[1]);
      const centerInViewport = {
        x: center.x - rect.left,
        y: center.y - rect.top,
      };

      pinchStartRef.current = {
        distance: Math.max(1, getDistance(points[0], points[1])),
        scale: currentTransform.scale,
        contentX: (centerInViewport.x - currentTransform.x) / currentTransform.scale,
        contentY: (centerInViewport.y - currentTransform.y) / currentTransform.scale,
      };
      dragStartRef.current = null;
      return;
    }

    dragStartRef.current = {
      point: points[0],
      transform: currentTransform,
    };
    pinchStartRef.current = null;
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    userAdjustedRef.current = true;
    dragMovedRef.current = false;
    setIsDragging(true);
    startGestureFromPointers();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!activePointersRef.current.has(event.pointerId)) return;

    activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = Array.from(activePointersRef.current.values());

    if (points.length >= 2) {
      dragMovedRef.current = true;
      const viewport = viewportRef.current;
      const pinchStart = pinchStartRef.current;
      if (!viewport || !pinchStart) {
        startGestureFromPointers();
        return;
      }

      const rect = viewport.getBoundingClientRect();
      const center = getMidpoint(points[0], points[1]);
      const centerInViewport = {
        x: center.x - rect.left,
        y: center.y - rect.top,
      };
      const nextScale = clamp(
        pinchStart.scale * (getDistance(points[0], points[1]) / pinchStart.distance),
        minScale,
        maxScale
      );

      setTransform({
        scale: nextScale,
        x: centerInViewport.x - pinchStart.contentX * nextScale,
        y: centerInViewport.y - pinchStart.contentY * nextScale,
      });
      return;
    }

    const dragStart = dragStartRef.current;
    if (!dragStart) {
      startGestureFromPointers();
      return;
    }

    const point = points[0];
    if (getDistance(point, dragStart.point) > 4) {
      dragMovedRef.current = true;
    }

    setTransform({
      ...dragStart.transform,
      x: dragStart.transform.x + point.x - dragStart.point.x,
      y: dragStart.transform.y + point.y - dragStart.point.y,
    });
  };

  const finishPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.delete(event.pointerId);

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // The browser may already have released capture after a touch cancellation.
    }

    if (activePointersRef.current.size === 0) {
      setIsDragging(false);
      dragStartRef.current = null;
      pinchStartRef.current = null;
      return;
    }

    startGestureFromPointers();
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) return;

    event.preventDefault();
    const viewport = viewportRef.current;
    if (!viewport) return;

    const rect = viewport.getBoundingClientRect();
    zoomBy(Math.exp(-event.deltaY * 0.002), {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      zoomBy(1.2);
    } else if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      zoomBy(1 / 1.2);
    } else if (event.key === '0') {
      event.preventDefault();
      resetToFit();
    }
  };

  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!dragMovedRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    dragMovedRef.current = false;
  };

  const isDark = variant === 'dark';
  const buttonClass = isDark
    ? 'inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-100 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-400'
    : 'inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const scaleClass = isDark
    ? 'min-w-14 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-center text-[11px] font-semibold tabular-nums text-slate-200'
    : 'min-w-14 rounded-lg border border-gray-200 bg-white px-2 py-1 text-center text-[11px] font-semibold tabular-nums text-gray-600 shadow-sm';
  const viewportBaseClass = isDark
    ? 'relative h-[clamp(21rem,58vh,34rem)] overflow-hidden rounded-lg border border-white/10 bg-black/10'
    : 'relative h-[clamp(24rem,68vh,44rem)] overflow-hidden rounded-lg border border-gray-100 bg-gray-50/60';

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-end gap-2">
        <div className={scaleClass}>{Math.round(transform.scale * 100)}%</div>
        <button
          type="button"
          className={buttonClass}
          onClick={() => zoomBy(1 / 1.2)}
          title="Zoom out"
          aria-label="Zoom out"
        >
          <Minus size={16} />
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={resetToFit}
          title="Fit to screen"
          aria-label="Fit to screen"
        >
          <Maximize2 size={16} />
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => zoomBy(1.2)}
          title="Zoom in"
          aria-label="Zoom in"
        >
          <Plus size={16} />
        </button>
      </div>

      <div
        ref={viewportRef}
        className={`${viewportBaseClass} ${viewportClassName}`}
        style={{
          touchAction: 'none',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
        onClickCapture={handleClickCapture}
      >
        <div
          ref={contentRef}
          className={`absolute left-0 top-0 w-max origin-top-left will-change-transform ${contentClassName}`}
          style={{
            ...contentStyle,
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
          }}
          data-fit-scale={fitScale}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
