import LineSidebar from "./LineSidebar";

const FEATURES = [
  "Profile",
  "Clean",
  "Analyze",
  "Visualize",
  "Insights",
  "Report",
];

export default function FeatureSidebar({
  activeIndex = 0,
  onFeatureChange,
}) {
  return (
    <LineSidebar
      items={FEATURES}
      accentColor="#FF9FFC"
      textColor="#77717F"
      markerColor="#39343F"
      showIndex
      showMarker
      proximityRadius={120}
      maxShift={24}
      falloff="smooth"
      markerLength={48}
      markerGap={12}
      tickScale={0.35}
      scaleTick
      itemGap={30}
      fontSize={1}
      smoothing={90}

      onItemClick={onFeatureChange}
    />
  );
}

export { FEATURES };    