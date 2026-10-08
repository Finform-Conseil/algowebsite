import type { ProfileStatistic } from '../../shared/types/domain.types.ts';
import { Card, Pct } from '../../shared/ui/UiAtoms';
import { C, F_BODY, F_DISPLAY } from '../../shared/theme/theme';

export function HomeReturnCard({
  currency,
  weightedReturn,
  profileStatistics,
}: {
  currency: string;
  weightedReturn: number;
  profileStatistics: ProfileStatistic[];
}) {
  return (
    <Card className="gsm-home-return">
      <div
        className="gsm-home-return__label"
        style={{ color: C.sub, ...F_BODY }}
      >
        Rentabilité moyenne pondérée (1 an)
      </div>

      <div className="gsm-home-return__total-row">
        <div className="gsm-home-return__total" style={F_DISPLAY}>
          <Pct v={weightedReturn} />
        </div>
        <span
          className="gsm-home-return__caption"
          style={{ color: C.sub, ...F_BODY }}
        >
          Global
        </span>
      </div>

      <div
        className="gsm-home-return__profiles"
        style={{ borderTop: `1px solid ${C.line}` }}
      >
        {profileStatistics.map((stat) => (
          <div
            key={stat.profil}
            className="gsm-home-return__profile"
            style={F_BODY}
          >
            <span style={{ color: C.sub }}>
              {stat.profil}
            </span>
            <span>
              <Pct v={stat.rendementPondere} />
            </span>
          </div>
        ))}
      </div>

      <div
        className="gsm-home-return__note"
        style={{ color: C.sub, ...F_BODY }}
      >
        Pondération par les encours convertis en {currency}
      </div>
    </Card>
  );
}
