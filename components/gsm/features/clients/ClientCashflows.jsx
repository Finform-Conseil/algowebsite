import { Badge, Card, Eyebrow, Pct, Td, Th } from '../../shared/ui/UiAtoms';
import { Donut, Legende } from '../home/HomeWidgets';
import { C, F_BODY, F_DISPLAY, F_MONO } from '../../shared/theme/theme';
import { ClientBreadcrumb } from './ClientCommon';
import { convertCurrency, fmt } from '../../shared/lib/finance';
import { createClientCashflowsModel } from './ClientCashflowsModel';

export function createClientCashflowsScreen(dependencies) {
  const {
    exportAnatomieExcel,
    exportAnatomiePdf,
    LIQUIDITY_HISTORY_MIN_DATE,
  } = dependencies;
  const { useClientCashflowsModel } = createClientCashflowsModel(dependencies);

  function ClientCashflows({ devise, orders = [] }) {
    const {
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
    } = useClientCashflowsModel({ devise, orders });

  return (
    <div className="gsm-native-clientcashflows-575825361">
      <ClientBreadcrumb items={['Espace Client', 'Liquidité & revenus']} />
      <div className="gsm-native-clientcashflows-3fdb7b704">
        <div>
          <h2
            className="gsm-native-clientcashflows-611547a60"
            style={{ ...F_DISPLAY, color: C.ink }}
          >
            Liquidité & revenus
          </h2>
          <div className="gsm-native-clientcashflows-8181cc57d" style={{ color: C.sub }}>
            Pilotez la liquidité de vos propres comptes SGI, distinguez ce qui
            est disponible, réservé ou destiné à être investi, et anticipez les
            entrées et sorties des 30 prochains jours.
          </div>
        </div>
        <Badge tone="navy">Devise de vue : {devise}</Badge>
      </div>

      <Card className="gsm-native-clientcashflows-88d639061" style={{ borderColor: C.navy }}>
        <div className="gsm-native-clientcashflows-b69e696b3">
          <div>
            <label
              className="gsm-native-clientcashflows-b6e0ccec3"
              style={{ color: C.sub }}
            >
              Pays
            </label>
            <select name="gsm-clientcashflows-105" aria-label="Sélection clientcashflows"
              value={filtrePays}
              onChange={(e) => {
                setFiltrePays(e.target.value);
                setFiltreSgi('Toutes');
              }}
              className="gsm-native-clientcashflows-d052c0c62"
              style={{ borderColor: C.line }}
            >
              {paysDisponibles.map((value) => (
                <option key={value} value={value}>
                  {value === 'Tous' ? 'Tous les pays' : value}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="gsm-native-clientcashflows-b6e0ccec3"
              style={{ color: C.sub }}
            >
              Marché
            </label>
            <select name="gsm-clientcashflows-128" aria-label="Sélection clientcashflows"
              value={filtreMarche}
              onChange={(e) => {
                setFiltreMarche(e.target.value);
                setFiltreSgi('Toutes');
              }}
              className="gsm-native-clientcashflows-d052c0c62"
              style={{ borderColor: C.line }}
            >
              {marchesDisponibles.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="gsm-native-clientcashflows-b6e0ccec3"
              style={{ color: C.sub }}
            >
              SGI
            </label>
            <select name="gsm-clientcashflows-149" aria-label="Sélection clientcashflows"
              value={filtreSgi}
              onChange={(e) => setFiltreSgi(e.target.value)}
              className="gsm-native-clientcashflows-d052c0c62"
              style={{ borderColor: C.line }}
            >
              {sgisDisponibles.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="gsm-native-clientcashflows-bbf67817d" style={{ borderTop: `1px solid ${C.line}` }}>
          <div className="gsm-native-clientcashflows-08169892c">
            <div>
              <div className="gsm-native-clientcashflows-9f1522638" style={{ color: C.ink }}>
                Seuils financiers
              </div>
              <div className="gsm-native-clientcashflows-3cae6cca4" style={{ color: C.sub }}>
                Les cinq seuils sont comparés après conversion dans votre devise
                de vue : {devise}.
              </div>
            </div>
            <Badge tone="navy">Seuils en {devise}</Badge>
          </div>
          <div className="gsm-native-clientcashflows-7bb4de4d8">
            {filtresMontants.map((filtre) => (
              <div key={filtre.key}>
                <label
                  className="gsm-native-clientcashflows-b6e0ccec3"
                  style={{ color: C.sub }}
                >
                  {filtre.label}
                </label>
                <div
                  className="gsm-native-clientcashflows-0d2672820"
                  style={{ borderColor: C.line, background: C.surfaceCard }}
                >
                  <input name="gsm-clientcashflows-188" aria-label="Aucun minimum"
                    type="number"
                    min="0"
                    step="1"
                    value={filtre.value}
                    onChange={(e) => filtre.setter(e.target.value)}
                    placeholder="Aucun minimum"
                    className="gsm-native-clientcashflows-4a3960d77"
                    style={F_MONO}
                  />
                  <span
                    className="gsm-native-clientcashflows-7f51d2ccd"
                    style={{
                      color: C.sub,
                      borderColor: C.line,
                      background: C.surfaceElevated,
                      ...F_MONO,
                    }}
                  >
                    {devise}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="gsm-native-clientcashflows-b8fbb4404">
          <div className="gsm-native-clientcashflows-7035296a2" style={{ color: C.sub }}>
            Ces filtres pilotent les comptes espèces, le prévisionnel, les
            revenus attendus et l’anatomie détaillée de votre liquidité.
          </div>
          <div className="gsm-native-clientcashflows-0050465ca">
            <Badge tone={filtresActifs > 0 ? 'teal' : 'slate'}>
              {filtresActifs} filtre(s) actif(s)
            </Badge>
            <Badge tone="gold">{lignesFiltrees.length} compte(s) SGI</Badge>
            {filtresActifs > 0 && (
              <button
                type="button"
                onClick={reinitialiserFiltres}
                className="gsm-native-clientcashflows-f2b53821d"
                style={{ borderColor: C.line, color: C.navy }}
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      </Card>

      <section className="gsm-native-clientcashflows-6af42cbb3">
        <div className="gsm-native-clientcashflows-947f692ea">
          <div>
            <Eyebrow>1. Synthèse de votre liquidité</Eyebrow>
            <div className="gsm-native-clientcashflows-d22b94eb5" style={{ color: C.sub }}>
              Vue consolidée de vos comptes SGI après application des filtres.
            </div>
          </div>
          <Badge tone="slate">
            Réservée aujourd’hui : {fmt(Math.round(totalCashReserve))} {devise}
          </Badge>
        </div>
        <div className="gsm-native-clientcashflows-7bb4de4d8">
          <Card className="gsm-native-clientcashflows-88d639061">
            <div className="gsm-native-clientcashflows-d22b94eb5" style={{ color: C.sub }}>
              Encours actuel
            </div>
            <div className="gsm-native-clientcashflows-568e74490" style={F_DISPLAY}>
              {fmt(Math.round(totalEncours))} {devise}
            </div>
          </Card>
          <Card className="gsm-native-clientcashflows-88d639061">
            <div className="gsm-native-clientcashflows-d22b94eb5" style={{ color: C.sub }}>
              Liquidité actuelle
            </div>
            <div className="gsm-native-clientcashflows-568e74490" style={F_DISPLAY}>
              {fmt(Math.round(totalCash))} {devise}
            </div>
          </Card>
          <Card className="gsm-native-clientcashflows-88d639061">
            <div className="gsm-native-clientcashflows-d22b94eb5" style={{ color: C.sub }}>
              Entrées à 30 j
            </div>
            <div
              className="gsm-native-clientcashflows-568e74490"
              style={{ ...F_DISPLAY, color: C.teal }}
            >
              +{fmt(Math.round(totalEntrees30J))} {devise}
            </div>
          </Card>
          <Card className="gsm-native-clientcashflows-88d639061">
            <div className="gsm-native-clientcashflows-d22b94eb5" style={{ color: C.sub }}>
              Sorties à 30 j
            </div>
            <div
              className="gsm-native-clientcashflows-568e74490"
              style={{ ...F_DISPLAY, color: C.coral }}
            >
              -{fmt(Math.round(totalSorties30J))} {devise}
            </div>
          </Card>
          <Card className="gsm-native-clientcashflows-88d639061">
            <div className="gsm-native-clientcashflows-d22b94eb5" style={{ color: C.sub }}>
              Liquidité prévisionnelle
            </div>
            <div className="gsm-native-clientcashflows-568e74490" style={F_DISPLAY}>
              {fmt(Math.round(totalPrevisionnel))} {devise}
            </div>
          </Card>
        </div>
      </section>

      <section className="gsm-native-clientcashflows-6af42cbb3">
        <div className="gsm-native-clientcashflows-6b33abcdc">
          <div>
            <Eyebrow>2. Anatomie de la liquidité de vos comptes SGI</Eyebrow>
            <div className="gsm-native-clientcashflows-5c6efcbf3" style={{ color: C.sub }}>
              Origine des fonds, sommes réservées ou à investir, liquidité
              réellement mobilisable et lecture indicative de l’écart
              d’allocation de chaque portefeuille. Les exports PDF et Excel
              portent sur le compte SGI actuellement sélectionné et reprennent
              la date de situation choisie. Les dates antérieures sont simulées
              dans la maquette en attendant les snapshots réels des SGI.
            </div>
          </div>
          <div className="gsm-native-clientcashflows-0ec59e2f7">
            <div
              className="gsm-native-clientcashflows-a693f56a6"
              style={{ borderColor: C.line, background: C.surfaceCard }}
            >
              <label
                htmlFor="client-liquidity-situation-date"
                className="gsm-native-clientcashflows-99476c7ed"
                style={{ color: C.sub }}
              >
                Date de situation
              </label>

              <input
                id="client-liquidity-situation-date"
                type="date"
                min={LIQUIDITY_HISTORY_MIN_DATE}
                max={dateReferenceIsoClient}
                value={dateSituationLiquiditeClient}
                onChange={(event) =>
                  setDateSituationLiquiditeClient(event.target.value)
                }
                className="gsm-native-clientcashflows-b943b4f7c"
                style={{ borderColor: C.line, color: C.ink, ...F_MONO }}
              />
              {dateSituationLiquiditeClient !== dateReferenceIsoClient && (
                <button
                  type="button"
                  onClick={() =>
                    setDateSituationLiquiditeClient(dateReferenceIsoClient)
                  }
                  className="gsm-native-clientcashflows-5043ecc3c"
                  style={{ color: C.navy }}
                >
                  Situation actuelle
                </button>
              )}
            </div>
            <Badge tone="navy">
              Situation au {formatDateFR(dateSituationObjClient)}
            </Badge>
            <button
              type="button"
              disabled={!payloadExportAnatomieClient}
              onClick={() => exportAnatomiePdf(payloadExportAnatomieClient)}
              className="gsm-native-clientcashflows-ed01a0b32"
              style={{
                borderColor: C.line,
                background: C.surfaceCard,
                color: C.navy,
                opacity: payloadExportAnatomieClient ? 1 : 0.45,
                cursor: payloadExportAnatomieClient ? 'pointer' : 'not-allowed',
              }}
              title="Exporter l'anatomie complète du compte SGI sélectionné en PDF"
            >
              Exporter PDF
            </button>
            <button
              type="button"
              disabled={!payloadExportAnatomieClient}
              onClick={() => exportAnatomieExcel(payloadExportAnatomieClient)}
              className="gsm-native-clientcashflows-ed01a0b32"
              style={{
                borderColor: C.line,
                background: C.positiveBackground,
                color: C.teal,
                opacity: payloadExportAnatomieClient ? 1 : 0.45,
                cursor: payloadExportAnatomieClient ? 'pointer' : 'not-allowed',
              }}
              title="Exporter les rubriques 1 à 26 du compte SGI sélectionné vers Excel"
            >
              Exporter Excel
            </button>
            <Badge tone="gold">
              Rubriques 1 à 26 adaptées à la gestion libre
            </Badge>
          </div>
        </div>

        <div className="gsm-native-clientcashflows-2a9bce932">
          <Card className="gsm-native-clientcashflows-ca5775a98">
            <div className="gsm-responsive-header gsm-native-clientcashflows-269857506">
              <div>
                <div
                  className="gsm-native-clientcashflows-7bc3c088d"
                  style={{ ...F_DISPLAY, color: C.ink }}
                >
                  Vos comptes / SGI
                </div>
                <div className="gsm-native-clientcashflows-819230e58" style={{ color: C.sub }}>
                  Sélectionnez un portefeuille pour analyser sa trésorerie.
                </div>
              </div>
              <Badge tone="navy">{detailsFiltres.length}</Badge>
            </div>

            <div className="gsm-native-clientcashflows-290024875">
              {detailsFiltres.length === 0 && (
                <div
                  className="gsm-native-clientcashflows-1811b6c35"
                  style={{ color: C.sub }}
                >
                  Aucun compte ne correspond aux filtres.
                </div>
              )}
              {detailsFiltres.map((detail) => {
                const actif =
                  detailSelectionne?.portefeuille.id === detail.portefeuille.id;
                return (
                  <button
                    key={detail.portefeuille.id}
                    type="button"
                    onClick={() =>
                      setPortefeuilleLiquiditeSelectionneId(
                        detail.portefeuille.id
                      )
                    }
                    className="gsm-native-clientcashflows-8bc07befc"
                    style={{
                      borderColor: actif ? C.navy : C.line,
                      background: actif ? C.infoBackground : C.surfaceCard,
                    }}
                  >
                    <div className="gsm-responsive-inline-row gsm-native-clientcashflows-e1ff73449">
                      <div className="gsm-native-clientcashflows-9901db781">
                        <div
                          className="gsm-native-clientcashflows-40aa4b562"
                          style={{ color: C.ink }}
                        >
                          {detail.portefeuille.sgi}
                        </div>
                        <div
                          className="gsm-native-clientcashflows-4f0be0dcd"
                          style={{ color: C.sub }}
                        >
                          {detail.portefeuille.nom}
                        </div>
                      </div>
                      <Badge tone="navy">{detail.portefeuille.marche}</Badge>
                    </div>
                    <div className="gsm-native-clientcashflows-ea4609ba7">
                      <div>
                        <div
                          className="gsm-native-clientcashflows-37f4e24b6"
                          style={{ color: C.sub }}
                        >
                          Liquidité
                        </div>
                        <div
                          className="gsm-native-clientcashflows-8db307e83"
                          style={F_MONO}
                        >
                          {fmt(Math.round(detail.liquiditeActuelle))}{' '}
                          {detail.portefeuille.devise}
                        </div>
                      </div>
                      <div className="gsm-native-clientcashflows-6855e7ea0">
                        <div
                          className="gsm-native-clientcashflows-37f4e24b6"
                          style={{ color: C.sub }}
                        >
                          Prévisionnel 30 j
                        </div>
                        <div
                          className="gsm-native-clientcashflows-8db307e83"
                          style={{ ...F_MONO, color: C.teal }}
                        >
                          {fmt(Math.round(detail.liquiditePrevisionnelle))}{' '}
                          {detail.portefeuille.devise}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="gsm-native-clientcashflows-85dc49147">
            {!detailSelectionne ? (
              <div
                className="gsm-native-clientcashflows-ae4474016"
                style={{ color: C.sub }}
              >
                Sélectionnez un compte pour afficher son analyse de liquidité.
              </div>
            ) : (
              <>
                <div className="gsm-native-clientcashflows-3fdb7b704">
                  <div>
                    <div
                      className="gsm-native-clientcashflows-a0a12241a"
                      style={{ ...F_DISPLAY, color: C.ink }}
                    >
                      {detailSelectionne.portefeuille.sgi}
                    </div>
                    <div className="gsm-native-clientcashflows-dade1b989" style={{ color: C.sub }}>
                      {detailSelectionne.portefeuille.nom} ·{' '}
                      {detailSelectionne.portefeuille.pays} ·{' '}
                      {detailSelectionne.portefeuille.marche} ·{' '}
                      {detailSelectionne.portefeuille.devise}
                    </div>
                  </div>
                  <div className="gsm-native-clientcashflows-6855e7ea0">
                    <div
                      className="gsm-native-clientcashflows-01b2f011e"
                      style={{ color: C.sub }}
                    >
                      Liquidité actuelle
                    </div>
                    <div className="gsm-native-clientcashflows-a8a9edc07" style={F_MONO}>
                      {fmt(Math.round(detailSelectionne.liquiditeActuelle))}{' '}
                      {detailSelectionne.portefeuille.devise}
                    </div>
                    {detailSelectionne.portefeuille.devise !== devise && (
                      <div className="gsm-native-clientcashflows-2e6c410d2" style={{ color: C.sub }}>
                        ≈{' '}
                        {fmt(
                          Math.round(
                            convertCurrency(
                              detailSelectionne.liquiditeActuelle,
                              detailSelectionne.portefeuille.devise,
                              devise
                            )
                          )
                        )}{' '}
                        {devise}
                      </div>
                    )}
                  </div>
                </div>

                <div className="gsm-native-clientcashflows-157e0dad2">
                  {[
                    ['origines', 'Origine des fonds · 1–10'],
                    ['affectations', 'Bloquée & disponible · 11–21'],
                    ['profil', 'Écart allocation & rendement · 22–26'],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setVueLiquiditeDetail(id)}
                      className="gsm-native-clientcashflows-ce78969f7"
                      style={{
                        background: vueLiquiditeDetail === id ? C.activeBackground : C.surfaceInset,
                        color: vueLiquiditeDetail === id ? C.textPrimary : C.sub,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {vueLiquiditeDetail === 'origines' && (
                  <div className="gsm-native-clientcashflows-995139a5b">
                    <div className="gsm-native-clientcashflows-d4175cff4">
                      <div
                        className="gsm-native-clientcashflows-c0a3d8236"
                        style={{ borderColor: C.line, background: C.surfaceElevated }}
                      >
                        <div className="gsm-native-clientcashflows-2e6c410d2" style={{ color: C.sub }}>
                          Dernier dépôt estimé

                        </div>
                        <div className="gsm-native-clientcashflows-5c033c7bd">
                          {detailSelectionne.dateDernierDepot}
                        </div>
                        <div
                          className="gsm-native-clientcashflows-c15fb18fa"
                          style={{ ...F_MONO, color: C.navy }}
                        >
                          {fmt(
                            Math.round(detailSelectionne.montantDernierDepot)
                          )}{' '}
                          {detailSelectionne.portefeuille.devise}
                        </div>
                      </div>
                      <Donut data={originesDonut} size={190} />
                      <Legende data={originesDonut} />
                    </div>
                    <div className="gsm-native-clientcashflows-322c64bdd">
                      {detailSelectionne.origines.map((item) => (
                        <div
                          key={item.numero}
                          className="gsm-native-clientcashflows-aa4573e6d"
                          style={{ borderColor: C.line }}
                        >
                          <div className="gsm-native-clientcashflows-f1c185c96">
                            <span
                              className="gsm-native-clientcashflows-f9abc04eb"
                              style={{ color: C.gold, ...F_MONO }}
                            >
                              #{item.numero}
                            </span>
                            <Badge tone={roleTone(item.responsable)}>
                              {item.responsable}
                            </Badge>
                          </div>
                          <div className="gsm-native-clientcashflows-f195d11bf">
                            {item.libelle}
                          </div>
                          <div
                            className="gsm-native-clientcashflows-5c033c7bd"
                            style={F_MONO}
                          >
                            {fmt(Math.round(item.montant))}{' '}
                            {detailSelectionne.portefeuille.devise}
                          </div>
                          <div
                            className="gsm-native-clientcashflows-995fed090"
                            style={{ color: C.sub }}
                          >
                            {item.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {vueLiquiditeDetail === 'affectations' && (
                  <div className="gsm-native-clientcashflows-f927cd84c">
                    <div className="gsm-native-clientcashflows-60a78d628">
                      <div
                        className="gsm-native-clientcashflows-aa4573e6d"
                        style={{
                          borderColor: C.negativeBorder,
                          background: C.negativeBackground,
                        }}
                      >
                        <div className="gsm-native-clientcashflows-2e6c410d2" style={{ color: C.sub }}>
                          Bloquée / réservée
                        </div>
                        <div
                          className="gsm-native-clientcashflows-0686d6416"
                          style={{ ...F_MONO, color: C.coral }}
                        >
                          {fmt(Math.round(detailSelectionne.liquiditeBloquee))}{' '}
                          {detailSelectionne.portefeuille.devise}
                        </div>
                      </div>
                      <div
                        className="gsm-native-clientcashflows-aa4573e6d"
                        style={{
                          borderColor: C.warningBorder,
                          background: C.warningBackground,
                        }}
                      >
                        <div className="gsm-native-clientcashflows-2e6c410d2" style={{ color: C.sub }}>
                          Autre liquidité à investir
                        </div>
                        <div
                          className="gsm-native-clientcashflows-0686d6416"
                          style={{ ...F_MONO, color: C.gold }}
                        >
                          {fmt(
                            Math.round(
                              detailSelectionne.autreLiquiditeAInvestir
                            )
                          )}{' '}
                          {detailSelectionne.portefeuille.devise}
                        </div>
                      </div>
                      <div
                        className="gsm-native-clientcashflows-aa4573e6d"
                        style={{
                          borderColor: C.positiveBorder,
                          background: C.positiveBackground,
                        }}
                      >
                        <div className="gsm-native-clientcashflows-2e6c410d2" style={{ color: C.sub }}>
                          Liquidité disponible
                        </div>
                        <div
                          className="gsm-native-clientcashflows-0686d6416"
                          style={{ ...F_MONO, color: C.teal }}
                        >
                          {fmt(
                            Math.round(
                              detailSelectionne.liquiditeDisponibleNette
                            )
                          )}{' '}
                          {detailSelectionne.portefeuille.devise}
                        </div>
                      </div>
                    </div>

                    <div className="gsm-native-clientcashflows-b76359c95">
                      {detailSelectionne.affectations.map((item) => {
                        const pct =
                          detailSelectionne.liquiditeActuelle > 0
                            ? (item.montant /
                                detailSelectionne.liquiditeActuelle) *
                              100
                            : 0;
                        const tone =
                          item.groupe === 'Disponible'
                            ? C.teal
                            : item.groupe === 'À investir'
                            ? C.gold
                            : C.coral;
                        return (
                          <div
                            key={item.numero}
                            className="gsm-native-clientcashflows-aa4573e6d"
                            style={{ borderColor: C.line }}
                          >
                            <div className="gsm-native-clientcashflows-f2dc5fcd4">
                              <div className="gsm-native-clientcashflows-9901db781">
                                <div className="gsm-native-clientcashflows-1ff1ebef1">
                                  <span
                                    className="gsm-native-clientcashflows-f9abc04eb"
                                    style={{ color: C.gold, ...F_MONO }}
                                  >
                                    #{item.numero}
                                  </span>
                                  <span className="gsm-native-clientcashflows-39adb3646">
                                    {item.libelle}
                                  </span>
                                  {item.reel && (
                                    <Badge tone="teal">
                                      Ordres ouverts réels
                                    </Badge>
                                  )}
                                </div>
                                <div className="gsm-native-clientcashflows-2bd3049f2">
                                  <Badge tone={roleTone(item.responsable)}>
                                    {item.responsable}
                                  </Badge>
                                </div>
                              </div>
                              <div className="gsm-native-clientcashflows-010f204a0">
                                <div
                                  className="gsm-native-clientcashflows-9f1522638"
                                  style={F_MONO}
                                >
                                  {fmt(Math.round(item.montant))}{' '}
                                  {detailSelectionne.portefeuille.devise}
                                </div>
                                <div
                                  className="gsm-native-clientcashflows-3cae6cca4"
                                  style={{ color: C.sub }}
                                >
                                  {pct.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                            <div
                              className="gsm-native-clientcashflows-a0ed61d3f"
                              style={{ background: C.surfaceInset }}
                            >
                              <div
                                className="gsm-native-clientcashflows-8c232d434"
                                style={{
                                  width: `${Math.min(100, pct)}%`,
                                  background: tone,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div
                      className="gsm-native-clientcashflows-9bb9341ed"
                      style={{ background: C.infoBackground, color: C.sub }}
                    >
                      Les réservations liées aux ordres d’achat ouverts sont
                      calculées à partir de vos ordres. Les autres
                      sous-rubriques restent une ventilation de démonstration
                      jusqu’au branchement des données détaillées de la SGI.
                    </div>
                  </div>
                )}

                {vueLiquiditeDetail === 'profil' && (
                  <div className="gsm-native-clientcashflows-d36de1c2c">
                    <div
                      className="gsm-native-clientcashflows-1615b8efe"
                      style={{ background: C.warningBackground }}
                    >
                      <div
                        className="gsm-native-clientcashflows-9f1522638"
                        style={{ color: C.ink }}
                      >
                        Cible indicative de démonstration
                      </div>
                      <div
                        className="gsm-native-clientcashflows-602b5f707"
                        style={{ color: C.sub }}
                      >
                        55% Actions · 35% Obligations · 10% Liquidité. Cette
                        cible devra être remplacée par votre profil
                        d’investissement réel lorsqu’il sera disponible dans le
                        backend.
                      </div>
                    </div>
                    <div className="gsm-native-clientcashflows-d4da4fa04">
                      {[
                        {
                          numeroPct: '22',
                          numeroValeur: '24',
                          nom: 'Actions',
                          actuel: detailSelectionne.actionsActuelles,
                          cible: detailSelectionne.cibleIndicative.Actions,
                          ecart: detailSelectionne.ecartActions,
                          montant: detailSelectionne.montantCorrectionActions,
                        },
                        {
                          numeroPct: '23',
                          numeroValeur: '25',
                          nom: 'Obligations',
                          actuel: detailSelectionne.obligationsActuelles,

                          cible: detailSelectionne.cibleIndicative.Obligations,
                          ecart: detailSelectionne.ecartObligations,
                          montant:
                            detailSelectionne.montantCorrectionObligations,
                        },
                      ].map((item) => (
                        <div
                          key={item.nom}
                          className="gsm-native-clientcashflows-99c32d264"
                          style={{ borderColor: C.line }}
                        >
                          <div className="gsm-native-clientcashflows-d90b29619">
                            <div className="gsm-native-clientcashflows-7bc3c088d">{item.nom}</div>
                            <Badge tone={item.ecart >= 0 ? 'gold' : 'navy'}>
                              #{item.numeroPct} / #{item.numeroValeur}
                            </Badge>
                          </div>
                          <div className="gsm-native-clientcashflows-0874354a1">
                            <div>
                              <div
                                className="gsm-native-clientcashflows-62d054b83"
                                style={{ color: C.sub }}
                              >
                                Actuel
                              </div>
                              <div
                                className="gsm-native-clientcashflows-5c033c7bd"
                                style={F_MONO}
                              >
                                {item.actuel.toFixed(1)}%
                              </div>
                            </div>
                            <div>
                              <div
                                className="gsm-native-clientcashflows-62d054b83"
                                style={{ color: C.sub }}
                              >
                                Cible
                              </div>
                              <div
                                className="gsm-native-clientcashflows-5c033c7bd"
                                style={F_MONO}
                              >
                                {item.cible.toFixed(1)}%
                              </div>
                            </div>
                            <div>
                              <div
                                className="gsm-native-clientcashflows-62d054b83"
                                style={{ color: C.sub }}
                              >
                                Écart
                              </div>
                              <div
                                className="gsm-native-clientcashflows-5c033c7bd"
                                style={{
                                  ...F_MONO,
                                  color:
                                    Math.abs(item.ecart) > 3 ? C.coral : C.teal,
                                }}
                              >
                                {item.ecart >= 0 ? '+' : ''}
                                {item.ecart.toFixed(1)} pts
                              </div>
                            </div>
                          </div>
                          <div
                            className="gsm-native-clientcashflows-db6bb661e"
                            style={{ borderTop: `1px solid ${C.line}` }}
                          >
                            <span style={{ color: C.sub }}>
                              Correction indicative
                            </span>
                            <span className="gsm-native-clientcashflows-438dc6d38" style={F_MONO}>
                              {fmt(Math.round(item.montant))}{' '}
                              {detailSelectionne.portefeuille.devise}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="gsm-native-clientcashflows-b69e696b3">
                      <div
                        className="gsm-native-clientcashflows-aa4573e6d"
                        style={{ borderColor: C.line }}
                      >
                        <div className="gsm-native-clientcashflows-2e6c410d2" style={{ color: C.sub }}>
                          Liquidité actuelle
                        </div>
                        <div className="gsm-native-clientcashflows-c15fb18fa" style={F_MONO}>
                          {detailSelectionne.ratioLiquidite.toFixed(1)}%
                        </div>
                      </div>
                      <div
                        className="gsm-native-clientcashflows-aa4573e6d"
                        style={{ borderColor: C.line }}
                      >
                        <div className="gsm-native-clientcashflows-2e6c410d2" style={{ color: C.sub }}>
                          Liquidité prévisionnelle
                        </div>
                        <div className="gsm-native-clientcashflows-c15fb18fa" style={F_MONO}>
                          {detailSelectionne.ratioPrevisionnel.toFixed(1)}%
                        </div>
                      </div>
                      <div
                        className="gsm-native-clientcashflows-aa4573e6d"
                        style={{ borderColor: C.line }}
                      >
                        <div className="gsm-native-clientcashflows-2e6c410d2" style={{ color: C.sub }}>
                          Rendement YTD · #26
                        </div>
                        <div className="gsm-native-clientcashflows-2bd3049f2">
                          <Pct v={detailSelectionne.rendement} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </section>

      <Card className="gsm-native-clientcashflows-dbe411f7a">
        <div className="gsm-native-clientcashflows-8afb94f28">
          <div>
            <Eyebrow>3. Comptes espèces par SGI</Eyebrow>
            <div className="gsm-native-clientcashflows-7035296a2" style={{ color: C.sub }}>
              Situation actuelle, réservations d’ordres et prévision à 30 jours.
            </div>
          </div>
          <Badge tone="gold">{lignesFiltrees.length} compte(s)</Badge>
        </div>
        <div className="gsm-table-scroll">
          <table className="gsm-table--banking gsm-native-clientcashflows-353ce7627" style={{ minWidth: 1250 }}>
            <thead style={{ background: C.surfaceElevated }}>
              <tr>
                <Th>SGI</Th>
                <Th>Pays / marché</Th>
                <Th>Encours actuel</Th>
                <Th>Liquidité actuelle</Th>
                <Th>Réservée</Th>
                <Th>Entrées 30 j</Th>
                <Th>Sorties 30 j</Th>
                <Th>Prévisionnel</Th>
              </tr>
            </thead>
            <tbody>
              {lignesFiltrees.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="gsm-native-clientcashflows-fdef7f41b"
                    style={{ color: C.sub }}
                  >
                    Aucun compte ne correspond aux critères sélectionnés.
                  </td>
                </tr>
              )}
              {lignesFiltrees.map((ligne) => {
                const pf = ligne.portefeuille;
                return (
                  <tr key={pf.id} style={{ borderTop: `1px solid ${C.line}` }}>
                    <Td className="gsm-native-clientcashflows-438dc6d38">{pf.sgi}</Td>
                    <Td>
                      {pf.pays} · {pf.marche}
                    </Td>
                    <Td mono>
                      {fmt(Math.round(ligne.encours))} {pf.devise}
                    </Td>
                    <Td mono>
                      {fmt(Math.round(ligne.liquiditeActuelle))} {pf.devise}
                    </Td>
                    <Td mono>
                      <span style={{ color: C.coral }}>
                        {fmt(Math.round(ligne.liquiditeReservee))} {pf.devise}
                      </span>
                    </Td>
                    <Td mono>
                      <span style={{ color: C.teal }}>
                        +{fmt(Math.round(ligne.entrees30J))} {pf.devise}
                      </span>
                    </Td>
                    <Td mono>
                      <span style={{ color: C.coral }}>
                        -{fmt(Math.round(ligne.sorties30J))} {pf.devise}
                      </span>
                    </Td>
                    <Td mono>
                      {fmt(Math.round(ligne.liquiditePrevisionnelle))}{' '}
                      {pf.devise}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="gsm-native-clientcashflows-dbe411f7a">
        <div className="gsm-native-clientcashflows-8afb94f28">
          <div>
            <Eyebrow>4. Dividendes & coupons attendus</Eyebrow>
            <div className="gsm-native-clientcashflows-7035296a2" style={{ color: C.sub }}>
              Revenus financiers correspondant au périmètre filtré.
            </div>
          </div>
          <Badge tone="teal">
            {fmt(Math.round(totalRevenus))} {devise}
          </Badge>
        </div>
        <div className="gsm-table-scroll">
          <table className="gsm-table--banking gsm-native-clientcashflows-353ce7627" style={{ minWidth: 1050 }}>
            <thead style={{ background: C.surfaceElevated }}>
              <tr>
                <Th>Date</Th>
                <Th>SGI</Th>
                <Th>Instrument</Th>
                <Th>Nature</Th>
                <Th>Montant</Th>
                <Th>Équivalent {devise}</Th>
                <Th>Statut</Th>
              </tr>
            </thead>
            <tbody>
              {revenusFiltres.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="gsm-native-clientcashflows-fdef7f41b"
                    style={{ color: C.sub }}
                  >
                    Aucun dividende ou coupon ne correspond aux filtres.
                  </td>
                </tr>
              )}
              {revenusFiltres.map((flux) => {
                const pf = portefeuilles.find(
                  (portefeuille) => portefeuille.id === flux.portefeuilleId
                );
                return (
                  <tr
                    key={flux.id}
                    style={{ borderTop: `1px solid ${C.line}` }}
                  >
                    <Td>{flux.date}</Td>
                    <Td className="gsm-native-clientcashflows-438dc6d38">{pf?.sgi}</Td>
                    <Td>{flux.instrument}</Td>

                    <Td>
                      <Badge tone="teal">{flux.type}</Badge>
                    </Td>
                    <Td mono>
                      {fmt(Math.round(flux.montant))} {flux.devise}
                    </Td>
                    <Td mono>
                      {fmt(
                        Math.round(
                          convertCurrency(flux.montant, flux.devise, devise)
                        )
                      )}{' '}
                      {devise}
                    </Td>
                    <Td>
                      <Badge tone="gold">{flux.statut}</Badge>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="gsm-native-clientcashflows-88d639061" style={{ borderColor: C.borderSubtle }}>
        <div className="gsm-native-clientcashflows-9f1522638" style={{ color: C.ink }}>
          Lecture du prévisionnel à 30 jours
        </div>
        <div className="gsm-native-clientcashflows-31433b226" style={{ color: C.sub }}>
          Les entrées combinent les dividendes/coupons à recevoir et les ventes
          ouvertes ; les sorties correspondent aux achats ouverts. Les ordres
          restent soumis à leur exécution effective par la SGI. Le détail des
          rubriques 1 à 21 est une structure opérationnelle prête à recevoir les
          données réelles du backend.
        </div>
      </Card>
    </div>
  );
}

  return { ClientCashflows };
}
