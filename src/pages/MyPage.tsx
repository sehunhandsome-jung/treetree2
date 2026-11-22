import { useState } from "react";
import {
  Coins,
  Gift,
  History,
  Leaf,
  RefreshCw,
  Sprout,
  Trophy,
} from "lucide-react";

import BottomNav from "../components/BottomNav";
import MobileLayout from "../components/MobileLayout";
import { useGarden } from "../context/GardenContext";
import {
  formatActivityRecordDate,
  getActivityEmoji,
  useActivityRecords,
} from "../hooks/useActivityRecords";
import {
  formatRewardExchangeDate,
  loadRewardHistory,
  type RewardHistoryItem,
} from "../utils/rewardHistory";

type MyPageTab = "activities" | "harvests" | "rewards";

type ExchangedProductSummary = {
  productId: string;
  name: string;
  icon: string;
  count: number;
  totalPoints: number;
  lastExchangedAt: string;
};

function summarizeExchangedProducts(
  history: RewardHistoryItem[]
) {
  const summaries = new Map<
    string,
    ExchangedProductSummary
  >();

  history.forEach((item) => {
    const existing = summaries.get(item.productId);

    if (existing) {
      existing.count += 1;
      existing.totalPoints += item.points;
      return;
    }

    summaries.set(item.productId, {
      productId: item.productId,
      name: item.name,
      icon: item.icon,
      count: 1,
      totalPoints: item.points,
      lastExchangedAt: item.exchangedAt,
    });
  });

  return [...summaries.values()];
}

function MyPage() {
  const { harvestCount, points } = useGarden();
  const [activeTab, setActiveTab] =
    useState<MyPageTab>("activities");
  const [rewardHistory] = useState<RewardHistoryItem[]>(
    loadRewardHistory
  );
  const {
    records,
    isLoading,
    errorMessage,
    refresh,
  } = useActivityRecords();

  const totalPoints = records.reduce(
    (sum, record) => sum + record.pointReward,
    0
  );
  const totalGrowth = records.reduce(
    (sum, record) => sum + record.growthReward,
    0
  );
  const totalSpentPoints = rewardHistory.reduce(
    (sum, item) => sum + item.points,
    0
  );
  const exchangedProducts =
    summarizeExchangedProducts(rewardHistory);

  return (
    <MobileLayout>
      <main className="mypage-page">
        <header className="mypage-header">
          <span className="mypage-eyebrow">
            MY GREEN LOG
          </span>
          <h1 className="leafy-title">마이페이지</h1>
          <p>
            활동과 수확, 교환한 아이템을 모아봤어요.
          </p>
        </header>

        <section
          className="mypage-summary"
          aria-label="활동 인증 요약"
        >
          <div className="mypage-summary-card">
            <History size={18} />
            <span>총 인증</span>
            <strong>{records.length}</strong>
            <small>회</small>
          </div>

          <div className="mypage-summary-card">
            <Coins size={18} />
            <span>누적 포인트</span>
            <strong>
              {totalPoints.toLocaleString()}
            </strong>
            <small>P</small>
          </div>

          <div className="mypage-summary-card">
            <Sprout size={18} />
            <span>누적 성장</span>
            <strong>{totalGrowth}</strong>
            <small>%</small>
          </div>
        </section>

        <div
          className="mypage-tabs"
          role="tablist"
          aria-label="마이페이지 기록 종류"
        >
          <button
            type="button"
            role="tab"
            id="mypage-activities-tab"
            aria-selected={activeTab === "activities"}
            aria-controls="mypage-activities-panel"
            className={
              activeTab === "activities" ? "active" : ""
            }
            onClick={() => setActiveTab("activities")}
          >
            활동 기록
          </button>
          <button
            type="button"
            role="tab"
            id="mypage-harvests-tab"
            aria-selected={activeTab === "harvests"}
            aria-controls="mypage-harvests-panel"
            className={
              activeTab === "harvests" ? "active" : ""
            }
            onClick={() => setActiveTab("harvests")}
          >
            수확한 작물
          </button>
          <button
            type="button"
            role="tab"
            id="mypage-rewards-tab"
            aria-selected={activeTab === "rewards"}
            aria-controls="mypage-rewards-panel"
            className={
              activeTab === "rewards" ? "active" : ""
            }
            onClick={() => setActiveTab("rewards")}
          >
            교환 아이템
          </button>
        </div>

        {activeTab === "activities" && (
          <section
            className="mypage-tab-panel"
            id="mypage-activities-panel"
            role="tabpanel"
            aria-labelledby="mypage-activities-tab"
          >
            <div className="mypage-section-title">
              <div>
                <Leaf size={17} />
                <h2>최근 활동</h2>
              </div>

              {!isLoading && !errorMessage && (
                <span>{records.length}개의 기록</span>
              )}
            </div>

            {isLoading ? (
              <div
                className="mypage-state"
                aria-live="polite"
              >
                <span className="mypage-loader" />
                <p>활동 기록을 불러오고 있어요...</p>
              </div>
            ) : errorMessage ? (
              <div
                className="mypage-state mypage-error"
                role="alert"
              >
                <p>{errorMessage}</p>
                <button
                  type="button"
                  onClick={refresh}
                >
                  <RefreshCw size={14} />
                  다시 불러오기
                </button>
              </div>
            ) : records.length === 0 ? (
              <div className="mypage-state mypage-empty">
                <span aria-hidden="true">🌱</span>
                <p>아직 인증한 활동이 없어요</p>
                <small>
                  친환경 활동을 인증하면 여기에 기록돼요.
                </small>
              </div>
            ) : (
              <div className="mypage-record-list">
                {records.map((record) => (
                  <article
                    className="mypage-record-card"
                    key={record.id}
                  >
                    <div className="mypage-record-main">
                      <span
                        className="mypage-record-icon"
                        aria-hidden="true"
                      >
                        {getActivityEmoji(record.activity)}
                      </span>

                      <div className="mypage-record-info">
                        <h3>{record.activity}</h3>
                        <time dateTime={record.createdAt}>
                          {formatActivityRecordDate(record)}
                        </time>
                      </div>
                    </div>

                    <div className="mypage-record-rewards">
                      <span>
                        성장 +{record.growthReward}%
                      </span>
                      <strong>
                        +{record.pointReward.toLocaleString()} P
                      </strong>
                    </div>

                    {record.reason && (
                      <p
                        className="mypage-record-reason"
                        title={record.reason}
                      >
                        AI 확인 · {record.reason}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "harvests" && (
          <section
            className="mypage-tab-panel"
            id="mypage-harvests-panel"
            role="tabpanel"
            aria-labelledby="mypage-harvests-tab"
          >
            <div className="mypage-section-title">
              <div>
                <Trophy size={17} />
                <h2>수확한 작물</h2>
              </div>
              <span>총 {harvestCount}개</span>
            </div>

            <div className="mypage-harvest-summary">
              <span aria-hidden="true">🏆</span>
              <div>
                <small>지금까지 수확한 작물</small>
                <strong>{harvestCount}개</strong>
                <p>꾸준한 친환경 활동의 결실이에요.</p>
              </div>
            </div>

            {harvestCount === 0 ? (
              <div className="mypage-state mypage-empty">
                <span aria-hidden="true">🍅</span>
                <p>아직 수확한 작물이 없어요</p>
                <small>
                  성장률 100%를 달성하면 토마토를 수확할 수 있어요.
                </small>
              </div>
            ) : (
              <article className="mypage-collection-card">
                <span
                  className="mypage-collection-icon"
                  aria-hidden="true"
                >
                  🍅
                </span>
                <div>
                  <h3>토마토</h3>
                  <p>정성껏 키워 수확한 작물</p>
                </div>
                <strong>{harvestCount}개</strong>
              </article>
            )}
          </section>
        )}

        {activeTab === "rewards" && (
          <section
            className="mypage-tab-panel"
            id="mypage-rewards-panel"
            role="tabpanel"
            aria-labelledby="mypage-rewards-tab"
          >
            <div className="mypage-section-title">
              <div>
                <Gift size={17} />
                <h2>교환한 아이템</h2>
              </div>
              <span>{rewardHistory.length}회 교환</span>
            </div>

            <div className="mypage-exchange-summary">
              <div>
                <span>누적 획득</span>
                <strong>
                  {totalPoints.toLocaleString()} P
                </strong>
              </div>
              <div>
                <span>사용</span>
                <strong>
                  −{totalSpentPoints.toLocaleString()} P
                </strong>
              </div>
              <div>
                <span>보유</span>
                <strong>
                  {points.toLocaleString()} P
                </strong>
              </div>
            </div>

            {exchangedProducts.length === 0 ? (
              <div className="mypage-state mypage-empty">
                <span aria-hidden="true">🎁</span>
                <p>아직 교환한 아이템이 없어요</p>
                <small>
                  리워드에서 포인트로 아이템을 교환해보세요.
                </small>
              </div>
            ) : (
              <div className="mypage-collection-list">
                {exchangedProducts.map((item) => (
                  <article
                    className="mypage-collection-card"
                    key={item.productId}
                  >
                    <span
                      className="mypage-collection-icon"
                      aria-hidden="true"
                    >
                      {item.icon}
                    </span>
                    <div>
                      <h3>{item.name}</h3>
                      <p>
                        최근 교환 {formatRewardExchangeDate(
                          item.lastExchangedAt
                        )}
                      </p>
                      <small>
                        총 {item.totalPoints.toLocaleString()}P 사용
                      </small>
                    </div>
                    <strong>{item.count}개</strong>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <BottomNav />
    </MobileLayout>
  );
}

export default MyPage;
