import type { CSSProperties } from "react";

const contourPaths = Array.from({ length: 10 }, (_, index) => {
  const y = 110 + index * 58;
  return `M -80 ${y} C 110 ${y - 48}, 236 ${y + 44}, 404 ${y + 4} S 660 ${y - 42}, 880 ${y + 20}`;
});

const archPaths = Array.from({ length: 4 }, (_, index) => {
  const inset = index * 24;
  const x = 40 + inset;
  const top = 190 + inset;
  const radius = 150 - inset * 0.6;
  const legBottom = 430;
  return `M ${x} ${legBottom} L ${x} ${top + radius} A ${radius} ${radius} 0 0 1 ${
    x + radius * 2
  } ${top + radius} L ${x + radius * 2} ${legBottom}`;
});

const stars: ReadonlyArray<readonly [number, number]> = [
  [70, 110],
  [148, 58],
  [232, 126],
  [318, 66],
  [404, 140],
  [492, 78],
  [566, 156],
  [118, 200],
  [292, 210],
  [444, 226],
];

const links: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [2, 8],
  [8, 9],
  [9, 4],
  [0, 7],
  [7, 1],
  [7, 8],
];

const contourMask: CSSProperties = {
  maskImage: "radial-gradient(ellipse at 32% 64%, black 8%, transparent 68%)",
  WebkitMaskImage: "radial-gradient(ellipse at 32% 64%, black 8%, transparent 68%)",
};

const archMask: CSSProperties = {
  maskImage: "radial-gradient(ellipse at 72% 34%, black 0%, transparent 65%)",
  WebkitMaskImage: "radial-gradient(ellipse at 72% 34%, black 0%, transparent 65%)",
};

const constellationMask: CSSProperties = {
  maskImage: "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
  WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
};

export function Backdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_38%,#1c1c1c_0%,#121212_45%,#050505_100%)]" />
      <div className="absolute left-1/2 top-[34%] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-white/[0.025] blur-3xl" />

      <svg
        className="animate-drift absolute -bottom-[30%] -left-[24%] h-[95vmax] w-[95vmax]"
        viewBox="0 0 800 800"
        fill="none"
        style={contourMask}
      >
        <g stroke="white" strokeOpacity="0.08" strokeWidth="1">
          {contourPaths.map((path, index) => (
            <path key={index} d={path} />
          ))}
        </g>
      </svg>

      <svg
        className="animate-drift-slow absolute -right-[18%] top-[4%] h-[70vmax] w-[70vmax]"
        viewBox="0 0 600 600"
        fill="none"
        style={archMask}
      >
        <g stroke="white" strokeOpacity="0.07" strokeWidth="1">
          {archPaths.map((path, index) => (
            <path key={index} d={path} />
          ))}
        </g>
      </svg>

      <svg
        className="absolute left-1/2 top-[5%] h-[26vh] w-[92vw] max-w-4xl -translate-x-1/2"
        viewBox="0 0 640 280"
        fill="none"
        style={constellationMask}
      >
        <g stroke="white" strokeOpacity="0.14" strokeWidth="0.75">
          {links.map(([from, to], index) => {
            const [x1, y1] = stars[from] ?? [0, 0];
            const [x2, y2] = stars[to] ?? [0, 0];
            return <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
        </g>
        <g fill="white" fillOpacity="0.3">
          {stars.map(([cx, cy], index) => (
            <circle key={index} cx={cx} cy={cy} r={index % 3 === 0 ? 1.4 : 1} />
          ))}
        </g>
      </svg>

      <div className="grain absolute inset-0 opacity-[0.05] mix-blend-overlay" />

      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
    </div>
  );
}
