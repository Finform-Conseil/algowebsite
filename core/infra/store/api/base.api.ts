import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { Mutex } from "async-mutex";
import { getSession } from "next-auth/react";
import { createApi } from "@reduxjs/toolkit/query/react";

// create a new mutex
const mutex = new Mutex();
const baseURL = `${process.env.NEXT_PUBLIC_HOST}/api/v1`

const baseQuery = fetchBaseQuery({
  baseUrl: baseURL,
  credentials: 'include',
  prepareHeaders: async (headers) => {
    const session = await getSession();
    console.log("session found", session);

    if (session?.user?.accessToken) {
      headers.set("Authorization", `Bearer ${session.user.accessToken}`);
    }

    return headers;
  },
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
            url: "/auth/refresh-token",
            method: "GET",
          },
          api,
          extraOptions
        );
        
        if (refreshResult.data) {
          console.log("Token refreshed", refreshResult);
          result = await baseQuery(args, api, extraOptions);
        } else {
          // Le refresh a échoué, rediriger vers la page de connexion
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/signin';
          }
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
  tagTypes: ['User', 'Users', 'Currencies', 'Sectors', 'Bourses', 'Countries', 'Societies', 'Actions', 'Industries', 'Cours', 'Statements', 'Sheets', 'Events', 'Results', 'Documents', 'Files', 'Dividends', 'Actionnariats', 'OPCVMs','OPCVMMetrics', 'Indices', 'IndiceCours', 'Rates', 'Sgos'], 
	endpoints: builder => ({}),
});

export default api