export type PrimaryFilterValueType = "number" | "percentage" | "date" | "text" | "boolean";

export interface PrimaryFilterCriterion {
  id: string;
  name: string;
  field: string;
  backendField: string;
  type: PrimaryFilterValueType;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  description: string;
}

export interface PrimaryActiveFilter {
  id: string;
  criterion: PrimaryFilterCriterion;
  operator: ">=" | "<=" | ">" | "<" | "=" | "contains";
  value: number | string;
}

export interface PrimaryFilterSubFamily {
  id: string;
  name: string;
  criteria: PrimaryFilterCriterion[];
}

export interface PrimaryFilterFamily {
  id: string;
  name: string;
  subFamilies: PrimaryFilterSubFamily[];
}

const DESCRIPTIONS: Record<string, string> = {
  isin: "Code ISIN international du titre.",
  issuer: "Nom de l'émetteur du titre.",
  type_name: "Type d'obligation (ex: Treasury Bond, Corporate Bond).",
  reference: "Référence interne de l'émission.",
  coupon_rate: "Taux du coupon en pourcentage.",
  tenor: "Durée résiduelle ou maturité en années.",
  maturity: "Date de maturité du titre.",
  outstanding_nominal: "Nominal restant en circulation.",
  status: "Statut actuel du titre (ex: ACTIVE, INACTIVE).",
  legal_form: "Forme juridique de l'émetteur.",
  coupon_type: "Type de coupon (ex: fixe, variable, zéro coupon).",
  coupon_frequency: "Nombre de paiements de coupon par an.",
  day_count_convention: "Convention de calcul des jours (ex: ACT/360).",
  amortization_method: "Méthode d'amortissement du titre.",
  minimum_trade_unit: "Unité minimale de transaction.",
  is_fungible: "Indique si le titre est fongible.",
  coupon_dates: "Dates de paiement des coupons.",
  payment_day_term: "Délai de paiement après la date de constatation.",
  full_first_coupon: "Indique si le premier coupon est plein.",
  is_amortized: "Indique si le titre est amortissable.",
  is_differed: "Indique si le coupon est différé.",
  differed_period: "Période de différé en jours.",
  auction_count: "Nombre d'enchères (issue lots) associées.",
  total_allocated: "Montant total alloué sur les enchères.",
  total_bids: "Montant total des offres reçues.",
  avg_coverage: "Taux de couverture moyen des enchères.",
  avg_absorption: "Taux d'absorption moyen des enchères.",
  avg_clearing_yield: "Rendement de clôture moyen.",
  avg_bid_to_cover: "Ratio bid-to-cover moyen.",
  cashflow_date: "Date du dernier cashflow enregistré.",
  duration_macaulay: "Duration de Macaulay.",
  accrued_interest: "Intérêts courus.",
  dirty_price: "Prix plein (clean price + intérêts courus).",
  clean_price: "Prix pied de coupon.",
  dv01: "DV01 : variation de prix pour 1bp de variation de taux.",
  convexity: "Convexité du titre.",
  cashflow_status: "Statut du dernier cashflow.",
};

const numberCriterion = (
  id: string,
  name: string,
  backendField: string,
  min: number,
  max: number,
  step: number,
  unit?: string
): PrimaryFilterCriterion => ({
  id,
  name,
  field: backendField.replace(/__/g, "."),
  backendField,
  type: unit === "%" ? "percentage" : "number",
  min,
  max,
  step,
  unit,
  description: DESCRIPTIONS[id] || `Filtre sur ${name}.`,
});

const textCriterion = (id: string, name: string, backendField: string): PrimaryFilterCriterion => ({
  id,
  name,
  field: backendField.replace(/__/g, "."),
  backendField,
  type: "text",
  description: DESCRIPTIONS[id] || `Filtre sur ${name}.`,
});

const dateCriterion = (id: string, name: string, backendField: string): PrimaryFilterCriterion => ({
  id,
  name,
  field: backendField.replace(/__/g, "."),
  backendField,
  type: "date",
  description: DESCRIPTIONS[id] || `Filtre sur ${name}.`,
});

const booleanCriterion = (id: string, name: string, backendField: string): PrimaryFilterCriterion => ({
  id,
  name,
  field: backendField.replace(/__/g, "."),
  backendField,
  type: "boolean",
  description: DESCRIPTIONS[id] || `Filtre sur ${name}.`,
});

export const PRIMARY_FILTER_FAMILIES: PrimaryFilterFamily[] = [
  {
    id: "overview",
    name: "Overview",
    subFamilies: [
      {
        id: "overview_identifiers",
        name: "Identification",
        criteria: [
          textCriterion("isin", "ISIN", "isin"),
          textCriterion("issuer", "Issuer", "issuer__name"),
          textCriterion("type_name", "Bond Type", "type_name"),
          textCriterion("reference", "Reference", "reference"),
        ],
      },
      {
        id: "overview_financial",
        name: "Financial",
        criteria: [
          numberCriterion("coupon_rate", "Coupon (%)", "coupon_rate", 0, 30, 0.01, "%"),
          numberCriterion("tenor", "Tenor (Y)", "tenor", 0, 50, 0.1),
          dateCriterion("maturity", "Maturity Date", "latest_cashflow__timestamp"),
          numberCriterion("outstanding_nominal", "Outstanding Nominal", "latest_cashflow__outstanding_nominal", 0, 100_000_000_000, 1_000_000),
          textCriterion("status", "Status", "status"),
        ],
      },
    ],
  },
  {
    id: "bond-info",
    name: "Bond Info",
    subFamilies: [
      {
        id: "bond_info_attributes",
        name: "Attributes",
        criteria: [
          textCriterion("legal_form", "Legal Form", "legal_form"),
          textCriterion("coupon_type", "Coupon Type", "coupon_type"),
          numberCriterion("coupon_frequency", "Coupon Frequency", "coupon_frequency", 0, 12, 1),
          textCriterion("day_count_convention", "Day Count", "day_count_convention"),
          textCriterion("amortization_method", "Amortization", "amortization_method"),
          numberCriterion("minimum_trade_unit", "Min. Trade Unit", "minimum_trade_unit", 0, 100_000_000, 1),
          booleanCriterion("is_fungible", "Fungible", "is_fungible"),
        ],
      },
    ],
  },
  {
    id: "coupon",
    name: "Coupon",
    subFamilies: [
      {
        id: "coupon_attributes",
        name: "Coupon Attributes",
        criteria: [
          numberCriterion("coupon_rate", "Coupon (%)", "coupon_rate", 0, 30, 0.01, "%"),
          numberCriterion("coupon_frequency", "Frequency", "coupon_frequency", 0, 12, 1),
          numberCriterion("payment_day_term", "Payment Day Term", "payment_day_term", 0, 365, 1),
          booleanCriterion("full_first_coupon", "Full First Coupon", "full_first_coupon"),
          booleanCriterion("is_amortized", "Amortized", "is_amortized"),
          booleanCriterion("is_differed", "Deferred", "is_differed"),
          numberCriterion("differed_period", "Deferred Period", "differed_period", 0, 365, 1),
        ],
      },
    ],
  },
  {
    id: "emission-stats",
    name: "Emission Statistics",
    subFamilies: [
      {
        id: "emission_metrics",
        name: "Auction Metrics",
        criteria: [
          numberCriterion("auction_count", "Auction Count", "issue_lots__count", 0, 100, 1),
          numberCriterion("total_allocated", "Total Allocated", "issue_lots__amount_allocated", 0, 100_000_000_000, 1_000_000),
          numberCriterion("total_bids", "Total Bids", "issue_lots__amount_bids_received", 0, 100_000_000_000, 1_000_000),
          numberCriterion("avg_coverage", "Avg. Coverage", "issue_lots__coverage_rate", 0, 50, 0.01),
          numberCriterion("avg_absorption", "Avg. Absorption", "issue_lots__absorption_rate", 0, 50, 0.01),
          numberCriterion("avg_clearing_yield", "Avg. Clearing Yield (%)", "issue_lots__clearing_yield", 0, 0.5, 0.0001, "%"),
          numberCriterion("avg_bid_to_cover", "Avg. Bid-to-Cover", "issue_lots__bid_to_cover_ratio", 0, 50, 0.01),
        ],
      },
    ],
  },
  {
    id: "upcoming-emissions",
    name: "Cashflow & Risk",
    subFamilies: [
      {
        id: "cashflow_metrics",
        name: "Cashflow Metrics",
        criteria: [
          dateCriterion("cashflow_date", "Latest Cashflow Date", "latest_cashflow__timestamp"),
          numberCriterion("outstanding_nominal", "Outstanding Nominal", "latest_cashflow__outstanding_nominal", 0, 100_000_000_000, 1_000_000),
          numberCriterion("duration_macaulay", "Duration Macaulay", "latest_cashflow__duration_macaulay", 0, 100, 0.01),
          numberCriterion("accrued_interest", "Accrued Interest", "latest_cashflow__accrued_interest", 0, 100_000_000, 1),
          numberCriterion("dirty_price", "Dirty Price", "latest_cashflow__dirty_price", 0, 200, 0.01),
          numberCriterion("clean_price", "Clean Price", "latest_cashflow__clean_price", 0, 200, 0.01),
          numberCriterion("dv01", "DV01", "latest_cashflow__dv01", -10, 10, 0.0001),
          numberCriterion("convexity", "Convexity", "latest_cashflow__convexity", -10, 10, 0.0001),
          textCriterion("cashflow_status", "Cashflow Status", "latest_cashflow__status"),
        ],
      },
    ],
  },
];

export const getPrimaryCriterionById = (id: string): PrimaryFilterCriterion | undefined => {
  for (const family of PRIMARY_FILTER_FAMILIES) {
    for (const subFamily of family.subFamilies) {
      const criterion = subFamily.criteria.find((c) => c.id === id);
      if (criterion) return criterion;
    }
  }
  return undefined;
};

export const operatorToSuffix = (operator: string): string => {
  switch (operator) {
    case ">=":
      return "__gte";
    case "<=":
      return "__lte";
    case ">":
      return "__gt";
    case "<":
      return "__lt";
    case "=":
      return "__iexact";
    case "contains":
      return "__icontains";
    default:
      return "";
  }
};
