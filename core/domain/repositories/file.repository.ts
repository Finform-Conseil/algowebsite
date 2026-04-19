import { FileEntity } from "../entities/file.entity";
import { CreateFileType, FileQueryParams, UploadFileResponse } from "../types/file.type";
import { PaginatedResponse } from "../types/pagination.type";

export interface IFileRepository {
  uploadFile(file: CreateFileType): Promise<UploadFileResponse>;
  getAllFiles(params?: FileQueryParams): Promise<PaginatedResponse<FileEntity>>;
  getFileById(id: string): FileEntity | null;
  deleteFile(id: string): Promise<void>;

  // Query states
  allFilesData?: PaginatedResponse<FileEntity>;
  isLoadingAllFiles?: boolean;
  isFetchingAllFiles?: boolean;
  allFilesError?: any;

  currentFileData?: FileEntity;
  isLoadingFileById?: boolean;
  isFetchingFileById?: boolean;
  fileByIdError?: any;

  // Mutation states
  isMutationLoading?: boolean;
  isMutationSuccess?: boolean;
  isMutationError?: boolean;
  mutationError?: any;
}
