import { useState } from 'react';
import { Search } from 'lucide-react';
import { convertCurrency, fmt, fmtPrice } from '../../shared/lib/finance';
import { Badge, Btn, Card, Eyebrow, Td, Th } from '../../shared/ui/UiAtoms';
import { Breadcrumb } from '../../shared/ui/Navigation';
import { C, F_BODY, F_DISPLAY, F_MONO } from '../../shared/theme/theme';
import { scoreTechniqueWatchlist } from '../watchlist/WatchlistModel';

export function createReequilibrageScreen(dependencies) {
  const {
    CLIENTS,
    MARKETS_DATA,
    PROFILE_TYPE_LABEL,
    RECOS,
    SEUIL_REEQUILIBRAGE,
    besoinsReequilibrageClient,
    propositionReequilibrage,
    exposureOf,
  } = dependencies;

  function ReequilibrageScreen({ initial, devise = 'XOF' }) {
  const initialClient = CLIENTS.find(
    (c) => c.id === initial?.client || c.nom === initial?.client
  );
  const initialBesoins = initialClient
    ? besoinsReequilibrageClient(initialClient)
    : [];

  const [clientSelectionneId, setClientSelectionneId] = useState(
    initialClient?.id || null
  );
  const [actifSelectionne, setActifSelectionne] = useState(
    initialBesoins.some((b) => b.actif === initial?.actif)
      ? initial.actif
      : initialBesoins[0]?.actif || null
  );
  const [ordresParActif, setOrdresParActif] = useState({});
  const [filtreClient, setFiltreClient] = useState('');
  const [filtreTypePortefeuille, setFiltreTypePortefeuille] = useState('Tous');

  const tousPortefeuillesAvecBesoins = CLIENTS.map((client) => ({
    client,
    besoins: besoinsReequilibrageClient(client),
  })).filter((ligne) => ligne.besoins.length > 0);

  const typesPortefeuilleDisponibles = [
    'Tous',
    ...new Set(
      tousPortefeuillesAvecBesoins.map(
        ({ client }) => PROFILE_TYPE_LABEL[client.type] || client.type
      )
    ),
  ];

  const portefeuillesAvecBesoins = tousPortefeuillesAvecBesoins.filter(
    ({ client }) => {
      const nomCorrespond = client.nom
        .toLowerCase()
        .includes(filtreClient.trim().toLowerCase());
      const typeLibelle = PROFILE_TYPE_LABEL[client.type] || client.type;
      const typeCorrespond =
        filtreTypePortefeuille === 'Tous' ||
        typeLibelle === filtreTypePortefeuille;

      return nomCorrespond && typeCorrespond;
    }
  );

  const clientSelectionne = CLIENTS.find(
    (client) => client.id === clientSelectionneId
  );
  const besoinsSelectionnes = clientSelectionne
    ? besoinsReequilibrageClient(clientSelectionne)
    : [];

  const filtresActifs =
    Number(Boolean(filtreClient.trim())) +
    Number(filtreTypePortefeuille !== 'Tous');

  const reinitialiserFiltres = () => {
    setFiltreClient('');
    setFiltreTypePortefeuille('Tous');
  };

  const totalPropositions = portefeuillesAvecBesoins.reduce(
    (somme, ligne) => somme + ligne.besoins.length,
    0
  );
  const montantTotalAReallouer = portefeuillesAvecBesoins.reduce(
    (somme, ligne) =>
      somme +
      ligne.besoins.reduce(
        (total, besoin) =>
          total + convertCurrency(besoin.montant, ligne.client.devise, devise),
        0
      ),
    0
  );

  const ouvrirPortefeuille = (client, actif = null) => {
    const besoins = besoinsReequilibrageClient(client);
    setClientSelectionneId(client.id);
    setActifSelectionne(
      besoins.some((besoin) => besoin.actif === actif)
        ? actif
        : besoins[0]?.actif || null
    );
    setOrdresParActif({});
  };

  const afficherToutesLesPropositions = () => {
    setClientSelectionneId(null);
    setActifSelectionne(null);
    setOrdresParActif({});
  };

  const construireOrdres = (client, besoin) => {
    const operation = besoin.sens === 'Renforcer' ? 'Achat' : 'Vente';

    if (besoin.actif === 'Actions') {
      let candidats =
        besoin.sens === 'Réduire'
          ? RECOS.filter(
              (reco) =>
                reco.marche === client.marche &&
                exposureOf(client.id, reco.titre) > 0
            ).sort(
              (a, b) => scoreTechniqueWatchlist(a) - scoreTechniqueWatchlist(b)
            )
          : RECOS.filter(
              (reco) => reco.marche === client.marche && reco.sens === 'Achat'
            ).sort(
              (a, b) => scoreTechniqueWatchlist(b) - scoreTechniqueWatchlist(a)
            );

      if (candidats.length === 0 && besoin.sens === 'Renforcer') {
        candidats = RECOS.filter((reco) => reco.sens === 'Achat').sort(
          (a, b) => scoreTechniqueWatchlist(b) - scoreTechniqueWatchlist(a)
        );
      }

      const selection = candidats.slice(0, 2);
      if (selection.length === 0) return [];

      const montantParOrdreClient = besoin.montant / selection.length;
      return selection.map((reco) => {
        const montantDansDeviseInstrument = convertCurrency(
          montantParOrdreClient,
          client.devise,
          reco.devise
        );

        return {
          titre: reco.titre,
          operation,
          marche: reco.marche,
          devise: reco.devise,
          prix: reco.cours,
          quantite: Math.max(
            1,
            Math.round(montantDansDeviseInstrument / reco.cours)
          ),
          montant: Math.round(montantDansDeviseInstrument),
        };
      });
    }

    if (
      besoin.actif === 'Obl. souveraines' ||
      besoin.actif === 'Obl. privées'
    ) {
      let candidats = MARKETS_DATA.filter(
        (instrument) =>
          instrument.type === 'Obligation' &&
          instrument.marche === client.marche
      );
      if (candidats.length === 0) {
        candidats = MARKETS_DATA.filter(
          (instrument) => instrument.type === 'Obligation'
        );
      }

      const instrument = candidats[0];
      if (!instrument) return [];

      const montantDansDeviseInstrument = convertCurrency(
        besoin.montant,
        client.devise,
        instrument.devise
      );

      return [
        {
          titre: instrument.nom,
          operation,
          marche: instrument.marche,
          devise: instrument.devise,
          prix: instrument.cours,
          quantite: Math.max(
            1,
            Math.round(montantDansDeviseInstrument / instrument.cours)
          ),
          montant: Math.round(montantDansDeviseInstrument),
        },
      ];
    }

    return [
      {
        titre: 'Compte espèces / support monétaire',        operation:
          besoin.sens === 'Renforcer'
            ? 'Constitution de liquidité'
            : 'Réinvestissement',
        marche: client.marche,
        devise: client.devise,
        prix: null,
        quantite: null,
        montant: besoin.montant,
      },
    ];
  };

  const genererOrdres = (client, besoin) => {
    setActifSelectionne(besoin.actif);
    setOrdresParActif((courant) => ({
      ...courant,
      [besoin.actif]: construireOrdres(client, besoin),
    }));
  };

  const tonePriorite = (priorite) => {
    if (priorite === 'Haute') return 'coral';
    if (priorite === 'Moyenne') return 'gold';
    return 'slate';
  };

  if (!clientSelectionne) {
    return (
      <div className="gsm-native-reequilibrage-a062e1c1b">
        <Breadcrumb items={['Accueil', 'Rééquilibrage']} />

        <div>
          <h2
            className="gsm-native-reequilibrage-d97b9257c"
            style={{ ...F_DISPLAY, color: C.ink }}
          >
            Rééquilibrage — propositions pour tous les portefeuilles
          </h2>
          <div className="gsm-native-reequilibrage-ff501961b" style={{ color: C.sub, ...F_BODY }}>
            Seuls les écarts strictement supérieurs à {SEUIL_REEQUILIBRAGE}{' '}
            points par rapport à l'allocation cible sont considérés comme
            nécessitant un rééquilibrage.
          </div>
        </div>

        <Card className="gsm-native-reequilibrage-5215b2bbe" style={{ borderColor: C.navy }}>
          <div className="gsm-native-reequilibrage-6fd0983c4">
            <div className="gsm-native-reequilibrage-24a53a013">
              <div>
                <label
                  className="gsm-native-reequilibrage-63c92db45"
                  style={{ color: C.sub }}
                >
                  Nom du client
                </label>
                <div
                  className="gsm-native-reequilibrage-49b390d1b"
                  style={{ borderColor: C.line, background: C.surfaceCard }}
                >
                  <Search size={14} color={C.sub} />
                  <input name="gsm-reequilibrage-271" aria-label="Rechercher un client…"
                    type="text"
                    value={filtreClient}
                    onChange={(e) => setFiltreClient(e.target.value)}
                    placeholder="Rechercher un client…"
                    className="gsm-native-reequilibrage-888f66dc5"
                    style={F_BODY}
                  />
                </div>
              </div>

              <div>
                <label
                  className="gsm-native-reequilibrage-63c92db45"
                  style={{ color: C.sub }}
                >
                  Type de portefeuille
                </label>
                <select name="gsm-reequilibrage-289" aria-label="Sélection reequilibrage"
                  value={filtreTypePortefeuille}
                  onChange={(e) => setFiltreTypePortefeuille(e.target.value)}
                  className="gsm-native-reequilibrage-6e7cedb4f"
                  style={{ borderColor: C.line, background: C.surfaceCard, ...F_BODY }}
                >
                  {typesPortefeuilleDisponibles.map((type) => (
                    <option key={type} value={type}>
                      {type === 'Tous' ? 'Tous les types' : type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="gsm-native-reequilibrage-ce29ecb4a">
              <Badge tone="navy">Devise principale : {devise}</Badge>
              <Badge tone="gold">
                {portefeuillesAvecBesoins.length} portefeuille(s)
              </Badge>
              <Badge tone={filtresActifs > 0 ? 'teal' : 'slate'}>
                {filtresActifs} filtre(s) actif(s)
              </Badge>
              {filtresActifs > 0 && (
                <button
                  type="button"
                  onClick={reinitialiserFiltres}
                  className="gsm-native-reequilibrage-09f88170e"
                  style={{
                    borderColor: C.line,
                    color: C.navy,
                    background: C.surfaceCard,
                  }}
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>
          <div className="gsm-native-reequilibrage-856b071e7" style={{ color: C.sub }}>
            Les filtres s'appliquent instantanément aux portefeuilles qui
            dépassent le seuil de rééquilibrage.
          </div>
        </Card>

        <div className="gsm-native-reequilibrage-ad8b2b481">
          <Card className="gsm-native-reequilibrage-5215b2bbe">
            <div className="gsm-native-reequilibrage-0c9c73cfe" style={{ color: C.sub }}>
              Portefeuilles à rééquilibrer
            </div>
            <div className="gsm-native-reequilibrage-cab5cf07e" style={F_DISPLAY}>
              {portefeuillesAvecBesoins.length}
            </div>
            <div className="gsm-native-reequilibrage-ff501961b" style={{ color: C.sub }}>
              sur {tousPortefeuillesAvecBesoins.length} portefeuille(s) à
              traiter
            </div>
          </Card>
          <Card className="gsm-native-reequilibrage-5215b2bbe">
            <div className="gsm-native-reequilibrage-0c9c73cfe" style={{ color: C.sub }}>
              Propositions affichées
            </div>
            <div className="gsm-native-reequilibrage-cab5cf07e" style={F_DISPLAY}>
              {totalPropositions}
            </div>
            <div className="gsm-native-reequilibrage-ff501961b" style={{ color: C.sub }}>
              après application des filtres
            </div>
          </Card>
          <Card className="gsm-native-reequilibrage-5215b2bbe">
            <div className="gsm-native-reequilibrage-0c9c73cfe" style={{ color: C.sub }}>
              Montants indicatifs à réallouer
            </div>
            <div className="gsm-native-reequilibrage-bb2d2c67f" style={F_DISPLAY}>
              {fmt(Math.round(montantTotalAReallouer))} {devise}
            </div>
            <div className="gsm-native-reequilibrage-ff501961b" style={{ color: C.sub }}>
              Conversion dans la devise principale sélectionnée sur l'accueil
            </div>
          </Card>
        </div>

        {tousPortefeuillesAvecBesoins.length === 0 && (
          <Card className="gsm-native-reequilibrage-3e1ebd256">
            <Badge tone="teal">Toutes les allocations sont conformes</Badge>
            <div className="gsm-native-reequilibrage-da9c0c6eb" style={{ color: C.sub }}>
              Aucun portefeuille ne dépasse le seuil de rééquilibrage.
            </div>
          </Card>
        )}

        {tousPortefeuillesAvecBesoins.length > 0 &&
          portefeuillesAvecBesoins.length === 0 && (
            <Card className="gsm-native-reequilibrage-3e1ebd256">
              <Badge tone="gold">Aucun résultat</Badge>
              <div className="gsm-native-reequilibrage-da9c0c6eb" style={{ color: C.sub }}>
                Aucun portefeuille à rééquilibrer ne correspond au nom ou au
                type sélectionné.
              </div>
              <div className="gsm-native-reequilibrage-956eab455">
                <Btn tone="ghost" onClick={reinitialiserFiltres}>
                  Réinitialiser les filtres
                </Btn>
              </div>
            </Card>
          )}

        {portefeuillesAvecBesoins.map(({ client, besoins }) => (
          <Card
            key={client.id}
            className="gsm-native-reequilibrage-44cda753c"            style={{ borderColor: C.gold }}
          >
            <div
              className="gsm-native-reequilibrage-9bd69c80e"
              style={{ background: C.warningBackground }}
            >
              <div>
                <div
                  className="gsm-native-reequilibrage-4c30a7306"
                  style={{ ...F_DISPLAY, color: C.ink }}
                >
                  {client.nom}
                </div>
                <div className="gsm-native-reequilibrage-c3303ff68">
                  <Badge tone="navy">
                    {client.marche} · {client.devise}
                  </Badge>
                  <Badge tone="slate">
                    {PROFILE_TYPE_LABEL[client.type] || client.type}
                  </Badge>
                  <Badge tone="slate">{client.profilRisque}</Badge>
                  <Badge tone="gold">{besoins.length} proposition(s)</Badge>
                </div>
              </div>
              <button
                type="button"
                onClick={() => ouvrirPortefeuille(client, besoins[0]?.actif)}
                className="gsm-native-reequilibrage-576fcd655"
                style={{ background: C.navy, color: C.surfaceCard, ...F_BODY }}
              >
                Ouvrir le détail →
              </button>
            </div>

            <div className="gsm-table-scroll">
              <table className="gsm-table--banking gsm-native-reequilibrage-4c859e3e2" style={{ minWidth: 1180 }}>
                <thead style={{ background: C.surfaceElevated }}>
                  <tr>
                    <Th>Classe d'actifs</Th>
                    <Th>Répartition par classe d'actifs</Th>
                    <Th>Allocation cible</Th>
                    <Th>Écart</Th>
                    <Th>Action proposée</Th>
                    <Th>Montant indicatif ({devise})</Th>
                    <Th>Priorité</Th>
                    <Th>Proposition</Th>
                  </tr>
                </thead>
                <tbody>
                  {besoins.map((besoin, index) => (
                    <tr
                      key={besoin.actif}
                      style={{
                        borderTop: `1px solid ${C.line}`,
                        background: index % 2 ? C.rowAlternate : C.surfaceCard,
                      }}
                    >
                      <Td className="gsm-native-reequilibrage-e9a9b46f5">
                        {besoin.actif}
                      </Td>
                      <Td mono>{besoin.actuel.toFixed(1)}%</Td>
                      <Td mono>{besoin.cible.toFixed(1)}%</Td>
                      <Td mono>
                        <Badge tone="coral">
                          {besoin.ecart > 0 ? '+' : ''}
                          {besoin.ecart.toFixed(1)} pts
                        </Badge>
                      </Td>
                      <Td>
                        <Badge
                          tone={besoin.sens === 'Renforcer' ? 'teal' : 'coral'}
                        >
                          {besoin.sens}
                        </Badge>
                      </Td>
                      <Td mono className="gsm-native-reequilibrage-21bb1315f">
                        <div className="gsm-native-reequilibrage-b84b307c3">
                          {fmt(
                            Math.round(
                              convertCurrency(
                                besoin.montant,
                                client.devise,
                                devise
                              )
                            )
                          )}{' '}
                          {devise}
                        </div>
                        {client.devise !== devise && (
                          <div
                            className="gsm-native-reequilibrage-91dfaab6d"
                            style={{ color: C.sub, ...F_BODY }}
                          >
                            {fmt(besoin.montant)} {client.devise} avant
                            conversion
                          </div>
                        )}
                      </Td>
                      <Td>
                        <Badge tone={tonePriorite(besoin.priorite)}>
                          {besoin.priorite}
                        </Badge>
                      </Td>
                      <Td>
                        <span className="gsm-native-reequilibrage-0c9c73cfe" style={{ color: C.sub }}>
                          {propositionReequilibrage(besoin)}
                        </span>
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

  return (
    <div className="gsm-native-reequilibrage-a062e1c1b">
      <Breadcrumb items={['Accueil', 'Rééquilibrage', clientSelectionne.nom]} />

      <div className="gsm-native-reequilibrage-57a04bcef">
        <div>
          <h2
            className="gsm-native-reequilibrage-d97b9257c"
            style={{ ...F_DISPLAY, color: C.ink }}
          >
            Proposition de rééquilibrage — {clientSelectionne.nom}
          </h2>
          <div className="gsm-native-reequilibrage-c3303ff68">
            <Badge tone="navy">
              {clientSelectionne.marche} · {clientSelectionne.devise}
            </Badge>
            <Badge tone="slate">
              {PROFILE_TYPE_LABEL[clientSelectionne.type] ||
                clientSelectionne.type}
            </Badge>
            <Badge tone="slate">{clientSelectionne.profilRisque}</Badge>
            <Badge tone="gold">Affichage : {devise}</Badge>
            <Badge tone="gold">
              {besoinsSelectionnes.length} écart(s) à traiter
            </Badge>
          </div>
        </div>
        <Btn tone="ghost" onClick={afficherToutesLesPropositions}>
          Voir toutes les propositions
        </Btn>
      </div>

      {besoinsSelectionnes.length === 0 ? (
        <Card className="gsm-native-reequilibrage-3e1ebd256" style={{ borderColor: C.teal }}>
          <Badge tone="teal">Allocation conforme</Badge>
          <div className="gsm-native-reequilibrage-da9c0c6eb" style={{ color: C.sub }}>
            Ce portefeuille ne présente aucun écart supérieur à{' '}
            {SEUIL_REEQUILIBRAGE} points.
          </div>
        </Card>
      ) : (
        <>
          <div className="gsm-native-reequilibrage-a41262c26">
            {Object.keys(clientSelectionne.alloc).map((actif) => {
              const besoin = besoinsSelectionnes.find(
                (item) => item.actif === actif
              );
              const selectionne = actifSelectionne === actif;

              return (
                <Card
                  key={actif}
                  onClick={
                    besoin
                      ? () => {
                          setActifSelectionne(actif);
                        }
                      : undefined
                  }
                  className="gsm-native-reequilibrage-5215b2bbe"
                  style={{
                    borderColor: selectionne
                      ? C.gold
                      : besoin
                      ? C.coral
                      : C.line,
                    borderWidth: selectionne ? 2 : 1,
                    opacity: besoin ? 1 : 0.75,
                  }}
                >
                  <div                    className="gsm-native-reequilibrage-81f275185"
                    style={{ color: C.sub }}
                  >
                    {actif}
                  </div>
                  <div className="gsm-native-reequilibrage-54e7fc69e" style={F_DISPLAY}>
                    {clientSelectionne.alloc[actif]}%
                  </div>
                  {besoin ? (
                    <Badge tone="coral">
                      {besoin.ecart > 0 ? '+' : ''}
                      {besoin.ecart.toFixed(1)} pts vs cible
                    </Badge>
                  ) : (
                    <Badge tone="teal">Conforme</Badge>
                  )}
                </Card>
              );
            })}
          </div>

          <div className="gsm-native-reequilibrage-dac867669">
            {besoinsSelectionnes.map((besoin) => {
              const ordres = ordresParActif[besoin.actif];
              const selectionne = actifSelectionne === besoin.actif;

              return (
                <Card
                  key={besoin.actif}
                  className="gsm-native-reequilibrage-ace2f1f95"
                  style={{
                    borderColor: selectionne ? C.gold : C.line,
                    borderWidth: selectionne ? 2 : 1,
                  }}
                >
                  <div className="gsm-native-reequilibrage-57a04bcef">
                    <div>
                      <Eyebrow>Recommandation — {besoin.actif}</Eyebrow>
                      <div className="gsm-native-reequilibrage-0d3bb6799">
                        <Badge
                          tone={besoin.sens === 'Renforcer' ? 'teal' : 'coral'}
                        >
                          {besoin.sens}
                        </Badge>
                        <Badge tone={tonePriorite(besoin.priorite)}>
                          Priorité {besoin.priorite}
                        </Badge>
                        <span className="gsm-native-reequilibrage-0c9c73cfe" style={{ color: C.sub }}>
                          Actuel {besoin.actuel}% · Cible {besoin.cible}% ·
                          Écart {besoin.ecart > 0 ? '+' : ''}
                          {besoin.ecart.toFixed(1)} pts
                        </span>
                      </div>
                    </div>
                    <div className="gsm-native-reequilibrage-0b28802ca">
                      <div className="gsm-native-reequilibrage-0c9c73cfe" style={{ color: C.sub }}>
                        Montant indicatif à réallouer
                      </div>
                      <div className="gsm-native-reequilibrage-d309754e6" style={F_DISPLAY}>
                        {fmt(
                          Math.round(
                            convertCurrency(
                              besoin.montant,
                              clientSelectionne.devise,
                              devise
                            )
                          )
                        )}{' '}
                        {devise}
                      </div>
                      {clientSelectionne.devise !== devise && (
                        <div
                          className="gsm-native-reequilibrage-91dfaab6d"
                          style={{ color: C.sub }}
                        >
                          {fmt(besoin.montant)} {clientSelectionne.devise} avant
                          conversion
                        </div>
                      )}
                    </div>
                  </div>

                  <p
                    className="gsm-native-reequilibrage-da9c0c6eb"
                    style={{ color: C.ink, ...F_BODY }}
                  >
                    {propositionReequilibrage(besoin)}
                  </p>

                  <div className="gsm-native-reequilibrage-956eab455">
                    <Btn
                      onClick={() => genererOrdres(clientSelectionne, besoin)}
                    >
                      Générer les ordres proposés
                    </Btn>
                  </div>

                  {ordres && ordres.length > 0 && (
                    <div className="gsm-table-scroll gsm-native-reequilibrage-3a044fd9f">
                      <table className="gsm-table--banking gsm-native-reequilibrage-4c859e3e2" style={{ minWidth: 850 }}>
                        <thead style={{ background: C.surfaceElevated }}>
                          <tr>
                            <Th>Instrument / support</Th>
                            <Th>Opération</Th>
                            <Th>Marché</Th>
                            <Th>Montant indicatif ({devise})</Th>
                            <Th>Quantité</Th>
                            <Th>Prix indicatif</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {ordres.map((ordre, index) => (
                            <tr
                              key={`${besoin.actif}-${ordre.titre}-${index}`}
                              style={{
                                borderTop: `1px solid ${C.line}`,
                                background: index % 2 ? C.rowAlternate : C.surfaceCard,
                              }}
                            >
                              <Td className="gsm-native-reequilibrage-e9a9b46f5">
                                {ordre.titre}
                              </Td>
                              <Td>
                                <Badge
                                  tone={
                                    ordre.operation === 'Achat' ||
                                    ordre.operation ===
                                      'Constitution de liquidité'
                                      ? 'teal'
                                      : 'coral'
                                  }
                                >
                                  {ordre.operation}
                                </Badge>
                              </Td>
                              <Td>
                                <Badge tone="navy">{ordre.marche}</Badge>
                              </Td>
                              <Td mono className="gsm-native-reequilibrage-21bb1315f">
                                <div className="gsm-native-reequilibrage-b84b307c3">
                                  {fmt(
                                    Math.round(
                                      convertCurrency(
                                        ordre.montant,
                                        ordre.devise,
                                        devise
                                      )
                                    )
                                  )}{' '}
                                  {devise}
                                </div>
                                {ordre.devise !== devise && (
                                  <div
                                    className="gsm-native-reequilibrage-91dfaab6d"
                                    style={{ color: C.sub, ...F_BODY }}
                                  >
                                    {fmt(ordre.montant)} {ordre.devise} en
                                    devise de négociation
                                  </div>
                                )}
                              </Td>
                              <Td mono>{ordre.quantite ?? '—'}</Td>
                              <Td mono className="gsm-native-reequilibrage-21bb1315f">
                                {ordre.prix == null
                                  ? '—'
                                  : `${fmtPrice(ordre.prix)} ${ordre.devise}`}
                              </Td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {ordres && ordres.length === 0 && (
                    <div className="gsm-native-reequilibrage-9e6114750" style={{ color: C.sub }}>
                      Aucun instrument de démonstration suffisamment pertinent
                      n'est disponible pour produire un ordre automatique sur
                      cette classe d'actifs.
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

  return { ReequilibrageScreen };
}
