import { ActionEntity } from "./action.entity";

export interface ActionnariatEntity {
    id: string;
    action: ActionEntity;
    date: string;
    owner: string;
    percentage: number;
    value: number;
}