
export interface PeriodEntity {
    id: string;
    year?: number;
    frequency: 'A' | 'Q' | 'S';
    number: string;
}