import { useState, useEffect, useCallback }  from 'react';

import { ChangePasswordType, CreateUserType, UpdateUserType, UserQueryParams } from "@/core/domain/types/user.type"; 
import { 
  useCreateUserMutation, 
  useDeleteUserMutation, 
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useChangePasswordMutation,
} from "../store/api";
import { skipToken } from '@reduxjs/toolkit/query/react';
import { UserEntity } from '@/core/domain/entities/user.entity';
import { PaginatedResponse } from '@/core/domain/types/pagination.type';
import { IUserRepository } from '@/core/domain/repositories/user.repository';


export const useUserRepository = (): IUserRepository => {
  const [
    createMutation,
    {
      isLoading: isCreating,
      isSuccess: isCreationSuccess,
      isError: isCreationError,
      error: creationErrorData,
      reset: resetCreateMutation,
    },
  ] = useCreateUserMutation();

  const [
    updateMutation,
    {
      isLoading: isUpdating,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
      error: updateErrorData,
      reset: resetUpdateMutation,
    },
  ] = useUpdateUserMutation();

  const [
    changePasswordMutation,
    {
      isLoading: isChangingPassword,
      isSuccess: isChangePasswordSuccess,
      isError: isChangePasswordError,
      error: changePasswordErrorData,
      reset: resetChangePasswordMutation,
    },
  ] = useChangePasswordMutation();

  const [
    deleteUserMutation, 
    {
      isLoading: isDeleting,
      isSuccess: isDeletionSuccess,
      isError: isDeletionError,
      error: deletionErrorData,
      reset: resetDeleteMutation,
    },
  ] = useDeleteUserMutation();

  const [allUsersParams, setAllUsersParams] = useState<UserQueryParams | typeof skipToken>(skipToken);
  const [userIdArg, setUserIdArg] = useState<string | typeof skipToken>(skipToken);

  const {
    data: allUsersQueryResult,
    isLoading: isLoadingAllUsersQuery,
    isFetching: isFetchingAllUsersQuery,
    error: allUsersQueryError,
    refetch: refetchAllUsersQuery, 
  } = useGetAllUsersQuery(allUsersParams, {});

  const {
    data: currentUserQueryResult,
    isLoading: isLoadingUserByIdQuery,
    isFetching: isFetchingUserByIdQuery,
    error: userByIdQueryError,
    refetch: refetchUserByIdQuery,
  } = useGetUserByIdQuery(userIdArg === skipToken ? skipToken : { id: userIdArg as string } , {});

  const isMutationLoading = isCreating || isUpdating || isDeleting || isChangingPassword;

  const isMutationSuccessOverall = isCreationSuccess || isUpdateSuccess || isDeletionSuccess || isChangePasswordSuccess;
  const isMutationErrorOverall = isCreationError || isUpdateError || isDeletionError || isChangePasswordError;
  const mutationErrorOverall = creationErrorData || updateErrorData || deletionErrorData || changePasswordErrorData;

  const createUser = useCallback(async (user: CreateUserType): Promise<UserEntity> => {
    resetCreateMutation();
    return createMutation(user).unwrap();
  }, [createMutation, resetCreateMutation]);

  const updateUser = useCallback(async (id: string, user: UpdateUserType): Promise<UserEntity | null> => {
    resetUpdateMutation();
    return updateMutation({ id, ...user }).unwrap();
  }, [updateMutation, resetUpdateMutation]);

  const changePassword = useCallback(async (user: ChangePasswordType): Promise<void> => {
    resetChangePasswordMutation();
    return changePasswordMutation(user).unwrap();
  }, [changePasswordMutation, resetChangePasswordMutation]);

  const deleteUser = useCallback(async (id: string): Promise<boolean> => {
    resetDeleteMutation();
    await deleteUserMutation(id).unwrap();
    return true;
  }, [deleteUserMutation, resetDeleteMutation]);

  const getAllUsers = useCallback(async (params: UserQueryParams = {}): Promise<PaginatedResponse<UserEntity>> => {
    setAllUsersParams(params);
    const result = await refetchAllUsersQuery();
    return result.data as PaginatedResponse<UserEntity>;
  }, [refetchAllUsersQuery]);

  const getUserById = useCallback((id: string) => {
    setUserIdArg(id);
    return currentUserQueryResult || null;
  }, []);
  
  const handleRefetchAllUsers = useCallback(() => {
    refetchAllUsersQuery();
  }, [refetchAllUsersQuery]);

  const handleRefetchUserById = useCallback(() => {
    if (userIdArg !== skipToken) { 
        refetchUserByIdQuery();
    }
  }, [refetchUserByIdQuery, userIdArg]);

  return {
    createUser,
    updateUser,
    changePassword,
    deleteUser,
    getAllUsers,
    getUserById,

    allUsersData: allUsersQueryResult,
    isLoadingAllUsers: isLoadingAllUsersQuery,
    isFetchingAllUsers: isFetchingAllUsersQuery,
    allUsersError: allUsersQueryError,
    refetchAllUsers: handleRefetchAllUsers,

    currentUserData: currentUserQueryResult,
    isLoadingUserById: isLoadingUserByIdQuery,
    isFetchingUserById: isFetchingUserByIdQuery,
    userByIdError: userByIdQueryError,
    refetchUserById: handleRefetchUserById,

    isMutationLoading,
    isMutationSuccess: isMutationSuccessOverall,
    isMutationError: isMutationErrorOverall,
    mutationError: mutationErrorOverall,
  };
};