"use client";

import { useState } from "react";
import {
  PRIMARY_FILTER_FAMILIES,
  PrimaryFilterCriterion,
  PrimaryActiveFilter,
} from "@/core/data/PrimaryScreenerFilters";

interface PrimaryFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (criterion: PrimaryFilterCriterion, operator: string, value: string | number) => void;
}

const operatorsByType: Record<string, { value: string; label: string }[]> = {
  number: [
    { value: ">=", label: "≥ Greater than or equal" },
    { value: "<=", label: "≤ Less than or equal" },
    { value: ">", label: "> Greater than" },
    { value: "<", label: "< Less than" },
    { value: "=", label: "= Equal" },
  ],
  percentage: [
    { value: ">=", label: "≥ Greater than or equal" },
    { value: "<=", label: "≤ Less than or equal" },
    { value: ">", label: "> Greater than" },
    { value: "<", label: "< Less than" },
    { value: "=", label: "= Equal" },
  ],
  date: [
    { value: ">=", label: "≥ After or on" },
    { value: "<=", label: "≤ Before or on" },
    { value: ">", label: "> After" },
    { value: "<", label: "< Before" },
    { value: "=", label: "= Equal" },
  ],
  text: [
    { value: "contains", label: "Contains" },
    { value: "=", label: "= Equal" },
  ],
  boolean: [{ value: "=", label: "= Equal" }],
};

export default function PrimaryFilterPanel({ isOpen, onClose, onApply }: PrimaryFilterPanelProps) {
  const [expandedFamilyId, setExpandedFamilyId] = useState<string | null>(null);
  const [selectedCriterion, setSelectedCriterion] = useState<PrimaryFilterCriterion | null>(null);
  const [operator, setOperator] = useState<">=" | "<=" | ">" | "<" | "=" | "contains">(">=");
  const [value, setValue] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  if (!isOpen) return null;

  const filteredFamilies = PRIMARY_FILTER_FAMILIES.map((family) => {
    const filteredSubFamilies = family.subFamilies
      .map((subFamily) => ({
        ...subFamily,
        criteria: subFamily.criteria.filter((criterion) => {
          if (!searchQuery) return true;
          const query = searchQuery.toLowerCase();
          return (
            criterion.name.toLowerCase().includes(query) ||
            criterion.description.toLowerCase().includes(query) ||
            criterion.id.toLowerCase().includes(query)
          );
        }),
      }))
      .filter((subFamily) => subFamily.criteria.length > 0);
    return { ...family, subFamilies: filteredSubFamilies };
  }).filter((family) => family.subFamilies.length > 0);

  const handleSelectCriterion = (criterion: PrimaryFilterCriterion) => {
    setSelectedCriterion(criterion);
    const operators = operatorsByType[criterion.type] || operatorsByType.number;
    setOperator(operators[0].value as PrimaryActiveFilter["operator"]);
    setValue("");
  };

  const handleApply = () => {
    if (!selectedCriterion || value === "") return;

    let finalValue: string | number = value;
    if (selectedCriterion.type === "boolean") {
      finalValue = value === "true" ? "true" : "false";
    } else if (selectedCriterion.type === "number" || selectedCriterion.type === "percentage") {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) finalValue = parsed;
    }

    onApply(selectedCriterion, operator, finalValue);
    setSelectedCriterion(null);
    setValue("");
  };

  return (
    <>
      <div className="filter-modal-overlay" onClick={onClose} />
      <div className="filter-modal filter-modal--two-column">
        <div className="filter-modal__header">
          <div className="filter-modal__header-content">
            <h3>Add Filter Criterion</h3>
            <p className="filter-modal__subtitle">Select a metric to filter primary bonds</p>
          </div>
          <button className="filter-modal__close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="filter-modal__search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search for a criterion..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery("")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <div className="filter-modal__body">
          <div className="filter-modal__navigation">
            {filteredFamilies.length === 0 ? (
              <div className="config-empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <h4>No results found</h4>
                <p>Try adjusting your search query</p>
              </div>
            ) : (
              <div className="families-nav">
                {filteredFamilies.map((family) => {
                  const isExpanded = searchQuery ? true : expandedFamilyId === family.id;
                  return (
                    <div key={family.id} className="family-nav-item">
                      <button
                        className={`family-nav-item__header ${isExpanded ? "active" : ""}`}
                        onClick={() => setExpandedFamilyId(isExpanded ? null : family.id)}
                      >
                        <span className="family-name">{family.name}</span>
                        <svg
                          className={`chevron ${isExpanded ? "expanded" : ""}`}
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      {isExpanded && (
                        <div className="subfamilies-list">
                          {family.subFamilies.map((subFamily) => (
                            <div key={subFamily.id} className="subfamily-item">
                              <span className="subfamily-name">{subFamily.name}</span>
                              <div className="criteria-nav-list">
                                {subFamily.criteria.map((criterion) => (
                                  <button
                                    key={criterion.id}
                                    className={`criterion-nav-item ${selectedCriterion?.id === criterion.id ? "active" : ""}`}
                                    onClick={() => handleSelectCriterion(criterion)}
                                  >
                                    <span className="criterion-nav-name">{criterion.name}</span>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="filter-modal__config">
            {selectedCriterion ? (
              <>
                <div className="config-header">
                  <h4 className="config-title">{selectedCriterion.name}</h4>
                  <span className="config-badge">
                    {selectedCriterion.type === "percentage" ? "Percentage" : selectedCriterion.type}
                  </span>
                </div>

                <div className="config-description">
                  <div className="description-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                    <span>Description</span>
                  </div>
                  <p className="description-text">{selectedCriterion.description}</p>
                </div>

                <div className="config-form">
                  <div className="form-section">
                    <label className="form-label">Operator</label>
                    <select
                      className="config-form__operator"
                      value={operator}
                      onChange={(e) => setOperator(e.target.value as PrimaryActiveFilter["operator"])}
                    >
                      {(operatorsByType[selectedCriterion.type] || operatorsByType.number).map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-section">
                    <label className="form-label">Value</label>
                    <div className="config-form__value-group">
                      {selectedCriterion.type === "boolean" ? (
                        <select
                          className="config-form__input"
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                        >
                          <option value="">Select...</option>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      ) : (
                        <input
                          type={selectedCriterion.type === "date" ? "date" : "text"}
                          className="config-form__input"
                          placeholder={
                            selectedCriterion.min !== undefined && selectedCriterion.max !== undefined
                              ? `Range: ${selectedCriterion.min} - ${selectedCriterion.max}`
                              : "Enter value"
                          }
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                        />
                      )}
                      {selectedCriterion.type === "percentage" && <span className="unit-suffix">%</span>}
                      {selectedCriterion.unit && selectedCriterion.type !== "percentage" && (
                        <span className="unit-suffix">{selectedCriterion.unit}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setSelectedCriterion(null);
                        setValue("");
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn-primary config-form__apply"
                      onClick={handleApply}
                      disabled={!value}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Apply Filter
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="config-empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                </svg>
                <h4>Select a Filter</h4>
                <p>Choose a criterion from the left menu to configure your filter</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
