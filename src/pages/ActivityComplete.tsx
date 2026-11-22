import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

import MobileLayout from "../components/MobileLayout";
import BottomNav from "../components/BottomNav";
import { useGarden } from "../context/GardenContext";
import {
  getCurrentStageIndex,
  growthStages,
} from "../utils/growthStages";

function ActivityComplete() {
  const navigate = useNavigate();
  const location = useLocation();

  const { points, growth } = useGarden();
  const currentStage =
    growthStages[getCurrentStageIndex(growth)];

  const activityType =
    location.state?.activityType ?? "친환경";

  const growthReward =
    location.state?.growthReward ?? 0;

  const pointReward =
    location.state?.pointReward ?? 0;

  const reason: string =
    location.state?.reason ?? "";

  return (
    <MobileLayout>
      <div className="complete-page">
        <CheckCircle
          size={54}
          strokeWidth={1.6}
          className="complete-icon"
        />

        <h1>인증 완료!</h1>

        <p>
          {activityType} 활동이 인증되었습니다.
        </p>

        <div
          className="complete-plant"
          aria-label={currentStage.description}
        >
          {currentStage.icon}
        </div>

        <div className="complete-growth">
          <span>현재 성장률</span>
          <strong>
            {growth}% · {currentStage.label}
          </strong>
        </div>

        <div className="complete-rewards">
          <div>
            <span>성장률</span>
            <strong>
              +{growthReward}%
            </strong>
          </div>

          <div>
            <span>포인트</span>
            <strong>
              +{pointReward} P
            </strong>
          </div>
        </div>

        {reason && (
          <div className="complete-ai-reason">
            <span>AI 판정 이유</span>
            <p>{reason}</p>
          </div>
        )}

        <p className="current-point">
          현재 보유 포인트{" "}
          {points.toLocaleString()} P
        </p>

        <button
          className="complete-button"
          onClick={() => navigate("/home")}
        >
          내 토마토 확인하기
        </button>
      </div>

      <BottomNav />
    </MobileLayout>
  );
}

export default ActivityComplete;  