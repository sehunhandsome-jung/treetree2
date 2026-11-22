import { Leaf, RefreshCw } from "lucide-react";

import {
  formatActivityRecordDate,
  getActivityEmoji,
  useActivityRecords,
} from "../../hooks/useActivityRecords";

function RecentGrowthActivities() {
  const {
    records,
    isLoading,
    errorMessage,
    refresh,
  } = useActivityRecords();
  const recentRecords = records.slice(0, 3);

  return (
    <section
      className="garden-recent"
      aria-labelledby="garden-recent-title"
    >
      <div className="garden-section-heading">
        <div>
          <Leaf size={17} />
          <h2 id="garden-recent-title">최근 성장 활동</h2>
        </div>
        {!isLoading && !errorMessage && records.length > 0 && (
          <span>최근 {recentRecords.length}개</span>
        )}
      </div>

      {isLoading ? (
        <div className="garden-record-state" aria-live="polite">
          <span className="mypage-loader" />
          <p>성장 기록을 불러오고 있어요...</p>
        </div>
      ) : errorMessage ? (
        <div
          className="garden-record-state garden-record-error"
          role="alert"
        >
          <p>{errorMessage}</p>
          <button type="button" onClick={refresh}>
            <RefreshCw size={14} />
            다시 불러오기
          </button>
        </div>
      ) : recentRecords.length === 0 ? (
        <div className="garden-record-state garden-record-empty">
          <span aria-hidden="true">🌱</span>
          <p>아직 성장 기록이 없어요</p>
        </div>
      ) : (
        <div className="garden-record-list">
          {recentRecords.map((record) => (
            <article
              className="garden-record-card"
              key={record.id}
            >
              <span
                className="garden-record-icon"
                aria-hidden="true"
              >
                {getActivityEmoji(record.activity)}
              </span>
              <div>
                <h3>{record.activity}</h3>
                <time dateTime={record.createdAt}>
                  {formatActivityRecordDate(record)}
                </time>
              </div>
              <strong>+{record.growthReward}%</strong>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default RecentGrowthActivities;
