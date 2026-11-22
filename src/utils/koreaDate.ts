/*
  서버가 모든 날짜를 Asia/Seoul 기준으로 다루므로 클라이언트도
  같은 기준을 써야 요일·완료 여부가 어긋나지 않는다.
  (기기 시간대가 한국이 아니어도 동일하게 동작한다)
*/

export const WEEKDAY_LABELS = [
  "일",
  "월",
  "화",
  "수",
  "목",
  "금",
  "토",
] as const;

/* 달력 머리글은 목업대로 영문 약자를 쓴다. */
export const WEEKDAY_SHORT_EN = [
  "SUN",
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
] as const;

/* 설정 화면은 월요일부터 보여준다. */
export const WEEKDAY_ORDER_FROM_MONDAY = [
  1, 2, 3, 4, 5, 6, 0,
] as const;

/* YYYY-MM-DD (한국 기준) */
export function getKoreaDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/* HH:MM (한국 기준) */
export function getKoreaTimeString(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

/*
  YYYY-MM-DD 문자열의 요일(0=일 … 6=토).
  이미 한국 날짜이므로 UTC로 해석해야 기기 시간대의 영향을 받지 않는다.
*/
export function getWeekdayFromDateString(dateString: string) {
  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  if (!year || !month || !day) {
    return 0;
  }

  return new Date(
    Date.UTC(year, month - 1, day)
  ).getUTCDay();
}

export function getTodayWeekday() {
  return getWeekdayFromDateString(getKoreaDateString());
}

export function formatDateLabel(dateString: string) {
  const [, month, day] = dateString.split("-");

  return `${Number(month)}월 ${Number(day)}일`;
}

/* 해당 날짜가 속한 주(월요일 시작)의 날짜 문자열 7개 */
export function getWeekDateStrings(
  dateString = getKoreaDateString()
) {
  const [year, month, day] = dateString
    .split("-")
    .map(Number);
  const base = new Date(Date.UTC(year, month - 1, day));
  const weekday = base.getUTCDay();

  /* 일요일(0)이면 이번 주 월요일은 6일 전이다. */
  const offsetToMonday = weekday === 0 ? 6 : weekday - 1;

  return Array.from({ length: 7 }, (_, index) => {
    const target = new Date(base);

    target.setUTCDate(
      base.getUTCDate() - offsetToMonday + index
    );

    return target.toISOString().slice(0, 10);
  });
}

/* 달력 그리드용: 해당 월의 날짜 정보 */
export function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month, 0));
  const leadingBlanks = firstDay.getUTCDay();

  const days = Array.from(
    { length: lastDay.getUTCDate() },
    (_, index) => {
      const dayNumber = index + 1;

      return {
        day: dayNumber,
        dateString: `${year}-${String(month).padStart(2, "0")}-${String(
          dayNumber
        ).padStart(2, "0")}`,
        weekday: new Date(
          Date.UTC(year, month - 1, dayNumber)
        ).getUTCDay(),
      };
    }
  );

  return { leadingBlanks, days };
}

export function addMonths(
  year: number,
  month: number,
  delta: number
) {
  const total = (year * 12 + (month - 1)) + delta;

  return {
    year: Math.floor(total / 12),
    month: (total % 12) + 1,
  };
}
