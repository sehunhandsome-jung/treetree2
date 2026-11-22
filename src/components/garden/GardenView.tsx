import BottomNav from "../BottomNav";
import MobileLayout from "../MobileLayout";
import type { GrowthStage } from "../../utils/growthStages";
import GardenPlantCard from "./GardenPlantCard";
import GrowthJourney from "./GrowthJourney";
import RecentGrowthActivities from "./RecentGrowthActivities";

type GardenViewProps = {
  growth: number;
  currentStage: GrowthStage;
  currentStageIndex: number;
  canHarvest: boolean;
  harvestCount: number;
  onHarvest: () => void;
};

function GardenView({
  growth,
  currentStage,
  currentStageIndex,
  canHarvest,
  harvestCount,
  onHarvest,
}: GardenViewProps) {
  return (
    <MobileLayout>
      <main className="garden-page">
        <header className="garden-header">
          <span className="garden-eyebrow">MY GARDEN</span>
          <h1 className="leafy-title">내 정원</h1>
          <p>친환경 활동으로 식물을 키워보세요 🌱</p>
        </header>

        <GardenPlantCard
          growth={growth}
          currentStage={currentStage}
          canHarvest={canHarvest}
          onHarvest={onHarvest}
        />

        <GrowthJourney currentStageIndex={currentStageIndex} />

        <section className="garden-harvest-card">
          <div
            className="garden-harvest-icon"
            aria-hidden="true"
          >
            🏆
          </div>
          <div>
            <span>지금까지 수확한 식물</span>
            <p>꾸준한 친환경 활동의 결실이에요.</p>
          </div>
          <strong>{harvestCount}개</strong>
        </section>

        <RecentGrowthActivities />
      </main>

      <BottomNav />
    </MobileLayout>
  );
}

export default GardenView;
