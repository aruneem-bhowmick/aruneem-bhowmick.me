import Image from "next/image";
import { VIGNETTE_RADIUS_VMIN } from "@/lib/layout";

const VIGNETTE_MASK = `radial-gradient(circle ${VIGNETTE_RADIUS_VMIN}vmin at center, black 0%, black 30%, transparent 100%)`;

// The not-found page's flashlight is out — no pointer tracking, no spotlight,
// just the ambient glow left to go fuzzy so nothing can be made out.
export function LostGlow() {
  return (
    <div
      className="pointer-events-none absolute inset-0 select-none"
      style={{
        maskImage: VIGNETTE_MASK,
        WebkitMaskImage: VIGNETTE_MASK,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
      }}
    >
      <Image
        src="/glow.png"
        alt=""
        fill
        priority
        className="pointer-events-none object-contain blur-lg"
      />
    </div>
  );
}
