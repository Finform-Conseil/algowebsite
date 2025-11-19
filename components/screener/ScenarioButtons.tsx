'use client';

import { PREDEFINED_SCENARIOS } from '@/core/data/StockScreenerV2';

interface ScenarioButtonsProps {
  onSelectScenario: (scenarioId: string) => void;
}

export default function ScenarioButtons({ onSelectScenario }: ScenarioButtonsProps) {
  return (
    <div className="scenario-buttons">
      <div className="scenario-buttons__label">Scénarios prédéfinis :</div>
      <div className="scenario-buttons__list">
        {PREDEFINED_SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            className="scenario-btn"
            onClick={() => onSelectScenario(scenario.id)}
            title={scenario.description}
          >
            <span className="scenario-btn__name">{scenario.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
