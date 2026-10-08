import { useState } from 'react';
import { Badge, Card } from '../../shared/ui/UiAtoms';
import { Breadcrumb } from '../../shared/ui/Navigation';
import { C, F_DISPLAY, F_MONO } from '../../shared/theme/theme';
import type { WatchlistReco } from '../watchlist/WatchlistModel';

interface Props {
  recommendations: WatchlistReco[];
  onOpenGroupedAllocation: (context: { sens?: string; instrument: string }) => void;
}

export function RecommandationsActionsScreen({
  recommendations,
  onOpenGroupedAllocation,
}: Props) {
  const [filtreSens, setFiltreSens] = useState('Tous');
  const rows = recommendations.filter(
    (recommendation) =>
      filtreSens === 'Tous' || recommendation.sens === filtreSens
  );

  return (
    <div className="gsm-native-recommandationsactions-8add83f24">
      <Breadcrumb items={['Accueil', 'Recommandations actions']} />
      <div className="gsm-native-recommandationsactions-7293585ef">
        <h2 className="gsm-native-recommandationsactions-943757a5d" style={{ ...F_DISPLAY, color: C.ink }}>
          Recommandations — marché actions
        </h2>
        <div className="gsm-chip-scroll" role="group" aria-label="Filtrer les recommandations par sens">
          {['Tous', 'Achat', 'Vente', 'Conserver'].map((sens) => (
            <button
              key={sens}
              type="button"
              onClick={() => setFiltreSens(sens)}
              aria-pressed={filtreSens === sens}
              className="gsm-native-recommandationsactions-08ab535b7"
              style={{
                background: filtreSens === sens ? C.activeBackground : C.surfaceInset,
                color: filtreSens === sens ? C.textPrimary : C.sub,
              }}
            >
              {sens}
            </button>
          ))}
        </div>
      </div>

      <div className="gsm-native-recommandationsactions-15bdc683b">
        {rows.map((recommendation) => (
          <Card key={recommendation.titre} className="gsm-native-recommandationsactions-b6c1feb98">
            <div className="gsm-native-recommandationsactions-544aab5f4">
              <span className="gsm-native-recommandationsactions-548c75d0b" style={F_DISPLAY}>
                {recommendation.titre}
              </span>
              <Badge
                tone={
                  recommendation.sens === 'Achat'
                    ? 'teal'
                    : recommendation.sens === 'Vente'
                      ? 'coral'
                      : 'slate'
                }
              >
                {recommendation.sens ?? 'Conserver'}
              </Badge>
            </div>

            <div className="gsm-native-recommandationsactions-7fddce7bc" style={{ color: C.sub }}>
              {recommendation.marche} · {recommendation.secteur}
            </div>

            <div className="gsm-native-recommandationsactions-c41697663" style={F_MONO}>
              <span>
                Cours {recommendation.cours} {recommendation.devise}
              </span>
              <span style={{ color: C.gold }}>
                Objectif {recommendation.objectif ?? 'N/D'}
              </span>
            </div>

            <div className="gsm-native-recommandationsactions-df7f6acfd">
              <Badge tone={recommendation.conviction === 'Forte' ? 'navy' : 'slate'}>
                Conviction {recommendation.conviction ?? 'N/D'}
              </Badge>

              {recommendation.sens !== 'Conserver' && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenGroupedAllocation({
                      sens: recommendation.sens,
                      instrument: recommendation.titre,
                    })
                  }
                  className="gsm-native-recommandationsactions-f853c11a4"
                  style={{ color: C.navy }}
                >
                  Passage groupé →
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
