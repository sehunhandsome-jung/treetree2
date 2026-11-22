import MobileLayout from "../components/MobileLayout";
import BottomNav from "../components/BottomNav";
import RecentGrowthActivities from "../components/garden/RecentGrowthActivities";
import TodayChallengeCard from "../components/challenges/TodayChallengeCard";
import { useGarden } from "../context/GardenContext";
import { useHarvest } from "../hooks/useHarvest";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const { growth, points } = useGarden();
  const { canHarvest, harvest } = useHarvest();

  return (
    <MobileLayout>
      <div className="home-page">

        <header className="home-header">
          <p className="home-welcome">안녕하세요 👋</p>
          <h1>오늘도 나무나무와 함께해요</h1>
        </header>

        <section className="plant-card">
          <div className="plant-card-top">
            <div>
              <span className="plant-label">현재 키우는 식물</span>
              <h2>토마토 🍅</h2>
            </div>

            <strong>{growth}%</strong>
          </div>

          <div className="growth-bar">
            <div
              className="growth-bar-fill"
              style={{ width: `${growth}%` }}
            />
          </div>

          {!canHarvest ? (
          <p className="growth-text">
            수확까지 {100 - growth}% 남았어요
          </p>
        ) : (
          <p className="harvest-ready">
            🎉 토마토를 수확할 수 있어요!
          </p>
        )}

        {canHarvest && (
          <button
            className="harvest-button"
            onClick={harvest}
          >
            토마토 수확하기 🍅
          </button>
        )}
        </section>

        <section className="point-card">
          <div>
            <span>보유 포인트</span>
            <strong>{points.toLocaleString()} P</strong>
          </div>

          <div className="point-icon">
            🌱
          </div>
        </section>

        <section className="mission-card">
          <div>
            <span className="mission-label">오늘의 활동</span>
            <h3>친환경 활동을 인증해보세요</h3>
            <p>활동에 따라 성장률과 포인트를 받을 수 있어요.</p>
          </div>

          <button
            onClick={() => navigate("/activity")}
          >
            활동 인증하기
          </button>
        </section>

        <TodayChallengeCard />

        <RecentGrowthActivities />

      </div>

      <BottomNav />
    </MobileLayout>
  );
}

export default Home;
