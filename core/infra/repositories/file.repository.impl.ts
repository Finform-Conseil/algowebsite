import { useState, useCallback } from 'react';
import { 
  useUploadFileMutation,
  useDeleteFileMutation,
  useGetAllFilesQuery,
  useLazyGetAllFilesQuery,
  useGetFileByIdQuery,
} from "../store/api";
import { skipToken } from '@reduxjs/toolkit/query/react';
import { IFileRepository } from '../../domain/repositories/file.repository';
import { CreateFileType, FileQueryParams, UploadFileResponse } from '../../domain/types/file.type';
import { FileEntity } from '@/core/domain/entities/file.entity';
import { PaginatedResponse } from '@/core/domain/types/pagination.type';

export const useFileRepository = (): IFileRepository => {
  const [
    uploadFileMutation,
    {
      isLoading: isUploading,
      isSuccess: isUploadSuccess,
      isError: isUploadError,
      error: uploadErrorData,
      reset: resetUploadMutation,
    },
  ] = useUploadFileMutation();

  const [
    deleteFileMutation,
    {
      isLoading: isDeleting,
      isSuccess: isDeletionSuccess,
      isError: isDeletionError,
      error: deletionErrorData,
      reset: resetDeleteMutation,
    },
  ] = useDeleteFileMutation();

  const [fileIdArg, setFileIdArg] = useState<string | typeof skipToken>(skipToken);

  const [
    triggerGetAllFiles,
    {
      data: allFilesQueryResult,
      isLoading: isLoadingAllFilesQuery,
      isFetching: isFetchingAllFilesQuery,
      error: allFilesQueryError,
    },
  ] = useLazyGetAllFilesQuery();

  const {
    data: currentFileQueryResult,
    isLoading: isLoadingFileByIdQuery,
    isFetching: isFetchingFileByIdQuery,
    error: fileByIdQueryError,
    refetch: refetchFileByIdQuery,
  } = useGetFileByIdQuery(fileIdArg === skipToken ? skipToken : { id: fileIdArg as string }, {});

  const isMutationLoading = isUploading || isDeleting;
  const isMutationSuccess = isUploadSuccess || isDeletionSuccess;
  const isMutationError = isUploadError || isDeletionError;
  const mutationError = uploadErrorData || deletionErrorData;

  const uploadFile = useCallback(async (fileData: CreateFileType): Promise<UploadFileResponse> => {
    resetUploadMutation();
    
    const formData = new FormData();
    
    if (fileData.file) {
      formData.append('file', fileData.file);
    }
    
    if (fileData.url) {
      formData.append('url', fileData.url);
    }
    
    if (fileData.name) {
      formData.append('name', fileData.name);
    }
    
    return uploadFileMutation(formData).unwrap();
  }, [uploadFileMutation, resetUploadMutation]);

  const deleteFile = useCallback(async (id: string): Promise<void> => {
    resetDeleteMutation();
    await deleteFileMutation(id).unwrap();
  }, [deleteFileMutation, resetDeleteMutation]);

  const getAllFiles = useCallback(
    async (
      params: FileQueryParams = {}
    ): Promise<PaginatedResponse<FileEntity>> => {
      const result = await triggerGetAllFiles(params).unwrap();
      return result;
    },
    [triggerGetAllFiles]
  );

  const getFileById = useCallback((id: string) => {
    setFileIdArg(id);
    return currentFileQueryResult || null;
  }, [currentFileQueryResult]);

  return {
    uploadFile,
    deleteFile,
    getAllFiles,
    getFileById,

    allFilesData: allFilesQueryResult,
    isLoadingAllFiles: isLoadingAllFilesQuery,
    isFetchingAllFiles: isFetchingAllFilesQuery,
    allFilesError: allFilesQueryError,

    currentFileData: currentFileQueryResult,
    isLoadingFileById: isLoadingFileByIdQuery,
    isFetchingFileById: isFetchingFileByIdQuery,
    fileByIdError: fileByIdQueryError,

    isMutationLoading,
    isMutationSuccess,
    isMutationError,
    mutationError,
  };
};
