import { z } from 'zod';
import { OPCVMNatureEnum, OPCVMTypeEnum, OPCVMAffectationResultatEnum } from '../enums/opcvm.enum';
import { timeStamp } from 'console';

export const opcvmSchema = z.object({
    id: z.uuid(),
    number: z.string().optional(),
    intitule: z.string().min(1, "Intitulé is required").max(255, "Intitulé must be less than 255 characters"),
    
    institution: z.uuid().optional(),
    instrument: z.uuid().optional(),
    isin: z.string().min(1, "ISIN is required").max(50, "ISIN must be less than 50 characters"),
    nature: z.enum([
        OPCVMNatureEnum.FCP,
        OPCVMNatureEnum.HEDGE_FUND,
        OPCVMNatureEnum.SICAV,
    ]),
    type: z.enum([
        OPCVMTypeEnum.A,
        OPCVMTypeEnum.C,
        OPCVMTypeEnum.D,
        OPCVMTypeEnum.OCT,
        OPCVMTypeEnum.OMLT,
    ]),
    sgo: z.string().optional(),
    gestionnaire: z.string().optional(),
    
    promoteurs: z.string().optional(),
    depositaire: z.string().optional(),
    
    delai_reglement_depositaire: z.number().min(0, "Délai must be positive").optional(),
    commissaires_comptes: z.string().optional(),
    receveurs_souscriptions_rachats: z.string().optional(),
    duree_placement_recommandee: z.number().min(0, "Durée must be positive").optional(),
    
    directeur_general: z.string().optional(),
    valeur_demarrage: z.number().min(0, "Valeur de démarrage must be positive").optional(),
    max_souscription: z.number().min(0, "Max souscription must be positive").optional(),
    max_rachat: z.number().min(0, "Max rachat must be positive").optional(),
    max_gestion: z.number().min(0, "Max gestion must be positive").optional(),
    periodicite: z.string().optional(),
    affectation_resultat: z.enum([
        OPCVMAffectationResultatEnum.CAPITALISATION,
        OPCVMAffectationResultatEnum.DISTRIBUTION,
        OPCVMAffectationResultatEnum.MIXTE,
    ]),
    
    indice_description: z.string().optional(),
    indice_reference: z.string().optional(),
    souscription_min: z.number().min(0, "Souscription min must be positive").optional(),
    date_creation: z.date().optional(),
    date_agrement: z.date().optional(),
    retrocession_commission: z.number().min(0, "Rétrocession must be positive").optional(),
    capital_initial: z.number().min(0, "Capital initial must be positive").optional(),
    aum: z.number().min(0, "AUM must be positive").optional(),
    commission_au_compte: z.number().min(0, "Commission must be positive").optional(),
    redevance_autorite_marche: z.number().min(0, "Redevance must be positive").optional(),
    country: z.string().optional(),
    objectif_investissement: z.string().optional(),
    orientation_strategique: z.string().optional(),
    
    actif_net: z.number().min(0, "Actif net must be positive").optional(),
    niveau_risque: z.number().min(0, "Niveau risque must be positive").max(7, "Niveau risque cannot exceed 7").optional(),
    contribution_odd: z.number().optional(),
    
    isr: z.boolean().optional(),
    
    website: z.string().optional(),
});

export const createOpcvmSchema = opcvmSchema.omit({
    id: true,
});

export const updateOpcvmSchema = opcvmSchema.partial();




export const opcvmMetricSchema = z.object({
    id: z.uuid(),
    opcvm: z.uuid().optional(),
    timestamp: z.date(),
    timeframe: z.string().optional(),
    liquidative_value: z.number().min(0, "Liquidative value must be positive").optional(),
    rendement: z.number().optional(),
    ratioSharpe: z.number().optional(),
    sortinoRatio: z.number().optional(),
    treynorRatio: z.number().optional(),
    turnover: z.number().optional(),
    volatility: z.number().optional(),
    beta: z.number().optional(),
    ratioInformation: z.number().optional(),
    alpha: z.number().optional(),
    trackingError: z.number().optional(),
    performance1Y: z.number().optional(),
    performance3Y: z.number().optional(),
    performance5Y: z.number().optional(),
    performanceJanuary: z.number().optional()
});


export const createOpcvmMetricSchema = opcvmMetricSchema.omit({
    id: true,
});

export const updateOpcvmMetricSchema = opcvmMetricSchema.partial();
