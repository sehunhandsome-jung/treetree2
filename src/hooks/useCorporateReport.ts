import { useCallback, useState } from "react";

/*
  서버의 server/esgReport.ts 타입과 짝을 이룬다.
  숫자는 전부 서버가 인증 기록에서 계산한 값이고,
  narrative만 AI가 쓴 해설이다.
*/
export type ActivityBreakdown = {
  activity: string;
  count: number;
  participants: number;
  co2eKg: number;
  disposableItems: number;
  factorSource: string | null;
  basis: string;
};

export type EsgMetrics = {
  period: { from: string; to: string };
  generatedAt: string;
  totalParticipants: number;
  totalVerifications: number;
  activityVerifications: number;
  challengeCompletions: number;
  avgVerificationsPerParticipant: number;
  totalCo2eKg: number;
  totalDisposableItems: number;
  breakdown: ActivityBreakdown[];
  weeklyTrend: { week: string; count: number }[];
  unverifiedFactors: string[];
};

export type ReportNarrative = {
  summary: string;
  insight: string;
  recommendation: string;
};

export type GriMappingEntry = {
  metric: string;
  code: string;
  note: string;
};

export type CorporateReport = {
  metrics: EsgMetrics;
  narrative: ReportNarrative;
  griMapping: GriMappingEntry[];
};

type ReportResponse = {
  ok: boolean;
  metrics?: EsgMetrics;
  narrative?: ReportNarrative;
  griMapping?: GriMappingEntry[];
  message?: string;
};

export function useCorporateReport() {
  const [report, setReport] =
    useState<CorporateReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);

  const generate = useCallback(
    async (code: string) => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetch(
          "/api/corporate/report",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ code }),
          }
        );

        /*
          서버가 꺼져 있으면 JSON이 아닌 응답이 오므로
          파싱 실패를 정상적인 실패로 다룬다.
        */
        let data: ReportResponse | null = null;

        try {
          data = (await response.json()) as ReportResponse;
        } catch {
          data = null;
        }

        if (
          !response.ok ||
          !data?.ok ||
          !data.metrics ||
          !data.narrative ||
          !Array.isArray(data.griMapping)
        ) {
          /*
            404는 거의 항상 "서버가 옛 코드로 떠 있다"는 뜻이다.
            이 경우 응답이 JSON이 아니라 일반 실패 문구가 떠서
            원인을 찾기 어려웠기에 따로 안내한다.
          */
          setErrorMessage(
            data?.message ??
              (response.status === 404
                ? "서버에 리포트 기능이 없어요. 백엔드를 재시작한 뒤 다시 시도해주세요."
                : "리포트를 만들지 못했어요. 잠시 후 다시 시도해주세요.")
          );

          return false;
        }

        setReport({
          metrics: data.metrics,
          narrative: data.narrative,
          griMapping: data.griMapping,
        });

        return true;
      } catch {
        /* 예외 원문은 사용자에게 의미가 없으므로 노출하지 않는다. */
        setErrorMessage(
          "서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요."
        );

        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setReport(null);
    setErrorMessage(null);
  }, []);

  return {
    report,
    isLoading,
    errorMessage,
    generate,
    reset,
  };
}
