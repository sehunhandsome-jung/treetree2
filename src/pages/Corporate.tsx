import { useState } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  FileText,
  Loader2,
  Printer,
  RotateCcw,
} from "lucide-react";

import MobileLayout from "../components/MobileLayout";
import {
  useCorporateReport,
  type ActivityBreakdown,
} from "../hooks/useCorporateReport";

function formatDate(isoDate: string) {
  return isoDate.replaceAll("-", ".");
}

/*
  보고 기간의 양 끝 주는 7일이 다 포함되지 않아 막대가 짧게 나온다.
  표시를 안 해두면 참여가 줄어든 것처럼 읽힌다.
*/
function isPartialWeek(
  weekStart: string,
  period: { from: string; to: string }
) {
  const [y, m, d] = weekStart.split("-").map(Number);
  const end = new Date(Date.UTC(y, m - 1, d));

  end.setUTCDate(end.getUTCDate() + 6);

  const weekEnd = end.toISOString().slice(0, 10);

  return weekStart < period.from || weekEnd > period.to;
}

function formatDateTime(iso: string) {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "시각 미상";
  }

  /* 리포트는 전부 한국 기준으로 집계되므로 표기도 맞춘다. */
  return date
    .toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(/\.\s?$/, "");
}

/*
  로그인 화면과 마이페이지 양쪽에서 들어올 수 있다.
  어디서 왔는지 모르면 뒤로가기가 엉뚱한 곳으로 가므로
  보낸 쪽이 state.from에 출발지를 실어 준다.
*/
function useExitTarget() {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)
    ?.from;

  return from === "/mypage"
    ? { path: "/mypage", label: "마이페이지로" }
    : { path: "/", label: "로그인으로" };
}

function CodeGate({
  onSubmit,
  isLoading,
  errorMessage,
}: {
  onSubmit: (code: string) => void;
  isLoading: boolean;
  errorMessage: string | null;
}) {
  const navigate = useNavigate();
  const exit = useExitTarget();
  const [code, setCode] = useState("");

  return (
    <div className="corp-gate">
      <button
        type="button"
        className="corp-back"
        onClick={() => navigate(exit.path)}
      >
        <ArrowLeft size={16} />
        <span>{exit.label}</span>
      </button>

      <div className="corp-gate-badge">
        <Building2 size={26} />
      </div>

      <h1 className="corp-gate-title">기업 담당자 로그인</h1>
      <p className="corp-gate-desc">
        임직원 친환경 활동 데이터를 ESG 보고서용
        <br />
        리포트로 받아보실 수 있어요.
      </p>

      <form
        className="corp-gate-form"
        onSubmit={(event) => {
          event.preventDefault();

          if (code.trim().length > 0 && !isLoading) {
            onSubmit(code.trim());
          }
        }}
      >
        <label
          className="corp-field-label"
          htmlFor="corporate-code"
        >
          기업 코드
        </label>

        <input
          id="corporate-code"
          type="password"
          className="login-input"
          placeholder="발급받은 기업 코드"
          autoComplete="off"
          value={code}
          onChange={(event) =>
            setCode(event.target.value)
          }
        />

        <button
          type="submit"
          className="login-button corp-primary-button"
          disabled={code.trim().length === 0 || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2
                size={18}
                className="corp-spinner"
              />
              <span>리포트를 만들고 있어요</span>
            </>
          ) : (
            <>
              <FileText size={18} />
              <span>레포트 만들기</span>
            </>
          )}
        </button>
      </form>

      {errorMessage && (
        <p
          className="corp-error"
          role="status"
          aria-live="polite"
        >
          {errorMessage}
        </p>
      )}

      <p className="corp-gate-note">
        체험판에서는 공용 코드 하나로 접속해요. 실제 계정
        연동은 준비 중이에요.
      </p>
    </div>
  );
}

function BreakdownRow({
  item,
  maxCount,
}: {
  item: ActivityBreakdown;
  maxCount: number;
}) {
  const widthPercent =
    maxCount === 0
      ? 0
      : Math.max(6, (item.count / maxCount) * 100);

  return (
    <tr>
      <th scope="row">
        <span className="corp-cell-name">
          {item.activity}
        </span>
        <span
          className="corp-cell-bar"
          style={{ width: `${widthPercent}%` }}
          aria-hidden="true"
        />
      </th>
      <td>{item.count.toLocaleString("ko-KR")}</td>
      <td>{item.participants.toLocaleString("ko-KR")}</td>
      <td>{item.co2eKg.toLocaleString("ko-KR")}</td>
      <td>
        {item.disposableItems.toLocaleString("ko-KR")}
      </td>
    </tr>
  );
}

function Corporate() {
  const navigate = useNavigate();
  const exit = useExitTarget();
  const {
    report,
    isLoading,
    errorMessage,
    generate,
    reset,
  } = useCorporateReport();

  if (!report) {
    return (
      <MobileLayout>
        <CodeGate
          onSubmit={(code) => {
            void generate(code);
          }}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />
      </MobileLayout>
    );
  }

  const { metrics, narrative, griMapping } = report;

  const maxCount = metrics.breakdown.reduce(
    (max, item) => Math.max(max, item.count),
    0
  );
  const maxWeek = metrics.weeklyTrend.reduce(
    (max, item) => Math.max(max, item.count),
    0
  );

  const hasData = metrics.totalVerifications > 0;

  return (
    <MobileLayout>
      <div className="corp-report">
        <header className="corp-report-head">
          <button
            type="button"
            className="corp-back"
            onClick={() => navigate(exit.path)}
          >
            <ArrowLeft size={16} />
            <span>{exit.label}</span>
          </button>

          <p className="corp-report-kicker">
            나무나무 임직원 친환경 활동 리포트
          </p>
          <h1 className="corp-report-title">
            ESG 보고서 작성용 성과 요약
          </h1>

          <dl className="corp-meta">
            <div>
              <dt>보고 기간</dt>
              <dd>
                {formatDate(metrics.period.from)} ~{" "}
                {formatDate(metrics.period.to)}
              </dd>
            </div>
            <div>
              <dt>생성 시각</dt>
              <dd>
                {formatDateTime(metrics.generatedAt)}
              </dd>
            </div>
            <div>
              <dt>작성 기준</dt>
              <dd>GRI Standards 2021 연계</dd>
            </div>
          </dl>

          <div className="corp-actions">
            <button
              type="button"
              className="corp-ghost-button"
              onClick={() => window.print()}
            >
              <Printer size={16} />
              <span>인쇄 · PDF 저장</span>
            </button>
            <button
              type="button"
              className="corp-ghost-button"
              onClick={reset}
            >
              <RotateCcw size={16} />
              <span>다시 만들기</span>
            </button>
          </div>
        </header>

        {!hasData && (
          <p className="corp-callout">
            보고 기간 중 인증 기록이 없어 모든 수치가 0으로
            집계되었어요. 임직원 인증이 쌓인 뒤에 다시
            만들어주세요.
          </p>
        )}

        <section className="corp-section">
          <h2>1. 경영진 요약</h2>
          <p className="corp-body">{narrative.summary}</p>
        </section>

        <section className="corp-section">
          <h2>2. 핵심 성과 지표</h2>

          <div className="corp-kpi-grid">
            <div className="corp-kpi">
              <span className="corp-kpi-label">
                참여 임직원
              </span>
              <strong className="corp-kpi-value">
                {metrics.totalParticipants.toLocaleString(
                  "ko-KR"
                )}
                <em>명</em>
              </strong>
            </div>
            <div className="corp-kpi">
              <span className="corp-kpi-label">
                총 인증 건수
              </span>
              <strong className="corp-kpi-value">
                {metrics.totalVerifications.toLocaleString(
                  "ko-KR"
                )}
                <em>건</em>
              </strong>
            </div>
            <div className="corp-kpi">
              <span className="corp-kpi-label">
                온실가스 감축 추정
              </span>
              <strong className="corp-kpi-value">
                {metrics.totalCo2eKg.toLocaleString(
                  "ko-KR"
                )}
                <em>kgCO2e</em>
              </strong>
            </div>
            <div className="corp-kpi">
              <span className="corp-kpi-label">
                일회용품 저감
              </span>
              <strong className="corp-kpi-value">
                {metrics.totalDisposableItems.toLocaleString(
                  "ko-KR"
                )}
                <em>개</em>
              </strong>
            </div>
            <div className="corp-kpi">
              <span className="corp-kpi-label">
                1인당 평균 인증
              </span>
              <strong className="corp-kpi-value">
                {metrics.avgVerificationsPerParticipant.toLocaleString(
                  "ko-KR"
                )}
                <em>건</em>
              </strong>
            </div>
            <div className="corp-kpi">
              <span className="corp-kpi-label">
                챌린지 완료
              </span>
              <strong className="corp-kpi-value">
                {metrics.challengeCompletions.toLocaleString(
                  "ko-KR"
                )}
                <em>건</em>
              </strong>
            </div>
          </div>
        </section>

        <section className="corp-section">
          <h2>3. 활동별 상세</h2>

          {metrics.breakdown.length === 0 ? (
            <p className="corp-empty">
              집계할 활동이 없어요.
            </p>
          ) : (
            <div className="corp-table-wrap">
              <table className="corp-table">
                <thead>
                  <tr>
                    <th scope="col">활동</th>
                    <th scope="col">건수</th>
                    <th scope="col">참여</th>
                    <th scope="col">kgCO2e</th>
                    <th scope="col">일회용품</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.breakdown.map((item) => (
                    <BreakdownRow
                      key={item.activity}
                      item={item}
                      maxCount={maxCount}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {metrics.weeklyTrend.length > 0 && (
          <section className="corp-section">
            <h2>4. 주별 참여 추이</h2>

            <ul className="corp-trend">
              {metrics.weeklyTrend.map((item) => (
                <li key={item.week}>
                  <span className="corp-trend-week">
                    {formatDate(item.week).slice(5)}
                  </span>
                  <span className="corp-trend-track">
                    <span
                      className="corp-trend-fill"
                      style={{
                        width:
                          maxWeek === 0
                            ? "0%"
                            : `${Math.max(
                                6,
                                (item.count / maxWeek) * 100
                              )}%`,
                      }}
                    />
                  </span>
                  <span className="corp-trend-count">
                    {item.count}건
                    {isPartialWeek(
                      item.week,
                      metrics.period
                    ) && (
                      <span
                        className="corp-trend-partial"
                        title="보고 기간에 일부만 포함된 주"
                      >
                        *
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            <p className="corp-caption">
              각 주의 시작일(월요일) 기준입니다. *표시는 보고
              기간에 일부만 포함된 주라 건수가 적게 집계됩니다.
            </p>
          </section>
        )}

        <section className="corp-section">
          <h2>5. 공시 기준 연계</h2>

          <div className="corp-table-wrap">
            <table className="corp-table corp-table-gri">
              <thead>
                <tr>
                  <th scope="col">지표</th>
                  <th scope="col">기준</th>
                </tr>
              </thead>
              <tbody>
                {griMapping.map((entry) => (
                  <tr key={entry.code}>
                    <th scope="row">
                      <span className="corp-cell-name">
                        {entry.metric}
                      </span>
                      <span className="corp-cell-note">
                        {entry.note}
                      </span>
                    </th>
                    <td className="corp-cell-code">
                      {entry.code}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="corp-section">
          <h2>6. 데이터 해석</h2>
          <p className="corp-body">{narrative.insight}</p>
        </section>

        <section className="corp-section">
          <h2>7. 개선 제안</h2>
          <p className="corp-body">
            {narrative.recommendation}
          </p>
        </section>

        <section className="corp-section corp-method">
          <h2>8. 산정 방법 및 한계</h2>

          <div className="corp-warning">
            <AlertTriangle size={18} />
            <div>
              <strong>
                이 리포트를 그대로 외부 공시에 쓰지 마세요.
              </strong>
              <p>
                환산 계수가 아직 공식 출처로 확정되지 않아
                감축량은 참고용 추정치입니다. 공시 전에 공식
                배출계수로 재산정하고 제3자 검증을 받아야
                합니다.
              </p>
            </div>
          </div>

          <ul className="corp-method-list">
            <li>
              <strong>집계 방식</strong> — 참여 인원·건수는
              서버에 저장된 사진 인증 기록을 그대로 센
              값입니다. 감축량은 활동별 환산 계수 × 인증
              건수로 계산했습니다.
            </li>
            <li>
              <strong>해설 문장</strong> — 1·6·7번 항목의
              문장은 AI가 작성했습니다. 위에 확정된 수치만
              전달받아 서술하며, 수치를 새로 만들거나 추정하지
              않습니다.
            </li>
            <li>
              <strong>중복 방지</strong> — 같은 사진 재사용을
              막는 해시 검사와 1일 1회 제한이 적용된 기록만
              집계됩니다.
            </li>
            <li>
              <strong>기간 기준</strong> — 모든 날짜는
              한국 표준시(Asia/Seoul) 기준이며, 기본 보고
              기간은 최근 90일입니다.
            </li>
            <li>
              <strong>Scope 연계</strong> — 통근 수단 전환분은
              Scope 3 Category 7(임직원 통근)과 연계할 수
              있으나, 실제 통근 거리를 측정하지 않으므로 대표
              거리 가정을 사용했습니다.
            </li>
          </ul>

          {metrics.unverifiedFactors.length > 0 && (
            <div className="corp-unverified">
              <p className="corp-unverified-title">
                출처 미확인 환산 계수
              </p>
              <p className="corp-unverified-list">
                {metrics.unverifiedFactors.join(", ")}
              </p>
            </div>
          )}

          <table className="corp-table corp-table-basis">
            <thead>
              <tr>
                <th scope="col">활동</th>
                <th scope="col">계수 산정 전제</th>
                <th scope="col">출처</th>
              </tr>
            </thead>
            <tbody>
              {metrics.breakdown.map((item) => (
                <tr key={item.activity}>
                  <th scope="row">{item.activity}</th>
                  <td>{item.basis}</td>
                  <td>
                    {item.factorSource ?? (
                      <span className="corp-missing">
                        미확인
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <footer className="corp-footer">
          나무나무 · 임직원 친환경 활동 인증 플랫폼
        </footer>
      </div>
    </MobileLayout>
  );
}

export default Corporate;
