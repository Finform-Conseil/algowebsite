import { InstrumentEntity } from "./instrument.entity";
import { InstitutionEntity } from "./institution.entity";
import { OPCVMNatureEnum, OPCVMTypeEnum, OPCVMAffectationResultatEnum } from "../enums/opcvm.enum";
import { SGOEntity } from "./sgo.entity";

export interface OPCVMEntity {
    id?: string;
    number?: string;
    intitule: string;

    institution?: string;
    instrument?: string;
    isin: string;
    nature: OPCVMNatureEnum;
    type: OPCVMTypeEnum;
    sgo?: SGOEntity;
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
    souscription_min : number;
    date_creation : Date;
    date_agrement : Date;
    retrocession_commission : number;
    capital_initial : number;
    aum : number;
    commission_au_compte : number;
    redevance_autorite_marche : number;
    country : string;
    objectif_investissement : string;
    orientation_strategique : string;

    actif_net : number;
    niveau_risque : number;
    contribution_odd?: number;

    isr?: boolean;

    website?: string;


}


export interface OPCVMMetricEntity {
    id?: string;

    opcvm: OPCVMEntity;
    timeframe: string;
    timestamp: string;
    liquidative_value: number;

    rendement?: number;
    ratioSharpe?: number;
    sortinoRatio?: number;
    treynorRatio?: number;
   
    turnover?: number;
    volatility?: number;
    beta?: number;
    ratioInformation?: number;
    alpha?: number;
    trackingError?: number;

    performance1Y?: number;
    performance3Y?: number;
    performance5Y?: number;
    performanceJanuary?: number;

    souscriptionPercent?: number;
    rachatPercent?: number;
}