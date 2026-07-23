"use client";

import Image from "next/image";
import { useRef } from "react";
import { VIGNETTE_RADIUS_VMIN } from "@/lib/layout";

const VIGNETTE_MASK = `radial-gradient(circle ${VIGNETTE_RADIUS_VMIN}vmin at center, black 0%, black 30%, transparent 100%)`;
const FLASHLIGHT_CURSOR = 'url("/cursor-flashlight.svg") 7 7, auto';

export function BackgroundGlow() {
  const spotlightRef = useRef<HTMLDivElement>(null);

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    spotlightRef.current?.style.setProperty("--spot-x", `${(x / rect.width) * 100}%`);
    spotlightRef.current?.style.setProperty("--spot-y", `${(y / rect.height) * 100}%`);

    const vmin = Math.min(rect.width, rect.height) / 100;
    const radiusPx = VIGNETTE_RADIUS_VMIN * vmin;
    const distFromCenter = Math.hypot(x - rect.width / 2, y - rect.height / 2);
    e.currentTarget.style.cursor =
      distFromCenter <= radiusPx ? FLASHLIGHT_CURSOR : "auto";
  }

  function handlePointerLeave(e: React.PointerEvent<HTMLDivElement>) {
    spotlightRef.current?.style.setProperty("--spot-x", "-100%");
    spotlightRef.current?.style.setProperty("--spot-y", "-100%");
    e.currentTarget.style.cursor = "auto";
  }

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="absolute inset-0"
      style={{
        maskImage: VIGNETTE_MASK,
        WebkitMaskImage: VIGNETTE_MASK,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
      }}
    >
      {/* The dots in glow.png are near-white already; they read as dim
          because their alpha is low, not because their RGB is dark. A
          brightness() filter can't push RGB past 255, so the spotlight
          instead boosts the alpha channel directly via this SVG filter. */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <filter id="dot-alpha-boost">
            <feComponentTransfer>
              <feFuncA type="linear" slope="9" intercept="0" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      <Image
        src="/glow.png"
        alt=""
        fill
        priority
        className="pointer-events-none object-contain"
      />
      <div
        ref={spotlightRef}
        className="pointer-events-none absolute inset-0"
        style={{
          maskImage:
            "radial-gradient(circle 140px at var(--spot-x, -100%) var(--spot-y, -100%), black 0%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(circle 140px at var(--spot-x, -100%) var(--spot-y, -100%), black 0%, transparent 100%)",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
        }}
      >
        <Image
          src="/glow.png"
          alt=""
          fill
          className="pointer-events-none object-contain"
          style={{ filter: "url(#dot-alpha-boost) brightness(1.3)" }}
        />
      </div>
    </div>
  );
}
