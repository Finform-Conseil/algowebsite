import { Btn, Card, Eyebrow } from '../../shared/ui/UiAtoms';
import { C, F_BODY } from '../../shared/theme/theme';

export interface ReportClient {
  id: string;
  nom: string;
}

export function ClientReportCard({
  clients,
  selectedClientId,
  period,
  onClientChange,
  onPeriodChange,
  onGenerate,
}: {
  clients: ReportClient[];
  selectedClientId: string;
  period: string;
  onClientChange: (clientId: string) => void;
  onPeriodChange: (period: string) => void;
  onGenerate: () => void;
}) {
  return (
    <Card className="gsm-native-clientreportcard-5eea1e85d">
      <Eyebrow>Rapport d'analyse client</Eyebrow>
      <div className="gsm-native-clientreportcard-a8d7cce38" style={{ color: C.sub, ...F_BODY }}>
        Situation globale, mouvements et commentaire de rendement sur
        période.
      </div>

      <label
        className="gsm-native-clientreportcard-ed878fe0b"
        style={{ color: C.sub }}
      >
        Client
      </label>
      <select name="gsm-clientreportcard-38" aria-label="Sélection clientreportcard"
        value={selectedClientId}
        onChange={(event) => onClientChange(event.target.value)}
        className="gsm-native-clientreportcard-b2959057c"
        style={{ borderColor: C.line, ...F_BODY }}
      >
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.nom}
          </option>
        ))}
      </select>

      <label
        className="gsm-native-clientreportcard-ed878fe0b"
        style={{ color: C.sub }}
      >
        Période
      </label>
      <select name="gsm-clientreportcard-57" aria-label="Sélection clientreportcard"
        value={period}
        onChange={(event) => onPeriodChange(event.target.value)}
        className="gsm-native-clientreportcard-a2f758182"
        style={{ borderColor: C.line, ...F_BODY }}
      >
        <option>Trimestre en cours</option>
        <option>Année en cours</option>
        <option>Personnalisée</option>
      </select>

      <div className="gsm-native-clientreportcard-0243a7dd2">
        <Btn onClick={onGenerate}>Générer le rapport</Btn>
      </div>
    </Card>
  );
}
