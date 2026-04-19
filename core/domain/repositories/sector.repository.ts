import { SectorType, CreateSectorType, UpdateSectorType } from '../types/sector.type';
import { PaginatedResponse, QueryParams } from '../types/pagination.type';
import { SectorEntity } from '../entities/sector.entity';

export interface ISectorRepository {
  createSector: (sector: CreateSectorType) => Promise<SectorType>;
  uploadSectors: (formData: any) => Promise<void>;
  updateSector: (id: string, sector: UpdateSectorType) => Promise<SectorType | null>;
  deleteSector: (id: string) => Promise<boolean>;
  getAllSectors: (params?: QueryParams) => Promise<PaginatedResponse<SectorEntity>>;
  getSectorById: (id: string) => SectorEntity | null;

  allSectorsData?: PaginatedResponse<SectorEntity>;
  isLoadingAllSectors: boolean;
  isFetchingAllSectors: boolean;
  allSectorsError?: any;
  // refetchAllSectors: () => void;

  currentSectorData?: SectorEntity | null;
  isLoadingSectorById: boolean;
  isFetchingSectorById: boolean;
  sectorByIdError?: any;
  // refetchSectorById: () => void;

  isMutationLoading: boolean;
  isMutationSuccess: boolean;
  isMutationError: boolean;
  mutationError?: any;
}