import { Badge, Card, Td, Th } from '../../shared/ui/UiAtoms';
import { Breadcrumb } from '../../shared/ui/Navigation';
import { C, F_DISPLAY } from '../../shared/theme/theme';

interface AllocationClient {
  id: string;
  nom: string;
  alloc: Record<string, number>;
  cible: Record<string, number>;
}

interface Props {
  clients: AllocationClient[];
  onApplyRebalancing: (context: { client: string; actif: string }) => void;
}

export function RecommandationAllocationScreen({
  clients,
  onApplyRebalancing,
}: Props) {
  return (
    <div className="gsm-native-recommandationallocation-1910fa508">
      <Breadcrumb items={['Accueil', "Recommandation d'allocation"]} />
      <h2 className="gsm-native-recommandationallocation-ceebf0475" style={{ ...F_DISPLAY, color: C.ink }}>
        Recommandation d'allocation aux portefeuilles clients
      </h2>

      <Card className="gsm-native-recommandationallocation-0480785fd">
        <table className="gsm-native-recommandationallocation-934630495">
          <thead style={{ background: C.surfaceElevated }}>
            <tr>
              <Th>Client</Th>
              <Th>Actuel</Th>
              <Th>Cible</Th>
              <Th>Écart</Th>
              <Th>Action suggérée</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client, index) => {
              const ecart = client.alloc.Actions - client.cible.Actions;
              return (
                <tr
                  key={client.id}
                  style={{
                    borderTop: `1px solid ${C.line}`,
                    background: index % 2 ? C.rowAlternate : C.surfaceCard,
                  }}
                >
                  <Td className="gsm-native-recommandationallocation-32eae62ee">{client.nom}</Td>
                  <Td mono>{client.alloc.Actions}% Actions</Td>
                  <Td mono>{client.cible.Actions}% Actions</Td>
                  <Td>
                    <Badge tone={ecart > 0 ? 'coral' : 'teal'}>
                      {ecart > 0 ? '+' : ''}
                      {ecart} pts
                    </Badge>
                  </Td>
                  <Td>
                    {ecart > 3
                      ? 'Réduire Actions'
                      : ecart < -3
                        ? 'Renforcer Actions'
                        : 'Aucune'}
                  </Td>
                  <Td>
                    {Math.abs(ecart) > 3 && (
                      <button
                        type="button"
                        onClick={() =>
                          onApplyRebalancing({
                            client: client.id,
                            actif: 'Actions',
                          })
                        }
                        className="gsm-native-recommandationallocation-8d1985e27"
                        style={{ color: C.navy }}
                      >
                        Appliquer →
                      </button>
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
