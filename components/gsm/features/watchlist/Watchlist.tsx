import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Breadcrumb } from '../../shared/ui/Navigation';
import { Badge, Card, Eyebrow, Pct, Td, Th } from '../../shared/ui/UiAtoms';
import { C, F_BODY, F_DISPLAY, F_MONO } from '../../shared/theme/theme';
import {
  DEFAULT_WATCHLIST_DAILY_FILTERS,
  countWatchlistActiveFilters,
  filterWatchlistDailyRows,
  toneWatchlistSignalFondamental,
  toneWatchlistSignalJour,
  type WatchlistDailyFilters,
  type WatchlistDailyRow,
  type WatchlistStaticRow,
} from './WatchlistModel';

interface Props {
  watchlistTitles: string[];
  onRemoveWatch: (title: string) => void;
  onOpenDepth: (context: { marche: string; instrument: string }) => void;
  buildDailyRows: (dateKey: string) => WatchlistDailyRow[];
  buildStaticRow: (title: string) => WatchlistStaticRow | null;
}
type FilterKey = keyof WatchlistDailyFilters;

function SelectField({ id, label, value, values, onChange }: {
  id: string; label: string; value: string; values: string[]; onChange: (value: string) => void;
}) {
  return <div>
    <label htmlFor={id} className="gsm-native-watchlist-df0918186" style={{ color: C.sub }}>{label}</label>
    <select aria-label="Sélection watchlist" id={id} name={id} value={value} onChange={(e) => onChange(e.target.value)}
      className="gsm-native-watchlist-79c665d0b" style={{ borderColor: C.line }}>
      {values.map((item) => <option key={item} value={item}>{item}</option>)}
    </select>
  </div>;
}

function NumberField({ id, label, value, onChange, min, max, step, placeholder }: {
  id: string; label: string; value: string; onChange: (value: string) => void;
  min?: number; max?: number; step?: number; placeholder?: string;
}) {
  return <div>
    <label htmlFor={id} className="gsm-native-watchlist-df0918186" style={{ color: C.sub }}>{label}</label>
    <input aria-label="Champ watchlist" id={id} name={id} type="number" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="gsm-native-watchlist-79c665d0b" style={{ borderColor: C.line, ...F_MONO }} />
  </div>;
}

export function WatchlistScreen({
  watchlistTitles, onRemoveWatch, onOpenDepth, buildDailyRows, buildStaticRow,
}: Props) {
  const now = new Date();
  const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const dateLabel = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  }).format(now);
  const [filters, setFilters] = useState<WatchlistDailyFilters>(() => ({ ...DEFAULT_WATCHLIST_DAILY_FILTERS }));
  const [showFilters, setShowFilters] = useState(true);

  const dailyRows = useMemo(() => buildDailyRows(dateKey), [buildDailyRows, dateKey]);
  const staticRows = useMemo(
    () => watchlistTitles.map(buildStaticRow).filter((row): row is WatchlistStaticRow => row !== null),
    [buildStaticRow, watchlistTitles]
  );
  const rows = useMemo(() => filterWatchlistDailyRows(dailyRows, filters), [dailyRows, filters]);
  const options = useMemo(() => ({
    marches: ['Tous', ...new Set(dailyRows.map((r) => r.marche))],
    secteurs: ['Tous', ...new Set(dailyRows.map((r) => r.secteur))],
    macd: ['Tous', ...new Set(dailyRows.map((r) => r.technique.macd))],
    bol: ['Tous', ...new Set(dailyRows.map((r) => r.technique.bol))],
    tech: ['Tous', ...new Set(dailyRows.map((r) => r.technique.signal))],
    valo: ['Tous', ...new Set(dailyRows.map((r) => r.fondamentale.valo))],
    fund: ['Tous', ...new Set(dailyRows.map((r) => r.fondamentale.signal))],
  }), [dailyRows]);
  const update = (key: FilterKey, value: string) => setFilters((f) => ({ ...f, [key]: value }));
  const active = countWatchlistActiveFilters(filters);

  return <div className="gsm-native-watchlist-31d9bd1e4">
    <Breadcrumb items={['Accueil', 'Watchlist']} />
    <div>
      <h2 className="gsm-native-watchlist-122467929" style={{ ...F_DISPLAY, color: C.ink }}>
        Watchlist — sélection fondamentale &amp; technique
      </h2>
      <div className="gsm-native-watchlist-22e5c5be4" style={{ color: C.sub, ...F_BODY }}>
        Une liste stratégique alimentée depuis Marchés et une sélection journalière recalculée selon les signaux.
      </div>
    </div>

    <Card className="gsm-native-watchlist-540d7e273" style={{ borderColor: C.gold }}>
      <div className="gsm-native-watchlist-8c7b52513" style={{ background: C.warningBackground }}>
        <div>
          <Eyebrow>Watchlist statique — conviction fondamentale</Eyebrow>
          <div className="gsm-native-watchlist-8d07af180" style={{ color: C.ink }}>Valeurs suivies dans la durée</div>
        </div>
        <Badge tone="gold">{staticRows.length} valeur(s)</Badge>
      </div>
      <div className="gsm-table-scroll">
        <table className="gsm-table--banking gsm-native-watchlist-345024606" style={{ minWidth: 1450 }}>
          <thead style={{ background: C.surfaceElevated }}>
            <tr><Th>Instrument</Th><Th>Marché</Th><Th>Secteur</Th><Th>PER</Th><Th>Total return YTD</Th><Th>EVOL</Th><Th>Valorisation</Th><Th>Signal fondamental</Th><Th>Consulter</Th><Th>Supprimer</Th></tr>
          </thead>
          <tbody>
            {staticRows.length === 0 && <tr><td colSpan={10} className="gsm-native-watchlist-3e65665d1" style={{ color: C.sub }}>La watchlist statique est vide.</td></tr>}
            {staticRows.map((r, i) => <tr key={r.titre} style={{ borderTop: `1px solid ${C.line}`, background: i % 2 ? C.rowAlternate : C.surfaceCard }}>
              <Td className="gsm-native-watchlist-6223bac4a">{r.titre}</Td>
              <Td><Badge tone="navy">{r.marche}</Badge></Td><Td>{r.secteur}</Td>
              <Td mono>{r.fondamentale.per == null ? 'N/D' : `${r.fondamentale.per.toFixed(1)}x`}</Td>
              <Td mono>{r.fondamentale.rentabilite}</Td><Td mono>{r.fondamentale.evol}</Td><Td>{r.fondamentale.valo}</Td>
              <Td><Badge tone={toneWatchlistSignalFondamental(r.fondamentale.signal)}>{r.fondamentale.signal}</Badge></Td>
              <Td><button type="button" onClick={() => onOpenDepth({ marche: r.marche, instrument: r.titre })} className="gsm-native-watchlist-fb05f5144" style={{ color: C.navy }}>Voir le marché →</button></Td>
              <Td><button type="button" onClick={() => onRemoveWatch(r.titre)} aria-label={`Supprimer ${r.titre} de la watchlist`}
                className="gsm-native-watchlist-d100b53f5" style={{ background: C.negativeBackground, color: C.coral }}><X size={13} /> Retirer</button></Td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </Card>

    <div className="gsm-native-watchlist-4eb245255">
      <Card className="gsm-native-watchlist-540d7e273" style={{ borderColor: C.navy }}>
        <div className="gsm-native-watchlist-be2aa40ce" style={{ background: C.infoBackground }}>
          <div className="gsm-native-watchlist-ec3d06104">
            <div>
              <Eyebrow>Watchlist journalière — signaux de marché</Eyebrow>
              <div className="gsm-native-watchlist-8d07af180" style={{ color: C.ink }}>Classement du {dateLabel}</div>
              <div className="gsm-native-watchlist-22e5c5be4" style={{ color: C.sub }}>
                Classement automatique des titres accessibles sur vos marchés. Les filtres s'appliquent instantanément.
              </div>
            </div>
            <div className="gsm-native-watchlist-446a52ece">
              <Badge tone="navy">Actualisation quotidienne</Badge>
              <Badge tone="gold">{rows.length} valeur(s)</Badge>
              <Badge tone={active > 0 ? 'teal' : 'slate'}>{active} filtre(s) actif(s)</Badge>
              <button type="button" onClick={() => setShowFilters((v) => !v)} className="gsm-native-watchlist-77c769c54" style={{ borderColor: C.line, color: C.navy, background: C.surfaceCard }}>
                {showFilters ? 'Masquer les filtres ↑' : 'Afficher les filtres ↓'}
              </button>
            </div>
          </div>

          {showFilters && <div className="gsm-native-watchlist-86f097a42" style={{ borderColor: C.borderSubtle, background: C.surfaceCard }}>
            <div className="gsm-native-watchlist-7c45d2272">
              <div>
                <div className="gsm-native-watchlist-fb05f5144" style={{ color: C.ink }}>Filtres automatiques — application instantanée</div>
                <div className="gsm-native-watchlist-040aa3213" style={{ color: C.sub }}>Technique, fondamentale, marché et secteur.</div>
              </div>
              <button type="button" onClick={() => setFilters({ ...DEFAULT_WATCHLIST_DAILY_FILTERS })} className="gsm-native-watchlist-15546f4b7" style={{ borderColor: C.line, color: C.navy, background: C.surfaceCard }}>Réinitialiser les filtres</button>
            </div>
            <div className="gsm-native-watchlist-c839bfe64">
              <SelectField id="watch-market" label="Bourse" value={filters.marche} values={options.marches} onChange={(v) => update('marche', v)} />
              <SelectField id="watch-sector" label="Secteur" value={filters.secteur} values={options.secteurs} onChange={(v) => update('secteur', v)} />
              <SelectField id="watch-mm" label="MM" value={filters.mm} values={['Tous','Haussière','Neutre','Baissière']} onChange={(v) => update('mm', v)} />
              <SelectField id="watch-macd" label="MACD" value={filters.macd} values={options.macd} onChange={(v) => update('macd', v)} />
              <SelectField id="watch-bol" label="BOL" value={filters.bol} values={options.bol} onChange={(v) => update('bol', v)} />
              <NumberField id="watch-rsi-min" label="RSI minimum" value={filters.rsiMin} min={0} max={100} onChange={(v) => update('rsiMin', v)} />
              <NumberField id="watch-rsi-max" label="RSI maximum" value={filters.rsiMax} min={0} max={100} onChange={(v) => update('rsiMax', v)} />
              <SelectField id="watch-tech" label="Signal technique" value={filters.signalTechnique} values={options.tech} onChange={(v) => update('signalTechnique', v)} />
              <NumberField id="watch-per" label="PER maximum" value={filters.perMax} min={0} step={0.1} placeholder="Sans limite" onChange={(v) => update('perMax', v)} />
              <NumberField id="watch-profit" label="Rentabilité min. (%)" value={filters.rentabiliteMin} step={0.1} placeholder="Sans limite" onChange={(v) => update('rentabiliteMin', v)} />
              <NumberField id="watch-growth" label="EVOL minimum (%)" value={filters.evolMin} step={0.1} placeholder="Sans limite" onChange={(v) => update('evolMin', v)} />
              <SelectField id="watch-valuation" label="Valorisation" value={filters.valorisation} values={options.valo} onChange={(v) => update('valorisation', v)} />
              <SelectField id="watch-fund" label="Signal fondamental" value={filters.signalFondamental} values={options.fund} onChange={(v) => update('signalFondamental', v)} />
            </div>
          </div>}
        </div>
      </Card>

      <Card className="gsm-native-watchlist-540d7e273" style={{ borderColor: C.line }}>
        <div className="gsm-native-watchlist-96bcd704a" style={{ background: C.surfaceElevated, borderBottom: `1px solid ${C.borderSubtle}` }}>
          <div>
            <div className="gsm-native-watchlist-8d07af180" style={{ color: C.ink }}>Résultats du classement</div>
            <div className="gsm-native-watchlist-22e5c5be4" style={{ color: C.sub }}>
              {rows.length} valeur(s) classée(s) selon les critères actifs.
            </div>
          </div>
          <Badge tone={active > 0 ? 'teal' : 'slate'}>{active} filtre(s)</Badge>
        </div>

        <div className="gsm-table-scroll">
          <table className="gsm-table--banking gsm-native-watchlist-345024606" style={{ minWidth: 2200 }}>
            <thead style={{ background: C.surfaceElevated }}>
              <tr><Th>Rang</Th><Th>Instrument</Th><Th>Marché</Th><Th>Secteur</Th><Th>Cours</Th><Th>Variation jour</Th><Th>MM</Th><Th>MACD</Th><Th>RSI</Th><Th>BOL</Th><Th>Score technique</Th><Th>PER</Th><Th>Rentabilité</Th><Th>EVOL</Th><Th>VALO</Th><Th>Signal fondamental</Th><Th>Score fondamental</Th><Th>Score combiné</Th><Th>Signal du jour</Th><Th>Actions</Th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={20} className="gsm-native-watchlist-3e65665d1" style={{ color: C.sub }}>Aucune valeur ne satisfait l'ensemble des filtres automatiques.</td></tr>}
              {rows.map((r, i) => <tr key={r.titre} style={{ borderTop: `1px solid ${C.line}`, background: i % 2 ? C.rowAlternate : C.surfaceCard }}>
                <Td mono><span className="gsm-native-watchlist-dc9dad1a9" style={{ color: C.gold }}>#{i + 1}</span></Td><Td className="gsm-native-watchlist-28d6f10b9">{r.titre}</Td>
                <Td><Badge tone="navy">{r.marche}</Badge></Td><Td>{r.secteur}</Td><Td mono>{r.cours} {r.devise}</Td><Td><Pct v={r.variationJour} /></Td>
                <Td mono>{r.technique.mm}</Td><Td>{r.technique.macd}</Td><Td mono>{r.technique.rsi}</Td><Td>{r.technique.bol}</Td><Td mono>{r.scoreTechnique}/100</Td>
                <Td mono>{r.fondamentale.per == null ? 'N/D' : `${r.fondamentale.per.toFixed(1)}x`}</Td><Td mono>{r.fondamentale.rentabilite}</Td><Td mono>{r.fondamentale.evol}</Td><Td>{r.fondamentale.valo}</Td>
                <Td><Badge tone={toneWatchlistSignalFondamental(r.fondamentale.signal)}>{r.fondamentale.signal}</Badge></Td><Td mono>{r.scoreFondamental}/100</Td>
                <Td><Badge tone={r.scoreCombine >= 78 ? 'teal' : r.scoreCombine >= 63 ? 'gold' : r.scoreCombine < 48 ? 'coral' : 'slate'}>{r.scoreCombine}/100</Badge></Td>
                <Td><Badge tone={toneWatchlistSignalJour(r.signalJour)}>{r.signalJour}</Badge></Td>
                <Td><button type="button" onClick={() => onOpenDepth({ marche: r.marche, instrument: r.titre })} className="gsm-native-watchlist-fb05f5144" style={{ color: C.navy }}>Analyser →</button></Td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  </div>;
}
