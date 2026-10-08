import { useEffect, useState } from 'react';
import { Briefcase, ChevronRight, Droplets } from 'lucide-react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { convertCurrency, fmt, fmtPrice } from '../../shared/lib/finance';
import { Badge, Btn, Card, Eyebrow, Pct, Td, Th } from '../../shared/ui/UiAtoms';
import { Breadcrumb } from '../../shared/ui/Navigation';
import { C, F_BODY, F_DISPLAY, F_MONO, PALETTE } from '../../shared/theme/theme';

export function createComiteWorkflow(dependencies) {
  const {
    ACTIONS_LIST,
    ASSET_MIX,
    COUNTRY_MIX,
    IMPACT_COMITE,
    MARKET_MIX,
    CLIENTS,
    MARKETS_DATA,
    PROFILE_TYPE_LABEL,
    RECOS,
    SECTOR_CONTRIB,
    SECTOR_MIX,
    UPCOMING_CASHFLOWS,
    compareOp,
    exposureOf,
    joursDepuisAujourdhui,
  } = dependencies;

const DECISIONS_COMITE_STORAGE_KEY = 'afrimarket-decisions-comite-v1';

const instrumentsPourDecision = (typeInstrument) => {
  if (typeInstrument === 'Actions') return ACTIONS_LIST;
  if (typeInstrument === 'Obl. souveraines') {
    return MARKETS_DATA.filter(
      (instrument) =>
        instrument.type === 'Obligation' &&
        instrument.nom.toLowerCase().includes('trésor')
    ).map((instrument) => instrument.nom);
  }
  return MARKETS_DATA.filter(
    (instrument) =>
      instrument.type === 'Obligation' &&
      !instrument.nom.toLowerCase().includes('trésor')
  ).map((instrument) => instrument.nom);
};

const prixDecisionPourInstrument = (instrument) => {
  const marche = MARKETS_DATA.find((item) => item.nom === instrument);
  const recommandation = RECOS.find((item) => item.titre === instrument);
  const cours = Number(marche?.cours ?? recommandation?.cours ?? 0);
  const objectif = Number(recommandation?.objectif ?? cours);

  return {
    prixMin: cours > 0 ? String(Number((cours * 0.98).toFixed(2))) : '',
    prixMax: cours > 0 ? String(Number((cours * 1.02).toFixed(2))) : '',
    prixObjectif: objectif > 0 ? String(objectif) : '',
  };
};

const nouvelleAllocationDecision = () => {
  const typeInstrument = 'Actions';
  const instrument = instrumentsPourDecision(typeInstrument)[0] || '';
  return {
    typeInstrument,
    sens: 'Achat',
    pourcentageOperation: '',
    marche: 'Tous',
    typePortefeuille: 'Tous',
    instrument,
    operateur: '<',
    seuil: '10',
    typeOrdre: 'Ordre au marché',
    ...prixDecisionPourInstrument(instrument),
  };
};

const lireDecisionsComite = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DECISIONS_COMITE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const sauvegarderDecisionsComite = (decisions) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      DECISIONS_COMITE_STORAGE_KEY,
      JSON.stringify(decisions)
    );
  } catch {
    // Les décisions restent disponibles pendant la session si le stockage est bloqué.
  }
};

const portefeuillesEligiblesDecision = (allocation) =>
  CLIENTS.filter((client) => {
    const correspondMarche =
      allocation.marche === 'Tous' || client.marche === allocation.marche;
    const typeLibelle = PROFILE_TYPE_LABEL[client.type] || client.type;
    const correspondType =
      allocation.typePortefeuille === 'Tous' ||
      typeLibelle === allocation.typePortefeuille;
    const exposition = exposureOf(client.id, allocation.instrument);
    const correspondExposition = compareOp(
      exposition,
      allocation.operateur,
      Number(allocation.seuil || 0)
    );

    return correspondMarche && correspondType && correspondExposition;
  });

function PortefeuillesConcernesDropdown({ portefeuilles = [] }) {
  const [ouvert, setOuvert] = useState(false);
  const liste = Array.isArray(portefeuilles)
    ? portefeuilles.filter(Boolean)
    : [];

  if (liste.length === 0) {
    return (
      <span className="gsm-native-comiteworkflow-45da207cc" style={{ color: C.sub }}>
        Aucun
      </span>
    );
  }

  return (
    <div className="gsm-native-comiteworkflow-26ba15d44">
      <button
        type="button"
        onClick={() => setOuvert((valeur) => !valeur)}
        className="gsm-native-comiteworkflow-27ca6a569"
        style={{
          borderColor: ouvert ? C.indigo : C.line,
          background: ouvert ? C.infoBackground : C.surfaceCard,
          color: ouvert ? C.indigo : C.ink,
        }}
        aria-expanded={ouvert}
      >
        <span className="gsm-native-comiteworkflow-43936ed7f">
          Portefeuilles concernés ({liste.length})
        </span>
        <ChevronRight
          size={15}
          style={{
            flexShrink: 0,
            transform: ouvert ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 160ms ease',
          }}
        />
      </button>

      {ouvert && (
        <div
          className="gsm-native-comiteworkflow-a42c1792d"
          style={{
            borderColor: C.line,
            background: C.surfaceCard,
            boxShadow: '0 8px 24px rgba(15, 27, 51, 0.08)',
          }}
        >
          <div
            className="gsm-native-comiteworkflow-f66e97f4a"
            style={{
              background: C.surfaceElevated,
              borderBottom: `1px solid ${C.line}`,
            }}
          >
            <span
              className="gsm-native-comiteworkflow-f93809032"
              style={{ color: C.sub }}
            >
              Liste des portefeuilles
            </span>
            <Badge tone="navy">{liste.length}</Badge>
          </div>

          <div
            className="gsm-native-comiteworkflow-6002a4b7a"
            style={{ scrollbarGutter: 'stable' }}
          >
            {liste.map((nom, index) => {
              const client = CLIENTS.find((item) => item.nom === nom);

              return (
                <div
                  key={`${nom}-${index}`}
                  className="gsm-native-comiteworkflow-014732562"
                  style={{
                    borderTop:
                      index === 0 ? 'none' : `1px solid ${C.line}`,
                    background: index % 2 ? C.rowAlternate : C.surfaceCard,
                  }}
                >
                  <div
                    className="gsm-native-comiteworkflow-e94f9b027"
                    style={{ color: C.ink }}
                  >
                    {nom}
                  </div>

                  {client && (
                    <div
                      className="gsm-native-comiteworkflow-17d30ad0f"
                      style={{ color: C.sub }}
                    >
                      <span>{client.marche}</span>
                      <span>•</span>
                      <span>{client.profilRisque}</span>
                      <span>•</span>
                      <span>
                        {fmt(client.encours)} {client.devise}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PriseDecisions({ go }) {
  const [allocationCourante, setAllocationCourante] = useState(() =>
    nouvelleAllocationDecision()
  );
  const [allocations, setAllocations] = useState([]);
  const [decisionsEnregistrees, setDecisionsEnregistrees] = useState(() =>
    lireDecisionsComite()
  );
  const [message, setMessage] = useState(null);

  const instrumentsDisponibles = instrumentsPourDecision(
    allocationCourante.typeInstrument
  );
  const eligiblesCourants = portefeuillesEligiblesDecision(allocationCourante);

  const mettreAJour = (champ, valeur) => {
    setMessage(null);
    setAllocationCourante((courante) => {      if (champ === 'typeInstrument') {
        const instrument = instrumentsPourDecision(valeur)[0] || '';
        return {
          ...courante,
          typeInstrument: valeur,
          instrument,
          ...prixDecisionPourInstrument(instrument),
        };
      }

      if (champ === 'instrument') {
        return {
          ...courante,
          instrument: valeur,
          ...prixDecisionPourInstrument(valeur),
        };
      }

      if (champ === 'sens') {
        return {
          ...courante,
          sens: valeur,
          pourcentageOperation: '',
        };
      }

      return { ...courante, [champ]: valeur };
    });
  };

  const verifierAllocation = (allocation) => {
    if (!allocation.instrument) {
      return "Sélectionnez un instrument avant d'ajouter l'allocation.";
    }

    const seuil = Number(allocation.seuil);
    if (!Number.isFinite(seuil) || seuil < 0 || seuil > 100) {
      return "Le seuil d'exposition doit être compris entre 0 et 100 %.";
    }

    const pourcentageOperation = Number(allocation.pourcentageOperation);
    if (
      !Number.isFinite(pourcentageOperation) ||
      pourcentageOperation <= 0 ||
      pourcentageOperation > 100
    ) {
      return allocation.sens === 'Vente'
        ? 'Le pourcentage de cession doit être supérieur à 0 et inférieur ou égal à 100 %.'
        : 'Le pourcentage de liquidité doit être supérieur à 0 et inférieur ou égal à 100 %.';
    }

    const prixMin = Number(allocation.prixMin);
    const prixMax = Number(allocation.prixMax);
    const prixObjectif = Number(allocation.prixObjectif);
    if (
      !Number.isFinite(prixMin) ||
      !Number.isFinite(prixMax) ||
      !Number.isFinite(prixObjectif) ||
      prixMin < 0 ||
      prixMax < 0 ||
      prixObjectif < 0
    ) {
      return 'Renseignez des prix minimum, maximum et objectif valides.';
    }
    if (prixMin > prixMax) {
      return 'Le prix minimum ne peut pas être supérieur au prix maximum.';
    }

    return null;
  };

  const ajouterAllocation = () => {
    const erreur = verifierAllocation(allocationCourante);
    if (erreur) {
      setMessage({ tone: 'coral', texte: erreur });
      return;
    }

    const eligibles = portefeuillesEligiblesDecision(allocationCourante);
    const allocation = {
      ...allocationCourante,
      id: `ALLOC-${Date.now()}-${allocations.length + 1}`,
      seuil: Number(allocationCourante.seuil),
      pourcentageOperation: Number(allocationCourante.pourcentageOperation),
      prixMin: Number(allocationCourante.prixMin),
      prixMax: Number(allocationCourante.prixMax),
      prixObjectif: Number(allocationCourante.prixObjectif),
      portefeuillesEligibles: eligibles.map((client) => client.nom),
    };

    setAllocations((courantes) => [...courantes, allocation]);
    setAllocationCourante(nouvelleAllocationDecision());
    setMessage({
      tone: 'teal',
      texte: `Allocation ajoutée au tableau (${eligibles.length} portefeuille(s) concerné(s)).`,
    });
  };

  const supprimerAllocation = (id) => {
    setAllocations((courantes) =>
      courantes.filter((allocation) => allocation.id !== id)
    );
    setMessage(null);
  };

  const enregistrerDecisions = () => {
    if (allocations.length === 0) {
      setMessage({
        tone: 'coral',
        texte:
          "Ajoutez au moins une allocation avant d'enregistrer les décisions.",
      });
      return;
    }

    const date = new Date();
    const portefeuilleDistincts = [
      ...new Set(
        allocations.flatMap(
          (allocation) => allocation.portefeuillesEligibles || []
        )
      ),
    ];
    const decision = {
      id: `DEC-${date.getFullYear()}${String(date.getMonth() + 1).padStart(
        2,
        '0'
      )}${String(date.getDate()).padStart(2, '0')}-${String(
        date.getHours()
      ).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(
        date.getSeconds()
      ).padStart(2, '0')}`,
      creeLe: date.toISOString(),
      libelleDate: new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date),
      allocations,
      nombrePortefeuilles: portefeuilleDistincts.length,
    };

    const prochaines = [decision, ...decisionsEnregistrees];
    setDecisionsEnregistrees(prochaines);
    sauvegarderDecisionsComite(prochaines);
    setAllocations([]);
    setAllocationCourante(nouvelleAllocationDecision());
    setMessage({
      tone: 'teal',
      texte: `${decision.id} enregistrée avec ${decision.allocations.length} allocation(s).`,
    });
  };

  const reutiliserDecision = (decision) => {
    const reprises = decision.allocations.map((allocation, index) => ({
      ...allocation,
      id: `ALLOC-${Date.now()}-${index + 1}`,
    }));
    setAllocations(reprises);
    setMessage({
      tone: 'gold',
      texte: `${decision.id} a été rechargée dans le tableau de préparation.`,
    });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };

  const supprimerDecision = (id) => {
    const prochaines = decisionsEnregistrees.filter(
      (decision) => decision.id !== id
    );
    setDecisionsEnregistrees(prochaines);
    sauvegarderDecisionsComite(prochaines);
    setMessage({ tone: 'gold', texte: `${id} a été supprimée.` });
  };

  return (
    <div className="gsm-native-comiteworkflow-2e34c8fc8">
      <Breadcrumb
        items={[
          'Accueil',
          'Rapport de comité de gestion',
          'Prise de décisions',
        ]}
      />

      <div className="gsm-native-comiteworkflow-8ee0f3820">
        <div>
          <h2
            className="gsm-native-comiteworkflow-e05b98d64"
            style={{ ...F_DISPLAY, color: C.ink }}
          >
            Prise de décisions — allocations d'investissement compilées
          </h2>
          <div className="gsm-native-comiteworkflow-02660a2c2" style={{ color: C.sub, ...F_BODY }}>
            Préparez plusieurs règles d'allocation, ajoutez-les au tableau puis
            enregistrez l'ensemble comme une décision de comité réutilisable.
          </div>
        </div>
        <Btn tone="ghost" onClick={() => go('comite')}>
          Retour au rapport
        </Btn>
      </div>

      {message && (
        <Card
          className="gsm-native-comiteworkflow-0c82b1fc2"
          style={{
            borderColor: message.tone === 'coral' ? C.coral : C.gold,
            background:
              message.tone === 'coral'
                ? C.negativeBackground
                : message.tone === 'teal'
                ? C.positiveBackground
                : C.warningBackground,
          }}
        >
          <div
            className="gsm-native-comiteworkflow-34cdf9fdb"
            style={{              color:
                message.tone === 'coral'
                  ? C.coral
                  : message.tone === 'teal'
                  ? C.teal
                  : C.warningText,
            }}
          >
            {message.texte}
          </div>
        </Card>
      )}

      <Card className="gsm-native-comiteworkflow-cfb864c93" style={{ borderColor: C.navy }}>
        <div className="gsm-native-comiteworkflow-fa23acfbb">
          <div>
            <Eyebrow>Nouvelle allocation d'investissement</Eyebrow>
            <div className="gsm-native-comiteworkflow-45da207cc" style={{ color: C.sub }}>
              Les portefeuilles concernés sont recalculés automatiquement selon
              le marché, le type de portefeuille et le seuil d'exposition.
            </div>
          </div>
          <div className="gsm-native-comiteworkflow-7698bc5ca">
            <Badge tone="navy">
              {eligiblesCourants.length} portefeuille(s) éligible(s)
            </Badge>
            <Badge tone="gold">
              {allocations.length} allocation(s) ajoutée(s)
            </Badge>
          </div>
        </div>

        <div className="gsm-native-comiteworkflow-1fafbe26e">
          <div>
            <label
              className="gsm-native-comiteworkflow-3bcf99993"
              style={{ color: C.sub }}
            >
              Type d'instrument
            </label>
            <select name="gsm-comiteworkflow-512" aria-label="Sélection comiteworkflow"
              value={allocationCourante.typeInstrument}
              onChange={(e) => mettreAJour('typeInstrument', e.target.value)}
              className="gsm-native-comiteworkflow-25fecf704"
              style={{ borderColor: C.line }}
            >
              <option>Actions</option>
              <option>Obl. souveraines</option>
              <option>Obl. privées</option>
            </select>
          </div>

          <div>
            <label
              className="gsm-native-comiteworkflow-3bcf99993"
              style={{ color: C.sub }}
            >
              Sens
            </label>
            <select name="gsm-comiteworkflow-531" aria-label="Sélection comiteworkflow"
              value={allocationCourante.sens}
              onChange={(e) => mettreAJour('sens', e.target.value)}
              className="gsm-native-comiteworkflow-25fecf704"
              style={{ borderColor: C.line }}
            >
              <option>Achat</option>
              <option>Vente</option>
            </select>
          </div>

          <div>
            <label
              className="gsm-native-comiteworkflow-3bcf99993"
              style={{ color: C.sub }}
            >
              {allocationCourante.sens === 'Vente'
                ? 'Pourcentage de cession (%)'
                : 'Pourcentage de liquidité (%)'}
            </label>
            <div className="gsm-native-comiteworkflow-6d67bcf71">
              <input name="gsm-comiteworkflow-552" aria-label="Ex. 25"
                type="number"
                min="0.01"
                max="100"
                step="0.5"
                placeholder="Ex. 25"
                value={allocationCourante.pourcentageOperation}
                onChange={(e) =>
                  mettreAJour('pourcentageOperation', e.target.value)
                }
                className="gsm-native-comiteworkflow-0f223e8ef"
                style={{ borderColor: C.line, ...F_MONO }}
              />
              <span
                className="gsm-native-comiteworkflow-4cd68776f"
                style={{ color: C.sub }}
              >
                %
              </span>
            </div>
            <div className="gsm-native-comiteworkflow-cb96f91d4" style={{ color: C.sub }}>
              {allocationCourante.sens === 'Vente'
                ? 'Part de la position à céder.'
                : 'Part de la liquidité disponible à mobiliser.'}
            </div>
          </div>

          <div>
            <label
              className="gsm-native-comiteworkflow-3bcf99993"
              style={{ color: C.sub }}
            >
              Marché boursier
            </label>
            <select name="gsm-comiteworkflow-586" aria-label="Sélection comiteworkflow"
              value={allocationCourante.marche}
              onChange={(e) => mettreAJour('marche', e.target.value)}
              className="gsm-native-comiteworkflow-25fecf704"
              style={{ borderColor: C.line }}
            >
              <option>Tous</option>
              <option>BRVM</option>
              <option>NGX</option>
              <option>GSE</option>
            </select>
          </div>

          <div>
            <label
              className="gsm-native-comiteworkflow-3bcf99993"
              style={{ color: C.sub }}
            >
              Type de portefeuille
            </label>
            <select name="gsm-comiteworkflow-606" aria-label="Sélection comiteworkflow"
              value={allocationCourante.typePortefeuille}
              onChange={(e) => mettreAJour('typePortefeuille', e.target.value)}
              className="gsm-native-comiteworkflow-25fecf704"
              style={{ borderColor: C.line }}
            >
              <option>Tous</option>
              <option>Particulier</option>
              <option>Institutionnel</option>
            </select>
          </div>
        </div>

        <div className="gsm-native-comiteworkflow-0c5df6dac">
          <div>
            <label
              className="gsm-native-comiteworkflow-3bcf99993"
              style={{ color: C.sub }}
            >
              Instrument (action / obligation)
            </label>
            <select name="gsm-comiteworkflow-627" aria-label="Sélection comiteworkflow"
              value={allocationCourante.instrument}
              onChange={(e) => mettreAJour('instrument', e.target.value)}
              className="gsm-native-comiteworkflow-25fecf704"
              style={{ borderColor: C.line }}
            >
              {instrumentsDisponibles.length === 0 && (
                <option value="">Aucun instrument</option>
              )}
              {instrumentsDisponibles.map((instrument) => (
                <option key={instrument}>{instrument}</option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="gsm-native-comiteworkflow-3bcf99993"
              style={{ color: C.sub }}
            >
              Opérateur de comparaison
            </label>
            <select name="gsm-comiteworkflow-649" aria-label="Sélection comiteworkflow"
              value={allocationCourante.operateur}
              onChange={(e) => mettreAJour('operateur', e.target.value)}
              className="gsm-native-comiteworkflow-25fecf704"
              style={{ borderColor: C.line }}
            >
              <option value="<">{'< (inférieur à)'}</option>
              <option value="=">{'= (égal à)'}</option>
              <option value=">">{'> (supérieur à)'}</option>
            </select>
          </div>

          <div>
            <label
              className="gsm-native-comiteworkflow-3bcf99993"
              style={{ color: C.sub }}
            >
              Seuil d'exposition par portefeuille (%)
            </label>
            <input name="gsm-comiteworkflow-668" aria-label="Champ comiteworkflow"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={allocationCourante.seuil}
              onChange={(e) => mettreAJour('seuil', e.target.value)}
              className="gsm-native-comiteworkflow-25fecf704"
              style={{ borderColor: C.line, ...F_MONO }}
            />
          </div>

          <div>
            <label
              className="gsm-native-comiteworkflow-3bcf99993"
              style={{ color: C.sub }}
            >
              Type d'ordre
            </label>
            <select name="gsm-comiteworkflow-687" aria-label="Sélection comiteworkflow"
              value={allocationCourante.typeOrdre}
              onChange={(e) => mettreAJour('typeOrdre', e.target.value)}
              className="gsm-native-comiteworkflow-25fecf704"
              style={{ borderColor: C.line }}            >
              <option>Ordre au marché</option>
              <option>Ordre limite</option>
              <option>Meilleure limite</option>
            </select>
          </div>
        </div>

        <div className="gsm-native-comiteworkflow-a3673520a">
          <div>
            <label
              className="gsm-native-comiteworkflow-3bcf99993"
              style={{ color: C.sub }}
            >
              Prix min
            </label>
            <input name="gsm-comiteworkflow-707" aria-label="Champ comiteworkflow"
              type="number"
              min="0"
              step="0.01"
              value={allocationCourante.prixMin}
              onChange={(e) => mettreAJour('prixMin', e.target.value)}
              className="gsm-native-comiteworkflow-25fecf704"
              style={{ borderColor: C.line, ...F_MONO }}
            />
          </div>
          <div>
            <label
              className="gsm-native-comiteworkflow-3bcf99993"
              style={{ color: C.sub }}
            >
              Prix Max
            </label>
            <input name="gsm-comiteworkflow-724" aria-label="Champ comiteworkflow"
              type="number"
              min="0"
              step="0.01"
              value={allocationCourante.prixMax}
              onChange={(e) => mettreAJour('prixMax', e.target.value)}
              className="gsm-native-comiteworkflow-25fecf704"
              style={{ borderColor: C.line, ...F_MONO }}
            />
          </div>
          <div>
            <label
              className="gsm-native-comiteworkflow-3bcf99993"
              style={{ color: C.sub }}
            >
              Prix Objectif
            </label>
            <input name="gsm-comiteworkflow-741" aria-label="Champ comiteworkflow"
              type="number"
              min="0"
              step="0.01"
              value={allocationCourante.prixObjectif}
              onChange={(e) => mettreAJour('prixObjectif', e.target.value)}
              className="gsm-native-comiteworkflow-25fecf704"
              style={{ borderColor: C.line, ...F_MONO }}
            />
          </div>
          <div className="gsm-native-comiteworkflow-d58a687dc">
            <Btn onClick={ajouterAllocation}>Ajouter allocation</Btn>
          </div>
        </div>

        <div className="gsm-native-comiteworkflow-617f76465" style={{ background: C.infoBackground }}>
          <div className="gsm-native-comiteworkflow-e94f9b027" style={{ color: C.ink }}>
            Portefeuilles actuellement concernés
          </div>
          <div className="gsm-native-comiteworkflow-ac78ddc3a">
            {eligiblesCourants.length === 0 ? (
              <span className="gsm-native-comiteworkflow-45da207cc" style={{ color: C.sub }}>
                Aucun portefeuille ne satisfait les critères actuels.
              </span>
            ) : (
              eligiblesCourants.map((client) => (
                <Badge key={client.id} tone="slate">
                  {client.nom}
                </Badge>
              ))
            )}
          </div>
        </div>
      </Card>

      <Card className="gsm-native-comiteworkflow-6bc18a4e2">
        <div
          className="gsm-native-comiteworkflow-994c69fba"
          style={{ background: C.warningBackground }}
        >
          <div>
            <Eyebrow>Tableau de préparation des décisions</Eyebrow>
            <div className="gsm-native-comiteworkflow-45da207cc" style={{ color: C.sub }}>
              Chaque ligne représente une allocation qui sera compilée dans la
              décision finale.
            </div>
          </div>
          <button
            type="button"
            onClick={enregistrerDecisions}
            className="gsm-native-comiteworkflow-8174d1187"
            style={{ background: C.gold, color: C.surfaceCard, ...F_BODY }}
          >
            Enregistrer Décisions
          </button>
        </div>

        <div className="gsm-table-scroll">
          <table className="gsm-table--banking gsm-native-comiteworkflow-21423c383" style={{ minWidth: 2650 }}>
            <thead style={{ background: C.surfaceElevated }}>
              <tr>
                <Th>#</Th>
                <Th>Type d'instrument</Th>
                <Th>Sens</Th>
                <Th>Pourcentage de cession / liquidité</Th>
                <Th>Marché boursier</Th>
                <Th>Type de portefeuille</Th>
                <Th>Instrument (action / obligation)</Th>
                <Th>Opérateur de comparaison</Th>
                <Th>Seuil d'exposition par portefeuille (%)</Th>
                <Th>Type d'ordre</Th>
                <Th>Prix min</Th>
                <Th>Prix Max</Th>
                <Th>Prix Objectif</Th>
                <Th>Portefeuilles concernés</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {allocations.length === 0 && (
                <tr>
                  <td
                    colSpan={15}
                    className="gsm-native-comiteworkflow-7f7f752d7"
                    style={{ color: C.sub }}
                  >
                    Aucune allocation ajoutée. Remplissez le formulaire puis
                    cliquez sur « Ajouter allocation ».
                  </td>
                </tr>
              )}
              {allocations.map((allocation, index) => (
                <tr
                  key={allocation.id}
                  style={{
                    borderTop: `1px solid ${C.line}`,
                    background: index % 2 ? C.rowAlternate : C.surfaceCard,
                  }}
                >
                  <Td mono>{index + 1}</Td>
                  <Td className="gsm-native-comiteworkflow-d83aa168d">
                    {allocation.typeInstrument}
                  </Td>
                  <Td>
                    <Badge
                      tone={allocation.sens === 'Achat' ? 'teal' : 'coral'}
                    >
                      {allocation.sens}
                    </Badge>
                  </Td>
                  <Td className="gsm-native-comiteworkflow-d83aa168d">
                    <div
                      className="gsm-native-comiteworkflow-28c01d1bb"
                      style={{ ...F_MONO, color: C.ink }}
                    >
                      {Number(allocation.pourcentageOperation || 0).toFixed(1)}%
                    </div>
                    <div className="gsm-native-comiteworkflow-7f14b09a0" style={{ color: C.sub }}>
                      {allocation.sens === 'Vente'
                        ? 'Pourcentage de cession'
                        : 'Pourcentage de liquidité'}
                    </div>
                  </Td>
                  <Td>
                    <Badge tone="navy">{allocation.marche}</Badge>
                  </Td>
                  <Td className="gsm-native-comiteworkflow-d83aa168d">
                    {allocation.typePortefeuille}
                  </Td>
                  <Td className="gsm-native-comiteworkflow-54ca0b577">
                    {allocation.instrument}
                  </Td>
                  <Td mono>{allocation.operateur}</Td>
                  <Td mono>{allocation.seuil}%</Td>
                  <Td className="gsm-native-comiteworkflow-d83aa168d">{allocation.typeOrdre}</Td>
                  <Td mono>{fmtPrice(allocation.prixMin)}</Td>
                  <Td mono>{fmtPrice(allocation.prixMax)}</Td>
                  <Td mono>{fmtPrice(allocation.prixObjectif)}</Td>
                  <Td>
                    <PortefeuillesConcernesDropdown
                      portefeuilles={allocation.portefeuillesEligibles || []}
                    />
                  </Td>
                  <Td>
                    <button
                      type="button"
                      onClick={() => supprimerAllocation(allocation.id)}
                      className="gsm-native-comiteworkflow-ebb7dc644"
                      style={{ background: C.negativeBackground, color: C.coral }}
                    >
                      Retirer
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="gsm-native-comiteworkflow-cb3e7834a">
        <div>
          <h3
            className="gsm-native-comiteworkflow-164eda61c"
            style={{ ...F_DISPLAY, color: C.ink }}
          >
            Décisions enregistrées pour utilisation ultérieure
          </h3>
        </div>
        <Badge tone="gold">{decisionsEnregistrees.length} décision(s)</Badge>      </div>

      {decisionsEnregistrees.length === 0 && (
        <Card className="gsm-native-comiteworkflow-62bc77a80">
          <Badge tone="slate">Aucune décision enregistrée</Badge>
          <div className="gsm-native-comiteworkflow-21f185d3b" style={{ color: C.sub }}>
            Les décisions compilées apparaîtront ici après enregistrement.
          </div>
        </Card>
      )}

      {decisionsEnregistrees.map((decision) => (
        <Card
          key={decision.id}
          className="gsm-native-comiteworkflow-6bc18a4e2"
          style={{ borderColor: C.gold }}
        >
          <div
            className="gsm-native-comiteworkflow-852a097dc"
            style={{ background: C.warningBackground }}
          >
            <div>
              <div
                className="gsm-native-comiteworkflow-3843798b4"
                style={{ ...F_DISPLAY, color: C.ink }}
              >
                {decision.id}
              </div>
              <div className="gsm-native-comiteworkflow-beeb339c0">
                <Badge tone="gold">
                  {decision.allocations.length} allocation(s)
                </Badge>
                <Badge tone="navy">
                  {decision.nombrePortefeuilles} portefeuille(s)
                </Badge>
                <span className="gsm-native-comiteworkflow-45da207cc" style={{ color: C.sub }}>
                  {decision.libelleDate}
                </span>
              </div>
            </div>
            <div className="gsm-native-comiteworkflow-7698bc5ca">
              <Btn tone="ghost" onClick={() => reutiliserDecision(decision)}>
                Réutiliser
              </Btn>
              <button
                type="button"
                onClick={() => supprimerDecision(decision.id)}
                className="gsm-native-comiteworkflow-ff92399b4"
                style={{ background: C.negativeBackground, color: C.coral }}
              >
                Supprimer
              </button>
            </div>
          </div>

          <div className="gsm-table-scroll">
            <table className="gsm-table--banking gsm-native-comiteworkflow-21423c383" style={{ minWidth: 2400 }}>
              <thead style={{ background: C.surfaceElevated }}>
                <tr>
                  <Th>Type d'instrument</Th>
                  <Th>Sens</Th>
                  <Th>Pourcentage de cession / liquidité</Th>
                  <Th>Marché boursier</Th>
                  <Th>Type de portefeuille</Th>
                  <Th>Instrument (action / obligation)</Th>
                  <Th>Opérateur</Th>
                  <Th>Seuil (%)</Th>
                  <Th>Type d'ordre</Th>
                  <Th>Prix min</Th>
                  <Th>Prix Max</Th>
                  <Th>Prix Objectif</Th>
                  <Th>Portefeuilles concernés</Th>
                </tr>
              </thead>
              <tbody>
                {decision.allocations.map((allocation, index) => (
                  <tr
                    key={`${decision.id}-${allocation.id || index}`}
                    style={{
                      borderTop: `1px solid ${C.line}`,
                      background: index % 2 ? C.rowAlternate : C.surfaceCard,
                    }}
                  >
                    <Td className="gsm-native-comiteworkflow-d83aa168d">
                      {allocation.typeInstrument}
                    </Td>
                    <Td>
                      <Badge
                        tone={allocation.sens === 'Achat' ? 'teal' : 'coral'}
                      >
                        {allocation.sens}
                      </Badge>
                    </Td>
                    <Td className="gsm-native-comiteworkflow-d83aa168d">
                      {allocation.pourcentageOperation != null &&
                      allocation.pourcentageOperation !== '' ? (
                        <>
                          <div
                            className="gsm-native-comiteworkflow-28c01d1bb"
                            style={{ ...F_MONO, color: C.ink }}
                          >
                            {Number(allocation.pourcentageOperation).toFixed(1)}%
                          </div>
                          <div className="gsm-native-comiteworkflow-7f14b09a0" style={{ color: C.sub }}>
                            {allocation.sens === 'Vente'
                              ? 'Pourcentage de cession'
                              : 'Pourcentage de liquidité'}
                          </div>
                        </>
                      ) : (
                        <span className="gsm-native-comiteworkflow-45da207cc" style={{ color: C.sub }}>
                          —
                        </span>
                      )}
                    </Td>
                    <Td>
                      <Badge tone="navy">{allocation.marche}</Badge>
                    </Td>
                    <Td className="gsm-native-comiteworkflow-d83aa168d">
                      {allocation.typePortefeuille}
                    </Td>
                    <Td className="gsm-native-comiteworkflow-54ca0b577">
                      {allocation.instrument}
                    </Td>
                    <Td mono>{allocation.operateur}</Td>
                    <Td mono>{allocation.seuil}%</Td>
                    <Td className="gsm-native-comiteworkflow-d83aa168d">
                      {allocation.typeOrdre}
                    </Td>
                    <Td mono>{fmtPrice(allocation.prixMin)}</Td>
                    <Td mono>{fmtPrice(allocation.prixMax)}</Td>
                    <Td mono>{fmtPrice(allocation.prixObjectif)}</Td>
                    <Td>
                      <PortefeuillesConcernesDropdown
                        portefeuilles={allocation.portefeuillesEligibles || []}
                      />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  );
}

function Comite({ devise = 'XOF', go }) {
  const [filtreBourse, setFiltreBourse] = useState('Toutes');
  const [filtreSecteur, setFiltreSecteur] = useState('Tous');
  const totalRef = CLIENTS.reduce(
    (s, c) => s + convertCurrency(c.encours, c.devise, devise),
    0
  );
  const boursesDisponibles = ['Toutes', ...new Set(RECOS.map((r) => r.marche))];
  const secteursDisponibles = ['Tous', ...new Set(RECOS.map((r) => r.secteur))];
  const recommandationsFiltrees = RECOS.filter(
    (r) =>
      (filtreBourse === 'Toutes' || r.marche === filtreBourse) &&
      (filtreSecteur === 'Tous' || r.secteur === filtreSecteur)
  );
  const previsionTresorerie30j = UPCOMING_CASHFLOWS.filter((c) => {
    const j = joursDepuisAujourdhui(c.echeance);
    return j >= 0 && j <= 30;
  }).reduce((s, c) => s + convertCurrency(c.montant, c.devise, devise), 0);
  return (
    <div className="gsm-native-comiteworkflow-38d9e28d6">
      <Breadcrumb items={['Accueil', 'Rapport de comité de gestion']} />
      <div className="gsm-committee-report-header gsm-native-comiteworkflow-94ec140c6">
        <h2
          className="gsm-native-comiteworkflow-e05b98d64"
          style={{ ...F_DISPLAY, color: C.ink }}
        >
          Rapport de comité de gestion — Juillet 2026
        </h2>
        <div className="gsm-committee-report-actions gsm-native-comiteworkflow-e340eb3f7">
          <Btn onClick={() => go('decisions-comite')}>Prise de décisions</Btn>
          <Btn tone="gold">Editer</Btn>
        </div>
      </div>

      <Card
        className="gsm-native-comiteworkflow-6bc18a4e2"
        style={{ borderColor: C.gold, background: C.warningBackground }}
      >
        <div className="gsm-committee-kpi-row gsm-native-comiteworkflow-e6ac7ad21">
          <div className="gsm-native-comiteworkflow-7698bc5ca">
            <Briefcase size={16} color={C.navy} />
            <span
              className="gsm-native-comiteworkflow-34cdf9fdb"
              style={{ color: C.ink, ...F_BODY }}
            >
              Encours total sous gestion
            </span>
          </div>
          <span
            className="gsm-committee-kpi-value gsm-native-comiteworkflow-3bb9f7dcc"
            style={{ ...F_DISPLAY, color: C.navy }}
          >
            {fmt(Math.round(totalRef))} {devise}
          </span>
        </div>
        <div
          className="gsm-committee-kpi-row gsm-native-comiteworkflow-e6ac7ad21"
          style={{ borderTop: `1px solid ${C.gold}` }}
        >
          <div className="gsm-native-comiteworkflow-7698bc5ca">
            <Droplets size={16} color={C.gold} />
            <span
              className="gsm-native-comiteworkflow-34cdf9fdb"
              style={{ color: C.ink, ...F_BODY }}
            >
              Prévision de trésorerie — dividendes &amp; coupons attendus dans
              le mois
            </span>
          </div>
          <span className="gsm-committee-kpi-value gsm-native-comiteworkflow-583500158" style={F_DISPLAY}>
            {fmt(Math.round(previsionTresorerie30j))} {devise}
          </span>
        </div>
      </Card>

      <div className="gsm-native-comiteworkflow-eb4345dfd">
        <Card className="gsm-native-comiteworkflow-cfb864c93">
          <Eyebrow>Rendement de la période</Eyebrow>
          <div className="gsm-native-comiteworkflow-e82d7cc88">
            <div>
              <div className="gsm-native-comiteworkflow-45da207cc" style={{ color: C.sub }}>
                Performance gestionnaire
              </div>
              <div className="gsm-native-comiteworkflow-6ee1d67d3" style={F_DISPLAY}>
                +2.4%
              </div>
            </div>
            <div>
              <div className="gsm-native-comiteworkflow-45da207cc" style={{ color: C.sub }}>
                Rentabilité générale
              </div>
              <div className="gsm-native-comiteworkflow-6ee1d67d3" style={F_DISPLAY}>
                +1.9%
              </div>
            </div>
          </div>
          <div className="gsm-native-comiteworkflow-5acc152be" style={{ color: C.sub }}>
            Dispersion clients : de -1.4% (Emeka Okafor) à +4.6% (Ama Boateng)
          </div>
        </Card>
        <Card className="gsm-native-comiteworkflow-cfb864c93">
          <Eyebrow>Écarts sur les autres types d'actifs</Eyebrow>
          <div className="gsm-native-comiteworkflow-2a48df6b6" style={F_BODY}>
            <div className="gsm-committee-delta-row gsm-native-comiteworkflow-52d091676">
              <span>Obl. souveraines</span>
              <Badge tone="teal">-1 pt vs cible (conforme)</Badge>
            </div>
            <div className="gsm-committee-delta-row gsm-native-comiteworkflow-52d091676">
              <span>Obl. privées</span>
              <Badge tone="gold">+3 pts vs cible</Badge>
            </div>
            <div className="gsm-committee-delta-row gsm-native-comiteworkflow-52d091676">
              <span>Liquidité</span>
              <Badge tone="teal">Conforme</Badge>
            </div>
          </div>
        </Card>
      </div>

      <Card className="gsm-native-comiteworkflow-cfb864c93">
        <div className="gsm-native-comiteworkflow-f55347278">
          <div>
            <Eyebrow>Recommandations d'achat / vente — tous marchés</Eyebrow>
            <div className="gsm-native-comiteworkflow-45da207cc" style={{ color: C.sub, ...F_BODY }}>
              Synthèse des signaux techniques et fondamentaux présentée au
              comité.
            </div>
          </div>
          <div className="gsm-native-comiteworkflow-c41abd64a">
            <div>
              <label
                className="gsm-native-comiteworkflow-3bcf99993"
                style={{ color: C.sub }}
              >
                Bourse
              </label>
              <select name="gsm-comiteworkflow-1193" aria-label="Sélection comiteworkflow"
                value={filtreBourse}
                onChange={(e) => setFiltreBourse(e.target.value)}
                className="gsm-native-comiteworkflow-389300958"
                style={{ borderColor: C.line, ...F_BODY }}
              >
                {boursesDisponibles.map((bourse) => (
                  <option key={bourse}>{bourse}</option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="gsm-native-comiteworkflow-3bcf99993"
                style={{ color: C.sub }}
              >
                Secteur
              </label>
              <select name="gsm-comiteworkflow-1211" aria-label="Sélection comiteworkflow"
                value={filtreSecteur}
                onChange={(e) => setFiltreSecteur(e.target.value)}
                className="gsm-native-comiteworkflow-389300958"
                style={{ borderColor: C.line, ...F_BODY }}
              >
                {secteursDisponibles.map((secteur) => (
                  <option key={secteur}>{secteur}</option>
                ))}
              </select>
            </div>
            <Badge tone="gold">
              {recommandationsFiltrees.length} valeur(s)
            </Badge>
          </div>
        </div>

        <div
          className="gsm-table-scroll gsm-native-comiteworkflow-9b04f1cb0"
          style={{ borderColor: C.line }}
        >
          <table className="gsm-table--banking gsm-native-comiteworkflow-21423c383" style={{ minWidth: 1740 }}>
            <thead style={{ background: C.surfaceElevated }}>
              <tr>
                <th
                  rowSpan={2}
                  className="gsm-native-comiteworkflow-a94a06034"
                  style={{ color: C.sub, ...F_BODY }}
                >
                  Titre
                </th>
                <th
                  rowSpan={2}
                  className="gsm-native-comiteworkflow-a94a06034"
                  style={{ color: C.sub, ...F_BODY }}
                >
                  Recommandation
                </th>
                <th
                  rowSpan={2}
                  className="gsm-native-comiteworkflow-a94a06034"
                  style={{ color: C.sub, ...F_BODY }}
                >
                  Prix min
                </th>
                <th
                  rowSpan={2}
                  className="gsm-native-comiteworkflow-a94a06034"
                  style={{ color: C.sub, ...F_BODY }}
                >
                  Prix max
                </th>
                <th
                  colSpan={5}
                  className="gsm-native-comiteworkflow-cbc42cacb"
                  style={{ color: C.navy, background: C.infoBackground, ...F_BODY }}
                >
                  Analyse technique
                </th>
                <th
                  colSpan={5}
                  className="gsm-native-comiteworkflow-cbc42cacb"
                  style={{ color: C.warningText, background: C.warningBackground, ...F_BODY }}
                >
                  Analyse fondamentale
                </th>
              </tr>
              <tr>
                <Th>MM</Th>
                <Th>MACD</Th>
                <Th>RSI</Th>
                <Th>BOL</Th>
                <Th>Signal technique</Th>
                <Th>PER</Th>
                <Th>Rentabilité</Th>
                <Th>EVOL</Th>
                <Th>VALO</Th>
                <Th>Signal fondamental</Th>
              </tr>
            </thead>
            <tbody>
              {recommandationsFiltrees.length === 0 && (
                <tr>
                  <td
                    colSpan={16}
                    className="gsm-native-comiteworkflow-2b20f8a1c"
                    style={{ color: C.sub, ...F_BODY }}
                  >
                    Aucune recommandation ne correspond à cette combinaison de
                    filtres.
                  </td>
                </tr>
              )}
              {recommandationsFiltrees.map((r, i) => (
                <tr
                  key={r.titre}
                  style={{
                    borderTop: `1px solid ${C.line}`,
                    background: i % 2 ? C.rowAlternate : C.surfaceCard,
                  }}
                >
                  <Td className="gsm-native-comiteworkflow-54ca0b577">{r.titre}</Td>
                  <Td>
                    <Badge tone="navy">{r.marche}</Badge>
                  </Td>
                  <Td className="gsm-native-comiteworkflow-d83aa168d">{r.secteur}</Td>
                  <Td>
                    <Badge
                      tone={
                        r.sens === 'Achat'
                          ? 'teal'
                          : r.sens === 'Vente'
                          ? 'coral'
                          : 'slate'
                      }
                    >
                      {r.sens}
                    </Badge>
                  </Td>
                  <Td mono className="gsm-native-comiteworkflow-d83aa168d">
                    {Math.min(r.cours, r.objectif)} {r.devise}
                  </Td>
                  <Td mono className="gsm-native-comiteworkflow-d83aa168d">
                    {Math.max(r.cours, r.objectif)} {r.devise}
                  </Td>
                  <Td mono className="gsm-native-comiteworkflow-d83aa168d">
                    {r.technique.mm}
                  </Td>
                  <Td className="gsm-native-comiteworkflow-d83aa168d">{r.technique.macd}</Td>
                  <Td mono>{r.technique.rsi}</Td>
                  <Td className="gsm-native-comiteworkflow-d83aa168d">{r.technique.bol}</Td>
                  <Td>
                    <Badge
                      tone={
                        r.technique.signal === 'Acheter'
                          ? 'teal'
                          : r.technique.signal === 'Vendre'
                          ? 'coral'                          : r.technique.signal === 'Alléger'
                          ? 'gold'
                          : 'slate'
                      }
                    >
                      {r.technique.signal}
                    </Badge>
                  </Td>
                  <Td mono>{r.fondamentale.per.toFixed(1)}x</Td>
                  <Td mono>{r.fondamentale.rentabilite}</Td>
                  <Td mono>{r.fondamentale.evol}</Td>
                  <Td className="gsm-native-comiteworkflow-d83aa168d">{r.fondamentale.valo}</Td>
                  <Td>
                    <Badge
                      tone={
                        r.fondamentale.signal === 'Acheter' ? 'teal' : 'coral'
                      }
                    >
                      {r.fondamentale.signal}
                    </Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="gsm-native-comiteworkflow-cfb864c93">
        <Eyebrow>
          Impact des recommandations du comité précédent sur la gestion
        </Eyebrow>
        <table className="gsm-native-comiteworkflow-e1d68e235">
          <thead>
            <tr>
              <Th>Thème</Th>
              <Th>Portefeuilles</Th>
              <Th>Impact mesuré</Th>
              <Th>Statut</Th>
            </tr>
          </thead>
          <tbody>
            {IMPACT_COMITE.map((r) => (
              <tr key={r.theme} style={{ borderTop: `1px solid ${C.line}` }}>
                <Td className="gsm-native-comiteworkflow-28c01d1bb">{r.theme}</Td>
                <Td>{r.pf}</Td>
                <Td>
                  <Pct v={parseFloat(r.impact)} />
                </Td>
                <Td>
                  <Badge tone={r.statut === 'Appliqué' ? 'teal' : 'gold'}>
                    {r.statut}
                  </Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="gsm-native-comiteworkflow-cfb864c93">
        <Eyebrow>Contribution sectorielle à la valorisation générale</Eyebrow>
        <div className="gsm-native-comiteworkflow-b71d720fd">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={SECTOR_CONTRIB}
                dataKey="valeur"
                nameKey="name"
                innerRadius={55}
                outerRadius={100}
                paddingAngle={2}
                label={({ name, valeur, pct }) =>
                  `${name} · ${valeur} M · ${pct}%`
                }
              >
                {SECTOR_CONTRIB.map((_, i) => (
                  <Cell
                    key={i}
                    fill={PALETTE[i % PALETTE.length]}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, n, p) => [
                  `${v} M XOF (${p.payload.pct}%)`,
                  p.payload.name,
                ]}
                contentStyle={{
                  borderRadius: 10,
                  fontSize: 12,
                  border: `1px solid ${C.line}`,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="gsm-native-comiteworkflow-65111a05a">
            {SECTOR_CONTRIB.map((s, i) => (
              <div
                key={s.name}
                className="gsm-native-comiteworkflow-4581ce59d"
                style={F_BODY}
              >
                <span
                  className="gsm-native-comiteworkflow-7698bc5ca"
                  style={{ color: C.ink }}
                >
                  <span
                    className="gsm-native-comiteworkflow-65f8d0bc6"
                    style={{ background: PALETTE[i % PALETTE.length] }}
                  />
                  {s.name}
                </span>
                <span
                  className="gsm-native-comiteworkflow-28c01d1bb"
                  style={{ ...F_MONO, color: C.sub }}
                >
                  {s.valeur} M XOF · {s.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="gsm-native-comiteworkflow-cfb864c93">
        <Eyebrow>Exposition générale du gestionnaire</Eyebrow>
        <div className="gsm-native-comiteworkflow-c25c0ad24">
          {[
            ["Type d'actif", ASSET_MIX],
            ['Marché / devise', MARKET_MIX],
            ['Pays', COUNTRY_MIX],
            ['Secteur', SECTOR_MIX],
          ].map(([t, d]) => {
            const data = d.map((s) => ({
              ...s,
              valeurM: Math.round((totalRef * s.value) / 100 / 1_000_000),
            }));
            return (
              <div key={t}>
                <div
                  className="gsm-native-comiteworkflow-bab4b1d31"
                  style={{ color: C.sub }}
                >
                  {t}
                </div>
                <div className="gsm-native-comiteworkflow-2aa18b1b2">
                  <ResponsiveContainer width="100%" height={170}>
                    <PieChart>
                      <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={32}
                        outerRadius={62}
                        paddingAngle={2}
                        label={({ value }) => `${value}%`}
                      >
                        {data.map((_, i) => (
                          <Cell
                            key={i}
                            fill={PALETTE[i % PALETTE.length]}
                            stroke="none"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v, n, p) => [
                          `${p.payload.valeurM} M ${devise} (${v}%)`,
                          p.payload.name,
                        ]}
                        contentStyle={{
                          borderRadius: 10,
                          fontSize: 11,
                          border: `1px solid ${C.line}`,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="gsm-native-comiteworkflow-2c28f4549">
                    {data.map((s, i) => (
                      <div
                        key={s.name}
                        className="gsm-native-comiteworkflow-6d76773ae"
                        style={F_BODY}
                      >
                        <span
                          className="gsm-native-comiteworkflow-9b9b7e00d"
                          style={{ color: C.ink }}
                        >
                          <span
                            className="gsm-native-comiteworkflow-dd1aa8725"
                            style={{ background: PALETTE[i % PALETTE.length] }}
                          />
                          {s.name}
                        </span>
                        <span
                          className="gsm-native-comiteworkflow-28c01d1bb"
                          style={{ ...F_MONO, color: C.sub }}
                        >
                          {s.valeurM} M · {s.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

  return {
    Comite,
    PriseDecisions,
  };
}
