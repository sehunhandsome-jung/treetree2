import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { getClientId } from "../utils/clientId";

export type ChallengeRecord = {
  id: string;
  clientId: string;
  date: string;
  /* HH:MM:SS (한국 시간) */
  time: string;
  weekday: number;
  missionTitle: string;
  missionDescription?: string;
  pointReward: number;
  reason: string;
  createdAt: string;
};

type ChallengeRecordsResponse = {
  ok: boolean;
  records?: ChallengeRecord[];
  message?: string;
};

export function useChallengeRecords() {
  const [records, setRecords] = useState<ChallengeRecord[]>(
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
          `/api/challenge-records?clientId=${encodeURIComponent(
            getClientId()
          )}`,
          { signal: controller.signal }
        );

        /*
          서버가 꺼져 있으면 JSON이 아닌 응답이 오므로
          파싱 실패를 정상적인 실패로 다룬다.
        */
        let data: ChallengeRecordsResponse | null = null;

        try {
          data =
            (await response.json()) as ChallengeRecordsResponse;
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
              "챌린지 기록을 불러오지 못했어요. 잠시 후 다시 시도해주세요."
          );
          return;
        }

        setRecords(data.records);
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        /* 예외 원문은 사용자에게 의미가 없으므로 노출하지 않는다. */
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
