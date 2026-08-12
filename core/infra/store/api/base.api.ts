import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { Mutex } from "async-mutex";
import { createApi } from "@reduxjs/toolkit/query/react";

// create a new mutex
const mutex = new Mutex();
const clientApiBase = process.env.NEXT_PUBLIC_CLIENT_API_BASE;
if (!clientApiBase) {
  throw new Error(
    "NEXT_PUBLIC_CLIENT_API_BASE is required for the client API configuration.",
  );
}
const baseURL = `${clientApiBase.replace(/\/+$/, "")}/api/v1`

const baseQuery = fetchBaseQuery({
  baseUrl: baseURL,
  credentials: 'include',
  prepareHeaders: (headers) => headers,
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // wait until the mutex is available without locking it
  await mutex.waitForUnlock();
  let result = await baseQuery(args, api, extraOptions);
  
  // Si on reçoit une erreur 401, on essaie de rafraîchir le token
  if (result.error && result.error.status === 401) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const refreshResult = await baseQuery(
          {
            url: "/users/refresh-token/",
            method: "POST",
          },
          api,
          extraOptions
        );
        
        if (refreshResult.data) {
          result = await baseQuery(args, api, extraOptions);
        } else {
          // Le refresh a échoué : on PROPAGE l'erreur 401 sans rediriger.
          // La couche transport (API) ne doit JAMAIS forcer la navigation :
          // cela éjectait tout visiteur des pages publiques (ex. technical-analysis)
          // dès qu'un endpoint renvoyait 401. La décision de rediriger appartient
          // aux pages réellement protégées (guard dédié / SessionProvider), pas ici.
          return {
            error: { status: 401, data: { message: 'Session expirée' } }
          };
        }
      } finally {
        release();
      }
    } else {
      await mutex.waitForUnlock();
      result = await baseQuery(args, api, extraOptions);
    }
  }
  
  return result;
};


const api = createApi({
	reducerPath: 'api',
	baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Users', 'Currencies', 'Sectors', 'Bourses', 'Countries', 'Societies', 'Actions', 'Industries', 'Activities', 'Cours', 'Statements', 'Macros', 'Sheets', 'Events', 'Results', 'Documents', 'Files', 'Dividends', 'Actionnariats', 'OPCVMs','OPCVMMetrics', 'Indices', 'IndiceCours', 'Rates', 'Sgos', 'Primary', 'Secondary', 'BondCashflow'], 
	endpoints: builder => ({}),
});

export default api