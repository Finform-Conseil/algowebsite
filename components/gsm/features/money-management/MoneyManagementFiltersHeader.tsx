import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Breadcrumb } from '../../shared/ui/Navigation';
import { Badge, Card } from '../../shared/ui/UiAtoms';
import { C, F_BODY, F_DISPLAY, F_MONO } from '../../shared/theme/theme';

export interface MoneyAmountFilter {
  key: string;
  label: string;
  value: string;
  setter: (value: string) => void;
}

export function MoneyManagementFiltersHeader({
  currency,
  clientQuery,
  market,
  type,
  riskProfile,
  status,
  markets,
  types,
  riskProfiles,
  statuses,
  amountFilters,
  activeFilterCount,
  filteredPortfolioCount,
  onClientQueryChange,
  onMarketChange,
  onTypeChange,
  onRiskProfileChange,
  onStatusChange,
  onReset,
}: {
  currency: string;
  clientQuery: string;
  market: string;
  type: string;
  riskProfile: string;
  status: string;
  markets: string[];
  types: string[];
  riskProfiles: string[];
  statuses: string[];
  amountFilters: MoneyAmountFilter[];
  activeFilterCount: number;
  filteredPortfolioCount: number;
  onClientQueryChange: (value: string) => void;
  onMarketChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onRiskProfileChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onReset: () => void;
}) {
  return (
    <>
      <Breadcrumb items={['Accueil', 'Money Management']} />

      <div className="gsm-native-moneymanagementfiltersheader-f1658ae13">
        <div>
          <h2
            className="gsm-native-moneymanagementfiltersheader-0e253d6cf"
            style={{ ...F_DISPLAY, color: C.ink }}
          >
            Money Management — gestion consolidée de la liquidité
          </h2>
          <div
            className="gsm-native-moneymanagementfiltersheader-15d6a49eb"
            style={{ color: C.sub, ...F_BODY }}
          >
            Pilotage des disponibilités de tous les portefeuilles, suivi des
            écarts à la cible, anticipation des encaissements et règlements, et
            identification des excédents ou besoins de trésorerie. Les montants
            consolidés sont convertis dans la devise principale choisie sur
            l'accueil.
          </div>
        </div>
        <Badge tone="navy">Devise principale : {currency}</Badge>
      </div>

      <Card className="gsm-native-moneymanagementfiltersheader-c80053cbe" style={{ borderColor: C.navy }}>
        <div className="gsm-native-moneymanagementfiltersheader-4754a239c">
          <FilterField label="Client">
            <div
              className="gsm-native-moneymanagementfiltersheader-7947a5ef4"
              style={{ borderColor: C.line }}
            >
              <Search size={14} color={C.sub} aria-hidden="true" />
              <input aria-label="Rechercher…"
                value={clientQuery}
                onChange={(event) => onClientQueryChange(event.target.value)}
                placeholder="Rechercher…"
                className="gsm-native-moneymanagementfiltersheader-a591d251e"
                style={F_BODY}
                type="search"
                name="money-management-client-search"
              />
            </div>
          </FilterField>

          <SelectFilter
            label="Marché"
            value={market}
            options={markets}
            onChange={onMarketChange}
          />
          <SelectFilter
            label="Type de portefeuille"
            value={type}
            options={types}
            onChange={onTypeChange}
          />
          <SelectFilter
            label="Profil de risque"
            value={riskProfile}
            options={riskProfiles}
            onChange={onRiskProfileChange}
          />
          <SelectFilter
            label="Statut liquidité"
            value={status}
            options={statuses}
            onChange={onStatusChange}
          />
        </div>

        <div
          className="gsm-native-moneymanagementfiltersheader-2dd22ea8f"
          style={{ borderTop: `1px solid ${C.line}` }}
        >
          <div className="gsm-native-moneymanagementfiltersheader-e514ad77f">
            <div>
              <div
                className="gsm-native-moneymanagementfiltersheader-7b1cb8564"
                style={{ color: C.ink, ...F_BODY }}
              >
                Seuils financiers
              </div>
              <div className="gsm-native-moneymanagementfiltersheader-db3562bb2" style={{ color: C.sub }}>
                Tous les seuils sont comparés après conversion dans la devise
                principale de vue : {currency}.
              </div>
            </div>
            <Badge tone="navy">Seuils en {currency}</Badge>
          </div>

          <div className="gsm-native-moneymanagementfiltersheader-4754a239c">
            {amountFilters.map((filter) => (
              <FilterField key={filter.key} label={filter.label}>
                <div
                  className="gsm-native-moneymanagementfiltersheader-16896b440"
                  style={{ borderColor: C.line, background: C.surfaceCard }}
                >
                  <input name="gsm-moneymanagementfiltersheader-154" aria-label="Aucun minimum"
                    type="number"
                    min="0"
                    step="1"
                    value={filter.value}
                    onChange={(event) => filter.setter(event.target.value)}
                    placeholder="Aucun minimum"
                    className="gsm-native-moneymanagementfiltersheader-95d130c39"
                    style={F_MONO}
                  />
                  <span
                    className="gsm-native-moneymanagementfiltersheader-a5b1053ca"
                    style={{
                      color: C.sub,
                      borderColor: C.line,
                      background: C.surfaceElevated,
                      ...F_MONO,
                    }}
                  >
                    {currency}
                  </span>
                </div>
              </FilterField>
            ))}
          </div>
        </div>

        <div className="gsm-native-moneymanagementfiltersheader-e808d6d89">
          <div className="gsm-native-moneymanagementfiltersheader-1486c1681" style={{ color: C.sub }}>
            Les mêmes filtres pilotent les positions, les flux, les répartitions
            et les actions de liquidité.
          </div>
          <div className="gsm-native-moneymanagementfiltersheader-37ad9fd72">
            <Badge tone={activeFilterCount > 0 ? 'teal' : 'slate'}>
              {activeFilterCount} filtre(s) actif(s)
            </Badge>
            <Badge tone="gold">
              {filteredPortfolioCount} portefeuille(s)
            </Badge>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={onReset}
                className="gsm-native-moneymanagementfiltersheader-e76886054"
                style={{ borderColor: C.line, color: C.navy }}
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      </Card>
    </>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        className="gsm-native-moneymanagementfiltersheader-fab02dfde"
        style={{ color: C.sub }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <FilterField label={label}>
      <select name="gsm-moneymanagementfiltersheader-243" aria-label="Sélection moneymanagementfiltersheader"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="gsm-native-moneymanagementfiltersheader-f48e58cbe"
        style={{ borderColor: C.line }}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </FilterField>
  );
}
