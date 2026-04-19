import { z } from 'zod';
import { DividendFrequencyEnum, DividendTypeEnum } from '../enums/dividend.enum';

export const dividendSchema = z.object({
    id: z.string().uuid(),
    action: z.string().uuid(),
    ex_date: z.string(),
    declared_date: z.string(),
    record_date: z.string(),
    pay_date: z.string(),
    amount: z.number().positive("Amount must be positive"),
    frequency: z.enum([
        DividendFrequencyEnum.QUARTER,
        DividendFrequencyEnum.SEMI_ANNUAL,
        DividendFrequencyEnum.ANNUAL,
        DividendFrequencyEnum.IRREGULAR,
        DividendFrequencyEnum.MONTHLY,
        DividendFrequencyEnum.NONE,
        DividendFrequencyEnum.OTHER,
        DividendFrequencyEnum.SUSPENDED,
        DividendFrequencyEnum.THREE_TIMES_A_YEAR
    ]),
    type: z.enum([
        DividendTypeEnum.CANCELLED,
        DividendTypeEnum.DISCONTINUED,
        DividendTypeEnum.FINAL,
        DividendTypeEnum.INTERIM,
        DividendTypeEnum.OTHER,
        DividendTypeEnum.OMITTED,
        DividendTypeEnum.RETURN_OF_CAPITAL,
        DividendTypeEnum.RETURN_OF_PREMIUM,
        DividendTypeEnum.SECOND_INTERIM,
        DividendTypeEnum.SPECIAL_CASH,
        DividendTypeEnum.REGULAR_CASH
    ]),
});

export const createDividendSchema = dividendSchema.omit({
    id: true,
});

export const updateDividendSchema = dividendSchema.partial();
