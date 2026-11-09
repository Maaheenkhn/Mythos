"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const ADJECTIVES = [
  "EXTRAORDINARY",
  "UNIMAGINABLE",
  "MONUMENTAL",
  "LEGENDARY",
  "OTHERWORLDLY",
  "UNPRECEDENTED",
  "LIMITLESS",
  "MYTHICAL",
  "INEVITABLE",
  "INFINITE",
] as const;

const ROTATION_INTERVAL = 3200;

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionOnServer() {
  return false;
}

export function RotatingHeadline() {
  const [words, setWords] = useState({ current: 0, previous: -1 });
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotion,
    getReducedMotionOnServer,
  );

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const timer = window.setInterval(() => {
      setWords(({ current }) => ({
        current: (current + 1) % ADJECTIVES.length,
        previous: current,
      }));
    }, ROTATION_INTERVAL);

    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  return (
    <p className="flex flex-col items-center font-serif text-center text-mist">
      <span className="sr-only">Something extraordinary is coming...</span>
      <span aria-hidden="true" className="flex flex-col items-center">
        <span className="text-[clamp(1.35rem,3.4vw,2.4rem)] leading-none tracking-[0.005em] text-mist">
          Something
        </span>
        <span className="rotating-word mt-2 text-[clamp(2.6rem,7.2vw,5.25rem)] leading-none tracking-[-0.02em] text-paper sm:mt-3">
          {ADJECTIVES.map((adjective, adjectiveIndex) => (
            <span
              key={adjective}
              className="rotating-word-item"
              data-state={
                adjectiveIndex === words.current
                  ? "active"
                  : adjectiveIndex === words.previous
                    ? "exit"
                    : "idle"
              }
            >
              {adjective.toLowerCase()}
            </span>
          ))}
        </span>
        <span className="mt-2 text-[clamp(1.35rem,3.4vw,2.4rem)] leading-none tracking-[0.005em] text-mist sm:mt-3">
          is coming...
        </span>
      </span>
    </p>
  );
}
