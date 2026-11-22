export const growthStages = [
  {
    minimumGrowth: 0,
    label: "씨앗",
    icon: "🫘",
    description: "씨앗이 잠들어 있어요",
  },
  {
    minimumGrowth: 20,
    label: "새싹",
    icon: "🌱",
    description: "새싹이 돋았어요",
  },
  {
    minimumGrowth: 40,
    label: "성장",
    icon: "🌿",
    description: "줄기와 잎이 자라고 있어요",
  },
  {
    minimumGrowth: 60,
    label: "꽃",
    icon: "🌼",
    description: "꽃이 피었어요",
  },
  {
    minimumGrowth: 80,
    label: "열매",
    icon: "🍅",
    description: "토마토 열매가 자라고 있어요",
  },
  {
    minimumGrowth: 100,
    label: "수확",
    icon: "🧺",
    description: "수확할 준비가 되었어요",
  },
] as const;

export type GrowthStage = (typeof growthStages)[number];

export function getCurrentStageIndex(growth: number) {
  if (growth >= 100) {
    return 5;
  }

  if (growth >= 80) {
    return 4;
  }

  if (growth >= 60) {
    return 3;
  }

  if (growth >= 40) {
    return 2;
  }

  return growth >= 20 ? 1 : 0;
}
