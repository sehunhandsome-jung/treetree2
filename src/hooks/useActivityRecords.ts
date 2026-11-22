import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { getClientId } from "../utils/clientId";

export type ActivityRecord = {
  id: string;
  clientId: string;
  activity: string;
  date: string;
  time: string;
  growthReward: number;
  pointReward: number;
  reason: string;
  createdAt: string;
  isLegacy?: boolean;
};

type ActivityRecordsResponse = {
  ok: boolean;
  records?: ActivityRecord[];
  message?: string;
};

export function formatActivityRecordDate(
  record: ActivityRecord
) {
  const formattedDate = record.date.replaceAll("-", ".");

  return record.isLegacy
    ? `${formattedDate} 시간 미상`
    : `${formattedDate} ${record.time.slice(0, 5)}`;
}

export function getActivityEmoji(activity: string) {
  const activityEmojis: Record<string, string> = {
    "텀블러 사용": "🥤",
    "대중교통 이용": "🚌",
    분리배출: "♻️",
    "장바구니 사용": "🛍️",
    "자전거 이용": "🚲",
    "다회용 식기 사용": "🍽️",
    "리필 제품 이용": "🧴",
    "플로깅 참여": "🧹",
    "헌옷 기부": "👕",
    "폐가전 재활용": "🔌",
  };

  return activityEmojis[activity] ?? "🌱";
}

export function useActivityRecords() {
  const [records, setRecords] = useState<ActivityRecord[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadRecords = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetch(
          `/api/activity-records?clientId=${encodeURIComponent(
            getClientId()
          )}`,
          {
            signal: controller.signal,
          }
        );

        /*
          서버가 꺼져 있으면 JSON이 아닌 응답이 오므로
          파싱 실패를 정상적인 실패로 다룬다.
        */
        let data: ActivityRecordsResponse | null = null;

        try {
          data =
            (await response.json()) as ActivityRecordsResponse;
        } catch {
          data = null;
        }

        if (
          !response.ok ||
          !data?.ok ||
          !Array.isArray(data.records)
        ) {
          setErrorMessage(
            data?.message ??
              "활동 기록을 불러오지 못했어요. 잠시 후 다시 시도해주세요."
          );
          return;
        }

        setRecords(data.records);
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        /*
          예외 원문(예: "Failed to fetch")은 사용자에게
          의미가 없으므로 노출하지 않는다.
        */
        setErrorMessage(
          "서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요."
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadRecords();

    return () => {
      controller.abort();
    };
  }, [refreshKey]);

  return {
    records,
    isLoading,
    errorMessage,
    refresh,
  };
}
