import { Backdrop } from "@/components/landing/backdrop";
import { Footer } from "@/components/landing/footer";
import { Wordmark } from "@/components/landing/wordmark";

export default function Home() {
  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center justify-between overflow-hidden px-6 pb-6 pt-8 sm:px-10 sm:pb-8">
      <Backdrop />

      <div aria-hidden="true" className="h-2" />

      <section className="relative z-10 flex flex-1 flex-col items-center justify-center py-16 text-center">
        <p className="animate-rise text-[10px] uppercase tracking-[0.55em] text-silver sm:text-[11px]">
          Karachi · Est. 2026
        </p>

        <div className="animate-rise mt-7 sm:mt-9" style={{ animationDelay: "90ms" }}>
          <Wordmark />
        </div>

        <span
          aria-hidden="true"
          className="mt-8 h-px w-20 bg-gradient-to-r from-transparent via-slate to-transparent sm:mt-10 sm:w-28"
        />

        <p
          className="animate-rise mt-6 text-[10px] uppercase tracking-[0.38em] text-silver sm:mt-7 sm:text-xs"
          style={{ animationDelay: "180ms" }}
        >
          Apparel, in monochrome
        </p>
      </section>

      <Footer />
    </main>
  );
}
