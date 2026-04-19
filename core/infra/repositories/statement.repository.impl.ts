import { useState, useCallback }  from 'react';
import { 
  useCreateStatementMutation, 
  useDeleteStatementMutation, 
  useGetAllStatementsQuery, 
  useLazyGetAllStatementsQuery,
  useGetStatementByIdQuery,
  useUpdateStatementMutation, 
  useUploadStatementMutation,
} from "../store/api";
import { skipToken } from '@reduxjs/toolkit/query/react';
import { CreateStatementType, StatementType, UpdateStatementType, StatementQueryParams } from '@/core/domain/types/statement.type';
import { FinancialValueEntity } from '@/core/domain/entities/statement.entity';
import { PaginatedResponse, QueryParams } from '../../domain/types/pagination.type';
import { IStatementRepository } from '@/core/domain/repositories/statement.repository';

export const useStatementRepository = (): IStatementRepository => {
  const [
    createMutation,
    {
      isLoading: isCreating,
      isSuccess: isCreationSuccess,
      isError: isCreationError,
      error: creationErrorData,
      reset: resetCreateMutation,
    },
  ] = useCreateStatementMutation();

  const [
    uploadStatementsMutation,
    {
      isLoading: isUploading,
      isSuccess: isUploadSuccess,
      isError: isUploadError,
      error: uploadErrorData,
      reset: resetUploadMutation,
    },
  ] = useUploadStatementMutation();

  const [
    updateMutation,
    {
      isLoading: isUpdating,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
      error: updateErrorData,
      reset: resetUpdateMutation,
    },
  ] = useUpdateStatementMutation();

  const [
    deleteStatementMutation,
    {
      isLoading: isDeleting,
      isSuccess: isDeletionSuccess,
      isError: isDeletionError,
      error: deletionErrorData,
      reset: resetDeleteMutation,
    },
  ] = useDeleteStatementMutation();

  const [statementIdArg, setStatementIdArg] = useState<string | typeof skipToken>(skipToken);

  const [
    triggerGetAllStatements,
    {
      data: allStatementsQueryResult,
      isLoading: isLoadingAllStatementsQuery,
      isFetching: isFetchingAllStatementsQuery,
      error: allStatementsQueryError,
    },
  ] = useLazyGetAllStatementsQuery();

  const {
    data: currentStatementQueryResult,
    isLoading: isLoadingStatementByIdQuery,
    isFetching: isFetchingStatementByIdQuery,
    error: StatementByIdQueryError,
    refetch: refetchStatementByIdQuery,
  } = useGetStatementByIdQuery(statementIdArg === skipToken ? skipToken : { id: statementIdArg as string });

  const isMutationLoading = isCreating || isUploading || isUpdating || isDeleting;
  const isMutationSuccessOverall = isCreationSuccess || isUploadSuccess || isUpdateSuccess || isDeletionSuccess;
  const isMutationErrorOverall = isCreationError || isUploadError || isUpdateError || isDeletionError;
  const mutationErrorOverall = creationErrorData || uploadErrorData || updateErrorData || deletionErrorData;

  const createStatement = useCallback(async (Statement: CreateStatementType): Promise<StatementType> => {
    resetCreateMutation();
    return createMutation(Statement).unwrap();
  }, [createMutation, resetCreateMutation]);

  const uploadStatements = useCallback(async (formData: any): Promise<void> => {
    resetUploadMutation();
    await uploadStatementsMutation(formData).unwrap();
  }, [uploadStatementsMutation, resetUploadMutation]);

  const updateStatement = useCallback(async (id: string, Statement: UpdateStatementType): Promise<StatementType | null> => {
    resetUpdateMutation();
    return updateMutation({ id, ...Statement }).unwrap();
  }, [updateMutation, resetUpdateMutation]);

  const deleteStatement = useCallback(async (id: string): Promise<boolean> => {
    resetDeleteMutation();
    await deleteStatementMutation(id).unwrap();
    return true;
  }, [deleteStatementMutation, resetDeleteMutation]);

  const getAllStatements = useCallback(
    async (
      params: QueryParams = {}
    ): Promise<PaginatedResponse<FinancialValueEntity>> => {
      const result = await triggerGetAllStatements(params).unwrap();
      return result;
    },
    [triggerGetAllStatements]
  );
  
  const getStatementById = useCallback((id: string) => {
    setStatementIdArg(id);
    return currentStatementQueryResult || null;
  }, [currentStatementQueryResult]);

  return {
    createStatement,
    uploadStatements,
    updateStatement,
    deleteStatement,
    getAllStatements,
    getStatementById,

    allStatementsData: allStatementsQueryResult,
    isLoadingAllStatements: isLoadingAllStatementsQuery,
    isFetchingAllStatements: isFetchingAllStatementsQuery,
    allStatementsError: allStatementsQueryError,

    currentStatementData: currentStatementQueryResult,
    isLoadingStatementById: isLoadingStatementByIdQuery,
    isFetchingStatementById: isFetchingStatementByIdQuery,
    statementByIdError: StatementByIdQueryError,

    isMutationLoading,
    isMutationSuccess: isMutationSuccessOverall,
    isMutationError: isMutationErrorOverall,
    mutationError: mutationErrorOverall,
  };
};
