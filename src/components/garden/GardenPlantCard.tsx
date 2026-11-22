import type { GrowthStage } from "../../utils/growthStages";

type GardenPlantCardProps = {
  growth: number;
  currentStage: GrowthStage;
  canHarvest: boolean;
  onHarvest: () => void;
};

function GardenPlantCard({
  growth,
  currentStage,
  canHarvest,
  onHarvest,
}: GardenPlantCardProps) {
  return (
    <section
      className="garden-plant-card"
      aria-labelledby="garden-current-plant"
    >
      <div className="garden-plant-overview">
        <div
          className="garden-plant-visual"
          aria-label={`현재 ${currentStage.label} 단계`}
        >
          <span aria-hidden="true">{currentStage.icon}</span>
        </div>

        <div className="garden-plant-info">
          <span>현재 키우는 식물</span>
          <h2 id="garden-current-plant">토마토</h2>
          <p>
            현재 단계: <strong>{currentStage.description}</strong>
          </p>
        </div>
      </div>

      <div className="garden-progress-heading">
        <span>성장 진행률</span>
        <strong>{growth}%</strong>
      </div>

      <div
        className="garden-progress"
        role="progressbar"
        aria-label="토마토 성장률"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={growth}
      >
        <div
          className="garden-progress-fill"
          style={{ width: `${growth}%` }}
        />
      </div>

      {canHarvest ? (
        <div className="garden-harvest-ready">
          <p>수확할 준비가 되었어요!</p>
          <button type="button" onClick={onHarvest}>
            토마토 수확하기 🍅
          </button>
        </div>
      ) : (
        <p className="garden-growth-remaining">
          수확까지 <strong>{100 - growth}%</strong> 남았어요
        </p>
      )}
    </section>
  );
}

export default GardenPlantCard;
