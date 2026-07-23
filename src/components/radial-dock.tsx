"use client";

import { IconDots, IconX } from "@tabler/icons-react";
import {
  AnimatePresence,
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { siteLinks } from "@/config/site";
import { VIGNETTE_RADIUS_VMIN } from "@/lib/layout";

const START_ANGLE = 60;
const END_ANGLE = 120;

// When open, the trigger nudges down below the central icon's position -
// with an odd number of icons spread symmetrically around 90 degrees, the
// middle icon's angle is exactly 90 degrees too, i.e. exactly where the
// trigger sits when closed.
const TRIGGER_OPEN_OFFSET_VMIN = 7;

function offsetFromAnchor(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const x = VIGNETTE_RADIUS_VMIN * Math.cos(rad);
  const y = VIGNETTE_RADIUS_VMIN * (Math.sin(rad) - 1);
  return { x: `${x.toFixed(3)}vmin`, y: `${y.toFixed(3)}vmin` };
}

const anchorStyle = {
  left: "50%",
  top: `calc(50% + ${VIGNETTE_RADIUS_VMIN}vmin)`,
} as const;

type SiteLink = (typeof siteLinks)[number];

export function RadialDock() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(Infinity);
  const mouseY = useMotionValue(Infinity);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const step =
    siteLinks.length > 1 ? (END_ANGLE - START_ANGLE) / (siteLinks.length - 1) : 0;

  return (
    <div
      ref={rootRef}
      onPointerMove={(e) => {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
      }}
      onPointerLeave={() => {
        mouseX.set(Infinity);
        mouseY.set(Infinity);
      }}
      className="pointer-events-none fixed inset-0 z-30"
    >
      <motion.button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close links" : "Open links"}
        aria-expanded={open}
        initial={false}
        animate={{ y: open ? `${TRIGGER_OPEN_OFFSET_VMIN}vmin` : "0vmin" }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="pointer-events-auto absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-neutral-400 transition-colors hover:text-neutral-100"
        style={anchorStyle}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ opacity: 0, rotate: -45 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 45 }}
              transition={{ duration: 0.2 }}
              className="flex"
            >
              <IconX className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span
              key="dots"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex"
            >
              <IconDots className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {siteLinks.map((item, i) => {
        const angle = END_ANGLE - step * i;
        const { x, y } = offsetFromAnchor(angle);
        return (
          <RadialIcon
            key={item.title}
            item={item}
            open={open}
            x={x}
            y={y}
            mouseX={mouseX}
            mouseY={mouseY}
            delay={open ? i * 0.03 : 0}
          />
        );
      })}
    </div>
  );
}

function RadialIcon({
  item,
  open,
  x,
  y,
  mouseX,
  mouseY,
  delay,
}: {
  item: SiteLink;
  open: boolean;
  x: string;
  y: string;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const distance = useTransform([mouseX, mouseY], (latest) => {
    const [latestX, latestY] = latest as number[];
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return Infinity;
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    return Math.hypot(latestX - cx, latestY - cy);
  });

  const scale = useSpring(useTransform(distance, [0, 100], [1.6, 1]), {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const glow = useSpring(useTransform(distance, [0, 100], [1, 0.5]), {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <motion.a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={item.title}
      initial={false}
      animate={
        open
          ? { x, y, opacity: 1, scale: 1 }
          : { x: "0vmin", y: "0vmin", opacity: 0, scale: 0.4 }
      }
      transition={{ type: "spring", stiffness: 260, damping: 22, delay }}
      style={{ ...anchorStyle, pointerEvents: open ? "auto" : "none" }}
      className="absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
    >
      <motion.div
        ref={ref}
        style={{
          scale,
          opacity: glow,
          filter: hovered
            ? "drop-shadow(0 0 10px rgba(255,255,255,0.55))"
            : "none",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative flex h-6 w-6 items-center justify-center text-neutral-300 transition-[filter] duration-200"
      >
        {item.icon}
      </motion.div>
    </motion.a>
  );
}
