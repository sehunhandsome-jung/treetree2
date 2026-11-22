import { useEffect, useRef, useState } from "react";
import { Camera, Check, ImagePlus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import MobileLayout from "../components/MobileLayout";
import BottomNav from "../components/BottomNav";
import ConfirmDialog from "../components/ConfirmDialog";
import { useGarden } from "../context/GardenContext";
import { getClientId } from "../utils/clientId";
import { getIsDevMode } from "../utils/devMode";
import { resizeImageForUpload } from "../utils/resizeImage";
import { clearRewardHistory } from "../utils/rewardHistory";

const activities = [
  {
    name: "텀블러 사용",
    emoji: "🥤",
    growth: 4,
    points: 100,
  },
  {
    name: "대중교통 이용",
    emoji: "🚌",
    growth: 6,
    points: 150,
  },
  {
    name: "분리배출",
    emoji: "♻️",
    growth: 3,
    points: 80,
  },
  {
    name: "장바구니 사용",
    emoji: "🛍️",
    growth: 5,
    points: 120,
  },
  {
    name: "자전거 이용",
    emoji: "🚲",
    growth: 6,
    points: 150,
  },
  {
    name: "다회용 식기 사용",
    emoji: "🍽️",
    growth: 4,
    points: 100,
  },
  {
    name: "리필 제품 이용",
    emoji: "🧴",
    growth: 5,
    points: 120,
  },
  {
    name: "플로깅 참여",
    emoji: "🧹",
    growth: 8,
    points: 200,
  },
  {
    name: "헌옷 기부",
    emoji: "👕",
    growth: 7,
    points: 180,
  },
  {
    name: "폐가전 재활용",
    emoji: "🔌",
    growth: 7,
    points: 180,
  },
];

function Activity() {
  const navigate = useNavigate();

  const {
    completeActivity,
    growth,
    points,
    setTestGardenValues,
    resetGardenState,
  } = useGarden();

  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);

  const [selectedActivity, setSelectedActivity] =
    useState(activities[0]);

  const [isVerifying, setIsVerifying] =
    useState(false);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  const [isDevMode] = useState(getIsDevMode);

  const [pendingConfirm, setPendingConfirm] = useState<
    "reset-today" | "reset-all" | null
  >(null);

  const [testGrowth, setTestGrowth] =
    useState(String(growth));
  const [testPoints, setTestPoints] =
    useState(String(points));
  const [testValuesMessage, setTestValuesMessage] =
    useState<{
      type: "success" | "error";
      text: string;
    } | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(imageFile);

    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  /*
    안내 문구는 화면 위쪽에 뜨는데, 휴대폰에서는 인증 버튼을 누를 때
    아래로 스크롤된 상태라 실패 이유를 못 보고 지나치기 쉽다.
  */
  useEffect(() => {
    if (feedback) {
      feedbackRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [feedback]);

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    /* 같은 사진을 다시 골라도 change 이벤트가 오도록 비운다. */
    event.target.value = "";

    if (!file) {
      return;
    }

    console.log("사진 저장 성공:", file.name);
    console.log("사진 크기:", file.size);
    console.log("사진 형식:", file.type);

    setFeedback(null);
    setImageFile(file);
  };

  const handleVerify = async () => {
    if (!imageFile) {
      setFeedback({
        type: "error",
        text: "먼저 인증 사진을 촬영해주세요.",
      });
      return;
    }

    if (isVerifying) {
      return;
    }

    try {
      setIsVerifying(true);
      setFeedback(null);

      const formData = new FormData();

      formData.append(
        "activity",
        selectedActivity.name
      );

      formData.append(
        "clientId",
        getClientId()
      );

      formData.append(
        "image",
        await resizeImageForUpload(imageFile)
      );

      console.log("사진 전송 시작");

      const response = await fetch(
        "/api/verify",
        {
          method: "POST",
          body: formData,
        }
      );

      console.log(
        "서버 응답 상태:",
        response.status
      );

      const responseText =
        await response.text();

      console.log(
        "서버 원본 응답:",
        responseText
      );

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `서버가 JSON이 아닌 응답을 보냈습니다. (${response.status})`
        );
      }

      if (!response.ok || !data.ok) {
        setFeedback({
          type: "error",
          text:
            data.message ??
            `인증 실패 (${response.status})`,
        });

        return;
      }

      /*
        서버에서 전달받은 보상만 지급
      */
      completeActivity(
        data.growthReward,
        data.pointReward
      );

      navigate(
        "/activity-complete",
        {
          state: {
            activityType:
              data.activity,

            growthReward:
              data.growthReward,

            pointReward:
              data.pointReward,

            reason:
              data.reason,
          },
        }
      );
    } catch (error) {
      console.error(
        "인증 오류:",
        error
      );

      if (error instanceof Error) {
        setFeedback({
          type: "error",
          text: `오류 내용: ${error.message}`,
        });
      } else {
        setFeedback({
          type: "error",
          text: "알 수 없는 오류가 발생했습니다.",
        });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const performResetToday = async () => {
    try {
      const response = await fetch(
        "/api/dev/reset-today",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            clientId: getClientId(),
          }),
        }
      );

      const data = await response.json();

      setFeedback({
        type: data.ok ? "success" : "error",
        text: data.message,
      });
    } catch (error) {
      console.error(error);

      setFeedback({
        type: "error",
        text: "오늘 활동 기록 초기화에 실패했습니다.",
      });
    }
  };

  const performResetAll = async () => {
    try {
      const response = await fetch(
        "/api/dev/reset-all",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!data.ok) {
        setFeedback({
          type: "error",
          text: data.message,
        });
        return;
      }

      /*
        서버 기록만 지우면 이 브라우저의 포인트·성장률이 남아
        마이페이지 누적 기록과 어긋난다. 함께 초기화한다.
      */
      resetGardenState();
      clearRewardHistory();

      setTestGrowth("0");
      setTestPoints("0");
      setTestValuesMessage(null);

      setFeedback({
        type: "success",
        text: "서버 기록과 이 기기의 포인트·성장률·교환 내역까지 모두 초기화했어요.",
      });
    } catch (error) {
      console.error(error);

      setFeedback({
        type: "error",
        text: "전체 테스트 기록 초기화에 실패했습니다.",
      });
    }
  };

  const confirmPendingReset = () => {
    const type = pendingConfirm;

    setPendingConfirm(null);

    if (type === "reset-today") {
      performResetToday();
    } else if (type === "reset-all") {
      performResetAll();
    }
  };

  const applyTestGardenValues = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const nextGrowth = Number(testGrowth);
    const nextPoints = Number(testPoints);
    const didApply =
      testGrowth.trim() !== "" &&
      testPoints.trim() !== "" &&
      setTestGardenValues(nextGrowth, nextPoints);

    if (!didApply) {
      setTestValuesMessage({
        type: "error",
        text: "성장률은 0~100, 포인트는 0 이상의 정수로 입력해주세요.",
      });
      return;
    }

    setTestGrowth(String(nextGrowth));
    setTestPoints(String(nextPoints));
    setTestValuesMessage({
      type: "success",
      text: `성장률 ${nextGrowth}%, 포인트 ${nextPoints.toLocaleString()}P로 설정했어요.`,
    });
  };

  const removeImage = () => {
    setImageFile(null);
  };

  return (
    <MobileLayout>
      <div className="activity-page">

        <header className="activity-header">
          <h1 className="leafy-title">활동인증</h1>

          <p>
            오늘의 친환경 활동을 기록해보세요
          </p>
        </header>

        {feedback && (
          <div
            ref={feedbackRef}
            className={`activity-message ${feedback.type}`}
            role={
              feedback.type === "error" ? "alert" : "status"
            }
            aria-live="polite"
          >
            {feedback.text}
          </div>
        )}

        <section className="activity-section">

          <h2>활동 선택</h2>

          <div className="activity-options">

            {activities.map((activity) => {
              const isSelected =
                selectedActivity.name === activity.name;

              return (
                <button
                  key={activity.name}
                  type="button"

                  className={
                    isSelected
                      ? "activity-option selected"
                      : "activity-option"
                  }

                  aria-pressed={isSelected}
                  disabled={isVerifying}

                  onClick={() =>
                    setSelectedActivity(activity)
                  }
                >
                  <span
                    className="activity-option-check"
                    aria-hidden="true"
                  >
                    <Check size={16} strokeWidth={3.5} />
                  </span>

                  <span
                    className="activity-option-emoji"
                    aria-hidden="true"
                  >
                    {activity.emoji}
                  </span>

                  <span className="activity-option-name">
                    {activity.name}
                  </span>
                </button>
              );
            })}

          </div>
        </section>

        <section className="activity-section">

          <h2>활동 인증 사진</h2>

          {!previewUrl ? (
            <label className="camera-upload">

              <Camera
                size={38}
                strokeWidth={1.5}
              />

              <strong>
                사진 촬영하기
              </strong>

              <span>
                활동 모습을 촬영해서 인증해주세요
              </span>

              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={
                  handleImageChange
                }
                hidden
              />

            </label>
          ) : (
            <div className="photo-preview">

              <img
                src={previewUrl}
                alt="활동 인증 사진"
              />

              {!isVerifying && (
                <button
                  className="remove-photo"
                  onClick={removeImage}
                  type="button"
                >
                  <X size={18} />
                </button>
              )}

              {isVerifying && (
                <div
                  className="photo-verifying"
                  aria-live="polite"
                >
                  <span className="photo-verifying-spinner" />
                  <strong>
                    AI가 사진을 확인하고 있어요
                  </strong>
                  <span>
                    잠시만 기다려주세요
                  </span>
                </div>
              )}

            </div>
          )}

          {/*
            촬영만 가능하면 활동 현장에 있지 않은 사람은 체험할 수 없어서
            앨범에서 고르는 경로도 함께 둔다.
          */}
          {!isVerifying && (
            <div className="photo-source-actions">

              {previewUrl && (
                <label className="change-photo">

                  <Camera size={17} />

                  다시 촬영하기

                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={
                      handleImageChange
                    }
                    hidden
                  />

                </label>
              )}

              <label className="change-photo">

                <ImagePlus size={17} />

                앨범에서 선택하기

                <input
                  type="file"
                  accept="image/*"
                  onChange={
                    handleImageChange
                  }
                  hidden
                />

              </label>

            </div>
          )}

        </section>

        <div className="activity-reward">

          <p className="activity-reward-title">예상 보상</p>

          <div className="activity-reward-item">
            <span aria-hidden="true">🪙</span>
            +{selectedActivity.points}
          </div>

          <span
            className="activity-reward-divider"
            aria-hidden="true"
          />

          <div className="activity-reward-item">
            <span aria-hidden="true">🌿</span>
            +{selectedActivity.growth}
          </div>

        </div>

        <button
          className="verify-button"

          onClick={handleVerify}

          disabled={
            !imageFile ||
            isVerifying
          }
        >
          {isVerifying ? (
            <>
              <span className="verify-button-spinner" />
              AI가 확인하는 중...
            </>
          ) : (
            "활동 인증하기"
          )}
        </button>

        {/*
          인증은 활동마다 하루 1회라 수확(100%)이나 리워드 교환까지
          가보려면 값을 직접 넣을 수 있어야 한다. 체험용 빌드에서는
          접어두고, 서버 전체 기록 초기화는 개발 모드에서만 보인다.
        */}
        <details
          className="dev-reset-area"
          open={isDevMode}
        >
          <summary className="dev-test-title">
            {isDevMode
              ? "개발용 테스트 기능"
              : "체험용 도구 (성장률·포인트 바로 설정)"}
          </summary>

          {!isDevMode && (
            <p>
              인증을 여러 번 하지 않아도 수확과 리워드 교환을
              바로 체험해볼 수 있어요.
            </p>
          )}

          <form
            className="dev-values-form"
            onSubmit={applyTestGardenValues}
          >
            <div className="dev-values-grid">
              <label>
                <span>식물 성장률 (%)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="100"
                  step="1"
                  required
                  value={testGrowth}
                  onChange={(event) => {
                    setTestGrowth(event.target.value);
                    setTestValuesMessage(null);
                  }}
                />
              </label>

              <label>
                <span>보유 포인트 (P)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max={Number.MAX_SAFE_INTEGER}
                  step="1"
                  required
                  value={testPoints}
                  onChange={(event) => {
                    setTestPoints(event.target.value);
                    setTestValuesMessage(null);
                  }}
                />
              </label>
            </div>

            <button
              type="submit"
              className="dev-apply-button"
            >
              성장률·포인트 적용
            </button>

            {testValuesMessage && (
              <p
                className={`dev-values-message ${testValuesMessage.type}`}
                role={
                  testValuesMessage.type === "error"
                    ? "alert"
                    : "status"
                }
                aria-live="polite"
              >
                {testValuesMessage.text}
              </p>
            )}
          </form>

          <button
            type="button"
            className="dev-reset-button"
            onClick={() => setPendingConfirm("reset-today")}
          >
            내 오늘 활동 초기화
          </button>

          {isDevMode && (
            <button
              type="button"
              className="dev-reset-button danger"
              onClick={() => setPendingConfirm("reset-all")}
            >
              전체 테스트 기록 초기화
            </button>
          )}
        </details>
      </div>

      <ConfirmDialog
        open={pendingConfirm !== null}
        title={
          pendingConfirm === "reset-all"
            ? "전체 테스트 기록 초기화"
            : "오늘 활동 기록 초기화"
        }
        message={
          pendingConfirm === "reset-all"
            ? "서버의 인증 기록과 이 기기의 포인트·성장률·수확·교환 내역까지 모두 지우고 신규 사용자 상태로 되돌릴까요?"
            : "이 기기의 오늘 활동 기록을 초기화할까요?"
        }
        confirmLabel="초기화"
        danger
        onConfirm={confirmPendingReset}
        onCancel={() => setPendingConfirm(null)}
      />

      <BottomNav />
    </MobileLayout>
  );
}

export default Activity;
