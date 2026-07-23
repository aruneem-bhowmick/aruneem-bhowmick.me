import { BackgroundGlow } from "@/components/background-glow";
import { RadialDock } from "@/components/radial-dock";

export default function Home() {
  return (
    <main className="relative min-h-svh overflow-hidden bg-background">
      <BackgroundGlow />
      <RadialDock />
    </main>
  );
}
