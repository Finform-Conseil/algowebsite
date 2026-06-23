import { MacroSectorValueEntity, MacroCountryDataEntity } from '../entities/macro.entity';
import { CreateMacroType, MacroQueryParams, MacroType, UpdateMacroType } from '../types/macro.type';
import { PaginatedResponse } from '../types/pagination.type';

export interface IMacroRepository {
  createMacro: (macro: CreateMacroType) => Promise<MacroType>;

  uploadSectorReal: (formData: any) => Promise<void>;
  uploadSectorForeign: (formData: any) => Promise<void>;
  uploadSectorMonetary: (formData: any) => Promise<void>;
  uploadSectorFinances: (formData: any) => Promise<void>;

  updateMacro: (id: string, statement: UpdateMacroType) => Promise<MacroType | null>;
  deleteMacro: (id: string) => Promise<boolean>;

  getAllSectorReal: (params?: MacroQueryParams) => Promise<MacroCountryDataEntity>;
  getAllSectorForeign: (params?: MacroQueryParams) => Promise<MacroCountryDataEntity>;
  getAllSectorMonetary: (params?: MacroQueryParams) => Promise<MacroCountryDataEntity>;
  getAllSectorFinances: (params?: MacroQueryParams) => Promise<MacroCountryDataEntity>;

  getMacroById: (id: string) => MacroSectorValueEntity | null;

  allSectorRealData?: MacroCountryDataEntity;
  allSectorForeignData?: MacroCountryDataEntity;
  allSectorMonetaryData?: MacroCountryDataEntity;
  allSectorFinancesData?: MacroCountryDataEntity;

  currentMacroData?: MacroSectorValueEntity | null;
  isLoadingMacroById: boolean;
  isFetchingMacroById: boolean;
  statementByIdError?: any;

  isMutationLoading: boolean;
  isMutationSuccess: boolean;
  isMutationError: boolean;
  mutationError?: any;
}
