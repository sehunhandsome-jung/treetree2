/*
  요일별 미션 설정. 실제 계정 시스템이 없으므로 clientId별로
  브라우저 localStorage에 저장한다. 값이 손상돼도 앱이 죽지 않게
  전부 방어적으로 파싱한다.
*/

import { getClientId } from "./clientId";

export const MAX_MISSION_TITLE_LENGTH = 40;
export const MAX_MISSION_DESCRIPTION_LENGTH = 100;

export type WeeklyChallenge = {
  /* 0=일 … 6=토 */
  weekday: number;
  title: string;
  description?: string;
  updatedAt: string;
};

/* weekday를 키로 쓰는 맵 */
export type WeeklyChallengeMap = Record<
  number,
  WeeklyChallenge
>;

function getStorageKey() {
  return `weeklyChallenges:${getClientId()}`;
}

function isWeeklyChallenge(
  value: unknown
): value is WeeklyChallenge {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.weekday === "number" &&
    Number.isInteger(candidate.weekday) &&
    candidate.weekday >= 0 &&
    candidate.weekday <= 6 &&
    typeof candidate.title === "string" &&
    candidate.title.trim().length > 0 &&
    (candidate.description === undefined ||
      typeof candidate.description === "string") &&
    typeof candidate.updatedAt === "string"
  );
}

export function loadWeeklyChallenges(): WeeklyChallengeMap {
  try {
    const saved = localStorage.getItem(getStorageKey());

    if (!saved) {
      return {};
    }

    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return {};
    }

    const result: WeeklyChallengeMap = {};

    parsed.filter(isWeeklyChallenge).forEach((item) => {
      /* 한 요일에는 미션 하나만 둔다. */
      result[item.weekday] = {
        weekday: item.weekday,
        title: item.title.slice(
          0,
          MAX_MISSION_TITLE_LENGTH
        ),
        description: item.description
          ? item.description.slice(
              0,
              MAX_MISSION_DESCRIPTION_LENGTH
            )
          : undefined,
        updatedAt: item.updatedAt,
      };
    });

    return result;
  } catch {
    /* 손상된 값은 버리고 빈 설정으로 복구한다. */
    return {};
  }
}

export function saveWeeklyChallenges(
  challenges: WeeklyChallengeMap
) {
  try {
    localStorage.setItem(
      getStorageKey(),
      JSON.stringify(Object.values(challenges))
    );

    return true;
  } catch {
    return false;
  }
}

export type MissionValidationResult =
  | { ok: true; title: string; description?: string }
  | { ok: false; message: string };

export function validateMission(
  rawTitle: string,
  rawDescription: string
): MissionValidationResult {
  const title = rawTitle.trim();
  const description = rawDescription.trim();

  if (title.length === 0) {
    return {
      ok: false,
      message: "미션 내용을 입력해주세요.",
    };
  }

  if (title.length > MAX_MISSION_TITLE_LENGTH) {
    return {
      ok: false,
      message: `미션은 ${MAX_MISSION_TITLE_LENGTH}자 이내로 입력해주세요.`,
    };
  }

  if (description.length > MAX_MISSION_DESCRIPTION_LENGTH) {
    return {
      ok: false,
      message: `설명은 ${MAX_MISSION_DESCRIPTION_LENGTH}자 이내로 입력해주세요.`,
    };
  }

  return {
    ok: true,
    title,
    description: description.length > 0 ? description : undefined,
  };
}
