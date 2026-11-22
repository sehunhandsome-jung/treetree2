import GardenView from "../components/garden/GardenView";
import { useGarden } from "../context/GardenContext";
import { useHarvest } from "../hooks/useHarvest";
import {
  getCurrentStageIndex,
  growthStages,
} from "../utils/growthStages";

function Garden() {
  const { growth, harvestCount } = useGarden();
  const { canHarvest, harvest } = useHarvest();
  const safeGrowth = Math.min(Math.max(growth, 0), 100);
  const currentStageIndex =
    getCurrentStageIndex(safeGrowth);

  return (
    <GardenView
      growth={safeGrowth}
      currentStage={growthStages[currentStageIndex]}
      currentStageIndex={currentStageIndex}
      canHarvest={canHarvest}
      harvestCount={harvestCount}
      onHarvest={harvest}
    />
  );
}

export default Garden;
