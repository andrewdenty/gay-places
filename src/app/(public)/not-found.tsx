import Image from "next/image";
import Link from "next/link";
import { HeroSearch } from "@/components/home/hero-search";

export default function NotFoundPage() {
  return (
    <section className="min-h-[70vh] flex items-center justify-center py-16 sm:py-24">
      <div className="w-full max-w-[620px] mx-auto text-center">
        <div className="mb-8 sm:mb-10 flex justify-center">
          <Image
            src="/404.svg"
            alt="Gay Places logo with a missing piece, indicating this page cannot be found"
            width={200}
            height={200}
            priority
            className="w-[130px] sm:w-[155px] md:w-[190px] h-auto"
          />
        </div>

        <h1
          className="h1-editorial text-[var(--foreground)]"
          style={{ fontSize: "clamp(38px, 9vw, 52px)" }}
        >
          This page hasn&apos;t come out yet
        </h1>

        <p className="mt-4 mb-10 text-[15px] leading-[1.6] text-[var(--foreground)] max-w-[560px] mx-auto">
          We couldn&apos;t find the page you were looking for.
          <br />
          Try searching for a city or place instead.
        </p>

        <div className="flex justify-center mb-10">
          <HeroSearch className="w-full sm:w-[400px]" />
        </div>

        <Link
          href="/"
          className="inline-flex w-full sm:w-auto items-center justify-center text-[15px] text-[var(--foreground)] underline"
        >
          Back to homepage
        </Link>
      </div>
    </section>
  );
}