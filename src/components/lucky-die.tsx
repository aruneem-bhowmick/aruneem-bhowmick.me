"use client";

import {
  IconDice1,
  IconDice2,
  IconDice3,
  IconDice4,
  IconDice5,
  IconDice6,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { siteLinks } from "@/config/site";

const FACES = [IconDice1, IconDice2, IconDice3, IconDice4, IconDice5, IconDice6];
const ROLL_STEPS = 9;
const ROLL_INTERVAL_MS = 90;
const ROLL_DURATION_S = (ROLL_STEPS * ROLL_INTERVAL_MS) / 1000;

export function LuckyDie() {
  const [face, setFace] = useState(0);
  const [spins, setSpins] = useState(0);
  const [rolling, setRolling] = useState(false);
  const stepsLeft = useRef(0);

  function roll() {
    if (rolling) return;
    setRolling(true);
    setSpins((s) => s + 360);
    stepsLeft.current = ROLL_STEPS;

    const tick = () => {
      setFace(Math.floor(Math.random() * FACES.length));
      stepsLeft.current -= 1;
      if (stepsLeft.current > 0) {
        setTimeout(tick, ROLL_INTERVAL_MS);
        return;
      }
      setRolling(false);
      const link = siteLinks[Math.floor(Math.random() * siteLinks.length)];
      window.open(link.href, "_blank", "noopener,noreferrer");
    };
    tick();
  }

  const Face = FACES[face];

  return (
    <motion.button
      type="button"
      onClick={roll}
      disabled={rolling}
      aria-label="Roll the die for a random link"
      animate={{ rotate: spins }}
      transition={{ duration: ROLL_DURATION_S, ease: "easeOut" }}
      className="flex h-12 w-12 items-center justify-center rounded-xl border border-border text-neutral-300 transition-colors hover:border-neutral-500 hover:text-neutral-100 disabled:cursor-wait disabled:opacity-70"
    >
      <Face className="h-7 w-7" />
    </motion.button>
  );
}
