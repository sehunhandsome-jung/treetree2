import { useRef, useState } from "react";
import { Coins, Gift, History } from "lucide-react";

import MobileLayout from "../components/MobileLayout";
import BottomNav from "../components/BottomNav";
import ConfirmDialog from "../components/ConfirmDialog";
import { useGarden } from "../context/GardenContext";
import {
  formatRewardExchangeDate,
  loadRewardHistory,
  saveRewardHistory,
  type RewardHistoryItem,
} from "../utils/rewardHistory";

type RewardProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
};

type RewardMessage = {
  type: "success" | "error";
  text: string;
};

const rewardProducts: RewardProduct[] = [
  {
    id: "sprout-seed",
    name: "새싹 씨앗",
    description: "새로운 식물을 시작할 수 있는 기본 씨앗",
    price: 500,
    icon: "🌱",
  },
  {
    id: "special-pot",
    name: "특별 화분",
    description: "내 정원을 더 특별하게 꾸며주는 화분",
    price: 800,
    icon: "🪴",
  },
  {
    id: "tomato-seed-pack",
    name: "토마토 씨앗 팩",
    description: "싱그러운 토마토를 키울 수 있는 씨앗 팩",
    price: 1000,
    icon: "🍅",
  },
  {
    id: "rare-plant-seed",
    name: "희귀 식물 씨앗",
    description: "특별한 식물을 만날 수 있는 희귀 씨앗",
    price: 1500,
    icon: "🌿",
  },
];

function Rewards() {
  const { points, spendPoints } = useGarden();
  const [history, setHistory] = useState<RewardHistoryItem[]>(
    loadRewardHistory
  );
  const [message, setMessage] =
    useState<RewardMessage | null>(null);
  const [exchangingProductId, setExchangingProductId] =
    useState<string | null>(null);
  const [pendingProduct, setPendingProduct] =
    useState<RewardProduct | null>(null);
  const exchangeLockRef = useRef(false);

  const requestExchange = (product: RewardProduct) => {
    if (exchangeLockRef.current || points < product.price) {
      return;
    }

    setMessage(null);
    setPendingProduct(product);
  };

  const exchangeReward = (product: RewardProduct) => {
    exchangeLockRef.current = true;
    setExchangingProductId(product.id);

    const didSpend = spendPoints(product.price);

    if (!didSpend) {
      setMessage({
        type: "error",
        text: "포인트가 부족해 교환하지 못했어요.",
      });
      exchangeLockRef.current = false;
      setExchangingProductId(null);
      return;
    }

    const exchangedAt = new Date().toISOString();
    const exchangedItem: RewardHistoryItem = {
      id: `${exchangedAt}-${product.id}`,
      productId: product.id,
      name: product.name,
      icon: product.icon,
      points: product.price,
      exchangedAt,
    };
    const nextHistory = saveRewardHistory(
      [exchangedItem, ...history]
    );
    setHistory(nextHistory);
    setMessage({
      type: "success",
      text: `${product.name}을 교환했어요! ${product.icon}`,
    });

    window.setTimeout(() => {
      exchangeLockRef.current = false;
      setExchangingProductId(null);
    }, 500);
  };

  return (
    <MobileLayout>
      <main className="rewards-page">
        <header className="rewards-header">
          <span className="rewards-eyebrow">GREEN REWARDS</span>
          <h1 className="leafy-title">리워드</h1>
          <p>친환경 활동으로 모은 포인트를 사용해보세요</p>
        </header>

        <section
          className="rewards-balance-card"
          aria-label="현재 보유 포인트"
        >
          <div>
            <span>보유 포인트</span>
            <strong>{points.toLocaleString()} P</strong>
          </div>
          <Coins size={31} strokeWidth={1.7} />
        </section>

        {message && (
          <div
            className={`rewards-message ${message.type}`}
            role={message.type === "error" ? "alert" : "status"}
            aria-live="polite"
          >
            {message.text}
          </div>
        )}

        <section className="rewards-products">
          <div className="rewards-section-title">
            <div>
              <Gift size={17} />
              <h2>리워드 상품</h2>
            </div>
            <span>{rewardProducts.length}개의 상품</span>
          </div>

          <div className="rewards-product-list">
            {rewardProducts.map((product) => {
              const isInsufficient = points < product.price;
              const isExchanging =
                exchangingProductId === product.id;

              return (
                <article
                  className="rewards-product-card"
                  key={product.id}
                >
                  <div className="rewards-product-main">
                    <span
                      className="rewards-product-icon"
                      aria-hidden="true"
                    >
                      {product.icon}
                    </span>
                    <div className="rewards-product-info">
                      <h3>{product.name}</h3>
                      <p>{product.description}</p>
                    </div>
                  </div>

                  <div className="rewards-product-action">
                    <strong>
                      {product.price.toLocaleString()} P
                    </strong>
                    <button
                      type="button"
                      disabled={
                        isInsufficient ||
                        exchangingProductId !== null
                      }
                      onClick={() => requestExchange(product)}
                    >
                      {isExchanging
                        ? "교환 중..."
                        : isInsufficient
                          ? "포인트 부족"
                          : "교환하기"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rewards-history">
          <div className="rewards-section-title">
            <div>
              <History size={17} />
              <h2>최근 교환</h2>
            </div>
            {history.length > 0 && (
              <span>최근 {Math.min(history.length, 5)}개</span>
            )}
          </div>

          {history.length === 0 ? (
            <div className="rewards-history-empty">
              <span aria-hidden="true">🎁</span>
              <p>아직 교환한 리워드가 없어요.</p>
            </div>
          ) : (
            <div className="rewards-history-list">
              {history.slice(0, 5).map((item) => (
                <article
                  className="rewards-history-item"
                  key={item.id}
                >
                  <span
                    className="rewards-history-icon"
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <div>
                    <h3>{item.name}</h3>
                    <time dateTime={item.exchangedAt}>
                      {formatRewardExchangeDate(item.exchangedAt)}
                    </time>
                  </div>
                  <strong>
                    -{item.points.toLocaleString()} P
                  </strong>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <ConfirmDialog
        open={pendingProduct !== null}
        title="리워드 교환"
        message={
          pendingProduct
            ? `${pendingProduct.name}을 ${pendingProduct.price.toLocaleString()}P로 교환할까요?`
            : undefined
        }
        confirmLabel="교환하기"
        onConfirm={() => {
          if (pendingProduct) {
            exchangeReward(pendingProduct);
          }
          setPendingProduct(null);
        }}
        onCancel={() => setPendingProduct(null)}
      />

      <BottomNav />
    </MobileLayout>
  );
}

export default Rewards;
