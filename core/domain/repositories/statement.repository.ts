import { FinancialValueEntity } from '../entities/statement.entity';
import { CreateStatementType, StatementType, UpdateStatementType, StatementQueryParams } from '../types/statement.type';
import { PaginatedResponse } from '../types/pagination.type';

export interface IStatementRepository {
  createStatement: (statement: CreateStatementType) => Promise<StatementType>;
  uploadStatements: (formData: any) => Promise<void>;
  updateStatement: (id: string, statement: UpdateStatementType) => Promise<StatementType | null>;
  deleteStatement: (id: string) => Promise<boolean>;
  getAllStatements: (params?: StatementQueryParams) => Promise<PaginatedResponse<FinancialValueEntity>>;
  getStatementById: (id: string) => FinancialValueEntity | null;

  allStatementsData?: PaginatedResponse<FinancialValueEntity>;
  isLoadingAllStatements: boolean;
  isFetchingAllStatements: boolean;
  allStatementsError?: any;

  currentStatementData?: FinancialValueEntity | null;
  isLoadingStatementById: boolean;
  isFetchingStatementById: boolean;
  statementByIdError?: any;

  isMutationLoading: boolean;
  isMutationSuccess: boolean;
  isMutationError: boolean;
  mutationError?: any;
}
