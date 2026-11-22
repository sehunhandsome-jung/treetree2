import { growthStages } from "../../utils/growthStages";

type GrowthJourneyProps = {
  currentStageIndex: number;
};

function GrowthJourney({
  currentStageIndex,
}: GrowthJourneyProps) {
  const currentStage = growthStages[currentStageIndex];

  return (
    <section
      className="garden-journey-card"
      aria-labelledby="garden-journey-title"
    >
      <div className="garden-section-heading">
        <h2 id="garden-journey-title">성장 과정</h2>
        <span>{currentStage.label} 단계</span>
      </div>

      <ol className="garden-stage-list">
        {growthStages.map((stage, index) => {
          const isCurrent = index === currentStageIndex;
          const isComplete = index < currentStageIndex;
          const stateClassName = isCurrent
            ? " current"
            : isComplete
              ? " complete"
              : "";

          return (
            <li
              className={`garden-stage-item${stateClassName}`}
              key={stage.label}
              aria-current={isCurrent ? "step" : undefined}
            >
              <span
                className="garden-stage-icon"
                aria-hidden="true"
              >
                {stage.icon}
              </span>
              <span className="garden-stage-label">
                {stage.label}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default GrowthJourney;
