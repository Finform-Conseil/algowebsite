import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  PortfolioHistoryPoint,
  ProfileStatistic,
} from '../../shared/types/domain.types.ts';
import { fmt } from '../../shared/lib/finance';
import { Card, Pct } from '../../shared/ui/UiAtoms';
import { C, F_BODY, F_DISPLAY, F_MONO } from '../../shared/theme/theme';

export function HomeToolbar({
  currency,
  currencies,
  onCurrencyChange,
}: {
  currency: string;
  currencies: string[];
  onCurrencyChange: (currency: string) => void;
}) {
  return (
    <div className="gsm-native-homeoverview-49d912b25">
      <div className="gsm-native-homeoverview-5c8abc3fd">
        <span
          className="gsm-native-homeoverview-d11fc4142"
          style={{ color: C.sub }}
        >
          Devise d'affichage du site
        </span>
        <select name="gsm-homeoverview-40" aria-label="Sélection homeoverview"
          value={currency}
          onChange={(event) =>
            onCurrencyChange(event.target.value)
          }
          className="gsm-native-homeoverview-2500a461a"
          style={{ borderColor: C.line }}
        >
          {currencies.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>

    </div>
  );
}

export function HomeAumCard({
  currency,
  total,
  weightedPerformance,
  profileStatistics,
}: {
  currency: string;
  total: number;
  weightedPerformance: number;
  profileStatistics: ProfileStatistic[];
}) {
  return (
    <Card className="gsm-native-homeoverview-94ec6fffb">
      <div
        className="gsm-native-homeoverview-c4ab238e8"
        style={{ color: C.sub, ...F_BODY }}
      >
        Encours total (éq. {currency})
      </div>

      <div className="gsm-native-homeoverview-edcde0613">
        <div
          className="gsm-native-homeoverview-5edfd0217"
          style={{ ...F_DISPLAY, color: C.ink }}
        >
          {fmt(Math.round(total))} {currency}
        </div>
        <span
          className="gsm-native-homeoverview-f6571dba5"
          style={{ color: C.sub, ...F_BODY }}
        >
          Global
        </span>
      </div>

      <div className="gsm-native-homeoverview-7a6b3d627">
        <Pct v={weightedPerformance} />
      </div>

      <div
        className="gsm-native-homeoverview-e50780cfd"
        style={{ borderTop: `1px solid ${C.line}` }}
      >
        {profileStatistics.map((stat) => (
          <div
            key={stat.profil}
            className="gsm-native-homeoverview-e874f9ea9"
            style={F_BODY}
          >
            <span style={{ color: C.sub }}>
              {stat.profil}
            </span>
            <span className="gsm-native-homeoverview-e141de698">
              <span
                className="gsm-native-homeoverview-7ff9fa26c"
                style={{ color: C.ink, ...F_MONO }}
              >
                {fmt(Math.round(stat.encoursProfil))}{' '}
                {currency}
              </span>
              <Pct v={stat.variationEncoursPonderee} />
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ManagedPortfoliosCard({
  portfolioCount,
  profileStatistics,
  selectedProfile,
  onSelectedProfileChange,
  riskProfiles,
  history,
  currentCount,
  growth,
}: {
  portfolioCount: number;
  profileStatistics: ProfileStatistic[];
  selectedProfile: string;
  onSelectedProfileChange: (profile: string) => void;
  riskProfiles: readonly string[];
  history: PortfolioHistoryPoint[];
  currentCount: number;
  growth: number;
}) {
  return (
    <Card className="gsm-native-homeoverview-94ec6fffb">
      <div
        className="gsm-native-homeoverview-c4ab238e8"
        style={{ color: C.sub, ...F_BODY }}
      >
        Portefeuilles gérés
      </div>

      <div className="gsm-native-homeoverview-edcde0613">
        <div
          className="gsm-native-homeoverview-5edfd0217"
          style={{ ...F_DISPLAY, color: C.ink }}
        >
          {portfolioCount}
        </div>
        <span
          className="gsm-native-homeoverview-f6571dba5"
          style={{ color: C.sub, ...F_BODY }}
        >
          Global
        </span>
      </div>

      <div
        className="gsm-native-homeoverview-e50780cfd"
        style={{ borderTop: `1px solid ${C.line}` }}
      >
        {profileStatistics.map((stat) => (
          <div
            key={stat.profil}
            className="gsm-native-homeoverview-d2f283906"
            style={F_BODY}
          >
            <span style={{ color: C.sub }}>
              {stat.profil}
            </span>
            <span
              className="gsm-native-homeoverview-9c2947fe6"
              style={{ color: C.ink, ...F_MONO }}
            >
              {stat.nombre}
            </span>
          </div>
        ))}
      </div>

      <div
        className="gsm-native-homeoverview-2a145c92e"
        style={{ borderTop: `1px solid ${C.line}` }}
      >
        <div className="gsm-native-homeoverview-db4eaa476">
          <span
            className="gsm-native-homeoverview-c0e876b78"
            style={{ color: C.sub, ...F_BODY }}
          >
            Historique trimestriel · 2 ans
          </span>

          <select name="gsm-homeoverview-214"
            value={selectedProfile}
            onChange={(event) =>
              onSelectedProfileChange(event.target.value)
            }
            className="gsm-native-homeoverview-2edc9cac9"
            style={{
              borderColor: C.line,
              color: C.ink,
              ...F_BODY,
            }}
            aria-label="Profil affiché dans l'historique des portefeuilles"
          >
            <option>Global</option>
            {riskProfiles.map((profile) => (
              <option key={profile}>{profile}</option>
            ))}
          </select>
        </div>

        <ResponsiveContainer width="100%" height={86}>
          <LineChart
            data={history}
            margin={{
              top: 5,
              right: 4,
              left: 4,
              bottom: 0,
            }}
          >
            <XAxis
              dataKey="trimestre"
              axisLine={false}
              tickLine={false}
              interval={1}
              tick={{ fontSize: 8, fill: C.sub }}
            />
            <YAxis hide domain={[0, 'dataMax + 1']} />
            <Tooltip
              formatter={(value) => [
                `${String(value)} portefeuille(s)`,
                selectedProfile,
              ]}
              contentStyle={{
                borderRadius: 9,
                border: `1px solid ${C.line}`,
                fontSize: 10,
              }}
            />
            <Line
              type="monotone"
              dataKey="nombre"
              stroke={C.indigo}
              strokeWidth={2.2}
              dot={{ r: 1.8 }}
              activeDot={{ r: 3 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>

        <div
          className="gsm-native-homeoverview-5a952877c"
          style={{ color: C.sub, ...F_BODY }}
        >
          <span>{selectedProfile}</span>
          <span style={F_MONO}>
            {currentCount} actuellement ·{' '}
            {growth >= 0 ? '+' : ''}
            {growth} sur 2 ans
          </span>
        </div>
      </div>

      <div
        className="gsm-native-homeoverview-24a51cd59"
        style={{ color: C.sub, ...F_BODY }}
      >
        3 marchés · 3 devises · 5 profils de risque
      </div>
    </Card>
  );
}
