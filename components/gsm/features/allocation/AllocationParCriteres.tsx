import { useState } from 'react';
import { fmt } from '../../shared/lib/finance';
import { Badge, Btn, Card, Eyebrow, Td, Th } from '../../shared/ui/UiAtoms';
import { Breadcrumb } from '../../shared/ui/Navigation';
import { C, F_DISPLAY, F_MONO } from '../../shared/theme/theme';

interface AllocationClient {
  id: string;
  nom: string;
  marche: string;
  type: string;
  devise: string;
  encours: number;
  alloc: Record<string, number>;
  cible: Record<string, number>;
}

interface Props {
  initialSens?: string;
  initialInstrument?: string;
  clients: AllocationClient[];
  instruments: string[];
  profileTypeLabel: Record<string, string>;
  compare: (left: number, operator: string, right: number) => boolean;
  exposureOf: (clientId: string, instrument: string) => number;
}

export function AllocationParCriteresScreen({
  initialSens,
  initialInstrument,
  clients,
  instruments,
  profileTypeLabel,
  compare,
  exposureOf,
}: Props) {
  const [type, setType] = useState('Actions');
  const [sens, setSens] = useState(initialSens || 'Achat');
  const [marche, setMarche] = useState('Tous');
  const [typePortefeuille, setTypePortefeuille] = useState('Tous');
  const [instrument, setInstrument] = useState(
    initialInstrument && instruments.includes(initialInstrument) ? initialInstrument : 'Aucun'
  );
  const [operateur, setOperateur] = useState('<');
  const [seuil, setSeuil] = useState<number | string>(10);
  const [ordreType, setOrdreType] = useState('Ordre au marché');
  const [montantOrdre] = useState(1_000_000);
  const [pourcentageOrdre, setPourcentageOrdre] = useState(10);
  const [applique, setApplique] = useState(false);

  const results = clients.filter((client) => {
    const matchMarche = marche === 'Tous' || client.marche === marche;
    const matchInstrument =
      instrument === 'Aucun' ||
      compare(exposureOf(client.id, instrument), operateur, Number(seuil));
    const matchTypePortefeuille =
      typePortefeuille === 'Tous' ||
      (profileTypeLabel[client.type] || client.type) === typePortefeuille;
    return matchMarche && matchInstrument && matchTypePortefeuille;
  });

  const liquiditePourInvestir = (client: AllocationClient) =>
    Math.max(0, (client.encours * Number(client.alloc.Liquidité || 0)) / 100);

  const projection = (client: AllocationClient) => {
    const valeurActuelle = (client.encours * client.alloc[type]) / 100;
    const delta = sens === 'Achat' ? montantOrdre : -montantOrdre;
    const nouvellePct = ((valeurActuelle + delta) / client.encours) * 100;
    return {
      ecartActuel: client.alloc[type] - client.cible[type],
      ecartProjete: nouvellePct - client.cible[type],
      nouvellePct,
    };
  };

  return (
    <div className="gsm-native-allocationparcriteres-82626c995">
      <Breadcrumb items={['Accueil', 'Allocation par critères']} />
      <h2 className="gsm-native-allocationparcriteres-d6f559a96" style={{ ...F_DISPLAY, color: C.ink }}>Allocation par critères</h2>

      <Card className="gsm-native-allocationparcriteres-1c0029dbc">
        <div>
          <label htmlFor="allocation-instrument-type" className="gsm-native-allocationparcriteres-99cab9ad8" style={{ color: C.sub }}>Type d'instrument</label>
          <select id="allocation-instrument-type" name="allocation-instrument-type" value={type} onChange={(event) => setType(event.target.value)}
            className="gsm-native-allocationparcriteres-d6f4f8e50" style={{ borderColor: C.line }}>
            <option>Actions</option><option>Obl. souveraines</option><option>Obl. privées</option>
          </select>
        </div>
        <div>
          <label htmlFor="allocation-direction" className="gsm-native-allocationparcriteres-99cab9ad8" style={{ color: C.sub }}>Sens</label>
          <select id="allocation-direction" name="allocation-direction" value={sens} onChange={(event) => setSens(event.target.value)}
            className="gsm-native-allocationparcriteres-d6f4f8e50" style={{ borderColor: C.line }}>
            <option>Achat</option><option>Vente</option>
          </select>
        </div>
        <div>
          <label htmlFor="allocation-market" className="gsm-native-allocationparcriteres-99cab9ad8" style={{ color: C.sub }}>Marché boursier</label>
          <select id="allocation-market" name="allocation-market" value={marche} onChange={(event) => setMarche(event.target.value)}
            className="gsm-native-allocationparcriteres-d6f4f8e50" style={{ borderColor: C.line }}>
            <option>Tous</option><option>BRVM</option><option>NGX</option><option>GSE</option>
          </select>
        </div>
        <div>
          <label htmlFor="allocation-portfolio-type" className="gsm-native-allocationparcriteres-99cab9ad8" style={{ color: C.sub }}>Type de portefeuille</label>
          <select id="allocation-portfolio-type" name="allocation-portfolio-type" value={typePortefeuille}
            onChange={(event) => setTypePortefeuille(event.target.value)}
            className="gsm-native-allocationparcriteres-d6f4f8e50" style={{ borderColor: C.line }}>
            <option>Tous</option><option>Particulier</option><option>Institutionnel</option>
          </select>
        </div>
      </Card>

      <Card className="gsm-native-allocationparcriteres-a48055a10">
        <Eyebrow>Filtre par instrument et seuil d'exposition</Eyebrow>
        <div className="gsm-native-allocationparcriteres-cabbfb308">
          <div>
            <label htmlFor="allocation-instrument" className="gsm-native-allocationparcriteres-99cab9ad8" style={{ color: C.sub }}>Instrument (action / obligation)</label>
            <select id="allocation-instrument" name="allocation-instrument" value={instrument}
              onChange={(event) => setInstrument(event.target.value)}
              className="gsm-native-allocationparcriteres-d6f4f8e50" style={{ borderColor: C.line }}>
              <option>Aucun</option>{instruments.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="allocation-operator" className="gsm-native-allocationparcriteres-99cab9ad8" style={{ color: C.sub }}>Opérateur de comparaison</label>
            <select id="allocation-operator" name="allocation-operator" value={operateur}
              onChange={(event) => setOperateur(event.target.value)} disabled={instrument === 'Aucun'}
              className="gsm-native-allocationparcriteres-d6f4f8e50"
              style={{ borderColor: C.line, opacity: instrument === 'Aucun' ? 0.5 : 1 }}>
              <option value="<">{'< (inférieur à)'}</option><option value="=">{'= (égal à)'}</option><option value=">">{'> (supérieur à)'}</option>
            </select>
          </div>
          <div>
            <label htmlFor="allocation-threshold" className="gsm-native-allocationparcriteres-99cab9ad8" style={{ color: C.sub }}>Seuil d'exposition par portefeuille (%)</label>
            <input id="allocation-threshold" name="allocation-threshold" type="number" min="0" max="100" step="0.5"
              value={seuil} onChange={(event) => setSeuil(event.target.value)} disabled={instrument === 'Aucun'}
              className="gsm-native-allocationparcriteres-d6f4f8e50"
              style={{ borderColor: C.line, opacity: instrument === 'Aucun' ? 0.5 : 1, ...F_MONO }} />
          </div>
          <div className="gsm-native-allocationparcriteres-df3fea794">
            {instrument !== 'Aucun' && <Badge tone="navy">Exposition {instrument} {operateur} {seuil}%</Badge>}
            <Badge tone="gold">{results.length} portefeuille(s)</Badge>
          </div>
        </div>
      </Card>

      <Card className="gsm-native-allocationparcriteres-6b9933a1e">
        <table className="gsm-native-allocationparcriteres-87a63761b">
          <thead style={{ background: C.surfaceElevated }}>
            <tr>
              <Th>Client</Th><Th>Marché</Th><Th>Type</Th><Th>Liquidité pour investir</Th><Th>Écart actuel {type}</Th>
              {instrument !== 'Aucun' && <Th>Exposition {instrument}</Th>}<Th>Écart après ordre</Th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 && <tr><td colSpan={instrument !== 'Aucun' ? 7 : 6} className="gsm-native-allocationparcriteres-914b8b342" style={{ color: C.sub }}>Aucun portefeuille ne correspond à ces critères.</td></tr>}
            {results.map((client, index) => {
              const projected = projection(client);
              return <tr key={client.id} style={{ borderTop: `1px solid ${C.line}`, background: index % 2 ? C.rowAlternate : C.surfaceCard }}>
                <Td className="gsm-native-allocationparcriteres-27b9a40f3">{client.nom}</Td><Td><Badge tone="navy">{client.marche}</Badge></Td>
                <Td><Badge tone="slate">{profileTypeLabel[client.type] || client.type}</Badge></Td>
                <Td mono className="gsm-native-allocationparcriteres-80e468a26">{fmt(Math.round(liquiditePourInvestir(client)))} {client.devise}</Td>
                <Td mono>{projected.ecartActuel.toFixed(1)} pts</Td>
                {instrument !== 'Aucun' && <Td mono>{exposureOf(client.id, instrument)}%</Td>}
                <Td mono><Badge tone={Math.abs(projected.ecartProjete) > 3 ? 'coral' : 'teal'}>{projected.ecartProjete > 0 ? '+' : ''}{projected.ecartProjete.toFixed(1)} pts</Badge></Td>
              </tr>;
            })}
          </tbody>
        </table>
      </Card>

      <Card className="gsm-native-allocationparcriteres-a48055a10">
        <Eyebrow>Passage d'ordre groupé</Eyebrow>
        <div className="gsm-native-allocationparcriteres-bec7ffeb7">
          <div>
            <label htmlFor="allocation-order-type" className="gsm-native-allocationparcriteres-99cab9ad8" style={{ color: C.sub }}>Type d'ordre</label>
            <select id="allocation-order-type" name="allocation-order-type" value={ordreType} onChange={(event) => setOrdreType(event.target.value)}
              className="gsm-native-allocationparcriteres-824d9eac1" style={{ borderColor: C.line }}>
              <option>Ordre au marché</option><option>Ordre limite</option><option>Meilleure limite</option>
            </select>
          </div>
          <div>
            <label htmlFor="allocation-order-percentage" className="gsm-native-allocationparcriteres-99cab9ad8" style={{ color: C.sub }}>
              {sens === 'Achat' ? 'Pourcentage de liquidité à investir' : 'Pourcentage de cession'}
            </label>
            <input id="allocation-order-percentage" name="allocation-order-percentage" type="number" min="0" step="1" max="100"
              value={pourcentageOrdre} onChange={(event) => setPourcentageOrdre(Number(event.target.value))}
              className="gsm-native-allocationparcriteres-824d9eac1" style={{ borderColor: C.line, ...F_MONO }} />
          </div>
          <Btn onClick={() => setApplique(true)}>Appliquer</Btn>
          {applique && results.length > 0 && <Badge tone="teal">{results.length} ordre(s) de {sens} lancé(s) en {ordreType} sur {results.length} portefeuille(s)</Badge>}
          {applique && results.length === 0 && <Badge tone="coral">Aucun portefeuille éligible à traiter</Badge>}
        </div>
      </Card>
    </div>
  );
}
