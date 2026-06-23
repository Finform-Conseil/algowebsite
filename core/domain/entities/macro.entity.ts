import { CountryEntity } from "./country.entity";
import { PeriodEntity } from "./config.entity";

export interface MacroItemValueEntity {
    period: PeriodEntity;
    value: string;
}

export interface MacroItemTreeNode {
    id: string;
    code: string;
    label: string;
    path: string;
    level: number;
    values: MacroItemValueEntity[];
    children: MacroItemTreeNode[];
}

export interface MacroCountryDataEntity {
    country: CountryEntity;
    items: MacroItemTreeNode[];
}

export interface MacroSectorItemEntity {
    id: string;
    code: string;
    label: string;
    path: string;
    level: number;
}

export interface MacroSectorValueEntity {
    id: string;
    country: CountryEntity;
    item: MacroSectorItemEntity;
    period: PeriodEntity;
    value: number;
}