"use client";

import { useEffect, useRef, useState } from "react";

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input, select, textarea, summary, [data-cursor="hover"]';
const DOT_SIZE = 5;
const RING_SIZE = 30;

function mix(current: number, target: number, amount: number) {
  return current + (target - current) * amount;
}

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const finePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (min-width: 768px)",
    );
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let enabled = false;
    let frame = 0;
    let shown = false;
    let initialized = false;
    let targetX = 0;
    let targetY = 0;
    let dotX = 0;
    let dotY = 0;
    let ringX = 0;
    let ringY = 0;

    const render = () => {
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dotX - DOT_SIZE / 2}px, ${
          dotY - DOT_SIZE / 2
        }px, 0)`;
      }

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${
          ringX - RING_SIZE / 2
        }px, ${ringY - RING_SIZE / 2}px, 0)`;
      }
    };

    const animate = () => {
      frame = 0;
      if (!enabled) {
        return;
      }

      dotX = mix(dotX, targetX, 0.55);
      dotY = mix(dotY, targetY, 0.55);
      ringX = mix(ringX, targetX, 0.16);
      ringY = mix(ringY, targetY, 0.16);

      render();

      const dotSettled =
        Math.abs(targetX - dotX) < 0.1 && Math.abs(targetY - dotY) < 0.1;
      const ringSettled =
        Math.abs(targetX - ringX) < 0.1 && Math.abs(targetY - ringY) < 0.1;

      if (!dotSettled || !ringSettled) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    const schedule = () => {
      if (enabled && frame === 0) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!enabled) {
        return;
      }

      if (!initialized) {
        dotX = event.clientX;
        dotY = event.clientY;
        ringX = event.clientX;
        ringY = event.clientY;
        initialized = true;
        render();
      }

      targetX = event.clientX;
      targetY = event.clientY;

      if (!shown) {
        shown = true;
        document.documentElement.classList.add("has-custom-cursor");
        setVisible(true);
      }

      schedule();
    };

    const onPointerOver = (event: PointerEvent) => {
      if (!enabled) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      setHovering(Boolean(target.closest(INTERACTIVE_SELECTOR)));
    };

    const hide = () => {
      if (!shown) {
        return;
      }

      shown = false;
      initialized = false;
      document.documentElement.classList.remove("has-custom-cursor");
      setVisible(false);
      setHovering(false);
    };

    const activate = () => {
      if (enabled) {
        return;
      }

      enabled = true;

      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.addEventListener("pointerover", onPointerOver, {
        passive: true,
      });
      document.documentElement.addEventListener("pointerleave", hide);
      window.addEventListener("blur", hide);
    };

    const deactivate = () => {
      if (!enabled) {
        return;
      }

      enabled = false;
      document.documentElement.classList.remove("has-custom-cursor");

      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerover", onPointerOver);
      document.documentElement.removeEventListener("pointerleave", hide);
      window.removeEventListener("blur", hide);

      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }

      shown = false;
      initialized = false;
      setVisible(false);
      setHovering(false);
    };

    const syncMode = () => {
      if (finePointer.matches && !reducedMotion.matches) {
        activate();
      } else {
        deactivate();
      }
    };

    finePointer.addEventListener("change", syncMode);
    reducedMotion.addEventListener("change", syncMode);
    syncMode();

    return () => {
      finePointer.removeEventListener("change", syncMode);
      reducedMotion.removeEventListener("change", syncMode);

      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }

      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerover", onPointerOver);
      document.documentElement.removeEventListener("pointerleave", hide);
      window.removeEventListener("blur", hide);
    };
  }, []);

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[80] h-[30px] w-[30px] will-change-transform"
        style={{ opacity: visible ? 1 : 0, transition: "opacity 260ms ease" }}
      >
        <span
          className={`block h-full w-full rounded-full border transition-[transform,border-color] duration-200 ease-out ${
            hovering ? "scale-150 border-white/40" : "scale-100 border-white/25"
          }`}
        />
      </div>

      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[81] h-[5px] w-[5px] rounded-full bg-paper will-change-transform"
        style={{ opacity: visible ? 1 : 0, transition: "opacity 260ms ease" }}
      />
    </>
  );
}
