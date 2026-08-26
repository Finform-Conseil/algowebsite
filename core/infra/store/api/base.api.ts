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
// The browser timeout must be longer than the proxy's single upstream attempt
// (30s by default). A shorter client budget causes false TIMEOUT_ERRORs while
// the proxy is still legitimately waiting for Django and may return HTTP 200.
const CLIENT_API_TIMEOUT_MS = Number.parseInt(
  process.env.NEXT_PUBLIC_CLIENT_API_TIMEOUT_MS || "35000",
  10,
);
const usesNextProxy = clientApiBase.startsWith("/api/proxy/");

const normalizeProxyClientUrl = (url: string): string => {
  if (!usesNextProxy) return url;

  const separatorIndex = url.search(/[?#]/);
  const path = separatorIndex === -1 ? url : url.slice(0, separatorIndex);
  if (path.length <= 1 || !path.endsWith("/")) return url;

  const suffix = separatorIndex === -1 ? "" : url.slice(separatorIndex);
  return `${path.replace(/\/+$/, "")}${suffix}`;
};

const normalizeClientApiArgs = (args: string | FetchArgs): string | FetchArgs => {
  if (typeof args === "string") return normalizeProxyClientUrl(args);
  return { ...args, url: normalizeProxyClientUrl(args.url) };
};

const baseQuery = fetchBaseQuery({
  baseUrl: baseURL,
  credentials: 'include',
  timeout: CLIENT_API_TIMEOUT_MS,
  prepareHeaders: (headers) => headers,
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const normalizedArgs = normalizeClientApiArgs(args);

  // wait until the mutex is available without locking it
  await mutex.waitForUnlock();
  let result = await baseQuery(normalizedArgs, api, extraOptions);
  
  // Si on reçoit une erreur 401, on essaie de rafraîchir le token
  if (result.error && result.error.status === 401) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const refreshResult = await baseQuery(
          normalizeClientApiArgs({
            url: "/users/refresh-token/",
            method: "POST",
          }),
          api,
          extraOptions
        );
        
        if (refreshResult.data) {
          result = await baseQuery(normalizedArgs, api, extraOptions);
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
      result = await baseQuery(normalizedArgs, api, extraOptions);
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