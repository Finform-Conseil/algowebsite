import {
  createContext,
  useContext,
} from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { C, F_BODY } from '../theme/theme';

export type NavigationParams = Record<string, unknown>;
export type Navigate = (
  route: string,
  params?: NavigationParams
) => void;

interface NavigationContextValue {
  go: Navigate;
}

export const NavigationContext =
  createContext<NavigationContextValue>({
    go: () => {},
  });

const BREADCRUMB_ROUTES: Record<string, string> = {
  Accueil: 'accueil',
  'Portefeuilles gérés': 'portefeuilles',
  Portefeuilles: 'portefeuilles',
  'Money Management': 'money-management',
  "Carnet d'ordres": 'carnet',
  "Avis d'opéré": 'avis',
  'Marchés Actions': 'vue-boursiere',
  'Marchés Obligataire': 'marches',
  Marchés: 'marches',
  Watchlist: 'watchlist',
  'Recommandations actions': 'recos-actions',
  "Recommandation d'allocation": 'reco-alloc',
  'Allocation par critères': 'alloc-criteres',
  Alertes: 'alertes',
  Rééquilibrage: 'reequilibrage',
  'Analyse portefeuille': 'analyse',
  'Rapport de comité de gestion': 'comite',
  'Prise de décisions': 'decisions-comite',
};

export interface BreadcrumbDescriptor {
  label: string;
  route?: string;
  params?: NavigationParams;
}

type BreadcrumbItem = string | BreadcrumbDescriptor | null | undefined;

export function Breadcrumb({
  items,
}: {
  items: BreadcrumbItem[];
}) {
  const { go } = useContext(NavigationContext);

  return (
    <nav
      aria-label="Fil d’Ariane"
      className="gsm-breadcrumb gsm-native-navigation-87da702dc"
      style={{ color: C.sub, ...F_BODY }}
    >
      {items.map((item, index) => {
        const descriptor: BreadcrumbDescriptor =
          typeof item === 'string'
            ? { label: item }
            : item || { label: '' };

        const label = descriptor.label || '';
        const route =
          descriptor.route || BREADCRUMB_ROUTES[label];
        const params = descriptor.params || {};
        const isCurrent = index === items.length - 1;
        const isClickable = !isCurrent && Boolean(route);

        return (
          <span
            key={`${label}-${index}`}
            className="gsm-breadcrumb__item gsm-native-navigation-7a005dddb"
          >
            {index > 0 && (
              <ChevronRight size={13} aria-hidden="true" />
            )}

            {isClickable && route ? (
              <button
                type="button"
                onClick={() => go(route, params)}
                className="gsm-native-navigation-634bcf543"
                style={{
                  color: C.navy,
                  cursor: 'pointer',
                  '--tw-ring-color': C.gold,
                } as React.CSSProperties}
                title={`Revenir à ${label}`}
              >
                {label === 'Accueil' && (
                  <Home size={13} aria-hidden="true" />
                )}
                {label}
              </button>
            ) : (
              <span
                aria-current={isCurrent ? 'page' : undefined}
                className="gsm-breadcrumb__current gsm-native-navigation-ee73c0f33"
                style={{
                  color: isCurrent ? C.ink : C.sub,
                  fontWeight: isCurrent ? 600 : 500,
                }}
              >
                {label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
