"use client";

import { useMotionValueEvent } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
import { useWarmth } from "@/components/warmth-provider";
import { VIGNETTE_RADIUS_VMIN } from "@/lib/layout";

const VIGNETTE_MASK = `radial-gradient(circle ${VIGNETTE_RADIUS_VMIN}vmin at center, black 0%, black 30%, transparent 100%)`;

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

// The cursor is Noto Emoji's flashlight glyph (github.com/googlefonts/noto-emoji,
// Apache-2.0) — at warmth 0 every beam path renders at its exact original hex
// value. Only the beam-cone paths (GLOW_PATH_FILLS) and the added rays get
// biased, using the identical per-channel offset math as colorMatrixForWarmth
// above, just applied to hex strings instead of through a live filter, since
// a cursor is a disposable image, not a DOM node we can keep mutating. The
// housing is a deliberate departure from Noto's original art: its teal
// (#2F7889 / #49A4BA) reads as a "cool" state next to a beam that actually
// goes cool, and clashes with the site's otherwise strictly hue-neutral grey
// scale (see --border/--muted-foreground in globals.css). That also applies
// to the thin ring path Noto drew in #80DEEA right at the lens boundary —
// it's a chrome/glass rim highlight, not light, so it moved out of
// GLOW_PATH_FILLS into the housing group as HOUSING_RIM. All three HOUSING_*
// constants are true neutral (R=G=B) greys picked to match Noto's original
// per-channel luminance, so the shading contrast is unchanged, just without
// a hue. The near-black switch/shadow detail (#212121) was already neutral
// and needed no change. Noto's glyph natively points down-left; flipping the
// whole group vertically (translate+scale) turns that into up-left without
// touching any path data. Ray marks (absent from Noto's glyph) are added
// separately, styled after the Windows emoji's comic-style beam lines.
const CURSOR_HOTSPOT = "7 8";
const HOUSING_BASE = "#6A6A6A";
const HOUSING_HIGHLIGHT = "#929292";
const HOUSING_RIM = "#CBCBCB";
const GLOW_PATH_FILLS = ["#9E740B", "#FFEE58", "#FFFFFF", "#FFFF8D", "#E2A610"];
const RAY_FILL = "#FFB300";
// Regenerating + re-encoding the cursor SVG on every warmth tick (which
// fires continuously while scrolling) would mean the browser re-decodes an
// OS cursor image dozens of times a second. Snapping warmth to steps before
// building the cursor, and caching the last built value, keeps that to a
// handful of swaps across the full -1..1 range instead.
const CURSOR_WARMTH_STEP = 0.1;

function applyWarmthBias(hex: string, warmth: number): string {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((n >> 16) & 255) + warmth * MAX_RED_BIAS * 255);
  const g = clamp(((n >> 8) & 255) + warmth * MAX_GREEN_BIAS * 255);
  const b = clamp((n & 255) - warmth * MAX_BLUE_BIAS * 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function cursorSvgForWarmth(warmth: number): string {
  const [g0, g1, g2, g4, g5] = GLOW_PATH_FILLS.map((hex) => applyWarmthBias(hex, warmth));
  const ray = applyWarmthBias(RAY_FILL, warmth);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 128 128">
<g transform="translate(0,128) scale(1,-1)">
<line x1="27" y1="106" x2="25" y2="122" stroke="${ray}" stroke-width="4" stroke-linecap="round"/>
<line x1="24" y1="104" x2="14" y2="117" stroke="${ray}" stroke-width="4" stroke-linecap="round"/>
<line x1="22" y1="101" x2="6" y2="108" stroke="${ray}" stroke-width="4" stroke-linecap="round"/>
<path fill="${HOUSING_BASE}" d="M95.2,6.3l-54.9,52C19.5,62.6,7.1,75.8,7.1,75.8L52,120.7c0,0,14.3-10.7,17.5-33.1l51.9-55.2c4.6-5.4,2.7-15-4.5-21.8c-6.9-6.5-16.5-8.5-21.8-4.2L95.2,6.3z"/>
<path fill="${g0}" d="M10,78.4c5.7-5.7,19.2-1.5,30.1,9.4s15.1,24.4,9.4,30.1s-19.2,1.5-30.1-9.4S4.3,84.1,10,78.4"/>
<path fill="${g1}" d="M14.3,77.1c4.6-4.6,15.8,0.6,25.9,10.7s15.3,21.3,10.7,25.9c-4.6,4.6-16.5,0.2-26.6-9.9s-14.5-22-9.9-26.6"/>
<path fill="${g2}" d="M22.8,74.5c0,0,10.1,3.6,18.5,12s12,18.5,12,18.5c-4.9,4.9-15.8,2.1-24.2-6.3S17.8,79.4,22.8,74.5"/>
<path fill="${HOUSING_RIM}" d="M9.7,80.3c5-5,17.5-0.5,28,9.9s14.9,23,9.9,28s-17.5,0.5-28-9.9C9.1,97.8,4.7,85.3,9.7,80.3 M7.1,75.9c-3.4,3.4-4,9.1-1.6,16c2.2,6.1,6.5,12.6,12.2,18.3s12.2,10.1,18.3,12.2c6.9,2.4,12.5,1.9,16-1.6c3.4-3.4,4-9.1,1.6-16c-2.2-6.1-6.5-12.6-12.2-18.3S29.2,76.4,23.1,74.3C16.2,71.9,10.6,72.4,7.1,75.9C7.1,75.9,7.1,75.9,7.1,75.9z"/>
<path fill="${g4}" d="M40.7,109.7c0.2,1.6,0.3,3-1,2.6C29.2,109.3,20,99,16.9,91.6c-0.7-1.7,1.7-1,3.1-0.8s2.2,0.6,2.6,1.4c2.2,4.1,8.3,12,16.4,14.8s1.4,1.1,1.6,2.7L40.7,109.7z"/>
<path fill="${g5}" d="M41,116.7L41,116.7c0.4,1.3,1.3,2.7,0,2.4c-14.8-2.8-27.3-15.5-31.4-27.9s0.4-0.7,2.4-0.4c1.9,0.3,2.1,0.7,2.4,1.2c3.9,7.5,11.6,18,24.5,22.9s1.6,0.5,2.1,1.9V116.7z"/>
<path fill="#212121" d="M72.1,47l-9.4,10.4c-1.5,1.5-3.9,1.5-5.3,0L55.8,56c-1.5-1.5-1.5-3.9,0-5.3l10-10c1.5-1.5,3.9-1.5,5.3,0l1,1C73.6,43.2,73.6,45.6,72.1,47z"/>
<circle fill="${HOUSING_HIGHLIGHT}" cx="60.2" cy="52.9" r="3.3"/>
<path fill="${HOUSING_HIGHLIGHT}" d="M34.5,74c3.8,0,2.8-3.2,9.5-6.2c2.5-1.1,1.8-2.5,0.8-3.2c-4.5-3.2-5.5-2.6-9.8-1.5S23.3,67.4,23.1,69s1.6,1.6,3.2,2.1c4.5,1.2,6.2,3,8.2,3V74z"/>
<path fill="#212121" d="M68.8,91.5c0,0-1.8-10.5-12.7-21.5C45.2,59.1,36.8,59.2,36.5,59.2l3.7-0.8c0,0,8.6-1.5,18.9,8.8s10.4,20.6,10.4,20.6L68.8,91.5z"/>
</g>
</svg>`;
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}") ${CURSOR_HOTSPOT}, auto`;
}

export function BackgroundGlow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const colorMatrixRef = useRef<SVGFEColorMatrixElement>(null);
  const insideVignetteRef = useRef(false);
  const cursorCacheRef = useRef<{ bucket: number; value: string } | null>(null);
  const warmth = useWarmth();

  function cursorForWarmth(latest: number): string {
    const bucket = Math.round(latest / CURSOR_WARMTH_STEP) * CURSOR_WARMTH_STEP;
    if (cursorCacheRef.current?.bucket !== bucket) {
      cursorCacheRef.current = { bucket, value: cursorSvgForWarmth(bucket) };
    }
    return cursorCacheRef.current.value;
  }

  function applyCursor() {
    if (containerRef.current) {
      containerRef.current.style.cursor = insideVignetteRef.current
        ? cursorForWarmth(warmth.get())
        : "auto";
    }
  }

  useMotionValueEvent(warmth, "change", (latest) => {
    colorMatrixRef.current?.setAttribute("values", colorMatrixForWarmth(latest));
    applyCursor();
  });

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    const next = Math.min(
      WARMTH_MAX,
      Math.max(WARMTH_MIN, warmth.get() - e.deltaY * WARMTH_SCROLL_SENSITIVITY),
    );
    warmth.set(next);
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
    insideVignetteRef.current = distFromCenter <= radiusPx;
    applyCursor();
  }

  function handlePointerLeave() {
    spotlightRef.current?.style.setProperty("--spot-x", "-100%");
    spotlightRef.current?.style.setProperty("--spot-y", "-100%");
    insideVignetteRef.current = false;
    applyCursor();
  }

  return (
    <div
      ref={containerRef}
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
