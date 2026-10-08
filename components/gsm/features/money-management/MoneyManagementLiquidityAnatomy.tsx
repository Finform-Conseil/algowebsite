import { convertCurrency, fmt } from '../../shared/lib/finance';
import { Donut, Legende } from '../home/HomeWidgets';
import { Badge, Card, Eyebrow, Pct } from '../../shared/ui/UiAtoms';
import { C, F_DISPLAY, F_MONO } from '../../shared/theme/theme';

type BadgeTone = 'slate' | 'gold' | 'teal' | 'coral' | 'navy';
export type LiquidityDetailView = 'origines' | 'affectations' | 'profil';

export interface LiquidityDetailClient {
  id: string;
  nom: string;
  marche: string;
  devise: string;
  profilRisque: string;
  encours: number;
}

export interface LiquidityOrigin {
  numero: string;
  libelle: string;
  description: string;
  responsable: string;
  montant: number;
}

export interface LiquidityAllocation {
  numero: string;
  libelle: string;
  groupe: string;
  responsable: string;
  montant: number;
}

export interface LiquidityAccountDetail {
  client: LiquidityDetailClient;
  statut: string;
  liquiditeActuelle: number;
  ratioCible: number;
  ratioPrevisionnel: number;
  dateDernierDepot: string;
  montantDernierDepot: number;
  origines: LiquidityOrigin[];
  affectations: LiquidityAllocation[];
  totalOrigines: number;
  liquiditeBloquee: number;
  autreLiquiditeAInvestir: number;
  liquiditeDisponibleNette: number;
  ecartActions: number;
  ecartObligations: number;
  montantCorrectionActions: number;
  montantCorrectionObligations: number;
  rendement: number;
}

export function MoneyManagementLiquidityAnatomy({
  currency,
  minDate,
  maxDate,
  situationDate,
  situationLabel,
  accountCount,
  filteredDetails,
  selectedDetail,
  view,
  canExport,
  statusTone,
  roleTone,
  onSituationDateChange,
  onUseCurrentSituation,
  onSelectClient,
  onViewChange,
  onExportPdf,
  onExportExcel,
}: {
  currency: string;
  minDate: string;
  maxDate: string;
  situationDate: string;
  situationLabel: string;
  accountCount: number;
  filteredDetails: LiquidityAccountDetail[];
  selectedDetail: LiquidityAccountDetail | null;
  view: LiquidityDetailView;
  canExport: boolean;
  statusTone: (status: string) => BadgeTone;
  roleTone: (role: string) => BadgeTone;
  onSituationDateChange: (date: string) => void;
  onUseCurrentSituation: () => void;
  onSelectClient: (clientId: string) => void;
  onViewChange: (view: LiquidityDetailView) => void;
  onExportPdf: () => void;
  onExportExcel: () => void;
}) {
  return (
    <section className="gsm-native-moneymanagementliquidityanatomy-a63fcc98f">
      <AnatomyToolbar
        minDate={minDate}
        maxDate={maxDate}
        situationDate={situationDate}
        situationLabel={situationLabel}
        accountCount={accountCount}
        canExport={canExport}
        onSituationDateChange={onSituationDateChange}
        onUseCurrentSituation={onUseCurrentSituation}
        onExportPdf={onExportPdf}
        onExportExcel={onExportExcel}
      />

      <div className="gsm-native-moneymanagementliquidityanatomy-ed0a1adae">
        <AccountSelector
          details={filteredDetails}
          selectedId={selectedDetail?.client.id ?? null}
          statusTone={statusTone}
          onSelect={onSelectClient}
        />

        <div className="gsm-native-moneymanagementliquidityanatomy-2cd10b812">
          {selectedDetail ? (
            <>
              <AccountSummary
                detail={selectedDetail}
                currency={currency}
                statusTone={statusTone}
              />
              <Card className="gsm-native-moneymanagementliquidityanatomy-d7ce8edbe">
                <ViewTabs view={view} onChange={onViewChange} />
                {view === 'origines' && (
                  <OriginsView detail={selectedDetail} roleTone={roleTone} />
                )}
                {view === 'affectations' && (
                  <AllocationsView detail={selectedDetail} roleTone={roleTone} />
                )}
                {view === 'profil' && <ProfileView detail={selectedDetail} />}
              </Card>
            </>
          ) : (
            <Card className="gsm-native-moneymanagementliquidityanatomy-778867800" style={{ color: C.sub }}>
              Sélectionnez un portefeuille pour afficher son anatomie de liquidité.
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}

function AnatomyToolbar({
  minDate,
  maxDate,
  situationDate,
  situationLabel,
  accountCount,
  canExport,
  onSituationDateChange,
  onUseCurrentSituation,
  onExportPdf,
  onExportExcel,
}: {
  minDate: string;
  maxDate: string;
  situationDate: string;
  situationLabel: string;
  accountCount: number;
  canExport: boolean;
  onSituationDateChange: (date: string) => void;
  onUseCurrentSituation: () => void;
  onExportPdf: () => void;
  onExportExcel: () => void;
}) {
  return (
    <div className="gsm-native-moneymanagementliquidityanatomy-59da0e00f">
      <Eyebrow>2. Anatomie de la liquidité des comptes clients</Eyebrow>
      <div className="gsm-native-moneymanagementliquidityanatomy-3457f30d0">
        <div
          className="gsm-native-moneymanagementliquidityanatomy-b4799e14c"
          style={{ borderColor: C.line, background: C.surfaceCard }}
        >
          <label
            htmlFor="manager-liquidity-situation-date"
            className="gsm-native-moneymanagementliquidityanatomy-476e412ac"
            style={{ color: C.sub }}
          >
            Date de situation
          </label>
          <input
            id="manager-liquidity-situation-date"
            type="date"
            min={minDate}
            max={maxDate}
            value={situationDate}
            onChange={(event) => onSituationDateChange(event.target.value)}
            className="gsm-native-moneymanagementliquidityanatomy-959e35c55"
            style={{ borderColor: C.line, color: C.ink, ...F_MONO }}
          />
          {situationDate !== maxDate && (
            <button
              type="button"
              onClick={onUseCurrentSituation}
              className="gsm-native-moneymanagementliquidityanatomy-66b923466"
              style={{ color: C.navy }}
            >
              Situation actuelle
            </button>
          )}
        </div>
        <Badge tone="navy">Situation au {situationLabel}</Badge>
        <ExportButton disabled={!canExport} onClick={onExportPdf}>
          Exporter PDF
        </ExportButton>
        <ExportButton disabled={!canExport} onClick={onExportExcel} excel>
          Exporter Excel
        </ExportButton>
        <Badge tone="teal">Export consolidé · {accountCount} compte(s)</Badge>
        <Badge tone="gold">Excel : 2 feuilles · rubriques 1 à 26</Badge>
      </div>
    </div>
  );
}

function ExportButton({
  disabled,
  onClick,
  excel = false,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  excel?: boolean;
  children: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="gsm-native-moneymanagementliquidityanatomy-260495283"
      style={{
        borderColor: C.line,
        background: excel ? C.positiveBackground : C.surfaceCard,
        color: excel ? C.teal : C.navy,
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function AccountSelector({
  details,
  selectedId,
  statusTone,
  onSelect,
}: {
  details: LiquidityAccountDetail[];
  selectedId: string | null;
  statusTone: (status: string) => BadgeTone;
  onSelect: (clientId: string) => void;
}) {
  return (
    <Card className="gsm-native-moneymanagementliquidityanatomy-3c2cfcece">
      <div className="gsm-native-moneymanagementliquidityanatomy-8788f4f94">
        <div>
          <div className="gsm-native-moneymanagementliquidityanatomy-b5b38943d" style={{ ...F_DISPLAY, color: C.ink }}>
            Comptes clients
          </div>
          <div className="gsm-native-moneymanagementliquidityanatomy-22028105a" style={{ color: C.sub }}>
            Sélectionnez un compte pour analyser la provenance et l'affectation de sa liquidité.
          </div>
        </div>
        <Badge tone="navy">{details.length}</Badge>
      </div>

      <div className="gsm-native-moneymanagementliquidityanatomy-22dbaeec4">
        {details.length === 0 && (
          <div className="gsm-native-moneymanagementliquidityanatomy-2de3eea35" style={{ color: C.sub }}>
            Aucun compte ne correspond aux filtres.
          </div>
        )}

        {details.map((detail) => {
          const active = selectedId === detail.client.id;
          const mobilePercent =
            detail.liquiditeActuelle > 0
              ? ((detail.autreLiquiditeAInvestir + detail.liquiditeDisponibleNette) /
                  detail.liquiditeActuelle) *
                100
              : 0;

          return (
            <button
              key={detail.client.id}
              type="button"
              onClick={() => onSelect(detail.client.id)}
              className="gsm-native-moneymanagementliquidityanatomy-8fb0625a2"
              style={{
                borderColor: active ? C.navy : C.line,
                background: active ? C.infoBackground : C.surfaceCard,
              }}
            >
              <div className="gsm-native-moneymanagementliquidityanatomy-971493b9c">
                <div className="gsm-native-moneymanagementliquidityanatomy-03a5d13d8">
                  <div className="gsm-native-moneymanagementliquidityanatomy-a10b9b60b" style={{ color: C.ink }}>
                    {detail.client.nom}
                  </div>
                  <div className="gsm-native-moneymanagementliquidityanatomy-fc8b3b094" style={{ color: C.sub }}>
                    {detail.client.marche} · {detail.client.profilRisque} · {detail.client.devise}
                  </div>
                </div>
                <Badge tone={statusTone(detail.statut)}>{detail.statut}</Badge>
              </div>
              <div className="gsm-native-moneymanagementliquidityanatomy-3ac56cce6">
                <div>
                  <div className="gsm-native-moneymanagementliquidityanatomy-ff6a6485a" style={{ color: C.sub }}>
                    Liquidité
                  </div>
                  <div className="gsm-native-moneymanagementliquidityanatomy-3e846f3ce" style={F_MONO}>
                    {fmt(Math.round(detail.liquiditeActuelle))} {detail.client.devise}
                  </div>
                </div>
                <div className="gsm-native-moneymanagementliquidityanatomy-498bcd9ff">
                  <div className="gsm-native-moneymanagementliquidityanatomy-ff6a6485a" style={{ color: C.sub }}>
                    Mobilisable
                  </div>
                  <div className="gsm-native-moneymanagementliquidityanatomy-3e846f3ce" style={{ ...F_MONO, color: C.teal }}>
                    {mobilePercent.toFixed(0)}%
                  </div>
                </div>
              </div>
              <div className="gsm-native-moneymanagementliquidityanatomy-ed4acb15f" style={{ background: C.surfaceInset }}>
                <div
                  className="gsm-native-moneymanagementliquidityanatomy-bd6548116"
                  style={{ width: `${Math.min(100, mobilePercent)}%`, background: C.teal }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function AccountSummary({
  detail,
  currency,
  statusTone,
}: {
  detail: LiquidityAccountDetail;
  currency: string;
  statusTone: (status: string) => BadgeTone;
}) {
  const converted = convertCurrency(detail.liquiditeActuelle, detail.client.devise, currency);

  return (
    <Card className="gsm-native-moneymanagementliquidityanatomy-d7ce8edbe" style={{ borderColor: C.navy }}>
      <div className="gsm-native-moneymanagementliquidityanatomy-b8bc2c69e">
        <div>
          <div className="gsm-native-moneymanagementliquidityanatomy-b996cdc67" style={{ ...F_DISPLAY, color: C.ink }}>
            {detail.client.nom}
          </div>
          <div className="gsm-native-moneymanagementliquidityanatomy-3fd45d5ea">
            <Badge tone="navy">{detail.client.marche} · {detail.client.devise}</Badge>
            <Badge tone="slate">{detail.client.profilRisque}</Badge>
            <Badge tone={statusTone(detail.statut)}>{detail.statut}</Badge>
          </div>
        </div>
        <div className="gsm-native-moneymanagementliquidityanatomy-498bcd9ff">
          <div className="gsm-native-moneymanagementliquidityanatomy-c202c7cbf" style={{ color: C.sub }}>
            Liquidité globale du compte (10)
          </div>
          <div className="gsm-native-moneymanagementliquidityanatomy-8ae838b43" style={F_DISPLAY}>
            {fmt(Math.round(detail.liquiditeActuelle))} {detail.client.devise}
          </div>
          {detail.client.devise !== currency && (
            <div className="gsm-native-moneymanagementliquidityanatomy-fc8b3b094" style={{ color: C.sub, ...F_MONO }}>
              ≈ {fmt(Math.round(converted))} {currency}
            </div>
          )}
        </div>
      </div>

      <div className="gsm-native-moneymanagementliquidityanatomy-573a689ac">
        <MiniMetric
          label="Dernier dépôt (2)"
          value={detail.dateDernierDepot}
          subValue={`${fmt(Math.round(detail.montantDernierDepot))} ${detail.client.devise}`}
          background={C.surfaceElevated}
          subColor={C.navy}
        />
        <MiniMetric
          label="Bloquée / réservée"
          value={`${fmt(detail.liquiditeBloquee)} ${detail.client.devise}`}
          background={C.negativeBackground}
          labelColor={C.coral}
        />
        <MiniMetric
          label="Autre liquidité à investir (12)"
          value={`${fmt(detail.autreLiquiditeAInvestir)} ${detail.client.devise}`}
          background={C.warningBackground}
          labelColor={C.warningText}
        />
        <MiniMetric
          label="Liquidité disponible (21)"
          value={`${fmt(detail.liquiditeDisponibleNette)} ${detail.client.devise}`}
          background={C.positiveBackground}
          labelColor={C.teal}
        />
      </div>
    </Card>
  );
}

function MiniMetric({
  label,
  value,
  subValue,
  background,
  labelColor = C.sub,
  subColor = C.ink,
}: {
  label: string;
  value: string;
  subValue?: string;
  background: string;
  labelColor?: string;
  subColor?: string;
}) {
  return (
    <div className="gsm-native-moneymanagementliquidityanatomy-432add488" style={{ background }}>
      <div className="gsm-native-moneymanagementliquidityanatomy-ff6a6485a" style={{ color: labelColor }}>{label}</div>
      <div className="gsm-native-moneymanagementliquidityanatomy-c9d87bea1" style={F_MONO}>{value}</div>
      {subValue && (
        <div className="gsm-native-moneymanagementliquidityanatomy-445ac97e5" style={{ ...F_MONO, color: subColor }}>
          {subValue}
        </div>
      )}
    </div>
  );
}

function ViewTabs({
  view,
  onChange,
}: {
  view: LiquidityDetailView;
  onChange: (view: LiquidityDetailView) => void;
}) {
  const tabs: Array<[LiquidityDetailView, string]> = [
    ['origines', 'Origine des fonds · 1–10'],
    ['affectations', 'Bloquée & disponible · 11–21'],
    ['profil', 'Écart profil & rendement · 22–26'],
  ];

  return (
    <div className="gsm-chip-scroll gsm-native-moneymanagementliquidityanatomy-09fe05b83">
      {tabs.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className="gsm-native-moneymanagementliquidityanatomy-7940890dc"
          style={{
            background: view === id ? C.activeBackground : C.surfaceInset,
            color: view === id ? C.textPrimary : C.sub,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function OriginsView({
  detail,
  roleTone,
}: {
  detail: LiquidityAccountDetail;
  roleTone: (role: string) => BadgeTone;
}) {
  const chartData = detail.origines.map((item) => ({
    name: item.libelle,
    value:
      detail.totalOrigines > 0
        ? Number(((item.montant / detail.totalOrigines) * 100).toFixed(1))
        : 0,
    montant: item.montant,
    devise: detail.client.devise,
  }));

  return (
    <div className="gsm-native-moneymanagementliquidityanatomy-c3fa5d1de">
      <div className="gsm-native-moneymanagementliquidityanatomy-6f9a7c85f">
        <Donut data={chartData} size={210} />
        <Legende data={chartData} />
      </div>
      <div className="gsm-native-moneymanagementliquidityanatomy-a58ac980c">
        {detail.origines.map((item) => (
          <div key={item.numero} className="gsm-native-moneymanagementliquidityanatomy-10ad7589f" style={{ borderColor: C.line }}>
            <div className="gsm-native-moneymanagementliquidityanatomy-971493b9c">
              <div className="gsm-native-moneymanagementliquidityanatomy-cb13d34f9" style={{ color: C.ink }}>
                {item.numero}. {item.libelle}
              </div>
              <Badge tone={roleTone(item.responsable)}>{item.responsable}</Badge>
            </div>
            <div className="gsm-native-moneymanagementliquidityanatomy-e4f77e612" style={F_MONO}>
              {fmt(item.montant)} {detail.client.devise}
            </div>
            <div className="gsm-native-moneymanagementliquidityanatomy-c5629ef51" style={{ color: C.sub }}>
              {item.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AllocationsView({
  detail,
  roleTone,
}: {
  detail: LiquidityAccountDetail;
  roleTone: (role: string) => BadgeTone;
}) {
  const totals = [
    ['Bloquée / réservée', detail.liquiditeBloquee, C.coral, C.negativeBackground],
    ['À investir', detail.autreLiquiditeAInvestir, C.warningText, C.warningBackground],
    ['Disponible', detail.liquiditeDisponibleNette, C.teal, C.positiveBackground],
  ] as const;

  return (
    <div className="gsm-native-moneymanagementliquidityanatomy-760f19e5b">
      <div className="gsm-native-moneymanagementliquidityanatomy-78ca2b38a">
        {totals.map(([label, amount, tone, bg]) => (
          <div key={label} className="gsm-native-moneymanagementliquidityanatomy-432add488" style={{ background: bg }}>
            <div className="gsm-native-moneymanagementliquidityanatomy-c202c7cbf" style={{ color: tone }}>{label}</div>
            <div className="gsm-native-moneymanagementliquidityanatomy-ce529285e" style={{ ...F_DISPLAY, color: C.ink }}>
              {fmt(amount)} {detail.client.devise}
            </div>
          </div>
        ))}
      </div>

      <div className="gsm-native-moneymanagementliquidityanatomy-9c510fdf2">
        {detail.affectations.map((item) => {
          const pct =
            detail.liquiditeActuelle > 0
              ? (item.montant / detail.liquiditeActuelle) * 100
              : 0;
          const color =
            item.groupe === 'Disponible'
              ? C.teal
              : item.groupe === 'À investir'
              ? C.gold
              : C.coral;

          return (
            <div key={item.numero} className="gsm-native-moneymanagementliquidityanatomy-10ad7589f" style={{ borderColor: C.line }}>
              <div className="gsm-native-moneymanagementliquidityanatomy-971493b9c">
                <div>
                  <div className="gsm-native-moneymanagementliquidityanatomy-cb13d34f9" style={{ color: C.ink }}>
                    {item.numero}. {item.libelle}
                  </div>
                  <div className="gsm-native-moneymanagementliquidityanatomy-14ae92857" style={{ color: C.sub }}>{item.groupe}</div>
                </div>
                <Badge tone={roleTone(item.responsable)}>{item.responsable}</Badge>
              </div>
              <div className="gsm-native-moneymanagementliquidityanatomy-0caebedfe">
                <div className="gsm-native-moneymanagementliquidityanatomy-b5b38943d" style={F_MONO}>
                  {fmt(item.montant)} {detail.client.devise}
                </div>
                <div className="gsm-native-moneymanagementliquidityanatomy-5024c189c" style={{ color, ...F_MONO }}>
                  {pct.toFixed(1)}%
                </div>
              </div>
              <div className="gsm-native-moneymanagementliquidityanatomy-ed4acb15f" style={{ background: C.surfaceInset }}>
                <div
                  className="gsm-native-moneymanagementliquidityanatomy-bd6548116"
                  style={{ width: `${Math.min(100, pct)}%`, background: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProfileView({ detail }: { detail: LiquidityAccountDetail }) {
  const gaps = [
    ['22 / 24', 'Actions', detail.ecartActions, detail.montantCorrectionActions],
    ['23 / 25', 'Obligations', detail.ecartObligations, detail.montantCorrectionObligations],
  ] as const;

  return (
    <div className="gsm-native-moneymanagementliquidityanatomy-760f19e5b">
      <div className="gsm-native-moneymanagementliquidityanatomy-d40e28408">
        {gaps.map(([number, asset, gap, amount]) => (
          <div key={asset} className="gsm-native-moneymanagementliquidityanatomy-3e85bbb5c" style={{ borderColor: C.line }}>
            <div className="gsm-native-moneymanagementliquidityanatomy-ed8ac1cb1">
              <div className="gsm-native-moneymanagementliquidityanatomy-beb3f1c07">{number}. Correction écart — {asset}</div>
              <Badge tone="teal">Système</Badge>
            </div>
            <div className="gsm-native-moneymanagementliquidityanatomy-119feb37e">
              <div>
                <div className="gsm-native-moneymanagementliquidityanatomy-ff6a6485a" style={{ color: C.sub }}>
                  Écart à corriger
                </div>
                <div
                  className="gsm-native-moneymanagementliquidityanatomy-8ae838b43"
                  style={{ ...F_DISPLAY, color: gap > 0 ? C.teal : gap < 0 ? C.coral : C.sub }}
                >
                  {gap > 0 ? '+' : ''}{gap.toFixed(1)} pts
                </div>
                <div className="gsm-native-moneymanagementliquidityanatomy-54e708f8b" style={{ color: C.sub }}>
                  {gap > 0
                    ? `Renforcer ${asset.toLowerCase()}`
                    : gap < 0
                    ? `Réduire ${asset.toLowerCase()}`
                    : 'Allocation déjà alignée'}
                </div>
              </div>
              <div>
                <div className="gsm-native-moneymanagementliquidityanatomy-ff6a6485a" style={{ color: C.sub }}>
                  Valeur correspondante
                </div>
                <div className="gsm-native-moneymanagementliquidityanatomy-e4f77e612" style={F_MONO}>
                  {fmt(amount)} {detail.client.devise}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="gsm-native-moneymanagementliquidityanatomy-78ca2b38a">
        <div className="gsm-native-moneymanagementliquidityanatomy-b28420bb6" style={{ background: C.infoBackground }}>
          <div className="gsm-native-moneymanagementliquidityanatomy-c202c7cbf" style={{ color: C.sub }}>
            26. Rendement du portefeuille
          </div>
          <div className="gsm-native-moneymanagementliquidityanatomy-4c5d5a0e2"><Pct v={detail.rendement} /></div>
          <div className="gsm-native-moneymanagementliquidityanatomy-c8821083f"><Badge tone="teal">Système</Badge></div>
        </div>
        <ProfileMetric label="Liquidité cible" value={`${detail.ratioCible.toFixed(1)}%`} />
        <ProfileMetric label="Liquidité prévisionnelle" value={`${detail.ratioPrevisionnel.toFixed(1)}%`} />
      </div>
    </div>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="gsm-native-moneymanagementliquidityanatomy-b28420bb6" style={{ background: C.surfaceElevated }}>
      <div className="gsm-native-moneymanagementliquidityanatomy-c202c7cbf" style={{ color: C.sub }}>{label}</div>
      <div className="gsm-native-moneymanagementliquidityanatomy-ce529285e" style={F_DISPLAY}>{value}</div>
    </div>
  );
}
