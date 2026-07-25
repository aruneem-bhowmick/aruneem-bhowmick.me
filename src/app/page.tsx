import { BackgroundGlow } from "@/components/background-glow";
import { RadialDock } from "@/components/radial-dock";
import { WarmthProvider } from "@/components/warmth-provider";

export default function Home() {
  return (
    <WarmthProvider>
      <main className="relative min-h-svh overflow-hidden bg-background">
        <BackgroundGlow />
        <RadialDock />
      </main>
    </WarmthProvider>
  );
}
