import MoltenMetal from "../landing/MoltenMetal";

export default function AppBackground() {
  return (
    <div className="app-background">
      <MoltenMetal
        color1="#5227FF"
        color2="#FF9FFC"
        color3="#FFFFFF"
        speed={0.35}
        scale={4}
        detail={3}
        glow={1.6}
        coreSize={0.1}
        swirl={1}
        fold={-0.2}
        blackPoint={0.05}
        brightness={1.3}
        colorMode="molten"
        grain
        grainIntensity={0.05}
        mouseInteraction
        mouseStrength={0.3}
        opacity={1}
      />
    </div>
  );
}
