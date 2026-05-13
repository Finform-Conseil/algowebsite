'use client';

import { ActiveFilter } from '@/core/data/StockScreenerFilters';
import FilterChip from './FilterChip';
import MultiSelect from '../corporate-events/MultiSelect';
import { PREDEFINED_SCENARIOS } from '@/core/data/StockScreenerV2';

interface FilterBarProps {
  activeFilters: ActiveFilter[];
  onRemoveFilter: (filterId: string) => void;
  onEditFilter: (filterId: string) => void;
  onAddFilter: () => void;
  bourses: string[];
  onBoursesChange: (bourses: string[]) => void;
  onSelectScenario: (scenarioId: string) => void;
}

export default function FilterBar({
  activeFilters,
  onRemoveFilter,
  onEditFilter,
  onAddFilter,
  bourses,
  onBoursesChange,
  onSelectScenario,
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      <MultiSelect
        options={["BRVM", "JSE", "NGX", "NSE", "CSE", "GSE"].map((m) => ({
          value: m,
          label: m,
        }))}
        selected={bourses}
        onChange={onBoursesChange}
        placeholder="All exchanges"
      />
      
      <div className="scenario-select">
        <select 
          onChange={(e) => {
            if (e.target.value) {
              onSelectScenario(e.target.value);
              e.target.value = ''; // Reset après sélection
            }
          }}
          defaultValue=""
        >
          <option value="" disabled>Select a scenario...</option>
          {PREDEFINED_SCENARIOS.map((scenario) => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.name}
            </option>
          ))}
        </select>
      </div>

      <button className="filter-bar__add-btn" onClick={onAddFilter}>
        <span className="icon">+</span>
        Add Filter
      </button>

      <div className="filter-bar__chips">
        {activeFilters.length === 0 && (
          <span className="filter-bar__empty">
            No active filters. Click "Add Filter" to get started.
          </span>
        )}
        {activeFilters.map((filter) => (
          <FilterChip
            key={filter.id}
            filter={filter}
            onRemove={() => onRemoveFilter(filter.id)}
            onEdit={() => onEditFilter(filter.id)}
          />
        ))}
      </div>
    </div>
  );
}
