import { useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import { fmt, fmtPrice } from '../../shared/lib/finance';
import { Breadcrumb } from '../../shared/ui/Navigation';
import { Badge, Card, Eyebrow, Pct, Td, Th } from '../../shared/ui/UiAtoms';
import { C, F_DISPLAY, F_MONO } from '../../shared/theme/theme';

export interface MarketInstrument {
  nom: string;
  type: string;
  marche: string;
  devise: string;
  cours: number;
  variation: number;
  volumeJour: number;
  coursMin: number;
  coursMax: number;
}
export interface BondMarketMeta {
  emetteur?: string;
  coupon?: number;
  rendement?: number;
  echeance?: string;
  duration?: number;
}
interface Props {
  markets: MarketInstrument[];
  bondMeta: Record<string, BondMarketMeta>;
  watchlistTitles: string[];
  onAddWatch: (title: string) => void;
  onOpenDepth: (context: { marche: string; instrument: string; source: 'obligations' }) => void;
}
interface Filters {
  recherche: string;
  volumeMin: string;
  variationMin: string;
  variationMax: string;
  coursMin: string;
  coursMax: string;
  statutWatchlist: string;
}
const EMPTY_FILTERS: Filters = {
  recherche: '', volumeMin: '', variationMin: '', variationMax: '',
  coursMin: '', coursMax: '', statutWatchlist: 'Tous',
};
const MARKET_CODES = ['Tous', 'BRVM', 'NGX', 'GSE'] as const;
const WATCHLIST_STATUSES = ['Tous', 'Ajoutés', 'Non ajoutés'] as const;

export function MarchesObligataires({
  markets, bondMeta, watchlistTitles, onAddWatch, onOpenDepth,
}: Props) {
  const [marche, setMarche] = useState<(typeof MARKET_CODES)[number]>('Tous');
  const [showMarketFilters, setShowMarketFilters] = useState(true);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const obligations = useMemo(
    () => markets.filter((item) =>
      item.type === 'Obligation' && (marche === 'Tous' || item.marche === marche)
    ),
    [markets, marche]
  );
  const rows = useMemo(() => obligations.filter((item) => {
    const volumeMin = filters.volumeMin === '' ? null : Number(filters.volumeMin);
    const variationMin = filters.variationMin === '' ? null : Number(filters.variationMin);
    const variationMax = filters.variationMax === '' ? null : Number(filters.variationMax);
    const coursMin = filters.coursMin === '' ? null : Number(filters.coursMin);
    const coursMax = filters.coursMax === '' ? null : Number(filters.coursMax);
    const suivi = watchlistTitles.includes(item.nom);
    return (
      item.nom.toLowerCase().includes(filters.recherche.trim().toLowerCase()) &&
      (volumeMin === null || item.volumeJour >= volumeMin) &&
      (variationMin === null || item.variation >= variationMin) &&
      (variationMax === null || item.variation <= variationMax) &&
      (coursMin === null || item.cours >= coursMin) &&
      (coursMax === null || item.cours <= coursMax) &&
      (filters.statutWatchlist === 'Tous' ||
        (filters.statutWatchlist === 'Ajoutés' && suivi) ||
        (filters.statutWatchlist === 'Non ajoutés' && !suivi))
    );
  }), [filters, obligations, watchlistTitles]);

  const filtresActifs =
    Number(Boolean(filters.recherche.trim())) +
    Number(filters.volumeMin !== '') +
    Number(filters.variationMin !== '') +
    Number(filters.variationMax !== '') +
    Number(filters.coursMin !== '') +
    Number(filters.coursMax !== '') +
    Number(filters.statutWatchlist !== 'Tous');

  const updateFilter = (key: keyof Filters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));

  return (
    <div className="gsm-native-marchesobligataires-bffb221f8">
      <Breadcrumb items={['Accueil', 'Marchés Obligataire']} />
      <div className="gsm-native-marchesobligataires-687426021">
        <div>
          <Eyebrow>Fixed Income · marché secondaire</Eyebrow>
          <h2 className="gsm-native-marchesobligataires-863d0f492" style={{ ...F_DISPLAY, color: C.ink }}>
            Marchés Obligataire
          </h2>
        </div>
        <Badge tone="gold">{rows.length} obligation(s)</Badge>
      </div>

      <div className="gsm-native-marchesobligataires-6cc0764af">
        <div className="gsm-chip-scroll">
          {MARKET_CODES.map((code) => (
            <button key={code} type="button" onClick={() => setMarche(code)}
              className="gsm-native-marchesobligataires-1d67a3c1d"
              style={{ background: marche === code ? C.activeBackground : C.surfaceInset, color: marche === code ? C.textPrimary : C.sub }}>
              {code}
            </button>
          ))}
        </div>
      </div>

      <Card className="gsm-native-marchesobligataires-484bacc8e" style={{ borderColor: C.navy }}>
        <div className="gsm-native-marchesobligataires-8dcf0c7f6" style={{ background: C.infoBackground }}>
          <div className="gsm-responsive-panel-header gsm-native-marchesobligataires-0b73ce637">
            <div>
              <div className="gsm-native-marchesobligataires-6c372a020" style={{ color: C.ink }}>
                Filtres obligataires — application instantanée
              </div>
              <div className="gsm-native-marchesobligataires-ec73b1fca" style={{ color: C.sub }}>
                Filtrez par instrument, volume, variation, niveau de cours et statut dans la watchlist.
              </div>
            </div>
            <div className="gsm-responsive-panel-actions gsm-native-marchesobligataires-ae8548f8a">
              <Badge tone={filtresActifs > 0 ? 'teal' : 'slate'}>{filtresActifs} filtre(s)</Badge>
              {filtresActifs > 0 && (
                <button type="button" onClick={() => setFilters(EMPTY_FILTERS)}
                  className="gsm-native-marchesobligataires-291deacb1"
                  style={{ borderColor: C.line, color: C.navy, background: C.surfaceCard }}>
                  Réinitialiser
                </button>
              )}
              <button type="button" onClick={() => setShowMarketFilters((visible) => !visible)}
                className="gsm-native-marchesobligataires-291deacb1"
                style={{ borderColor: C.line, color: C.navy, background: C.surfaceCard }}>
                {showMarketFilters ? 'Masquer les filtres ↑' : 'Afficher les filtres ↓'}
              </button>
            </div>
          </div>

          {showMarketFilters && (
            <div className="gsm-native-marchesobligataires-bce9841b7"
              style={{ borderColor: C.borderSubtle, background: C.surfaceCard }}>
              {[
                ['market-bond-search', 'Instrument', 'recherche', 'text', 'Rechercher une obligation…', undefined],
                ['market-volume-min', 'Volume minimum', 'volumeMin', 'number', 'Sans limite', '1'],
                ['market-variation-min', 'Variation min. (%)', 'variationMin', 'number', 'Sans limite', '0.1'],
                ['market-variation-max', 'Variation max. (%)', 'variationMax', 'number', 'Sans limite', '0.1'],
                ['market-price-min', 'Cours minimum', 'coursMin', 'number', 'Sans limite', '0.01'],
                ['market-price-max', 'Cours maximum', 'coursMax', 'number', 'Sans limite', '0.01'],
              ].map(([id, label, key, type, placeholder, step]) => (
                <div key={id}>
                  <label htmlFor={id} className="gsm-native-marchesobligataires-266a07645" style={{ color: C.sub }}>
                    {label}
                  </label>
                  <input aria-label="Champ marchesobligataires"
                    id={id}
                    name={id}
                    type={type}
                    min={type === 'number' ? '0' : undefined}
                    step={step}
                    value={filters[key as keyof Filters]}
                    onChange={(event) => updateFilter(key as keyof Filters, event.target.value)}
                    placeholder={placeholder}
                    className="gsm-native-marchesobligataires-eda39814c"
                    style={{ borderColor: C.line, ...(type === 'number' ? F_MONO : {}) }}
                  />
                </div>
              ))}
              <div>
                <label htmlFor="market-watchlist-status" className="gsm-native-marchesobligataires-266a07645" style={{ color: C.sub }}>
                  Statut watchlist
                </label>
                <select
                  id="market-watchlist-status"
                  name="market-watchlist-status"
                  value={filters.statutWatchlist}
                  onChange={(event) => updateFilter('statutWatchlist', event.target.value)}
                  className="gsm-native-marchesobligataires-eda39814c"
                  style={{ borderColor: C.line }}
                >
                  {WATCHLIST_STATUSES.map((value) => <option key={value}>{value}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="gsm-native-marchesobligataires-484bacc8e">
        <div className="gsm-table-scroll">
          <table className="gsm-table--banking gsm-native-marchesobligataires-64fe97ba3" style={{ minWidth: 1550 }}>
            <thead style={{ background: C.surfaceElevated }}>
              <tr>
                <Th>Instrument</Th><Th>Émetteur</Th><Th>Marché</Th><Th>Cours</Th>
                <Th>Coupon</Th><Th>Rendement indicatif</Th><Th>Échéance</Th>
                <Th>Duration</Th><Th>Volume</Th><Th>Var %</Th><Th>Plus bas</Th>
                <Th>Plus haut</Th><Th>Watchlist</Th><Th>Profondeur</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={14} className="gsm-native-marchesobligataires-39511c30b" style={{ color: C.sub }}>
                  Aucune obligation ne correspond aux filtres sélectionnés.
                </td></tr>
              )}
              {rows.map((item, index) => {
                const meta = bondMeta[item.nom] || {};
                const suivi = watchlistTitles.includes(item.nom);
                return (
                  <tr key={item.nom}
                    style={{ borderTop: `1px solid ${C.line}`, background: index % 2 ? C.rowAlternate : C.surfaceCard }}>
                    <Td className="gsm-native-marchesobligataires-f869fda3f">{item.nom}</Td>
                    <Td>{meta.emetteur || '—'}</Td>
                    <Td><Badge tone="navy">{item.marche}</Badge></Td>
                    <Td mono className="gsm-native-marchesobligataires-dc7c1d8e4">{fmtPrice(item.cours)} {item.devise}</Td>
                    <Td mono>{meta.coupon != null ? `${meta.coupon.toFixed(2)}%` : '—'}</Td>
                    <Td mono>{meta.rendement != null ? `${meta.rendement.toFixed(2)}%` : '—'}</Td>
                    <Td mono>{meta.echeance || '—'}</Td>
                    <Td mono>{meta.duration != null ? `${meta.duration.toFixed(1)} an(s)` : '—'}</Td>
                    <Td mono>{fmt(item.volumeJour)}</Td>
                    <Td><Pct v={item.variation} /></Td>
                    <Td mono>{fmtPrice(item.coursMin)}</Td>
                    <Td mono>{fmtPrice(item.coursMax)}</Td>
                    <Td>
                      <button type="button" disabled={suivi} onClick={() => !suivi && onAddWatch(item.nom)}
                        className="gsm-native-marchesobligataires-73f6a1e7a"
                        style={{ background: suivi ? C.positiveBackground : C.warningBackground, color: suivi ? C.teal : C.warningText, cursor: suivi ? 'default' : 'pointer' }}>
                        <Star size={13} fill={suivi ? 'currentColor' : 'none'} />
                        {suivi ? 'Ajouté' : 'Add Watch'}
                      </button>
                    </Td>
                    <Td>
                      <button type="button"
                        onClick={() => onOpenDepth({ marche: item.marche, instrument: item.nom, source: 'obligations' })}
                        className="gsm-native-marchesobligataires-c88b55bae" style={{ color: C.indigo }}>
                        Voir profondeur →
                      </button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
