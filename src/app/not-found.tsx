import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import icon from "@/app/icon.png";
import { LostGlow } from "@/components/lost-glow";
import { LuckyDie } from "@/components/lucky-die";

export const metadata: Metadata = {
  title: "Lost in the cave",
  description: "This passage doesn't exist. Head back to Aruneem Bhowmick's site.",
};

export default function NotFound() {
  return (
    <main className="relative min-h-svh overflow-hidden bg-background">
      <LostGlow />
      <div className="pointer-events-none absolute inset-0 z-10 flex select-none flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="font-mono text-sm tracking-[0.3em] text-muted-foreground uppercase">
          404
        </p>
        <h1 className="max-w-lg text-3xl font-medium text-balance text-foreground sm:text-4xl">
          You&apos;ve wandered off route.
        </h1>
        <p className="max-w-md font-mono text-base text-muted-foreground">
          Not even the bats have mapped this far. Feel your way back to the
          surface, or let the die pick a tunnel for you.
        </p>
        <div className="pointer-events-auto flex items-center gap-4">
          <Link
            href="/"
            aria-label="Back to the surface"
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-border transition-colors hover:border-neutral-500"
          >
            <Image src={icon} alt="" className="h-8 w-8" />
          </Link>
          <LuckyDie />
        </div>
      </div>
    </main>
  );
}
