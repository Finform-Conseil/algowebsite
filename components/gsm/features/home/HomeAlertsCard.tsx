import { ChevronRight } from 'lucide-react';
import { Badge, Card } from '../../shared/ui/UiAtoms';
import { C, F_BODY, F_DISPLAY } from '../../shared/theme/theme';

type BadgeTone =
  | 'slate'
  | 'gold'
  | 'teal'
  | 'coral'
  | 'navy';

export interface AlertStatistic {
  type: string;
  nombre: number;
}

export interface WithdrawalStatusStatistic {
  statut: string;
  nombre: number;
}

export function HomeAlertsCard({
  totalAlerts,
  alertStatistics,
  totalActiveWithdrawals,
  withdrawalStatistics,
  onOpenAlerts,
  onOpenWithdrawals,
  onOpenAvailableWithdrawals,
  statusTone,
}: {
  totalAlerts: number;
  alertStatistics: AlertStatistic[];
  totalActiveWithdrawals: number;
  withdrawalStatistics: WithdrawalStatusStatistic[];
  onOpenAlerts: () => void;
  onOpenWithdrawals: () => void;
  onOpenAvailableWithdrawals: () => void;
  statusTone: (status: string) => BadgeTone;
}) {
  return (
    <Card className="gsm-home-alerts">
      <div className="gsm-home-alerts__heading">
        <div
          className="gsm-home-alerts__label"
          style={{ color: C.sub, ...F_BODY }}
        >
          Alertes actives
        </div>
        <button
          type="button"
          onClick={onOpenAlerts}
          className="gsm-home-alerts__view-alerts"
          style={{ color: C.coral }}
        >
          Voir →
        </button>
      </div>

      <div className="gsm-home-alerts__total-line">
        <div
          className="gsm-home-alerts__total"
          style={{ ...F_DISPLAY, color: C.ink }}
        >
          {totalAlerts}
        </div>
        <span
          className="gsm-home-alerts__total-caption"
          style={{ color: C.sub, ...F_BODY }}
        >
          Total
        </span>
      </div>

      <div
        className="gsm-home-alerts__alert-stats"
        style={{ borderTop: `1px solid ${C.line}` }}
      >
        {alertStatistics.map((stat) => (
          <div
            key={stat.type}
            className="gsm-home-alerts__stat-row"
            style={F_BODY}
          >
            <span style={{ color: C.sub }}>
              {stat.type}
            </span>
            <Badge
              tone={
                stat.type === 'Risque'
                  ? 'coral'
                  : stat.type === 'Rendement'
                  ? 'gold'
                  : 'navy'
              }
            >
              {stat.nombre}
            </Badge>
          </div>
        ))}
      </div>

      <div
        className="gsm-home-alerts__withdrawals"
        style={{ borderTop: `1px solid ${C.line}` }}
      >
        <div className="gsm-home-alerts__withdrawal-heading">
          <div>
            <div
              className="gsm-home-alerts__withdrawal-label"
              style={{ color: C.sub }}
            >
              État cession-retrait
            </div>
            <div
              className="gsm-home-alerts__withdrawal-caption"
              style={{ color: C.sub }}
            >
              {totalActiveWithdrawals} dossier(s) en traitement
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenWithdrawals}
            className="gsm-home-alerts__view-withdrawals"
            style={{ color: C.indigo }}
          >
            Voir →
          </button>
        </div>

        <div className="gsm-home-alerts__withdrawal-list">
          {withdrawalStatistics.map((stat) =>
            stat.statut === 'Retrait disponible' ? (
              <button
                type="button"
                key={stat.statut}
                disabled={stat.nombre === 0}
                onClick={onOpenAvailableWithdrawals}
                className="gsm-home-alerts__available-withdrawal"
                style={{
                  background:
                    stat.nombre > 0
                      ? C.positiveBackground
                      : 'transparent',
                  cursor:
                    stat.nombre > 0
                      ? 'pointer'
                      : 'default',
                  opacity: stat.nombre > 0 ? 1 : 0.6,
                }}
                title={
                  stat.nombre > 0
                    ? 'Voir les retraits disponibles'
                    : 'Aucun retrait disponible'
                }
              >
                <span
                  className="gsm-home-alerts__available-label"
                  style={{
                    color:
                      stat.nombre > 0
                        ? C.teal
                        : C.sub,
                  }}
                >
                  {stat.statut}
                  {stat.nombre > 0 && (
                    <ChevronRight size={12} />
                  )}
                </span>
                <Badge tone={statusTone(stat.statut)}>
                  {stat.nombre}
                </Badge>
              </button>
            ) : (
              <div
                key={stat.statut}
                className="gsm-home-alerts__withdrawal-row"
              >
                <span style={{ color: C.sub }}>
                  {stat.statut}
                </span>
                <Badge tone={statusTone(stat.statut)}>
                  {stat.nombre}
                </Badge>
              </div>
            )
          )}
        </div>
      </div>
    </Card>
  );
}
