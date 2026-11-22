import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useGarden } from "../context/GardenContext";

export function useHarvest() {
  const navigate = useNavigate();
  const { growth, harvestPlant } = useGarden();
  const canHarvest = growth >= 100;

  const harvest = useCallback(() => {
    if (!canHarvest) {
      return;
    }

    harvestPlant();
    navigate("/harvest-complete");
  }, [canHarvest, harvestPlant, navigate]);

  return {
    canHarvest,
    harvest,
  };
}
