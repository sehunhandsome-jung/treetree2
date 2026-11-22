export type RewardHistoryItem = {
  id: string;
  productId: string;
  name: string;
  icon: string;
  points: number;
  exchangedAt: string;
};

const REWARD_HISTORY_KEY = "rewardHistory";
const MAX_REWARD_HISTORY = 50;

function isRewardHistoryItem(
  value: unknown
): value is RewardHistoryItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return (
    "id" in value &&
    typeof value.id === "string" &&
    "productId" in value &&
    typeof value.productId === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "icon" in value &&
    typeof value.icon === "string" &&
    "points" in value &&
    typeof value.points === "number" &&
    Number.isFinite(value.points) &&
    value.points > 0 &&
    "exchangedAt" in value &&
    typeof value.exchangedAt === "string"
  );
}

export function loadRewardHistory(): RewardHistoryItem[] {
  try {
    const saved = localStorage.getItem(REWARD_HISTORY_KEY);

    if (!saved) {
      return [];
    }

    const parsed: unknown = JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed.filter(isRewardHistoryItem)
      : [];
  } catch {
    return [];
  }
}

export function saveRewardHistory(
  history: RewardHistoryItem[]
) {
  const safeHistory = history
    .filter(isRewardHistoryItem)
    .slice(0, MAX_REWARD_HISTORY);

  localStorage.setItem(
    REWARD_HISTORY_KEY,
    JSON.stringify(safeHistory)
  );

  return safeHistory;
}

export function clearRewardHistory() {
  localStorage.removeItem(REWARD_HISTORY_KEY);
}

export function formatRewardExchangeDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "날짜 정보 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
