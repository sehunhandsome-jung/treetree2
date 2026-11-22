import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  Flame,
  ImagePlus,
  Pencil,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import MobileLayout from "../components/MobileLayout";
import BottomNav from "../components/BottomNav";
import ConfirmDialog from "../components/ConfirmDialog";
import ChallengeCalendar from "../components/challenges/ChallengeCalendar";
import CompletionStamp from "../components/challenges/CompletionStamp";
import { useGarden } from "../context/GardenContext";
import { useChallengeRecords } from "../hooks/useChallengeRecords";
import { useWeeklyChallenges } from "../hooks/useWeeklyChallenges";
import { getClientId } from "../utils/clientId";
import { resizeImageForUpload } from "../utils/resizeImage";
import {
  formatDateLabel,
  getKoreaDateString,
  getWeekdayFromDateString,
  getWeekDateStrings,
  WEEKDAY_LABELS,
  WEEKDAY_ORDER_FROM_MONDAY,
} from "../utils/koreaDate";
import {
  MAX_MISSION_DESCRIPTION_LENGTH,
  MAX_MISSION_TITLE_LENGTH,
  validateMission,
} from "../utils/weeklyChallenges";

/* 서버와 같은 값. 표시용이며 실제 지급은 서버 응답을 따른다. */
const CHALLENGE_POINT_REWARD = 50;

type TabKey = "today" | "settings";

type Feedback = {
  type: "success" | "error";
  text: string;
};


function Challenges() {
  const { addPoints } = useGarden();
  const {
    challenges,
    upsertChallenge,
    removeChallenge,
  } = useWeeklyChallenges();
  const {
    records,
    isLoading,
    errorMessage,
    refresh,
  } = useChallengeRecords();

  const [activeTab, setActiveTab] =
    useState<TabKey>("today");

  /*
    자정을 넘겨도 화면을 열어둔 경우가 있어 주기적으로 오늘 날짜를
    다시 계산한다. 날짜가 바뀌면 오늘의 미션과 완료 상태가 갱신된다.
  */
  const [today, setToday] = useState(getKoreaDateString);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = getKoreaDateString();

      setToday((previous) =>
        previous === current ? previous : current
      );
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  const todayWeekday = getWeekdayFromDateString(today);
  const todayMission = challenges[todayWeekday];

  const [selectedDate, setSelectedDate] = useState(today);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const [year, month] = today.split("-").map(Number);

    return { year, month };
  });

  /* 날짜가 바뀌면 선택 날짜도 오늘로 따라간다. */
  useEffect(() => {
    setSelectedDate(today);
  }, [today]);

  const [imageFile, setImageFile] =
    useState<File | null>(null);
  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [feedback, setFeedback] =
    useState<Feedback | null>(null);
  const verifyLockRef = useRef(false);

  /* 요일별 설정 편집 상태 */
  const [editingWeekday, setEditingWeekday] = useState<
    number | null
  >(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] =
    useState("");
  const [settingsMessage, setSettingsMessage] =
    useState<Feedback | null>(null);
  const [pendingDelete, setPendingDelete] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(imageFile);

    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const recordsByDate = useMemo(() => {
    const map = new Map<string, (typeof records)[number]>();

    records.forEach((record) => {
      /* 하루 1회라 중복은 없지만, 있으면 최신 것을 남긴다. */
      if (!map.has(record.date)) {
        map.set(record.date, record);
      }
    });

    return map;
  }, [records]);

  const todayRecord = recordsByDate.get(today);
  const selectedRecord = recordsByDate.get(selectedDate);

  const weekStats = useMemo(() => {
    const weekDates = getWeekDateStrings(today);
    const done = weekDates.filter((date) =>
      recordsByDate.has(date)
    );

    return {
      doneCount: done.length,
      bonusPoints: done.reduce(
        (sum, date) =>
          sum + (recordsByDate.get(date)?.pointReward ?? 0),
        0
      ),
    };
  }, [today, recordsByDate]);

  /* 오늘부터 거꾸로 세는 연속 달성 일수 */
  const streak = useMemo(() => {
    let count = 0;
    const [year, month, day] = today.split("-").map(Number);
    const cursor = new Date(Date.UTC(year, month - 1, day));

    while (count < 365) {
      const key = cursor.toISOString().slice(0, 10);

      if (!recordsByDate.has(key)) {
        break;
      }

      count += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    return count;
  }, [today, recordsByDate]);

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setFeedback(null);
    setImageFile(file);
  };

  const handleVerify = async () => {
    if (!todayMission) {
      setFeedback({
        type: "error",
        text: "오늘의 미션을 먼저 설정해주세요.",
      });
      return;
    }

    if (!imageFile) {
      setFeedback({
        type: "error",
        text: "먼저 인증 사진을 촬영해주세요.",
      });
      return;
    }

    /* 중복 클릭으로 보상이 두 번 지급되지 않게 잠근다. */
    if (verifyLockRef.current || todayRecord) {
      return;
    }

    verifyLockRef.current = true;

    try {
      setIsVerifying(true);
      setFeedback(null);

      const formData = new FormData();

      formData.append("clientId", getClientId());
      formData.append("missionTitle", todayMission.title);

      if (todayMission.description) {
        formData.append(
          "missionDescription",
          todayMission.description
        );
      }

      formData.append(
        "image",
        await resizeImageForUpload(imageFile)
      );

      const response = await fetch(
        "/api/challenges/verify",
        { method: "POST", body: formData }
      );

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error("서버 응답을 읽지 못했습니다.");
      }

      if (!response.ok || !data.ok) {
        setFeedback({
          type: "error",
          text:
            data?.message ??
            `인증에 실패했어요. (${response.status})`,
        });
        return;
      }

      /* 서버가 정한 보상만 지급한다. */
      addPoints(data.pointReward);
      setImageFile(null);
      refresh();

      setFeedback({
        type: "success",
        text: `오늘의 챌린지 완료! +${data.pointReward}P를 받았어요.`,
      });
    } catch {
      setFeedback({
        type: "error",
        text: "서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요.",
      });
    } finally {
      setIsVerifying(false);
      verifyLockRef.current = false;
    }
  };

  const startEditing = (weekday: number) => {
    const existing = challenges[weekday];

    setEditingWeekday(weekday);
    setDraftTitle(existing?.title ?? "");
    setDraftDescription(existing?.description ?? "");
    setSettingsMessage(null);
  };

  const saveDraft = (weekday: number) => {
    const result = validateMission(
      draftTitle,
      draftDescription
    );

    if (!result.ok) {
      setSettingsMessage({
        type: "error",
        text: result.message,
      });
      return;
    }

    const saved = upsertChallenge(
      weekday,
      result.title,
      result.description
    );

    if (!saved) {
      setSettingsMessage({
        type: "error",
        text: "미션을 저장하지 못했어요. 브라우저 저장 공간을 확인해주세요.",
      });
      return;
    }

    setEditingWeekday(null);
    setSettingsMessage({
      type: "success",
      text: `${WEEKDAY_LABELS[weekday]}요일 미션을 저장했어요.`,
    });
  };

  const confirmDelete = () => {
    if (pendingDelete === null) {
      return;
    }

    const weekday = pendingDelete;

    setPendingDelete(null);

    const removed = removeChallenge(weekday);

    setSettingsMessage(
      removed
        ? {
            type: "success",
            text: `${WEEKDAY_LABELS[weekday]}요일 미션을 삭제했어요. 지난 완료 기록은 그대로 남아요.`,
          }
        : {
            type: "error",
            text: "미션을 삭제하지 못했어요.",
          }
    );
  };

  const selectedWeekday =
    getWeekdayFromDateString(selectedDate);
  const selectedPlannedMission = challenges[selectedWeekday];

  return (
    <MobileLayout>
      <main className="challenges-page">
        <header className="challenges-header">
          <span className="challenges-eyebrow">
            WEEKLY CHALLENGE
          </span>
          <h1 className="leafy-title">요일별 챌린지</h1>
          <p>
            나만의 친환경 미션을 정하고 매일 실천해보세요
          </p>
        </header>

        <section
          className="challenges-summary"
          aria-label="이번 주 챌린지 요약"
        >
          <div className="challenges-summary-card">
            <CheckCircle2 size={17} />
            <span>이번 주 완료</span>
            <strong>{weekStats.doneCount}</strong>
            <small>/ 7일</small>
          </div>

          <div className="challenges-summary-card">
            <Sparkles size={17} />
            <span>보너스</span>
            <strong>
              {weekStats.bonusPoints.toLocaleString()}
            </strong>
            <small>P</small>
          </div>

          <div className="challenges-summary-card">
            <Flame size={17} />
            <span>연속 달성</span>
            <strong>{streak}</strong>
            <small>일째</small>
          </div>
        </section>

        <div
          className="challenges-tabs"
          role="tablist"
          aria-label="챌린지 화면 종류"
        >
          <button
            type="button"
            role="tab"
            id="challenges-today-tab"
            aria-selected={activeTab === "today"}
            aria-controls="challenges-today-panel"
            className={activeTab === "today" ? "active" : ""}
            onClick={() => setActiveTab("today")}
          >
            오늘의 챌린지
          </button>

          <button
            type="button"
            role="tab"
            id="challenges-settings-tab"
            aria-selected={activeTab === "settings"}
            aria-controls="challenges-settings-panel"
            className={
              activeTab === "settings" ? "active" : ""
            }
            onClick={() => setActiveTab("settings")}
          >
            요일별 미션 설정
          </button>
        </div>

        {activeTab === "today" && (
          <section
            id="challenges-today-panel"
            role="tabpanel"
            aria-labelledby="challenges-today-tab"
            className="challenges-panel"
          >
            {feedback && (
              <div
                className={`activity-message ${feedback.type}`}
                role={
                  feedback.type === "error"
                    ? "alert"
                    : "status"
                }
                aria-live="polite"
              >
                {feedback.text}
              </div>
            )}

            {!todayMission ? (
              <div className="challenge-empty-card">
                <span aria-hidden="true">🗓️</span>
                <p>오늘 설정된 미션이 없어요</p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("settings");
                    startEditing(todayWeekday);
                  }}
                >
                  미션 설정하기
                </button>
              </div>
            ) : todayRecord ? (
              <div className="challenge-done-card">
                <CompletionStamp variant="large" animate />
                <h2>오늘의 챌린지 완료!</h2>
                <p className="challenge-done-mission">
                  {todayRecord.missionTitle}
                </p>

                <div className="challenge-done-meta">
                  <span>
                    +
                    {todayRecord.pointReward.toLocaleString()}{" "}
                    P 획득
                  </span>
                  <time dateTime={todayRecord.createdAt}>
                    {todayRecord.time.slice(0, 5)} 완료
                  </time>
                </div>

                {todayRecord.reason && (
                  <p className="challenge-done-reason">
                    AI 확인 · {todayRecord.reason}
                  </p>
                )}
              </div>
            ) : (
              <div className="challenge-today-card">
                <div className="challenge-today-top">
                  <span className="challenge-weekday-chip">
                    {WEEKDAY_LABELS[todayWeekday]}요일
                  </span>
                  <strong>+{CHALLENGE_POINT_REWARD} P</strong>
                </div>

                <h2>{todayMission.title}</h2>

                {todayMission.description && (
                  <p className="challenge-today-desc">
                    {todayMission.description}
                  </p>
                )}

                {!previewUrl ? (
                  <label className="camera-upload">
                    <Camera size={34} strokeWidth={1.5} />
                    <strong>사진 촬영하기</strong>
                    <span>
                      미션을 실천하는 모습을 찍어주세요
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageChange}
                      hidden
                    />
                  </label>
                ) : (
                  <div className="photo-preview">
                    <img
                      src={previewUrl}
                      alt="챌린지 인증 사진"
                    />

                    {!isVerifying && (
                      <button
                        type="button"
                        className="remove-photo"
                        aria-label="사진 삭제"
                        onClick={() => setImageFile(null)}
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
                        <span>잠시만 기다려주세요</span>
                      </div>
                    )}
                  </div>
                )}

                {previewUrl && !isVerifying && (
                  <label className="change-photo">
                    <ImagePlus size={17} />
                    다른 사진 선택하기
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageChange}
                      hidden
                    />
                  </label>
                )}

                <button
                  type="button"
                  className="verify-button"
                  disabled={!imageFile || isVerifying}
                  onClick={handleVerify}
                >
                  {isVerifying ? (
                    <>
                      <span className="verify-button-spinner" />
                      AI가 확인하는 중...
                    </>
                  ) : (
                    "사진 인증하기"
                  )}
                </button>
              </div>
            )}

            <ChallengeCalendar
              year={calendarMonth.year}
              month={calendarMonth.month}
              today={today}
              selectedDate={selectedDate}
              recordsByDate={recordsByDate}
              challenges={challenges}
              onChangeMonth={(year, month) =>
                setCalendarMonth({ year, month })
              }
              onSelectDate={setSelectedDate}
            />

            {isLoading ? (
              <div
                className="challenge-detail-card"
                aria-live="polite"
              >
                <span className="mypage-loader" />
                <p>챌린지 기록을 불러오고 있어요...</p>
              </div>
            ) : errorMessage ? (
              <div
                className="challenge-detail-card"
                role="alert"
              >
                <p>{errorMessage}</p>
                <button type="button" onClick={refresh}>
                  다시 불러오기
                </button>
              </div>
            ) : (
              <div className="challenge-detail-card">
                <span className="challenge-detail-date">
                  {formatDateLabel(selectedDate)} (
                  {WEEKDAY_LABELS[selectedWeekday]})
                </span>

                {selectedRecord ? (
                  <>
                    <h3>{selectedRecord.missionTitle}</h3>
                    <div className="challenge-detail-meta">
                      <span className="challenge-detail-done">
                        완료
                      </span>
                      <span>
                        +
                        {selectedRecord.pointReward.toLocaleString()}{" "}
                        P
                      </span>
                      <time
                        dateTime={selectedRecord.createdAt}
                      >
                        {selectedRecord.time.slice(0, 5)}
                      </time>
                    </div>

                    {selectedRecord.reason && (
                      <p className="challenge-detail-reason">
                        AI 확인 · {selectedRecord.reason}
                      </p>
                    )}
                  </>
                ) : selectedDate > today ? (
                  <p className="challenge-detail-empty">
                    {selectedPlannedMission
                      ? `예정된 미션: ${selectedPlannedMission.title}`
                      : "설정된 미션이 없어요."}
                  </p>
                ) : (
                  <p className="challenge-detail-empty">
                    {selectedPlannedMission
                      ? `미완료 · ${selectedPlannedMission.title}`
                      : "이 날은 설정된 미션이 없었어요."}
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {activeTab === "settings" && (
          <section
            id="challenges-settings-panel"
            role="tabpanel"
            aria-labelledby="challenges-settings-tab"
            className="challenges-panel"
          >
            {settingsMessage && (
              <div
                className={`activity-message ${settingsMessage.type}`}
                role={
                  settingsMessage.type === "error"
                    ? "alert"
                    : "status"
                }
                aria-live="polite"
              >
                {settingsMessage.text}
              </div>
            )}

            <div className="challenge-settings-list">
              {WEEKDAY_ORDER_FROM_MONDAY.map((weekday) => {
                const mission = challenges[weekday];
                const isEditing =
                  editingWeekday === weekday;
                const isToday = weekday === todayWeekday;

                return (
                  <article
                    key={weekday}
                    className={
                      isToday
                        ? "challenge-setting-row today"
                        : "challenge-setting-row"
                    }
                  >
                    <div className="challenge-setting-head">
                      <span className="challenge-weekday-chip">
                        {WEEKDAY_LABELS[weekday]}
                        {isToday ? " · 오늘" : ""}
                      </span>

                      {!isEditing && (
                        <div className="challenge-setting-actions">
                          <button
                            type="button"
                            aria-label={`${WEEKDAY_LABELS[weekday]}요일 미션 ${
                              mission ? "수정" : "설정"
                            }`}
                            onClick={() =>
                              startEditing(weekday)
                            }
                          >
                            <Pencil size={15} />
                          </button>

                          {mission && (
                            <button
                              type="button"
                              aria-label={`${WEEKDAY_LABELS[weekday]}요일 미션 삭제`}
                              onClick={() =>
                                setPendingDelete(weekday)
                              }
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="challenge-setting-form">
                        <label>
                          <span>미션 내용</span>
                          <input
                            type="text"
                            value={draftTitle}
                            maxLength={
                              MAX_MISSION_TITLE_LENGTH
                            }
                            placeholder="예: 계단으로 올라가기"
                            onChange={(event) => {
                              setDraftTitle(
                                event.target.value
                              );
                              setSettingsMessage(null);
                            }}
                          />
                        </label>

                        <label>
                          <span>설명 (선택)</span>
                          <input
                            type="text"
                            value={draftDescription}
                            maxLength={
                              MAX_MISSION_DESCRIPTION_LENGTH
                            }
                            placeholder="예: 3층까지는 계단으로"
                            onChange={(event) => {
                              setDraftDescription(
                                event.target.value
                              );
                              setSettingsMessage(null);
                            }}
                          />
                        </label>

                        <div className="challenge-setting-buttons">
                          <button
                            type="button"
                            className="challenge-cancel"
                            onClick={() =>
                              setEditingWeekday(null)
                            }
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            className="challenge-save"
                            onClick={() =>
                              saveDraft(weekday)
                            }
                          >
                            저장
                          </button>
                        </div>
                      </div>
                    ) : mission ? (
                      <div className="challenge-setting-body">
                        <strong>{mission.title}</strong>
                        {mission.description && (
                          <p>{mission.description}</p>
                        )}
                      </div>
                    ) : (
                      <p className="challenge-setting-none">
                        아직 설정하지 않았어요
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="미션 삭제"
        message={
          pendingDelete !== null
            ? `${WEEKDAY_LABELS[pendingDelete]}요일 미션을 삭제할까요? 이미 완료한 날의 기록은 그대로 남아요.`
            : undefined
        }
        confirmLabel="삭제"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <BottomNav />
    </MobileLayout>
  );
}

export default Challenges;
