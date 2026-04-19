import { SheetEntity } from '../entities/sheet.entity';
import { CreateSheetType, SheetType, UpdateSheetType, SheetQueryParams } from '../types/sheet.type';
import { PaginatedResponse } from '../types/pagination.type';

export interface ISheetRepository {
  createSheet: (sheet: CreateSheetType) => Promise<SheetEntity>;
  uploadSheets: (formData: any) => Promise<void>;
  updateSheet: (id: string, sheet: UpdateSheetType) => Promise<SheetEntity | null>;
  deleteSheet: (id: string) => Promise<boolean>;
  getAllSheets: (params?: SheetQueryParams) => Promise<PaginatedResponse<SheetEntity>>;
  getSheetById: (id: string) => SheetEntity | null;

  allSheetsData?: PaginatedResponse<SheetEntity>;
  isLoadingAllSheets: boolean;
  isFetchingAllSheets: boolean;
  allSheetsError?: any;

  currentSheetData?: SheetEntity | null;
  isLoadingSheetById: boolean;
  isFetchingSheetById: boolean;
  sheetByIdError?: any;

  isMutationLoading: boolean;
  isMutationSuccess: boolean;
  isMutationError: boolean;
  mutationError?: any;
}
