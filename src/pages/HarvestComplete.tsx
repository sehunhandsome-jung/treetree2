import { useNavigate } from "react-router-dom";

import MobileLayout from "../components/MobileLayout";
import BottomNav from "../components/BottomNav";
import { useGarden } from "../context/GardenContext";

function HarvestComplete() {
  const navigate = useNavigate();

  const { harvestCount } = useGarden();

  return (
    <MobileLayout>
      <div className="harvest-complete-page">

        <div className="harvest-tomato">
          🍅
        </div>

        <h1>수확 완료!</h1>

        <p>
          정성껏 키운 토마토를 수확했어요.
        </p>

        <div className="harvest-result-card">
          <span>지금까지 수확한 식물</span>

          <strong>
            {harvestCount}개
          </strong>
        </div>

        <button
          onClick={() => navigate("/home")}
        >
          새로운 토마토 키우기
        </button>

      </div>

      <BottomNav />
    </MobileLayout>
  );
}

export default HarvestComplete;