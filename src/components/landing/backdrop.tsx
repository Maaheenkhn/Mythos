import MoltenMetal from "@/components/landing/MoltenMetal";
// import { DotMatrix } from "@/components/landing/dot-matrix";

export function Backdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_38%,#1c1c1c_0%,#121212_45%,#050505_100%)]" />
      <div className="absolute left-1/2 top-[34%] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-white/[0.025] blur-3xl" />

      <div className="absolute inset-0">
        <MoltenMetal
          colors={["#94a3b8", "#ffffff"]}
          coreColor="#FFFFFF"
          speed={0.35}
          scale={4}
          detail={3}
          glow={1.6}
          thickness={1}
          haze={0.75}
          mouseInteraction
          flareOnClick
        />
      </div>

      {/* Dot grid is disabled while the molten metal background is active.
      <DotMatrix />
      */}

      <div className="grain absolute inset-0 opacity-[0.05] mix-blend-overlay" />

      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
    </div>
  );
}
