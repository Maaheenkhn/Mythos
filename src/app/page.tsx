import { Backdrop } from "@/components/landing/backdrop";
import { CustomCursor } from "@/components/landing/custom-cursor";
import { Footer } from "@/components/landing/footer";
import { RotatingHeadline } from "@/components/landing/rotating-headline";
import { Wordmark } from "@/components/landing/wordmark";

export default function Home() {
  return (
    <>
      <main className="relative isolate flex min-h-dvh flex-col items-center justify-between overflow-hidden px-6 pb-6 pt-8 sm:px-10 sm:pb-8">
        <Backdrop />

        <div aria-hidden="true" className="h-2" />

        <section className="relative z-10 flex flex-1 flex-col items-center py-12 text-center sm:py-16">
          <p className="animate-rise text-[10px] uppercase tracking-[0.55em] text-silver sm:text-[11px]">
            Pakistan · Est. 2026
          </p>

          <div
            className="animate-rise mt-3 sm:mt-4"
            style={{ animationDelay: "90ms" }}
          >
            <Wordmark />
          </div>

          <p
            className="animate-rise mt-4 text-[10px] uppercase tracking-[0.38em] text-silver sm:mt-5 sm:text-xs"
            style={{ animationDelay: "150ms" }}
          >
            Media inspired fashion
          </p>

          <span
            aria-hidden="true"
            className="mt-5 h-px w-20 bg-gradient-to-r from-transparent via-slate to-transparent sm:mt-7 sm:w-28"
          />

          <div
            className="animate-rise flex w-full flex-1 flex-col items-center justify-center"
            style={{ animationDelay: "220ms" }}
          >
            <RotatingHeadline />
          </div>
        </section>

        <Footer />
      </main>

      <CustomCursor />
    </>
  );
}
