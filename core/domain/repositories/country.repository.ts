import { CountryEntity } from '../entities/country.entity';
import { CountryType, CreateCountryType, UpdateCountryType, CountryQueryParams } from '../types/country.type';
import { PaginatedResponse } from '../types/pagination.type';

export interface ICountryRepository {
  createCountry: (country: CreateCountryType) => Promise<CountryType>;
  uploadCountries: (formData: any) => Promise<void>;
  updateCountry: (id: string, country: UpdateCountryType) => Promise<CountryType | null>;
  deleteCountry: (id: string) => Promise<boolean>;
  getAllCountries: (params?: CountryQueryParams) => Promise<PaginatedResponse<CountryEntity>>;
  getCountryById: (id: string) => CountryEntity | null;

  allCountriesData?: PaginatedResponse<CountryEntity>;
  isLoadingAllCountries: boolean;
  isFetchingAllCountries: boolean;
  allCountriesError?: any;

  currentCountryData?: CountryEntity | null;
  isLoadingCountryById: boolean;
  isFetchingCountryById: boolean;
  countryByIdError?: any;

  isMutationLoading: boolean;
  isMutationSuccess: boolean;
  isMutationError: boolean;
  mutationError?: any;
}
