"use client";

import { useEffect, useRef } from "react";

const DOT_GAP = 30;
const DOT_RADIUS = 1;
const CURSOR_RADIUS = 170;
const CURSOR_PUSH = 14;
const BASE_ALPHA = 0.09;
const PEAK_ALPHA = 0.24;
const ALPHA_STEPS = 5;
const TAU = Math.PI * 2;
const RETURN_EASE = 0.14;
const BOOST_EASE = 0.16;

type Dot = {
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  boost: number;
};

function mix(current: number, target: number, amount: number) {
  return current + (target - current) * amount;
}

export function DotMatrix() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let dots: Dot[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let resizeFrame = 0;
    let disposed = false;
    let interactive = finePointer.matches && !reducedMotion.matches;

    const pointer = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      active: false,
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);

      const buckets: Dot[][] = Array.from({ length: ALPHA_STEPS }, () => []);

      for (const dot of dots) {
        const level = Math.min(
          ALPHA_STEPS - 1,
          Math.round(dot.boost * (ALPHA_STEPS - 1)),
        );
        buckets[level]?.push(dot);
      }

      for (let level = 0; level < ALPHA_STEPS; level += 1) {
        const bucket = buckets[level];
        if (!bucket || bucket.length === 0) {
          continue;
        }

        const alpha =
          BASE_ALPHA +
          ((PEAK_ALPHA - BASE_ALPHA) * level) / (ALPHA_STEPS - 1);

        context.beginPath();
        for (const dot of bucket) {
          const x = dot.x + dot.offsetX;
          const y = dot.y + dot.offsetY;
          context.moveTo(x + DOT_RADIUS, y);
          context.arc(x, y, DOT_RADIUS, 0, TAU);
        }
        context.fillStyle = `rgba(245, 245, 245, ${alpha})`;
        context.fill();
      }
    };

    const build = () => {
      width = window.innerWidth;
      height = window.innerHeight;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const area = width * height;
      let gap = DOT_GAP;

      if (width < 768) {
        gap = 36;
      } else if (area > 3_500_000) {
        gap = 40;
      } else if (area > 2_000_000) {
        gap = 36;
      }

      const columns = Math.ceil(width / gap) + 1;
      const rows = Math.ceil(height / gap) + 1;
      const offsetX = (width - (columns - 1) * gap) / 2;
      const offsetY = (height - (rows - 1) * gap) / 2;

      dots = [];
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          dots.push({
            x: offsetX + column * gap,
            y: offsetY + row * gap,
            offsetX: 0,
            offsetY: 0,
            boost: 0,
          });
        }
      }

      pointer.active = false;
      pointer.x = -1000;
      pointer.y = -1000;
      pointer.targetX = -1000;
      pointer.targetY = -1000;

      draw();
    };

    const animate = () => {
      frame = 0;
      if (disposed) {
        return;
      }

      let moving = false;

      if (pointer.active) {
        pointer.x = mix(pointer.x, pointer.targetX, 0.24);
        pointer.y = mix(pointer.y, pointer.targetY, 0.24);

        if (
          Math.abs(pointer.x - pointer.targetX) > 0.1 ||
          Math.abs(pointer.y - pointer.targetY) > 0.1
        ) {
          moving = true;
        }
      }

      for (const dot of dots) {
        let targetOffsetX = 0;
        let targetOffsetY = 0;
        let targetBoost = 0;

        if (interactive && pointer.active) {
          const deltaX = dot.x - pointer.x;
          const deltaY = dot.y - pointer.y;
          const distanceSquared = deltaX * deltaX + deltaY * deltaY;

          if (distanceSquared < CURSOR_RADIUS * CURSOR_RADIUS) {
            const distance = Math.sqrt(distanceSquared) || 0.0001;
            const falloff = 1 - distance / CURSOR_RADIUS;
            targetBoost = falloff * falloff;

            const push = (CURSOR_PUSH * targetBoost) / distance;
            targetOffsetX = deltaX * push;
            targetOffsetY = deltaY * push;
          }
        }

        dot.offsetX = mix(dot.offsetX, targetOffsetX, RETURN_EASE);
        dot.offsetY = mix(dot.offsetY, targetOffsetY, RETURN_EASE);
        dot.boost = mix(dot.boost, targetBoost, BOOST_EASE);

        if (
          Math.abs(dot.offsetX - targetOffsetX) > 0.015 ||
          Math.abs(dot.offsetY - targetOffsetY) > 0.015 ||
          Math.abs(dot.boost - targetBoost) > 0.002
        ) {
          moving = true;
        }
      }

      draw();

      if (moving) {
        schedule();
      }
    };

    const schedule = () => {
      if (!disposed && frame === 0) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!interactive) {
        return;
      }

      pointer.targetX = event.clientX;
      pointer.targetY = event.clientY;

      if (!pointer.active) {
        pointer.active = true;
        pointer.x = event.clientX;
        pointer.y = event.clientY;
      }

      schedule();
    };

    const onPointerLeave = () => {
      if (!pointer.active) {
        return;
      }

      pointer.active = false;
      schedule();
    };

    const syncMode = () => {
      interactive = finePointer.matches && !reducedMotion.matches;

      if (!interactive) {
        pointer.active = false;
        schedule();
      }
    };

    const onResize = () => {
      if (resizeFrame !== 0) {
        return;
      }

      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        build();
      });
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        if (frame !== 0) {
          window.cancelAnimationFrame(frame);
          frame = 0;
        }
        return;
      }

      schedule();
    };

    build();

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("blur", onPointerLeave);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibilityChange);
    finePointer.addEventListener("change", syncMode);
    reducedMotion.addEventListener("change", syncMode);

    return () => {
      disposed = true;

      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
      if (resizeFrame !== 0) {
        window.cancelAnimationFrame(resizeFrame);
      }

      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener(
        "pointerleave",
        onPointerLeave,
      );
      window.removeEventListener("blur", onPointerLeave);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      finePointer.removeEventListener("change", syncMode);
      reducedMotion.removeEventListener("change", syncMode);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
