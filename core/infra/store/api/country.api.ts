import { CountryEntity } from "@/core/domain/entities/country.entity";
import { CreateCountryType, CountryType, UpdateCountryType, CountryQueryParams } from "../../../domain/types/country.type";
import { PaginatedResponse } from "../../../domain/types/pagination.type";
import api from "./base.api";

export const countryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createCountry: builder.mutation<CountryType, CreateCountryType>({
      query: (country) => ({
        url: "/countries/",
        method: "POST",
        body: country,
      }),
      invalidatesTags: (result) => [
        { type: "Countries", id: "LIST" }
      ],
    }),
    uploadCountries: builder.mutation<void, any>({
      query: (formData) => ({
        url: "/countries/bulk-import/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result) => [
        { type: "Countries", id: "LIST" }
      ],
    }),
    updateCountry: builder.mutation<CountryType, UpdateCountryType & { id: string }>({
      query: ({ id, ...country }) => ({
        url: `countries/${id}/`,
        method: "PATCH",
        body: country,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Countries", id }],
    }),
    getAllCountries: builder.query<PaginatedResponse<CountryEntity>, CountryQueryParams | void>({
        query: (params) => ({
            url: "countries",
            method: "GET",
            params: params || {},
        }),
        providesTags: (result) =>
            result
            ? [
                ...result.data.map(({ id }) => ({ type: "Countries" as const, id })),
                { type: "Countries", id: "LIST" },
                { type: "Countries", id: `PAGE-${result.current_page}` },
            ] : [{ type: "Countries", id: "LIST" }],
    }),
    getCountryById: builder.query<CountryEntity, { id: string }>({
      query: ({ id }) => `/countries/${id}/`,
    }),
    deleteCountry: builder.mutation<void, string>({
      query: (id) => ({
        url: `countries/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Countries", id }
      ],
    }),
  }),
  overrideExisting: true,
});


