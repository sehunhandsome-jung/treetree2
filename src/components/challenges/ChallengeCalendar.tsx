import { ChevronLeft, ChevronRight } from "lucide-react";

import CompletionStamp from "./CompletionStamp";
import {
  addMonths,
  getMonthGrid,
  WEEKDAY_SHORT_EN,
} from "../../utils/koreaDate";
import type { ChallengeRecord } from "../../hooks/useChallengeRecords";
import type { WeeklyChallengeMap } from "../../utils/weeklyChallenges";

type ChallengeCalendarProps = {
  year: number;
  month: number;
  today: string;
  selectedDate: string;
  recordsByDate: Map<string, ChallengeRecord>;
  challenges: WeeklyChallengeMap;
  onChangeMonth: (year: number, month: number) => void;
  onSelectDate: (dateString: string) => void;
};

function ChallengeCalendar({
  year,
  month,
  today,
  selectedDate,
  recordsByDate,
  challenges,
  onChangeMonth,
  onSelectDate,
}: ChallengeCalendarProps) {
  const { leadingBlanks, days } = getMonthGrid(year, month);

  const goToMonth = (delta: number) => {
    const next = addMonths(year, month, delta);

    onChangeMonth(next.year, next.month);
  };

  return (
    <section className="challenge-calendar">
      <header className="challenge-calendar-header">
        <button
          type="button"
          aria-label="이전 달 보기"
          onClick={() => goToMonth(-1)}
        >
          <ChevronLeft size={18} />
        </button>

        <strong aria-live="polite">
          {year}년 {month}월
        </strong>

        <button
          type="button"
          aria-label="다음 달 보기"
          onClick={() => goToMonth(1)}
        >
          <ChevronRight size={18} />
        </button>
      </header>

      <div
        className="challenge-calendar-weekdays"
        aria-hidden="true"
      >
        {WEEKDAY_SHORT_EN.map((label, index) => (
          <span
            key={label}
            className={
              index === 0 ? "sun" : index === 6 ? "sat" : ""
            }
          >
            {label}
          </span>
        ))}
      </div>

      <div className="challenge-calendar-grid">
        {Array.from({ length: leadingBlanks }, (_, index) => (
          <span
            key={`blank-${index}`}
            className="challenge-day-blank"
            aria-hidden="true"
          />
        ))}

        {days.map(({ day, dateString, weekday }) => {
          const record = recordsByDate.get(dateString);
          const isToday = dateString === today;
          const isFuture = dateString > today;
          const isSelected = dateString === selectedDate;
          const hasPlannedMission = Boolean(
            challenges[weekday]
          );

          const classNames = [
            "challenge-day",
            record ? "done" : "",
            isToday ? "today" : "",
            isSelected ? "selected" : "",
            isFuture ? "future" : "",
            /* 일요일은 빨강, 토요일은 파랑 (한국 달력 관례) */
            weekday === 0 ? "sun" : "",
            weekday === 6 ? "sat" : "",
          ]
            .filter(Boolean)
            .join(" ");

          /* 색만으로 구분되지 않도록 상태를 글로도 읽어준다. */
          const statusLabel = record
            ? "챌린지 완료"
            : isFuture
              ? "예정"
              : hasPlannedMission
                ? "미완료"
                : "미션 없음";

          return (
            <button
              key={dateString}
              type="button"
              className={classNames}
              aria-pressed={isSelected}
              aria-label={`${month}월 ${day}일 ${statusLabel}`}
              onClick={() => onSelectDate(dateString)}
            >
              <span className="challenge-day-number">
                {day}
              </span>

              {record ? (
                /*
                  도장은 absolute라 칸 높이에 기여하지 않는다.
                  다른 칸과 숫자 위치가 어긋나지 않게 빈 자리를 함께 둔다.
                */
                <>
                  <span
                    className="challenge-day-mark-empty"
                    aria-hidden="true"
                  />
                  <CompletionStamp />
                </>
              ) : hasPlannedMission && !isFuture ? (
                <span
                  className="challenge-day-dot"
                  aria-hidden="true"
                />
              ) : hasPlannedMission ? (
                <span
                  className="challenge-day-dot planned"
                  aria-hidden="true"
                />
              ) : (
                <span
                  className="challenge-day-mark-empty"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default ChallengeCalendar;
