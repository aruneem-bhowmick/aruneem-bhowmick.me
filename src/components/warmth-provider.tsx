"use client";

import { MotionValue, useMotionValue } from "motion/react";
import { createContext, useContext, type ReactNode } from "react";

const WarmthContext = createContext<MotionValue<number> | null>(null);

export function WarmthProvider({ children }: { children: ReactNode }) {
  const warmth = useMotionValue(0);
  return (
    <WarmthContext.Provider value={warmth}>{children}</WarmthContext.Provider>
  );
}

export function useWarmth() {
  const warmth = useContext(WarmthContext);
  if (!warmth) {
    throw new Error("useWarmth must be used within a WarmthProvider");
  }
  return warmth;
}
