import { useState } from 'react';
import { convertCurrency } from '../../shared/lib/finance';
import { parseIsoLocalDate } from '../../shared/lib/dateUtils';

export function createClientCashflowsModel(dependencies) {
  const {
    CLIENT_CASHFLOWS,
    CLIENT_GESTION_LIBRE,
    CLIENT_OPEN_ORDER_STATUSES,
    LIQUIDITY_HISTORY_MIN_DATE,
    buildAnatomieExportPayload,
    clientAssetClass,
    clientAvailableCash,
    clientLineValue,
    clientMarket,
    clientPortfolioValue,
    clientReservedCash,
    liquidityHistoricalAmount,
    parseFR,
  } = dependencies;

  function useClientCashflowsModel({ devise, orders = [] }) {
  const portefeuilles = CLIENT_GESTION_LIBRE.portefeuilles;
  const [filtrePays, setFiltrePays] = useState('Tous');
  const [filtreMarche, setFiltreMarche] = useState('Tous');
  const [filtreSgi, setFiltreSgi] = useState('Toutes');
  const [filtreEncoursMin, setFiltreEncoursMin] = useState('');
  const [filtreLiquiditeActuelleMin, setFiltreLiquiditeActuelleMin] =
    useState('');
  const [filtreEntrees30JMin, setFiltreEntrees30JMin] = useState('');
  const [filtreSorties30JMin, setFiltreSorties30JMin] = useState('');
  const [filtrePrevisionnelMin, setFiltrePrevisionnelMin] = useState('');
  const [
    portefeuilleLiquiditeSelectionneId,
    setPortefeuilleLiquiditeSelectionneId,
  ] = useState(portefeuilles[0]?.id || '');
  const [vueLiquiditeDetail, setVueLiquiditeDetail] = useState('origines');
  const [dateSituationLiquiditeClient, setDateSituationLiquiditeClient] =
    useState('2026-08-13');

  const dateReferenceIsoClient = '2026-08-13';
  const dateReference = parseIsoLocalDate(dateReferenceIsoClient);
  const dateSituationObjClient = parseIsoLocalDate(
    dateSituationLiquiditeClient
  );
  const finHorizon = new Date(dateReference);
  finHorizon.setDate(finHorizon.getDate() + 30);

  const formatDateFR = (date) =>
    new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);

  const fluxRevenus30J = CLIENT_CASHFLOWS.flatMap((flux) => {
    const dateFlux = parseFR(flux.date);
    if (dateFlux < dateReference || dateFlux > finHorizon) return [];
    const pf = portefeuilles.find(
      (portefeuille) => portefeuille.id === flux.portefeuilleId
    );
    if (!pf) return [];
    return [
      {
        id: flux.id,
        portefeuilleId: pf.id,
        date: flux.date,
        dateObj: dateFlux,
        nature: flux.type,
        libelle: flux.instrument,
        sens: 'Entrée',
        montant: flux.montant,
        devise: flux.devise,
        statut: flux.statut,
      },
    ];
  });

  const fluxOrdres30J = orders
    .filter((ordre) => CLIENT_OPEN_ORDER_STATUSES.includes(ordre.statut))
    .map((ordre, index) => {
      const pf = portefeuilles.find(
        (portefeuille) => portefeuille.id === ordre.portefeuilleId
      );
      const dateFlux = new Date(dateReference);
      dateFlux.setDate(dateFlux.getDate() + 2 + index);
      return {
        id: `forecast-${ordre.id}`,
        portefeuilleId: ordre.portefeuilleId,
        date: formatDateFR(dateFlux),
        dateObj: dateFlux,
        nature: "Règlement d'ordre",
        libelle: `${ordre.sens} ${ordre.instrument}`,
        sens: ordre.sens === 'Achat' ? 'Sortie' : 'Entrée',
        montant: Number(ordre.qte || 0) * Number(ordre.prix || 0),
        devise: ordre.devise || pf?.devise || devise,
        statut: ordre.statut,
      };
    });

  const flux30J = [...fluxRevenus30J, ...fluxOrdres30J].sort(
    (a, b) => a.dateObj - b.dateObj
  );

  const synthesePortefeuilles = portefeuilles.map((portefeuille) => {
    const encours = clientPortfolioValue(portefeuille);
    const liquiditeActuelle = Number(portefeuille.compteEspeces || 0);
    const fluxPf = flux30J.filter(
      (flux) => flux.portefeuilleId === portefeuille.id
    );
    const entrees30J = fluxPf
      .filter((flux) => flux.sens === 'Entrée')
      .reduce(
        (somme, flux) =>
          somme +
          convertCurrency(flux.montant, flux.devise, portefeuille.devise),
        0
      );
    const sorties30J = fluxPf
      .filter((flux) => flux.sens === 'Sortie')
      .reduce(
        (somme, flux) =>
          somme +
          convertCurrency(flux.montant, flux.devise, portefeuille.devise),
        0
      );
    const liquiditePrevisionnelle = Math.max(
      0,
      liquiditeActuelle + entrees30J - sorties30J
    );
    const liquiditeReservee = clientReservedCash(portefeuille, orders);
    const liquiditeDisponibleOrdres = clientAvailableCash(portefeuille, orders);

    return {
      portefeuille,
      encours,
      liquiditeActuelle,
      liquiditeReservee,
      liquiditeDisponibleOrdres,
      entrees30J,
      sorties30J,
      liquiditePrevisionnelle,
      ratioLiquidite: encours > 0 ? (liquiditeActuelle / encours) * 100 : 0,
      ratioPrevisionnel:
        encours > 0 ? (liquiditePrevisionnelle / encours) * 100 : 0,
    };
  });

  const paysDisponibles = [
    'Tous',
    ...new Set(portefeuilles.map((portefeuille) => portefeuille.pays)),
  ];
  const marchesDisponibles = [
    'Tous',
    ...new Set(portefeuilles.map((portefeuille) => portefeuille.marche)),
  ];
  const sgisDisponibles = [
    'Toutes',
    ...new Set(
      portefeuilles
        .filter(
          (portefeuille) =>
            (filtrePays === 'Tous' || portefeuille.pays === filtrePays) &&
            (filtreMarche === 'Tous' || portefeuille.marche === filtreMarche)
        )
        .map((portefeuille) => portefeuille.sgi)
    ),
  ];

  const lignesFiltrees = synthesePortefeuilles.filter((ligne) => {
    const { portefeuille } = ligne;
    const encoursVue = convertCurrency(
      ligne.encours,
      portefeuille.devise,
      devise
    );
    const liquiditeVue = convertCurrency(
      ligne.liquiditeActuelle,
      portefeuille.devise,
      devise
    );
    const entreesVue = convertCurrency(
      ligne.entrees30J,
      portefeuille.devise,
      devise
    );
    const sortiesVue = convertCurrency(
      ligne.sorties30J,
      portefeuille.devise,
      devise
    );
    const previsionnelVue = convertCurrency(
      ligne.liquiditePrevisionnelle,
      portefeuille.devise,
      devise
    );

    const seuilEncours =
      filtreEncoursMin === '' ? null : Number(filtreEncoursMin);
    const seuilLiquidite =
      filtreLiquiditeActuelleMin === ''
        ? null
        : Number(filtreLiquiditeActuelleMin);
    const seuilEntrees =
      filtreEntrees30JMin === '' ? null : Number(filtreEntrees30JMin);
    const seuilSorties =
      filtreSorties30JMin === '' ? null : Number(filtreSorties30JMin);
    const seuilPrevisionnel =
      filtrePrevisionnelMin === '' ? null : Number(filtrePrevisionnelMin);

    return (
      (filtrePays === 'Tous' || portefeuille.pays === filtrePays) &&
      (filtreMarche === 'Tous' || portefeuille.marche === filtreMarche) &&
      (filtreSgi === 'Toutes' || portefeuille.sgi === filtreSgi) &&
      (seuilEncours === null || encoursVue > seuilEncours) &&
      (seuilLiquidite === null || liquiditeVue > seuilLiquidite) &&
      (seuilEntrees === null || entreesVue > seuilEntrees) &&
      (seuilSorties === null || sortiesVue > seuilSorties) &&
      (seuilPrevisionnel === null || previsionnelVue > seuilPrevisionnel)
    );
  });

  const idsFiltres = new Set(
    lignesFiltrees.map((ligne) => ligne.portefeuille.id)
  );
  const fluxFiltres = flux30J.filter((flux) =>
    idsFiltres.has(flux.portefeuilleId)
  );
  const revenusFiltres = CLIENT_CASHFLOWS.filter((flux) =>
    idsFiltres.has(flux.portefeuilleId)
  );

  const totalEncours = lignesFiltrees.reduce(
    (somme, ligne) =>
      somme + convertCurrency(ligne.encours, ligne.portefeuille.devise, devise),
    0
  );
  const totalCash = lignesFiltrees.reduce(
    (somme, ligne) =>
      somme +
      convertCurrency(
        ligne.liquiditeActuelle,
        ligne.portefeuille.devise,
        devise
      ),
    0
  );
  const totalCashReserve = lignesFiltrees.reduce(
    (somme, ligne) =>
      somme +
      convertCurrency(
        ligne.liquiditeReservee,
        ligne.portefeuille.devise,
        devise
      ),
    0
  );
  const totalEntrees30J = lignesFiltrees.reduce(
    (somme, ligne) =>
      somme +
      convertCurrency(ligne.entrees30J, ligne.portefeuille.devise, devise),
    0
  );
  const totalSorties30J = lignesFiltrees.reduce(
    (somme, ligne) =>
      somme +
      convertCurrency(ligne.sorties30J, ligne.portefeuille.devise, devise),
    0
  );
  const totalPrevisionnel = lignesFiltrees.reduce(
    (somme, ligne) =>      somme +
      convertCurrency(
        ligne.liquiditePrevisionnelle,
        ligne.portefeuille.devise,
        devise
      ),
    0
  );
  const totalRevenus = revenusFiltres.reduce(
    (somme, flux) => somme + convertCurrency(flux.montant, flux.devise, devise),
    0
  );

  const filtresActifs =
    Number(filtrePays !== 'Tous') +
    Number(filtreMarche !== 'Tous') +
    Number(filtreSgi !== 'Toutes') +
    Number(filtreEncoursMin !== '') +
    Number(filtreLiquiditeActuelleMin !== '') +
    Number(filtreEntrees30JMin !== '') +
    Number(filtreSorties30JMin !== '') +
    Number(filtrePrevisionnelMin !== '');

  const reinitialiserFiltres = () => {
    setFiltrePays('Tous');
    setFiltreMarche('Tous');
    setFiltreSgi('Toutes');
    setFiltreEncoursMin('');
    setFiltreLiquiditeActuelleMin('');
    setFiltreEntrees30JMin('');
    setFiltreSorties30JMin('');
    setFiltrePrevisionnelMin('');
  };

  const filtresMontants = [
    {
      key: 'encours',
      label: 'Encours (supérieur à)',
      value: filtreEncoursMin,
      setter: setFiltreEncoursMin,
    },
    {
      key: 'liquidite',
      label: 'Liquidité actuelle (supérieur à)',
      value: filtreLiquiditeActuelleMin,
      setter: setFiltreLiquiditeActuelleMin,
    },
    {
      key: 'entrees',
      label: 'Entrées 30 j (supérieur à)',
      value: filtreEntrees30JMin,
      setter: setFiltreEntrees30JMin,
    },
    {
      key: 'sorties',
      label: 'Sorties 30 j (supérieur à)',
      value: filtreSorties30JMin,
      setter: setFiltreSorties30JMin,
    },
    {
      key: 'previsionnel',
      label: 'Liquidité prévisionnelle (supérieur à)',
      value: filtrePrevisionnelMin,
      setter: setFiltrePrevisionnelMin,
    },
  ];

  const repartitionMontants = (total, definitions) => {
    let cumule = 0;
    return definitions.map((definition, index) => {
      const dernier = index === definitions.length - 1;
      const montant = dernier
        ? Math.max(0, total - cumule)
        : Math.round((total * definition.poids) / 100);
      cumule += montant;
      return { ...definition, montant };
    });
  };

  const detailsLiquidite = synthesePortefeuilles.map((ligne, index) => {
    const portefeuille = ligne.portefeuille;
    const total = liquidityHistoricalAmount(
      ligne.liquiditeActuelle,
      `${portefeuille.id}-liquidite`,
      dateSituationObjClient,
      dateReference,
      1
    );
    const entreesSituation = liquidityHistoricalAmount(
      ligne.entrees30J,
      `${portefeuille.id}-entrees`,
      dateSituationObjClient,
      dateReference,
      0.55
    );
    const sortiesSituation = liquidityHistoricalAmount(
      ligne.sorties30J,
      `${portefeuille.id}-sorties`,
      dateSituationObjClient,
      dateReference,
      0.7
    );
    const liquiditePrevisionnelleSituation = Math.max(
      0,
      total + entreesSituation - sortiesSituation
    );
    const ratioLiquiditeSituation =
      ligne.encours > 0 ? (total / ligne.encours) * 100 : 0;
    const ratioPrevisionnelSituation =
      ligne.encours > 0
        ? (liquiditePrevisionnelleSituation / ligne.encours) * 100
        : 0;
    const dateDernierDepot = new Date(dateSituationObjClient);
    dateDernierDepot.setDate(dateDernierDepot.getDate() - (5 + (index % 19)));

    const origines = repartitionMontants(total, [
      {
        numero: '1',
        libelle: 'Dépôt d’ouverture',
        description:
          'Liquidité issue de l’ouverture du compte ou du premier investissement.',
        responsable: 'Client / SGI',
        poids: 8,
      },
      {
        numero: '2',
        libelle: 'Dernier dépôt',
        description: 'Dernier versement enregistré sur le compte espèces.',
        responsable: 'Système',
        poids: 18,
      },
      {
        numero: '3',
        libelle: 'Amortissements ESV',
        description:
          'Capital remboursé sur les titres arrivant à échéance partielle ou totale.',
        responsable: 'Système',
        poids: 16,
      },
      {
        numero: '4',
        libelle: 'Intérêts / coupons ESV',
        description: 'Intérêts et coupons crédités sur le compte.',
        responsable: 'Système',
        poids: 8,
      },
      {
        numero: '5',
        libelle: 'Dividendes',
        description: 'Liquidité issue des dividendes encaissés.',
        responsable: 'Système',
        poids: 12,
      },
      {
        numero: '6',
        libelle: 'Cession de titre — retrait',
        description: 'Produit de cession destiné à un retrait de fonds.',
        responsable: 'Client',
        poids: 8,
      },
      {
        numero: '7',
        libelle: 'Cession de titre — réinvestissement',
        description:
          'Produit de cession que vous destinez à un nouvel investissement.',
        responsable: 'Client',
        poids: 18,
      },
      {
        numero: '8',
        libelle: 'Part à ne pas réinvestir',
        description:
          'Montant que vous souhaitez conserver durablement en espèces.',
        responsable: 'Client',
        poids: 4,
      },
      {
        numero: '9',
        libelle: 'Dépôt pour opération primaire',
        description:
          'Dépôt réalisé pour une opportunité spécifique sur le marché primaire.',
        responsable: 'Client',
        poids: 8,
      },
    ]);

    const ordresAchatOuverts = orders.filter(
      (ordre) =>
        ordre.portefeuilleId === portefeuille.id &&
        ordre.sens === 'Achat' &&
        CLIENT_OPEN_ORDER_STATUSES.includes(ordre.statut) &&
        (!ordre.date || parseFR(ordre.date) <= dateSituationObjClient)
    );
    const reserveActions = ordresAchatOuverts
      .filter(
        (ordre) =>
          (clientMarket(ordre.instrument)?.type || 'Action') === 'Action'
      )
      .reduce(
        (somme, ordre) =>
          somme + Number(ordre.qte || 0) * Number(ordre.prix || 0),
        0
      );
    const reserveObligations = ordresAchatOuverts
      .filter((ordre) => clientMarket(ordre.instrument)?.type === 'Obligation')
      .reduce(
        (somme, ordre) =>
          somme + Number(ordre.qte || 0) * Number(ordre.prix || 0),
        0
      );
    const reserveOrdres = Math.min(total, reserveActions + reserveObligations);

    const definitionsFixes = [
      {
        numero: '11',
        libelle: 'Retrait en cours',
        groupe: 'Bloquée / réservée',
        responsable: 'Client / SGI',
        poids: 4,
      },
      {
        numero: '12',
        libelle: 'Autre liquidité à investir',
        groupe: 'À investir',
        responsable: 'Système',
        poids: 18,
      },
      {
        numero: '13',
        libelle: 'Achat marché monétaire — OAT',
        groupe: 'Bloquée / réservée',
        responsable: 'Client',
        poids: 6,
      },
      {
        numero: '14',
        libelle: 'Achat marché monétaire — BAT',
        groupe: 'Bloquée / réservée',
        responsable: 'Client',
        poids: 5,
      },
      {
        numero: '15',
        libelle: 'Achat marché financier — OPV / APE',
        groupe: 'Bloquée / réservée',
        responsable: 'Client',
        poids: 5,
      },
      {
        numero: '17',        libelle: 'ESV — Amortissements bloqués',
        groupe: 'Bloquée / réservée',
        responsable: 'Client / SGI',
        poids: 4,
      },
      {
        numero: '18',
        libelle: 'ESV — Intérêts bloqués',
        groupe: 'Bloquée / réservée',
        responsable: 'Client / SGI',
        poids: 3,
      },
      {
        numero: '19',
        libelle: 'ESV — Dividendes bloqués',
        groupe: 'Bloquée / réservée',
        responsable: 'Client / SGI',
        poids: 3,
      },
      {
        numero: '20',
        libelle: 'Ne pas réinvestir',
        groupe: 'Bloquée / réservée',
        responsable: 'Client',
        poids: 4,
      },
    ];

    const poidsTotalFixe = definitionsFixes.reduce(
      (somme, item) => somme + item.poids,
      0
    );
    const montantFixeTheorique = (total * poidsTotalFixe) / 100;
    const capaciteFixe = Math.max(0, total - reserveOrdres);
    const facteur =
      montantFixeTheorique > 0
        ? Math.min(1, capaciteFixe / montantFixeTheorique)
        : 1;
    const affectationsFixes = definitionsFixes.map((item) => ({
      ...item,
      montant: Math.round(((total * item.poids) / 100) * facteur),
    }));

    const reserveObligationsAffectee = Math.min(
      reserveObligations,
      Math.max(
        0,
        total - affectationsFixes.reduce((s, item) => s + item.montant, 0)
      )
    );
    const reserveActionsAffectee = Math.min(
      reserveActions,
      Math.max(
        0,
        total -
          affectationsFixes.reduce((s, item) => s + item.montant, 0) -
          reserveObligationsAffectee
      )
    );

    const affectationsSansDisponible = [
      ...affectationsFixes.map((item) =>
        item.numero === '13'
          ? { ...item, montant: item.montant + reserveObligationsAffectee }
          : item
      ),
      {
        numero: '16',
        libelle: 'Achat marché financier — Actions',
        groupe: 'Bloquée / réservée',
        responsable: 'Client',
        montant: reserveActionsAffectee,
        reel: true,
      },
    ].sort((a, b) => Number(a.numero) - Number(b.numero));

    const montantAvantDisponible = affectationsSansDisponible.reduce(
      (somme, item) => somme + item.montant,
      0
    );
    const liquiditeDisponible = Math.max(0, total - montantAvantDisponible);
    const affectations = [
      ...affectationsSansDisponible,
      {
        numero: '21',
        libelle: 'Liquidité disponible',
        groupe: 'Disponible',
        responsable: 'Système',
        montant: liquiditeDisponible,
      },
    ];

    const sommeGroupe = (groupe) =>
      affectations
        .filter((item) => item.groupe === groupe)
        .reduce((somme, item) => somme + item.montant, 0);

    const valeurPortefeuille = clientPortfolioValue(portefeuille);
    const valeurActions = portefeuille.lignes
      .filter((position) => clientAssetClass(position.instrument) === 'Actions')
      .reduce((somme, position) => somme + clientLineValue(position), 0);
    const valeurObligations = portefeuille.lignes
      .filter(
        (position) => clientAssetClass(position.instrument) === 'Obligations'
      )
      .reduce((somme, position) => somme + clientLineValue(position), 0);
    const actionsActuelles =
      valeurPortefeuille > 0 ? (valeurActions / valeurPortefeuille) * 100 : 0;
    const obligationsActuelles =
      valeurPortefeuille > 0
        ? (valeurObligations / valeurPortefeuille) * 100
        : 0;
    const cibleIndicative = { Actions: 55, Obligations: 35, Liquidite: 10 };
    const ecartActions = cibleIndicative.Actions - actionsActuelles;
    const ecartObligations = cibleIndicative.Obligations - obligationsActuelles;

    return {
      ...ligne,
      dateSituation: formatDateFR(dateSituationObjClient),
      liquiditeActuelle: total,
      liquiditeReservee: reserveOrdres,
      liquiditeDisponibleOrdres: Math.max(0, total - reserveOrdres),
      entrees30J: entreesSituation,
      sorties30J: sortiesSituation,
      liquiditePrevisionnelle: liquiditePrevisionnelleSituation,
      ratioLiquidite: ratioLiquiditeSituation,
      ratioPrevisionnel: ratioPrevisionnelSituation,
      dateDernierDepot: formatDateFR(dateDernierDepot),
      montantDernierDepot:
        origines.find((item) => item.numero === '2')?.montant || 0,
      origines,
      affectations,
      totalOrigines: origines.reduce((somme, item) => somme + item.montant, 0),
      liquiditeBloquee: sommeGroupe('Bloquée / réservée'),
      autreLiquiditeAInvestir: sommeGroupe('À investir'),
      liquiditeDisponibleNette: sommeGroupe('Disponible'),
      actionsActuelles,
      obligationsActuelles,
      cibleIndicative,
      ecartActions,
      ecartObligations,
      montantCorrectionActions:
        (valeurPortefeuille * Math.abs(ecartActions)) / 100,
      montantCorrectionObligations:
        (valeurPortefeuille * Math.abs(ecartObligations)) / 100,
      rendement: Number(portefeuille.perfYtd || 0),
    };
  });

  const detailsFiltres = detailsLiquidite.filter((detail) =>
    idsFiltres.has(detail.portefeuille.id)
  );
  const detailSelectionne =
    detailsFiltres.find(
      (detail) => detail.portefeuille.id === portefeuilleLiquiditeSelectionneId
    ) ||
    detailsFiltres[0] ||
    null;

  const payloadExportAnatomieClient = detailSelectionne
    ? buildAnatomieExportPayload({
        espace: 'Gestion libre',
        titulaire: CLIENT_GESTION_LIBRE.nom,
        compte: detailSelectionne.portefeuille.nom,
        sgi: detailSelectionne.portefeuille.sgi,
        pays: detailSelectionne.portefeuille.pays,
        marche: detailSelectionne.portefeuille.marche,
        devise: detailSelectionne.portefeuille.devise,
        liquiditeActuelle: detailSelectionne.liquiditeActuelle,
        liquiditePrevisionnelle: detailSelectionne.liquiditePrevisionnelle,
        liquiditeBloquee: detailSelectionne.liquiditeBloquee,
        autreLiquiditeAInvestir: detailSelectionne.autreLiquiditeAInvestir,
        liquiditeDisponibleNette: detailSelectionne.liquiditeDisponibleNette,
        dateSituation: detailSelectionne.dateSituation,
        dateDernierDepot: detailSelectionne.dateDernierDepot,
        montantDernierDepot: detailSelectionne.montantDernierDepot,
        origines: detailSelectionne.origines,
        affectations: detailSelectionne.affectations,
        totalOrigines: detailSelectionne.totalOrigines,
        ecartActions: detailSelectionne.ecartActions,
        ecartObligations: detailSelectionne.ecartObligations,
        montantCorrectionActions: detailSelectionne.montantCorrectionActions,
        montantCorrectionObligations:
          detailSelectionne.montantCorrectionObligations,
        rendement: detailSelectionne.rendement,
        ratioCible: detailSelectionne.cibleIndicative?.Liquidite,
        ratioPrevisionnel:
          detailSelectionne.liquiditeActuelle > 0
            ? (detailSelectionne.liquiditePrevisionnelle /
                detailSelectionne.liquiditeActuelle) *
              100
            : 0,
      })
    : null;

  const roleTone = (responsable) => {
    if (responsable.includes('Client')) return 'gold';
    if (responsable.includes('SGI')) return 'navy';
    return 'teal';
  };

  const originesDonut = detailSelectionne
    ? detailSelectionne.origines.map((item) => ({
        name: item.libelle,
        montant: item.montant,
        devise: detailSelectionne.portefeuille.devise,
        value:
          detailSelectionne.totalOrigines > 0
            ? Number(
                (
                  (item.montant / detailSelectionne.totalOrigines) *
                  100
                ).toFixed(1)
              )
            : 0,
      }))
    : [];

    return {
      portefeuilles,
      filtrePays,
      setFiltrePays,
      filtreMarche,
      setFiltreMarche,
      filtreSgi,
      setFiltreSgi,
      filtreEncoursMin,
      setFiltreEncoursMin,
      filtreLiquiditeActuelleMin,
      setFiltreLiquiditeActuelleMin,
      filtreEntrees30JMin,
      setFiltreEntrees30JMin,
      filtreSorties30JMin,
      setFiltreSorties30JMin,
      filtrePrevisionnelMin,
      setFiltrePrevisionnelMin,
      portefeuilleLiquiditeSelectionneId,
      setPortefeuilleLiquiditeSelectionneId,
      vueLiquiditeDetail,
      setVueLiquiditeDetail,
      dateSituationLiquiditeClient,
      setDateSituationLiquiditeClient,
      dateReferenceIsoClient,
      dateReference,
      dateSituationObjClient,
      finHorizon,
      formatDateFR,
      fluxRevenus30J,
      fluxOrdres30J,
      flux30J,
      synthesePortefeuilles,
      paysDisponibles,
      marchesDisponibles,
      sgisDisponibles,
      lignesFiltrees,
      idsFiltres,
      fluxFiltres,
      revenusFiltres,
      totalEncours,
      totalCash,
      totalCashReserve,
      totalEntrees30J,
      totalSorties30J,
      totalPrevisionnel,
      totalRevenus,
      filtresActifs,
      reinitialiserFiltres,
      filtresMontants,
      repartitionMontants,
      detailsLiquidite,
      detailsFiltres,
      detailSelectionne,
      payloadExportAnatomieClient,
      roleTone,
      originesDonut,
    };
  }

  return { useClientCashflowsModel };
}
