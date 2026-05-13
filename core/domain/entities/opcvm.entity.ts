import { InstrumentEntity } from "./instrument.entity";
import { InstitutionEntity } from "./institution.entity";
import { OPCVMNatureEnum, OPCVMTypeEnum, OPCVMAffectationResultatEnum } from "../enums/opcvm.enum";
import { SGOEntity } from "./sgo.entity";
import { CurrencyEntity } from "./currency.entity";
import { CountryEntity } from "./country.entity";

export interface OPCVMEntity {
    id: string;
    number?: string;
    intitule: string;

    institution?: string;
    instrument?: string;
    isin: string;
    bourse?: string;
    nature: OPCVMNatureEnum;
    type: OPCVMTypeEnum;
    sgo?: string | SGOEntity;
    currency?: string | CurrencyEntity;
    gestionnaire: string;

    promoteurs : string;
    depositaire : string;

    delai_reglement_depositaire : number;
    commissaires_comptes : string;
    receveurs_souscriptions_rachats : string;
    duree_placement_recommandee : number;

    directeur_general : string;
    valeur_demarrage : number;
    max_souscription : number;
    max_rachat : number;
    max_gestion : number;
    periodicite : string;
    affectation_resultat : OPCVMAffectationResultatEnum;

    indice_description : string;
    indice_reference : string;
    souscription_min ?: number;
    date_creation : Date;
    date_agrement : Date;
    retrocession_commission : number;
    capital_initial : number;
    aum : number;
    commission_au_compte : number;
    commission_au_compte_type : 'amount' | 'percentage' | 'unit';
    redevance_autorite_marche : number;
    redevance_autorite_marche_type : 'amount' | 'percentage' | 'unit';
    country : string | CountryEntity;
    objectif_investissement : string;
    orientation_strategique : string;

    actif_net : number;
    niveau_risque : number;
    contribution_odd?: number;
    isr?: boolean;
    website?: string;

    latest_metrics?: OPCVMMetricEntity;
}


export interface OPCVMMetricEntity {
    opcvm: string;
    timeframe: number;
    timestamp: string;
    
    // Valeur liquidative
    liquidative_value: string;
    
    // Performance par période
    performance_1m?: number | null;
    performance_3m?: number | null;
    performance_6m?: number | null;
    performance_9m?: number | null;
    performance_1y?: number | null;
    performance_3y?: number | null;
    performance_5y?: number | null;
    performance_ytd?: number | null;
    performance_inception?: number | null;

    // Rendement par période
    rendement?: number | null;
    rendement_1m?: number | null;
    rendement_3m?: number | null;
    rendement_6m?: number | null;
    rendement_9m?: number | null;
    rendement_1y?: number | null;
    rendement_3y?: number | null;
    rendement_5y?: number | null;
    
    // Volatilité par période
    volatility?: number | null;
    volatility_1m?: number | null;
    volatility_3m?: number | null;
    volatility_6m?: number | null;
    volatility_9m?: number | null;
    volatility_1y?: number | null;
    volatility_3y?: number | null;
    volatility_5y?: number | null;
    
    // Sharpe Ratio par période
    sharpe_ratio_1m?: number | null;
    sharpe_ratio_3m?: number | null;
    sharpe_ratio_6m?: number | null;
    sharpe_ratio_9m?: number | null;
    sharpe_ratio_1y?: number | null;
    sharpe_ratio_3y?: number | null;
    sharpe_ratio_5y?: number | null;
    
    // Sortino Ratio par période
    sortino_ratio_1m?: number | null;
    sortino_ratio_3m?: number | null;
    sortino_ratio_6m?: number | null;
    sortino_ratio_9m?: number | null;
    sortino_ratio_1y?: number | null;
    sortino_ratio_3y?: number | null;
    sortino_ratio_5y?: number | null;
    
    // Calmar Ratio par période
    calmar_ratio?: number | null;
    calmar_ratio_1m?: number | null;
    calmar_ratio_3m?: number | null;
    calmar_ratio_6m?: number | null;
    calmar_ratio_9m?: number | null;
    calmar_ratio_1y?: number | null;
    calmar_ratio_3y?: number | null;
    calmar_ratio_5y?: number | null;
    
    // Treynor Ratio par période
    treynor_ratio_1m?: number | null;
    treynor_ratio_3m?: number | null;
    treynor_ratio_6m?: number | null;
    treynor_ratio_9m?: number | null;
    treynor_ratio_1y?: number | null;
    treynor_ratio_3y?: number | null;
    treynor_ratio_5y?: number | null;
    
    // Information Ratio par période
    information_ratio?: number | null;
    information_ratio_1m?: number | null;
    information_ratio_3m?: number | null;
    information_ratio_6m?: number | null;
    information_ratio_9m?: number | null;
    information_ratio_1y?: number | null;
    information_ratio_3y?: number | null;
    information_ratio_5y?: number | null;
    
    // Alpha par période
    alpha?: number | null;
    alpha_1m?: number | null;
    alpha_3m?: number | null;
    alpha_6m?: number | null;
    alpha_9m?: number | null;
    alpha_1y?: number | null;
    alpha_3y?: number | null;
    alpha_5y?: number | null;
    
    // Beta par période
    beta?: number | null;
    beta_1m?: number | null;
    beta_3m?: number | null;
    beta_6m?: number | null;
    beta_9m?: number | null;
    beta_1y?: number | null;
    beta_3y?: number | null;
    beta_5y?: number | null;
    
    // Downside Deviation par période
    downside_deviation?: number | null;
    downside_deviation_1m?: number | null;
    downside_deviation_3m?: number | null;
    downside_deviation_6m?: number | null;
    downside_deviation_9m?: number | null;
    downside_deviation_1y?: number | null;
    downside_deviation_3y?: number | null;
    downside_deviation_5y?: number | null;
    
    // Max Drawdown par période
    max_drawdown?: number | null;
    max_drawdown_1m?: number | null;
    max_drawdown_3m?: number | null;
    max_drawdown_6m?: number | null;
    max_drawdown_9m?: number | null;
    max_drawdown_1y?: number | null;
    max_drawdown_3y?: number | null;
    max_drawdown_5y?: number | null;
    
    // Tracking Error par période
    tracking_error?: number | null;
    tracking_error_1m?: number | null;
    tracking_error_3m?: number | null;
    tracking_error_6m?: number | null;
    tracking_error_9m?: number | null;
    tracking_error_1y?: number | null;
    tracking_error_3y?: number | null;
    tracking_error_5y?: number | null;
    
    // Correlation avec benchmark par période
    correlation_benchmark?: number | null;
    correlation_benchmark_1m?: number | null;
    correlation_benchmark_3m?: number | null;
    correlation_benchmark_6m?: number | null;
    correlation_benchmark_9m?: number | null;
    correlation_benchmark_1y?: number | null;
    correlation_benchmark_3y?: number | null;
    correlation_benchmark_5y?: number | null;
    
    // Active Return par période
    active_return_1m?: number | null;
    active_return_3m?: number | null;
    active_return_6m?: number | null;
    active_return_9m?: number | null;
    active_return_1y?: number | null;
    active_return_3y?: number | null;
    active_return_5y?: number | null;
    
    // Benchmark Return par période
    benchmark_return_1m?: number | null;
    benchmark_return_3m?: number | null;
    benchmark_return_6m?: number | null;
    benchmark_return_9m?: number | null;
    benchmark_return_1y?: number | null;
    benchmark_return_3y?: number | null;
    benchmark_return_5y?: number | null;
    
    // Risk-Free Rate par période
    risk_free_rate_1d?: number | null;
    risk_free_rate_1m?: number | null;
    risk_free_rate_3m?: number | null;
    risk_free_rate_6m?: number | null;
    risk_free_rate_9m?: number | null;
    risk_free_rate_1y?: number | null;
    risk_free_rate_3y?: number | null;
    risk_free_rate_5y?: number | null;
    
    // Autres métriques
    rating: number | null;
    cagr_inception?: number | null;
    turnover?: number | null;
    expense_ratio?: number | null;
    net_return_after_fees?: number | null;
    
    // Flux et souscriptions/rachats
    souscription_percent?: number | null;
    rachat_percent?: number | null;
    net_flow_amount?: number | null;
    net_flow_percent?: number | null;
    aum_growth?: number | null;
    redemption_to_subscription_ratio?: number | null;
}