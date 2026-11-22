/*
  챌린지 완료 도장 — 목업의 새싹 캐릭터.

  몸통은 겹친 원으로 만든다. 같은 원을 "조금 큰 초록 원"과
  "작은 크림색 원" 두 겹으로 깔면 내부 선 없이 윤곽선이 있는
  뭉게구름 모양이 나온다. 손으로 쓴 복잡한 path보다 안전하다.
*/

/* 몸통을 이루는 원들 (cx, cy, r) */
const BODY_BLOBS: ReadonlyArray<[number, number, number]> = [
  [50, 40, 19],
  [34, 45, 13],
  [66, 45, 13],
  [40, 28, 13],
  [60, 28, 13],
];

const OUTLINE_WIDTH = 3.5;

type CompletionStampProps = {
  /* 달력 칸용 작은 도장 / 완료 카드용 큰 도장 */
  variant?: "small" | "large";
  /* 방금 완료한 순간에만 찍히는 연출 */
  animate?: boolean;
};

function CompletionStamp({
  variant = "small",
  animate = false,
}: CompletionStampProps) {
  const className = [
    "completion-stamp",
    variant,
    animate ? "animate" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 100 100">
        {/* 줄기 */}
        <path
          className="stamp-stem"
          d="M50 58c0 9-4 14-10 17"
          fill="none"
          strokeLinecap="round"
        />

        {/* 잎 */}
        <ellipse
          className="stamp-leaf"
          cx="31"
          cy="74"
          rx="13"
          ry="8"
          transform="rotate(-18 31 74)"
        />
        <ellipse
          className="stamp-leaf"
          cx="67"
          cy="70"
          rx="13"
          ry="8"
          transform="rotate(16 67 70)"
        />

        {/* 몸통 윤곽 */}
        <g className="stamp-outline">
          {BODY_BLOBS.map(([cx, cy, r]) => (
            <circle
              key={`o-${cx}-${cy}`}
              cx={cx}
              cy={cy}
              r={r + OUTLINE_WIDTH}
            />
          ))}
        </g>

        {/* 몸통 */}
        <g className="stamp-body">
          {BODY_BLOBS.map(([cx, cy, r]) => (
            <circle
              key={`b-${cx}-${cy}`}
              cx={cx}
              cy={cy}
              r={r}
            />
          ))}
        </g>

        {/* 눈 */}
        <circle className="stamp-face" cx="42" cy="38" r="3" />
        <circle className="stamp-face" cx="58" cy="38" r="3" />

        {/* 입 */}
        <path
          className="stamp-face-line"
          d="M44 47c2.5 3 9.5 3 12 0"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export default CompletionStamp;
