"use client";

import Image from "next/image";
import { useRef } from "react";
import { VIGNETTE_RADIUS_VMIN } from "@/lib/layout";

const VIGNETTE_MASK = `radial-gradient(circle ${VIGNETTE_RADIUS_VMIN}vmin at center, black 0%, black 30%, transparent 100%)`;
const FLASHLIGHT_CURSOR = 'url("/cursor-flashlight.svg") 7 7, auto';

// Warmth is a clamped (never wraps) -1..1 dial: -1 is the coolest the
// light can go, 1 the warmest, 0 is the original neutral white it starts
// at. Rather than compositing a colored layer over the flashlight (which
// blends against whatever's behind it and washes the dots into a solid
// disc), warmth is applied as a per-channel color bias directly on the
// dots' own pixels via feColorMatrix. Transparent gaps have alpha 0, so a
// channel bias can't paint over them — only pixels that already have a lit
// dot shift color, keeping the dotted texture intact.
const WARMTH_MIN = -1;
const WARMTH_MAX = 1;
const WARMTH_SCROLL_SENSITIVITY = 0.0018;
const MAX_RED_BIAS = 0.16;
const MAX_GREEN_BIAS = 0.03;
const MAX_BLUE_BIAS = 0.2;

function colorMatrixForWarmth(warmth: number): string {
  const r = warmth * MAX_RED_BIAS;
  const g = warmth * MAX_GREEN_BIAS;
  const b = -warmth * MAX_BLUE_BIAS;
  return `1 0 0 0 ${r}  0 1 0 0 ${g}  0 0 1 0 ${b}  0 0 0 1 0`;
}

export function BackgroundGlow() {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const colorMatrixRef = useRef<SVGFEColorMatrixElement>(null);
  const warmthRef = useRef(0);

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    warmthRef.current = Math.min(
      WARMTH_MAX,
      Math.max(WARMTH_MIN, warmthRef.current - e.deltaY * WARMTH_SCROLL_SENSITIVITY),
    );
    colorMatrixRef.current?.setAttribute("values", colorMatrixForWarmth(warmthRef.current));
  }

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
      onWheel={handleWheel}
      className="absolute inset-0 select-none"
      style={{
        maskImage: VIGNETTE_MASK,
        WebkitMaskImage: VIGNETTE_MASK,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        WebkitTapHighlightColor: "transparent",
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
          {/* Shifts each dot's own RGB by a warmth-driven bias. Alpha is
              untouched, so gaps (alpha 0) can't be tinted into a solid fill. */}
          <filter id="warmth-tint" colorInterpolationFilters="sRGB">
            <feColorMatrix ref={colorMatrixRef} type="matrix" values={colorMatrixForWarmth(0)} />
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
          style={{ filter: "url(#dot-alpha-boost) brightness(1.3) url(#warmth-tint)" }}
        />
      </div>
    </div>
  );
}
