import { useState } from 'react';
import { Search, Star } from 'lucide-react';
import { fmt, fmtPrice } from '../../shared/lib/finance';
import { Badge, Btn, Card, Eyebrow, Pct, Td, Th } from '../../shared/ui/UiAtoms';
import { C, F_BODY, F_DISPLAY, F_MONO } from '../../shared/theme/theme';
import { ClientBreadcrumb } from './ClientCommon';

export function createClientTradingScreens(dependencies) {
  const {
    BOND_MARKET_META,
    CLIENT_GESTION_LIBRE,
    CLIENT_TRADABLE_MARKETS,
    MARKETS_DATA,
    clientAvailableCash,
    clientMarket,
    clientReservedCash,
  } = dependencies;

  function ClientOrderTicket({
  goClient,
  onCreateOrder,
  orders,
  initialInstrument,
  initialMarket,
  source = 'vue-boursiere',
}) {
  const typeSource =
    source === 'obligations'
      ? 'Obligation'
      : source === 'vue-boursiere'
      ? 'Action'
      : null;

  const universTicket = CLIENT_TRADABLE_MARKETS.filter(
    (item) => !typeSource || item.type === typeSource
  );

  const instrumentDemande = clientMarket(initialInstrument, initialMarket);
  const instrumentInitial =
    instrumentDemande && (!typeSource || instrumentDemande.type === typeSource)
      ? instrumentDemande
      : universTicket[0] || CLIENT_TRADABLE_MARKETS[0];

  const [instrument, setInstrument] = useState(instrumentInitial?.nom || '');
  const marche =
    clientMarket(instrument, initialMarket) ||
    instrumentInitial ||
    CLIENT_TRADABLE_MARKETS[0];

  const portefeuillesEligibles = CLIENT_GESTION_LIBRE.portefeuilles.filter(
    (portefeuille) => portefeuille.marche === marche?.marche
  );

  const [portefeuilleId, setPortefeuilleId] = useState(
    portefeuillesEligibles[0]?.id || ''
  );
  const [sens, setSens] = useState('Achat');
  const [qte, setQte] = useState(100);
  const [typeOrdre, setTypeOrdre] = useState('Ordre limite');
  const [prixLimite, setPrixLimite] = useState(Number(marche?.cours || 0));
  const [message, setMessage] = useState('');

  const portefeuilleCourant =
    portefeuillesEligibles.find((p) => p.id === portefeuilleId) ||
    portefeuillesEligibles[0];

  const retourRoute =
    source === 'obligations' ? 'client-markets' : 'client-exchanges';
  const retourLabel =
    source === 'obligations' ? 'Marchés Obligataire' : 'Marchés Actions';

  const changerInstrument = (nom) => {
    const nouveauMarche = clientMarket(nom);
    setInstrument(nom);
    setPrixLimite(Number(nouveauMarche?.cours || 0));
    const premier = CLIENT_GESTION_LIBRE.portefeuilles.find(
      (portefeuille) => portefeuille.marche === nouveauMarche?.marche
    );
    setPortefeuilleId(premier?.id || '');
    setMessage('');
  };

  const prixEstime =
    typeOrdre === 'Ordre au marché'
      ? Number(marche?.cours || 0)
      : Number(prixLimite || 0);
  const montantEstime = Number(qte || 0) * prixEstime;
  const position =
    portefeuilleCourant?.lignes.find((ligne) => ligne.instrument === instrument)
      ?.qte || 0;
  const cashTotal = portefeuilleCourant?.compteEspeces || 0;
  const cashReserve = portefeuilleCourant
    ? clientReservedCash(portefeuilleCourant, orders)
    : 0;
  const cash = portefeuilleCourant
    ? clientAvailableCash(portefeuilleCourant, orders)
    : 0;
  const achatPossible = sens !== 'Achat' || montantEstime <= cash;
  const ventePossible = sens !== 'Vente' || Number(qte || 0) <= position;
  const ordreValide =
    Boolean(portefeuilleCourant) &&
    Number(qte) > 0 &&
    prixEstime > 0 &&
    achatPossible &&
    ventePossible;

  const envoyerOrdre = () => {
    if (!ordreValide) {
      setMessage(
        sens === 'Achat' && !achatPossible
          ? 'Liquidité insuffisante sur le compte espèces de cette SGI.'
          : sens === 'Vente' && !ventePossible
          ? 'Quantité à vendre supérieure à la position disponible.'
          : "Vérifiez les paramètres de l'ordre."
      );
      return;
    }
    onCreateOrder({
      portefeuilleId: portefeuilleCourant.id,
      instrument,
      marche: marche.marche,
      devise: marche.devise,
      sens,
      qte: Number(qte),
      typeOrdre,
      prix: prixEstime,
      statut: 'En attente',
    });
    goClient('client-orders');
  };

  if (!marche) {
    return (
      <Card className="gsm-native-clienttradingscreens-06ca2914b" style={{ color: C.sub }}>
        Instrument indisponible pour le passage d'ordre.
      </Card>
    );
  }

  return (
    <div className="gsm-native-clienttradingscreens-93b06aa35">
      <ClientBreadcrumb
        items={['Espace Client', retourLabel, "Ticket d'ordre", marche.nom]}
      />

      <div className="gsm-native-clienttradingscreens-1f2aa1799">
        <div>
          <Eyebrow>Passage d'ordre · Gestion libre</Eyebrow>
          <h2
            className="gsm-native-clienttradingscreens-8834ebed4"
            style={{ ...F_DISPLAY, color: C.ink }}
          >
            Ticket d'ordre
          </h2>
          <div className="gsm-native-clienttradingscreens-3cb2e5ffe" style={{ color: C.sub }}>
            Le ticket est ouvert depuis {retourLabel}. L'instrument et le marché
            sont présélectionnés ; choisissez la SGI / le portefeuille, le sens,
            la quantité et le type d'ordre avant envoi.
          </div>
        </div>
        <Btn tone="ghost" onClick={() => goClient(retourRoute)}>
          ← Retour à {retourLabel}
        </Btn>
      </div>

      <div className="gsm-native-clienttradingscreens-bcbf3d638">
        <Card className="gsm-native-clienttradingscreens-810205f50">
          <Eyebrow>Instrument sélectionné</Eyebrow>
          <div
            className="gsm-native-clienttradingscreens-265434914"
            style={{ ...F_DISPLAY, color: C.ink }}
          >
            {marche.nom}
          </div>
          <div className="gsm-native-clienttradingscreens-6f56af179">
            <Badge tone="navy">{marche.marche}</Badge>
            <Badge tone={marche.type === 'Obligation' ? 'gold' : 'teal'}>
              {marche.type}
            </Badge>
          </div>

          <div
            className="gsm-native-clienttradingscreens-0d05e67b2"
            style={{ borderTop: `1px solid ${C.line}` }}
          >
            <div className="gsm-responsive-inline-row gsm-native-clienttradingscreens-a26cf48cb">
              <span className="gsm-native-clienttradingscreens-410ba87ea" style={{ color: C.sub }}>
                Dernier cours
              </span>
              <b style={{ ...F_MONO, color: C.ink }}>
                {fmtPrice(marche.cours)} {marche.devise}
              </b>
            </div>
            <div className="gsm-responsive-inline-row gsm-native-clienttradingscreens-a26cf48cb">
              <span className="gsm-native-clienttradingscreens-410ba87ea" style={{ color: C.sub }}>
                Variation
              </span>
              <Pct v={Number(marche.variation || 0)} />
            </div>
            <div className="gsm-responsive-inline-row gsm-native-clienttradingscreens-6c20c4cb6">
              <span className="gsm-native-clienttradingscreens-410ba87ea" style={{ color: C.sub }}>
                SGI compatibles
              </span>
              <span
                className="gsm-native-clienttradingscreens-b6f0f96bc"
                style={{ color: C.ink }}
              >
                {portefeuillesEligibles.length > 0
                  ? portefeuillesEligibles.map((pf) => pf.sgi).join(' · ')
                  : 'Aucune SGI compatible'}
              </span>
            </div>
          </div>

          <div
            className="gsm-native-clienttradingscreens-57d75d92a"
            style={{ background: C.surfaceElevated, color: C.sub }}          >
            Vous pouvez changer d'instrument uniquement à l'intérieur du même
            univers de marché ({typeSource || 'Actions / Obligations'}).
          </div>
        </Card>

        <Card className="gsm-native-clienttradingscreens-6a61cab32" style={{ borderColor: C.gold }}>
          <div className="gsm-responsive-header gsm-native-clienttradingscreens-cd7ebbd1c">
            <Eyebrow>Ticket d'ordre</Eyebrow>
            <Badge tone="gold">
              {marche.type === 'Obligation' ? 'Fixed Income' : 'Equity'}
            </Badge>
          </div>

          <div className="gsm-native-clienttradingscreens-afcfa0d76">
            <div>
              <label
                className="gsm-native-clienttradingscreens-091de6136"
                style={{ color: C.sub }}
              >
                Instrument
              </label>
              <select name="gsm-clienttradingscreens-239" aria-label="Sélection clienttradingscreens"
                value={instrument}
                onChange={(e) => changerInstrument(e.target.value)}
                className="gsm-native-clienttradingscreens-1167bb281"
                style={{ borderColor: C.line }}
              >
                {universTicket.map((item) => (
                  <option key={item.nom} value={item.nom}>
                    {item.nom} · {item.marche}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="gsm-native-clienttradingscreens-091de6136"
                style={{ color: C.sub }}
              >
                Portefeuille / SGI
              </label>
              <select name="gsm-clienttradingscreens-260" aria-label="Sélection clienttradingscreens"
                value={portefeuilleCourant?.id || ''}
                onChange={(e) => setPortefeuilleId(e.target.value)}
                className="gsm-native-clienttradingscreens-1167bb281"
                style={{ borderColor: C.line }}
              >
                {portefeuillesEligibles.map((portefeuille) => (
                  <option key={portefeuille.id} value={portefeuille.id}>
                    {portefeuille.sgi} — {portefeuille.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="gsm-native-clienttradingscreens-57fbdba2b">
            {['Achat', 'Vente'].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setSens(value);
                  setMessage('');
                }}
                className="gsm-native-clienttradingscreens-a9feda96b"
                style={{
                  background:
                    sens === value
                      ? value === 'Achat'
                        ? C.teal
                        : C.coral
                      : C.surfaceInset,
                  color: sens === value ? C.textPrimary : C.sub,
                }}
              >
                {value}
              </button>
            ))}
          </div>

          <div className="gsm-native-clienttradingscreens-8e56f3cb9">
            <div>
              <label
                className="gsm-native-clienttradingscreens-091de6136"
                style={{ color: C.sub }}
              >
                Type d'ordre
              </label>
              <select name="gsm-clienttradingscreens-308" aria-label="Sélection clienttradingscreens"
                value={typeOrdre}
                onChange={(e) => setTypeOrdre(e.target.value)}
                className="gsm-native-clienttradingscreens-1167bb281"
                style={{ borderColor: C.line }}
              >
                <option>Ordre au marché</option>
                <option>Ordre limite</option>
              </select>            </div>

            <div>
              <label
                className="gsm-native-clienttradingscreens-091de6136"
                style={{ color: C.sub }}
              >
                Quantité
              </label>
              <input name="gsm-clienttradingscreens-325" aria-label="Champ clienttradingscreens"
                type="number"
                min="1"
                value={qte}
                onChange={(e) => setQte(Number(e.target.value))}
                className="gsm-native-clienttradingscreens-1167bb281"
                style={{ borderColor: C.line, ...F_MONO }}
              />
            </div>

            <div>
              <label
                className="gsm-native-clienttradingscreens-091de6136"
                style={{ color: C.sub }}
              >
                Prix limite
              </label>
              <input name="gsm-clienttradingscreens-342" aria-label="Champ clienttradingscreens"
                type="number"
                step="0.01"
                disabled={typeOrdre === 'Ordre au marché'}
                value={prixLimite}
                onChange={(e) => setPrixLimite(Number(e.target.value))}
                className="gsm-native-clienttradingscreens-1167bb281"
                style={{
                  borderColor: C.line,
                  opacity: typeOrdre === 'Ordre au marché' ? 0.55 : 1,
                  ...F_MONO,
                }}
              />
            </div>
          </div>

          <div
            className="gsm-native-clienttradingscreens-3726fc18e"
            style={{ background: C.infoBackground, color: C.ink }}
          >
            <div className="gsm-native-clienttradingscreens-738873e92">
              <span>Montant estimé</span>
              <b style={F_MONO}>
                {fmt(Math.round(montantEstime))} {marche.devise}
              </b>
            </div>
            <div className="gsm-native-clienttradingscreens-738873e92">
              <span>Liquidité disponible</span>
              <span style={F_MONO}>
                {fmt(Math.round(cash))}{' '}
                {portefeuilleCourant?.devise || marche.devise}
              </span>
            </div>
            <div className="gsm-native-clienttradingscreens-738873e92">
              <span>Liquidité réservée</span>
              <span style={F_MONO}>
                {fmt(Math.round(cashReserve))}{' '}
                {portefeuilleCourant?.devise || marche.devise}
              </span>
            </div>
            <div className="gsm-native-clienttradingscreens-738873e92">
              <span>Liquidité totale</span>
              <span style={F_MONO}>
                {fmt(Math.round(cashTotal))}{' '}
                {portefeuilleCourant?.devise || marche.devise}
              </span>
            </div>
            {sens === 'Vente' && (
              <div className="gsm-native-clienttradingscreens-1dac75aed">
                <span>Position disponible</span>
                <span style={F_MONO}>{fmt(position)} titre(s)</span>
              </div>
            )}
          </div>

          {message && (
            <div
              className="gsm-native-clienttradingscreens-35ead3967"
              style={{ background: C.negativeBackground, color: C.coral }}
            >
              {message}
            </div>
          )}

          <div className="gsm-native-clienttradingscreens-4375bc55e">
            <div className="gsm-native-clienttradingscreens-f0ba7d7e0" style={{ color: C.sub }}>
              Prototype : l'ordre est enregistré dans l'espace client. En
              production, l'envoi devra être confirmé par l'API ou le workflow
              de la SGI concernée.
            </div>
            <Btn onClick={envoyerOrdre}>
              Envoyer l'ordre à {portefeuilleCourant?.sgi || 'la SGI'}
            </Btn>
          </div>        </Card>
      </div>
    </div>
  );
}


  function ClientMarkets({
  goClient,
  watchlistTitles,
  onAddWatch,
  onRemoveWatch,
}) {
  const [marche, setMarche] = useState('Tous');
  const [recherche, setRecherche] = useState('');

  const rows = MARKETS_DATA.filter(
    (item) =>
      item.type === 'Obligation' &&
      (marche === 'Tous' || item.marche === marche) &&
      item.nom.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className="gsm-native-clienttradingscreens-93b06aa35">
      <ClientBreadcrumb items={['Espace Client', 'Marchés Obligataire']} />

      <div className="gsm-native-clienttradingscreens-1f2aa1799">
        <div>
          <Eyebrow>Fixed Income · Gestion libre</Eyebrow>
          <h2
            className="gsm-native-clienttradingscreens-8834ebed4"
            style={{ ...F_DISPLAY, color: C.ink }}
          >
            Marchés Obligataire
          </h2>
        </div>
        <Badge tone="gold">{rows.length} obligation(s)</Badge>
      </div>

      <Card className="gsm-native-clienttradingscreens-b7ac7de35" style={{ borderColor: C.borderSubtle }}>
        <div className="gsm-native-clienttradingscreens-743b63e4f">
          <div>
            <div
              className="gsm-native-clienttradingscreens-6c8dbbe23"
              style={{ color: C.sub }}
            >
              Marché
            </div>
            <div className="gsm-chip-scroll">
              {['Tous', 'BRVM', 'NGX', 'GSE'].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setMarche(code)}
                  className="gsm-native-clienttradingscreens-73e4826a2"
                  style={{
                    background: marche === code ? C.activeBackground : C.surfaceInset,
                    color: marche === code ? C.textPrimary : C.sub,
                  }}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          <div className="gsm-native-clienttradingscreens-aa34aa274">
            <label
              className="gsm-native-clienttradingscreens-278a3a9af"
              style={{ color: C.sub }}
            >
              Obligation
            </label>
            <div
              className="gsm-native-clienttradingscreens-1797dfb30"
              style={{ borderColor: C.line }}
            >
              <Search size={13} color={C.sub} />
              <input name="gsm-clienttradingscreens-494" aria-label="Rechercher une obligation…"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher une obligation…"
                className="gsm-native-clienttradingscreens-d0c3f598b"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="gsm-native-clienttradingscreens-117e647c2">
        <div className="gsm-table-scroll">
          <table className="gsm-table--banking gsm-native-clienttradingscreens-ebfeaa1fe" style={{ minWidth: 1650 }}>
            <thead style={{ background: C.surfaceElevated }}>
              <tr>
                <Th>Instrument</Th>
                <Th>Émetteur</Th>
                <Th>Marché</Th>
                <Th>Cours</Th>
                <Th>Coupon</Th>
                <Th>Rendement indicatif</Th>
                <Th>Échéance</Th>
                <Th>Duration</Th>
                <Th>Volume jour</Th>
                <Th>Var %</Th>
                <Th>SGI accessibles</Th>
                <Th>Watchlist</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={13}
                    className="gsm-native-clienttradingscreens-da67e47e6"
                    style={{ color: C.sub }}
                  >
                    Aucune obligation ne correspond aux filtres sélectionnés.
                  </td>
                </tr>
              )}
              {rows.map((item, index) => {
                const meta = BOND_MARKET_META[item.nom] || {};
                const compatibles = CLIENT_GESTION_LIBRE.portefeuilles.filter(
                  (pf) => pf.marche === item.marche
                );
                const suivi = watchlistTitles.includes(item.nom);

                return (
                  <tr
                    key={item.nom}
                    style={{
                      borderTop: `1px solid ${C.line}`,
                      background: index % 2 ? C.rowAlternate : C.surfaceCard,
                    }}
                  >
                    <Td className="gsm-native-clienttradingscreens-c1832a2d9">
                      {item.nom}
                    </Td>
                    <Td>{meta.emetteur || '—'}</Td>
                    <Td>
                      <Badge tone="navy">{item.marche}</Badge>
                    </Td>
                    <Td mono className="gsm-native-clienttradingscreens-b1175e7d7">
                      {fmtPrice(item.cours)} {item.devise}
                    </Td>
                    <Td mono>
                      {meta.coupon != null ? `${meta.coupon.toFixed(2)}%` : '—'}
                    </Td>
                    <Td mono>
                      {meta.rendement != null
                        ? `${meta.rendement.toFixed(2)}%`
                        : '—'}
                    </Td>
                    <Td mono>{meta.echeance || '—'}</Td>
                    <Td mono>
                      {meta.duration != null
                        ? `${meta.duration.toFixed(1)} an(s)`
                        : '—'}
                    </Td>
                    <Td mono>{fmt(item.volumeJour)}</Td>
                    <Td>
                      <Pct v={item.variation} />
                    </Td>
                    <Td>
                      <div className="gsm-native-clienttradingscreens-87c3c2014">
                        {compatibles.length} SGI
                      </div>
                      <div
                        className="gsm-native-clienttradingscreens-abb106d11"
                        style={{ color: C.sub }}
                      >
                        {compatibles.map((pf) => pf.sgi).join(' · ')}
                      </div>
                    </Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() =>
                          suivi ? onRemoveWatch(item.nom) : onAddWatch(item.nom)
                        }
                        className="gsm-native-clienttradingscreens-ee77cacb5"
                        style={{
                          background: suivi ? C.positiveBackground : C.warningBackground,
                          color: suivi ? C.teal : C.warningText,
                        }}
                      >
                        <Star
                          size={13}
                          fill={suivi ? 'currentColor' : 'none'}
                        />
                        {suivi ? 'Suivi' : 'Ajouter'}
                      </button>
                    </Td>
                    <Td>
                      <div className="gsm-native-clienttradingscreens-b6ec00a65">
                        <button
                          type="button"
                          onClick={() =>
                            goClient('client-market-depth', {
                              instrument: item.nom,
                              marche: item.marche,
                              source: 'obligations',
                            })
                          }
                          className="gsm-native-clienttradingscreens-c3d3e9a3b"                          style={{ color: C.indigo }}
                        >
                          Profondeur →
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            goClient('client-ticket', {
                              instrument: item.nom,
                              marche: item.marche,
                              source: 'obligations',
                            })
                          }
                          className="gsm-native-clienttradingscreens-c3d3e9a3b"
                          style={{ color: C.navy }}
                        >
                          Ticket d'ordre →
                        </button>
                      </div>
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


  return { ClientOrderTicket, ClientMarkets };
}
