import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type GardenContextType = {
  points: number;
  growth: number;
  harvestCount: number;

  completeActivity: (
    growthReward: number,
    pointReward: number
  ) => void;

  /*
    요일별 챌린지 보상. 성장률은 올리지 않고 포인트만 준다.
    completeActivity(0, reward)처럼 쓰면 의도가 드러나지 않아
    별도 함수로 둔다.
  */
  addPoints: (amount: number) => void;

  harvestPlant: () => void;
  spendPoints: (amount: number) => boolean;
  setTestGardenValues: (
    growth: number,
    points: number
  ) => boolean;
  resetGardenState: () => void;
};

const GardenContext =
  createContext<GardenContextType | undefined>(undefined);

export function GardenProvider({
  children,
}: {
  children: ReactNode;
}) {
  /*
    시작값은 0이어야 마이페이지의 누적 기록과 어긋나지 않는다.
    (보유 포인트 = 누적 획득 - 사용, 성장률 = 누적 성장 - 수확분)
  */
  const [points, setPoints] = useState(() => {
    const saved = localStorage.getItem("points");
    const parsed = saved === null ? 0 : Number(saved);

    return Number.isFinite(parsed)
      ? Math.max(0, parsed)
      : 0;
  });
  const pointsRef = useRef(points);

  const [growth, setGrowth] = useState(() => {
    const saved = localStorage.getItem("growth");
    const parsed = saved === null ? 0 : Number(saved);

    return Number.isFinite(parsed)
      ? Math.min(Math.max(parsed, 0), 100)
      : 0;
  });

  const [harvestCount, setHarvestCount] = useState(() => {
    const saved = localStorage.getItem("harvestCount");
    const parsed = saved === null ? 0 : Number(saved);

    return Number.isSafeInteger(parsed) && parsed >= 0
      ? parsed
      : 0;
  });

  useEffect(() => {
    pointsRef.current = points;
    localStorage.setItem("points", String(points));
  }, [points]);

  useEffect(() => {
    localStorage.setItem("growth", String(growth));
  }, [growth]);

  useEffect(() => {
    localStorage.setItem(
      "harvestCount",
      String(harvestCount)
    );
  }, [harvestCount]);

  const completeActivity = (
    growthReward: number,
    pointReward: number
  ) => {
    setGrowth((prev) =>
      Math.min(prev + growthReward, 100)
    );

    if (Number.isFinite(pointReward) && pointReward > 0) {
      const nextPoints =
        pointsRef.current + pointReward;

      pointsRef.current = nextPoints;
      setPoints(nextPoints);
    }
  };

  const addPoints = (amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    const nextPoints =
      pointsRef.current + Math.floor(amount);

    pointsRef.current = nextPoints;
    setPoints(nextPoints);
  };

  const spendPoints = (amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) {
      return false;
    }

    const safeAmount = Math.floor(amount);

    if (
      safeAmount <= 0 ||
      pointsRef.current < safeAmount
    ) {
      return false;
    }

    const nextPoints = Math.max(
      0,
      pointsRef.current - safeAmount
    );

    pointsRef.current = nextPoints;
    localStorage.setItem("points", String(nextPoints));
    setPoints(nextPoints);

    return true;
  };

  const setTestGardenValues = (
    nextGrowth: number,
    nextPoints: number
  ) => {
    const isValidGrowth =
      Number.isInteger(nextGrowth) &&
      nextGrowth >= 0 &&
      nextGrowth <= 100;
    const isValidPoints =
      Number.isSafeInteger(nextPoints) &&
      nextPoints >= 0;

    if (!isValidGrowth || !isValidPoints) {
      return false;
    }

    pointsRef.current = nextPoints;
    localStorage.setItem("growth", String(nextGrowth));
    localStorage.setItem("points", String(nextPoints));
    setGrowth(nextGrowth);
    setPoints(nextPoints);

    return true;
  };

  const harvestPlant = () => {
    setGrowth(0);

    setHarvestCount((prev) =>
      prev + 1
    );
  };

  /*
    개발용 전체 초기화. 저장된 값을 지워서 신규 사용자와
    같은 상태(0P, 0%)로 되돌린다.
  */
  const resetGardenState = () => {
    localStorage.removeItem("points");
    localStorage.removeItem("growth");
    localStorage.removeItem("harvestCount");

    pointsRef.current = 0;
    setPoints(0);
    setGrowth(0);
    setHarvestCount(0);
  };

  return (
    <GardenContext.Provider
      value={{
        points,
        growth,
        harvestCount,
        completeActivity,
        addPoints,
        harvestPlant,
        spendPoints,
        setTestGardenValues,
        resetGardenState,
      }}
    >
      {children}
    </GardenContext.Provider>
  );
}

export function useGarden() {
  const context = useContext(GardenContext);

  if (!context) {
    throw new Error(
      "useGarden은 GardenProvider 안에서 사용해야 합니다."
    );
  }

  return context;
}
