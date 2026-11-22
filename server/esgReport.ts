/*
  기업용 ESG 리포트 산정 모듈.

  설계 원칙 — 숫자는 여기(코드)에서만 만든다.
  ESG 보고서는 제3자 검증을 받는 공시 자료라, 감축량 같은 수치를
  LLM이 지어내면 허위기재로 이어질 수 있다. 그래서 모든 수치는
  실제 인증 기록으로부터 결정론적으로 계산하고, AI는 그 수치를
  설명하는 문장만 쓴다.
*/

export type ActivityRecordLike = {
  clientId: string;
  activity: string;
  date: string;
  pointReward: number;
  growthReward: number;
};

export type ChallengeRecordLike = {
  clientId: string;
  date: string;
  missionTitle: string;
  pointReward: number;
};

/*
  활동 1회당 환산 계수.

  ⚠️ 중요: value는 공개 자료로 아직 교차검증하지 못한 추정치다.
  source가 null인 항목은 리포트에 "출처 미확인"으로 표시되며,
  외부 공시에 쓰기 전에 반드시 공식 계수(환경부 온실가스 배출계수,
  탄소중립포인트 운영지침 등)로 교체해야 한다.
  교체할 때는 value와 source를 함께 채운다.
*/
export type ImpactFactor = {
  /* 1회당 온실가스 감축량 (kgCO2e) */
  co2eKg: number;
  /* 1회당 줄인 일회용품 개수 (해당 없으면 0) */
  disposableItems: number;
  /* 어떤 전제로 계산했는지 — 리포트에 그대로 싣는다 */
  basis: string;
  /* 공신력 있는 출처. null이면 미검증으로 표기된다. */
  source: string | null;
};

export const IMPACT_FACTORS: Record<string, ImpactFactor> = {
  "텀블러 사용": {
    co2eKg: 0.035,
    disposableItems: 1,
    basis: "일회용 컵 1개 생산·폐기 대체",
    source: null,
  },
  "대중교통 이용": {
    co2eKg: 1.4,
    disposableItems: 0,
    basis: "승용차 10km 통행을 대중교통으로 대체",
    source: null,
  },
  분리배출: {
    co2eKg: 0.2,
    disposableItems: 0,
    basis: "재활용 가능 자원 1회 분리 배출",
    source: null,
  },
  "장바구니 사용": {
    co2eKg: 0.035,
    disposableItems: 1,
    basis: "일회용 비닐봉투 1장 대체",
    source: null,
  },
  "자전거 이용": {
    co2eKg: 2.0,
    disposableItems: 0,
    basis: "승용차 10km 통행을 자전거로 대체",
    source: null,
  },
  "다회용 식기 사용": {
    co2eKg: 0.05,
    disposableItems: 2,
    basis: "일회용 용기·수저 1세트 대체",
    source: null,
  },
  "리필 제품 이용": {
    co2eKg: 0.12,
    disposableItems: 1,
    basis: "플라스틱 용기 1개 신규 생산 대체",
    source: null,
  },
  "플로깅 참여": {
    co2eKg: 0.3,
    disposableItems: 0,
    basis: "폐기물 수거·재활용 경로 전환",
    source: null,
  },
  "헌옷 기부": {
    co2eKg: 3.0,
    disposableItems: 0,
    basis: "의류 1벌 재사용으로 신규 생산 대체",
    source: null,
  },
  "폐가전 재활용": {
    co2eKg: 5.0,
    disposableItems: 0,
    basis: "소형 가전 1대 자원 회수",
    source: null,
  },
};

/* 요일별 챌린지는 사용자가 직접 정한 미션이라 보수적으로 잡는다. */
export const CHALLENGE_FACTOR: ImpactFactor = {
  co2eKg: 0.1,
  disposableItems: 0,
  basis: "사용자 정의 친환경 미션 1회 수행 (보수적 추정)",
  source: null,
};

/*
  국내 지속가능경영보고서가 공통으로 쓰는 공시 기준에 맞춰
  각 지표가 어느 항목에 대응하는지 표기한다.
  (GRI Standards 2021 기반, TCFD·SASB 병기가 일반적)
*/
export const GRI_MAPPING = [
  {
    metric: "온실가스 감축 기여량",
    code: "GRI 305-5",
    note: "온실가스 배출 감축. 임직원 통근 전환분은 Scope 3 Category 7(임직원 통근)과 연계 가능",
  },
  {
    metric: "일회용품 저감량",
    code: "GRI 306-2",
    note: "폐기물 발생 저감 활동",
  },
  {
    metric: "임직원 참여율·참여 건수",
    code: "GRI 413-1",
    note: "지역사회 참여 프로그램 운영 비율",
  },
] as const;

export type ReportPeriod = {
  from: string;
  to: string;
};

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
  period: ReportPeriod;
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
  /* 출처가 확인되지 않은 계수를 쓴 활동 — 리포트에 경고로 싣는다 */
  unverifiedFactors: string[];
};

function round(value: number, digits = 1) {
  const p = 10 ** digits;

  return Math.round(value * p) / p;
}

/* YYYY-MM-DD → 그 날이 속한 주의 월요일 (ISO 주 시작) */
function getWeekStart(dateString: string) {
  const [y, m, d] = dateString.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  const weekday = base.getUTCDay();
  const offset = weekday === 0 ? 6 : weekday - 1;

  base.setUTCDate(base.getUTCDate() - offset);

  return base.toISOString().slice(0, 10);
}

export function buildEsgMetrics(
  activityRecords: ActivityRecordLike[],
  challengeRecords: ChallengeRecordLike[],
  period: ReportPeriod
): EsgMetrics {
  const inPeriod = (date: string) =>
    date >= period.from && date <= period.to;

  const acts = activityRecords.filter((r) =>
    inPeriod(r.date)
  );
  const challenges = challengeRecords.filter((r) =>
    inPeriod(r.date)
  );

  const participants = new Set<string>();

  acts.forEach((r) => participants.add(r.clientId));
  challenges.forEach((r) => participants.add(r.clientId));

  /* 활동별 집계 */
  const grouped = new Map<
    string,
    { count: number; people: Set<string> }
  >();

  acts.forEach((r) => {
    const entry = grouped.get(r.activity) ?? {
      count: 0,
      people: new Set<string>(),
    };

    entry.count += 1;
    entry.people.add(r.clientId);
    grouped.set(r.activity, entry);
  });

  const breakdown: ActivityBreakdown[] = [];
  let totalCo2e = 0;
  let totalItems = 0;
  const unverified = new Set<string>();

  grouped.forEach((entry, activity) => {
    /*
      계수가 없는 활동(나중에 추가됐는데 계수를 안 넣은 경우)은
      0으로 처리하고 미검증 목록에 올린다. 임의로 추정하지 않는다.
    */
    const factor = IMPACT_FACTORS[activity];
    const co2e = factor ? factor.co2eKg * entry.count : 0;
    const items = factor
      ? factor.disposableItems * entry.count
      : 0;

    if (!factor || factor.source === null) {
      unverified.add(activity);
    }

    totalCo2e += co2e;
    totalItems += items;

    breakdown.push({
      activity,
      count: entry.count,
      participants: entry.people.size,
      co2eKg: round(co2e, 2),
      disposableItems: items,
      factorSource: factor?.source ?? null,
      basis: factor?.basis ?? "환산 계수 미정의 (0으로 처리)",
    });
  });

  if (challenges.length > 0) {
    const co2e = CHALLENGE_FACTOR.co2eKg * challenges.length;

    totalCo2e += co2e;

    if (CHALLENGE_FACTOR.source === null) {
      unverified.add("요일별 챌린지");
    }

    breakdown.push({
      activity: "요일별 챌린지",
      count: challenges.length,
      participants: new Set(
        challenges.map((r) => r.clientId)
      ).size,
      co2eKg: round(co2e, 2),
      disposableItems: 0,
      factorSource: CHALLENGE_FACTOR.source,
      basis: CHALLENGE_FACTOR.basis,
    });
  }

  breakdown.sort((a, b) => b.count - a.count);

  /* 주별 추이 */
  const weekMap = new Map<string, number>();

  [...acts, ...challenges].forEach((r) => {
    const week = getWeekStart(r.date);

    weekMap.set(week, (weekMap.get(week) ?? 0) + 1);
  });

  const weeklyTrend = [...weekMap.entries()]
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => a.week.localeCompare(b.week));

  const totalVerifications = acts.length + challenges.length;

  return {
    period,
    generatedAt: new Date().toISOString(),
    totalParticipants: participants.size,
    totalVerifications,
    activityVerifications: acts.length,
    challengeCompletions: challenges.length,
    avgVerificationsPerParticipant:
      participants.size === 0
        ? 0
        : round(totalVerifications / participants.size, 1),
    totalCo2eKg: round(totalCo2e, 2),
    totalDisposableItems: totalItems,
    breakdown,
    weeklyTrend,
    unverifiedFactors: [...unverified],
  };
}
