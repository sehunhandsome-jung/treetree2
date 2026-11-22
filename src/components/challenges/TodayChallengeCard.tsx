import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useChallengeRecords } from "../../hooks/useChallengeRecords";
import { useWeeklyChallenges } from "../../hooks/useWeeklyChallenges";
import {
  getKoreaDateString,
  getWeekdayFromDateString,
} from "../../utils/koreaDate";

const CHALLENGE_POINT_REWARD = 50;

/*
  홈에서 보여주는 오늘의 챌린지 요약.
  자세한 내용과 인증은 /challenges에서 한다.
*/
function TodayChallengeCard() {
  const navigate = useNavigate();
  const { challenges } = useWeeklyChallenges();
  const { records, isLoading } = useChallengeRecords();

  const [today, setToday] = useState(getKoreaDateString);

  /* 자정이 지나면 오늘의 미션이 바뀌어야 한다. */
  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = getKoreaDateString();

      setToday((previous) =>
        previous === current ? previous : current
      );
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  const mission =
    challenges[getWeekdayFromDateString(today)];
  const todayRecord = records.find(
    (record) => record.date === today
  );

  const goToChallenges = () => navigate("/challenges");

  return (
    <section className="home-challenge-card">
      <div className="home-challenge-top">
        <span className="home-challenge-label">
          <CalendarDays size={13} aria-hidden="true" />
          오늘의 챌린지
        </span>

        {!isLoading && todayRecord && (
          <CheckCircle2
            size={18}
            className="home-challenge-done-icon"
            aria-hidden="true"
          />
        )}
      </div>

      {todayRecord ? (
        <>
          <h3>오늘의 챌린지 완료</h3>
          <p>
            {todayRecord.missionTitle} · +
            {todayRecord.pointReward.toLocaleString()}P 획득
          </p>
          <button type="button" onClick={goToChallenges}>
            기록 보기
          </button>
        </>
      ) : mission ? (
        <>
          <h3>{mission.title}</h3>
          <p>
            완료하면 +{CHALLENGE_POINT_REWARD}P를 받을 수
            있어요.
          </p>
          <button type="button" onClick={goToChallenges}>
            인증하기
          </button>
        </>
      ) : (
        <>
          <h3>오늘의 미션을 설정해보세요</h3>
          <p>
            요일마다 나만의 친환경 미션을 정할 수 있어요.
          </p>
          <button type="button" onClick={goToChallenges}>
            미션 설정하기
          </button>
        </>
      )}
    </section>
  );
}

export default TodayChallengeCard;
