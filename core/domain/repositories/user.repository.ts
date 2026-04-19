import { ChangePasswordType, CreateUserType, UpdateUserType, UserQueryParams} from '../types/user.type';
import { UserEntity } from '../entities/user.entity';
import { PaginatedResponse } from '../types/pagination.type';


export interface IUserRepository {
  createUser: (user: CreateUserType) => Promise<UserEntity>;
  updateUser: (id: string, user: UpdateUserType) => Promise<UserEntity | null>;
  changePassword: (user:ChangePasswordType) => Promise<void>
  deleteUser: (id: string) => Promise<boolean>;
  getAllUsers(params?: UserQueryParams): Promise<PaginatedResponse<UserEntity>>;
  getUserById: (id: string) => UserEntity | null;

  allUsersData?: PaginatedResponse<UserEntity>;
  isLoadingAllUsers: boolean;
  isFetchingAllUsers: boolean;
  allUsersError?: any;
  refetchAllUsers: () => void;

  currentUserData?: UserEntity | null;
  isLoadingUserById: boolean;
  isFetchingUserById: boolean;
  userByIdError?: any;
  refetchUserById: () => void;

  isMutationLoading: boolean;
  isMutationSuccess: boolean; 
  isMutationError: boolean;
  mutationError?: any;
}