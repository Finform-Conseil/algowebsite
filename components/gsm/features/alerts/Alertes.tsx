import { useState } from 'react';
import { Badge, Card, Td, Th } from '../../shared/ui/UiAtoms';
import { Breadcrumb } from '../../shared/ui/Navigation';
import { C, F_BODY, F_DISPLAY } from '../../shared/theme/theme';

interface AlertRow {
  client: string;
  type: string;
  actif: string;
  ecart: string;
  marche: string;
  severite: string;
  depuis: string;
}

interface Props {
  alerts: AlertRow[];
  onRebalance: (context: { client: string; actif: string }) => void;
}

const toneType = (type: string) => {
  if (type === 'Allocation') return 'navy' as const;
  if (type === 'Rendement') return 'gold' as const;
  if (type === 'Risque') return 'coral' as const;
  return 'slate' as const;
};

export function AlertesScreen({ alerts, onRebalance }: Props) {
  const [filtreType, setFiltreType] = useState('Tous');
  const typesDisponibles = ['Tous', ...new Set(alerts.map((alert) => alert.type))];
  const alertesFiltrees = alerts.filter(
    (alert) => filtreType === 'Tous' || alert.type === filtreType
  );

  return (
    <div className="gsm-alerts">
      <Breadcrumb items={['Accueil', 'Alertes']} />

      <div className="gsm-alerts__header">
        <div>
          <h2 className="gsm-alerts__title" style={{ ...F_DISPLAY, color: C.ink }}>
            Alertes de seuil — allocation, rendement &amp; risque
          </h2>
          <div className="gsm-alerts__description" style={{ color: C.sub, ...F_BODY }}>
            Filtrez les alertes suivant leur type pour cibler les contrôles à traiter.
          </div>
        </div>

        <div className="gsm-alerts__filters">
          <div>
            <label htmlFor="alerts-type-filter" className="gsm-alerts__filter-label" style={{ color: C.sub }}>
              Type d'alerte
            </label>
            <select
              id="alerts-type-filter"
              name="alerts-type-filter"
              value={filtreType}
              onChange={(event) => setFiltreType(event.target.value)}
              className="gsm-alerts__select"
              style={{ borderColor: C.line, background: C.surfaceCard, ...F_BODY }}
            >
              {typesDisponibles.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <Badge tone="gold">{alertesFiltrees.length} alerte(s)</Badge>
          {filtreType !== 'Tous' && (
            <button
              type="button"
              onClick={() => setFiltreType('Tous')}
              className="gsm-alerts__reset"
              style={{ borderColor: C.line, color: C.navy, background: C.surfaceCard }}
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      <Card className="gsm-alerts__table-card">
        <table className="gsm-alerts__table">
          <thead style={{ background: C.surfaceElevated }}>
            <tr>
              <Th>Client</Th><Th>Type</Th><Th>Actif</Th><Th>Écart</Th><Th>Marché</Th><Th>Sévérité</Th><Th>Depuis</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {alertesFiltrees.length === 0 && (
              <tr>
                <td colSpan={8} className="gsm-alerts__empty" style={{ color: C.sub, ...F_BODY }}>
                  Aucune alerte ne correspond au type sélectionné.
                </td>
              </tr>
            )}

            {alertesFiltrees.map((alert, index) => (
              <tr
                key={`${alert.client}-${alert.type}-${alert.actif}-${index}`}
                style={{
                  borderTop: `1px solid ${C.line}`,
                  background: index % 2 ? C.rowAlternate : C.surfaceCard,
                }}
              >
                <Td className="gsm-alerts__client">{alert.client}</Td>
                <Td><Badge tone={toneType(alert.type)}>{alert.type}</Badge></Td>
                <Td>{alert.actif}</Td>
                <Td>{alert.ecart}</Td>
                <Td><Badge tone="navy">{alert.marche}</Badge></Td>
                <Td>
                  <Badge tone={alert.severite === 'Haute' ? 'coral' : alert.severite === 'Moyenne' ? 'gold' : 'slate'}>
                    {alert.severite}
                  </Badge>
                </Td>
                <Td>{alert.depuis}</Td>
                <Td>
                  <button
                    type="button"
                    onClick={() => onRebalance({ client: alert.client, actif: alert.actif })}
                    className="gsm-alerts__action"
                    style={{ color: C.navy }}
                  >
                    Rééquilibrer →
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
