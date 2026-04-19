import { userApi } from "./user.api";
import { currencyApi } from "./currency.api";
import { sectorApi } from "./sector.api";
import { bourseApi } from "./bourse.api";
import { countryApi } from "./country.api";
import { societyApi } from "./society.api";
import { actionApi } from "./action.api";
import { coursApi } from "./cours.api";
import { statementApi } from "./statement.api";
import { sheetApi } from "./sheet.api";
import { eventApi } from "./event.api";
import { industryApi } from "./industry.api";
import { resultApi } from "./result.api";
import { fileApi } from "./file.api";
import { dividendApi } from "./dividend.api";
import { actionnariatApi } from "./actionnariat.api";
import { opcvmApi, opcvmMetricApi } from "./opcvm.api";
import { indiceApi } from "./indice.api";
import { rateApi } from "./rate.api";
import { sgoApi } from "./sgo.api";

export { default as api } from "./base.api";

export const {
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useMeQuery,
  useCreateUserMutation,
  useDeleteUserMutation,
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useChangePasswordMutation,
  endpoints: {
    login, logout, refreshToken, me, createUser, deleteUser, getAllUsers, getUserById, updateUser, changePassword,
  },
} = userApi;

export const {
  useCreateCurrencyMutation,
  useUploadCurrenciesMutation,
  useDeleteCurrencyMutation,
  useGetAllCurrenciesQuery,
  useLazyGetAllCurrenciesQuery,
  useGetCurrencyByIdQuery,
  useUpdateCurrencyMutation,
  endpoints: { createCurrency, uploadCurrencies, deleteCurrency, getAllCurrencies, getCurrencyById, updateCurrency },
} = currencyApi;

export const {
  useCreateSectorMutation,
  useUploadSectorsMutation,
  useDeleteSectorMutation,
  useGetAllSectorsQuery,
  useLazyGetAllSectorsQuery,
  useGetSectorByIdQuery,
  useUpdateSectorMutation,
  endpoints: { createSector, uploadSectors, deleteSector, getAllSectors, getSectorById, updateSector },
} = sectorApi;

export const {
  useCreateBourseMutation,
  useUploadBoursesMutation,
  useDeleteBourseMutation,
  useGetAllBoursesQuery,
  useLazyGetAllBoursesQuery,
  useGetBourseByIdQuery,
  useUpdateBourseMutation,
  endpoints: { createBourse, uploadBourses, deleteBourse, getAllBourses, getBourseById, updateBourse },
} = bourseApi;

export const {
  useCreateCountryMutation,
  useUploadCountriesMutation,
  useDeleteCountryMutation,
  useGetAllCountriesQuery,
  useLazyGetAllCountriesQuery,
  useGetCountryByIdQuery,
  useUpdateCountryMutation,
  endpoints: { createCountry, uploadCountries, deleteCountry, getAllCountries, getCountryById, updateCountry },
} = countryApi;

export const {
  useCreateIndustryMutation,
  useUploadIndustriesMutation,
  useDeleteIndustryMutation,
  useGetAllIndustriesQuery,
  useLazyGetAllIndustriesQuery,
  useGetIndustryByIdQuery,
  useUpdateIndustryMutation,
  endpoints: { createIndustry, uploadIndustries, deleteIndustry, getAllIndustries, getIndustryById, updateIndustry },
} = industryApi;

export const {
  useCreateSocietyMutation,
  useUploadSocietiesMutation,
  useDeleteSocietyMutation,
  useGetAllSocietiesQuery,
  useLazyGetAllSocietiesQuery,
  useGetSocietyByIdQuery,
  useUpdateSocietyMutation,
  endpoints: { createSociety, uploadSocieties, deleteSociety, getAllSocieties, getSocietyById, updateSociety },
} = societyApi;

export const {
  useCreateActionMutation,
  useUploadActionsMutation,
  useDeleteActionMutation,
  useGetAllActionsQuery,
  useLazyGetAllActionsQuery,
  useGetActionByIdQuery,
  useGetActionByTickerQuery,
  useUpdateActionMutation,
  endpoints: { createAction, uploadActions, deleteAction, getAllActions, getActionById, getActionByTicker, updateAction },
} = actionApi;

export const {
  useCreateCoursMutation,
  useUploadCoursMutation,
  useDeleteCoursMutation,
  useGetAllCoursQuery,
  useLazyGetAllCoursQuery,
  useGetCoursByIdQuery,
  useUpdateCoursMutation,
  endpoints: { createCours, uploadCours, deleteCours, getAllCours, getCoursById, updateCours },
} = coursApi;

export const {
  useCreateStatementMutation,
  useUploadStatementMutation,
  useDeleteStatementMutation,
  useGetAllStatementsQuery,
  useLazyGetAllStatementsQuery,
  useGetStatementByIdQuery,
  useUpdateStatementMutation,
  endpoints: { createStatement, uploadStatement, deleteStatement, getAllStatements, getStatementById, updateStatement },
} = statementApi;

export const {
  useCreateSheetMutation,
  useUploadSheetMutation,
  useDeleteSheetMutation,
  useGetAllSheetsQuery,
  useLazyGetAllSheetsQuery,
  useGetSheetByIdQuery,
  useUpdateSheetMutation,
  endpoints: { createSheet, uploadSheet, deleteSheet, getAllSheets, getSheetById, updateSheet },
} = sheetApi;

export const {
  useCreateEventMutation,
  useUploadEventMutation,
  useDeleteEventMutation,
  useGetAllEventsQuery,
  useLazyGetAllEventsQuery,
  useGetEventByIdQuery,
  useUpdateEventMutation,
  endpoints: { createEvent, uploadEvent, deleteEvent, getAllEvents, getEventById, updateEvent },
} = eventApi;

export const {
  useCreateResultMutation,
  useUploadResultMutation,
  useDeleteResultMutation,
  useGetAllResultsQuery,
  useLazyGetAllResultsQuery,
  useGetResultByIdQuery,
  useUpdateResultMutation,
  endpoints: { createResult, uploadResult, deleteResult, getAllResults, getResultById, updateResult },
} = resultApi;

export const {
  useUploadFileMutation,
  useDeleteFileMutation,
  useGetAllFilesQuery,
  useLazyGetAllFilesQuery,
  useGetFileByIdQuery,
  endpoints: { uploadFile, deleteFile, getAllFiles, getFileById },
} = fileApi;

export const {
  useCreateDividendMutation,
  useUploadDividendsMutation,
  useDeleteDividendMutation,
  useGetAllDividendsQuery,
  useLazyGetAllDividendsQuery,
  useGetDividendByIdQuery,
  useUpdateDividendMutation,
  endpoints: { createDividend, uploadDividends, deleteDividend, getAllDividends, getDividendById, updateDividend },
} = dividendApi;

export const {
  useCreateActionnariatMutation,
  useUploadActionnariatsMutation,
  useDeleteActionnariatMutation,
  useGetAllActionnariatsQuery,
  useLazyGetAllActionnariatsQuery,
  useGetActionnariatByIdQuery,
  useUpdateActionnariatMutation,
  endpoints: { createActionnariat, uploadActionnariats, deleteActionnariat, getAllActionnariats, getActionnariatById, updateActionnariat },
} = actionnariatApi;

export const {
  useCreateOpcvmMutation,
  useUploadOpcvmsMutation,
  useDeleteOpcvmMutation,
  useGetAllOpcvmsQuery,
  useLazyGetAllOpcvmsQuery,
  useGetOpcvmByIdQuery,
  useUpdateOpcvmMutation,
  endpoints: { createOpcvm, uploadOpcvms, deleteOpcvm, getAllOpcvms, getOpcvmById, updateOpcvm },
} = opcvmApi;

export const {
  useCreateOpcvmMetricMutation,
  useUploadOpcvmMetricsMutation,
  useDeleteOpcvmMetricMutation,
  useGetAllOpcvmMetricsQuery,
  useLazyGetAllOpcvmMetricsQuery,
  useGetOpcvmMetricByIdQuery,
  useUpdateOpcvmMetricMutation,
  endpoints: { createOpcvmMetric, uploadOpcvmMetrics, deleteOpcvmMetric, getAllOpcvmMetrics, getOpcvmMetricById, updateOpcvmMetric },
} = opcvmMetricApi;

export const {
  useCreateIndiceMutation,
  useUploadIndicesMutation,
  useUploadIndicesCoursMutation,
  useDeleteIndiceMutation,
  useGetAllIndicesQuery,
  useGetIndicesCoursByIndiceQuery,
  useLazyGetAllIndicesQuery,
  useLazyGetIndicesCoursByIndiceQuery,
  useGetIndiceByIdQuery,
  useUpdateIndiceMutation,
  endpoints: { createIndice, uploadIndices, uploadIndicesCours, deleteIndice, getAllIndices, getIndiceById, updateIndice },
} = indiceApi;

export const {
  useCreateRateMutation,
  useUploadRateMutation,
  useDeleteRateMutation,
  useGetAllRatesQuery,
  useLazyGetAllRatesQuery,
  useGetRateByIdQuery,
  useUpdateRateMutation,
  endpoints: { createRate, uploadRate, deleteRate, getAllRates, getRateById, updateRate },
} = rateApi;

export const {
  useCreateSgoMutation,
  useUploadSgoMutation,
  useDeleteSgoMutation,
  useGetAllSgosQuery,
  useLazyGetAllSgosQuery,
  useGetSgoByIdQuery,
  useUpdateSgoMutation,
  endpoints: { createSgo, uploadSgo, deleteSgo, getAllSgos, getSgoById, updateSgo },
} = sgoApi;