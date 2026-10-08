import { useState } from 'react';
import { X } from 'lucide-react';
import { C, F_DISPLAY } from '../../shared/theme/theme';
import { Badge, Btn, Card, Eyebrow, Td, Th } from '../../shared/ui/UiAtoms';
import { Breadcrumb } from '../../shared/ui/Navigation';
import { ORDERS } from './TradingDomainData';
import { CessionA4Modal } from './CessionWorkflow';

/*
 * Carnet synchronisé depuis origin/main sans réintroduire App.jsx.
 */
function Carnet({ initial }) {
  const [f, setF] = useState(initial?.marche || 'Tous');
  const [instrumentFilter, setInstrumentFilter] = useState(
    initial?.instrument || null
  );
  const [cessionA4ModalVisible, setCessionA4ModalVisible] =
    useState(false);
  const cessionRows = Array.isArray(initial?.cessionOrders)
    ? initial.cessionOrders
    : [];
  const cessionA4 = initial?.cessionA4 || null;
  const sourceRows = [...cessionRows, ...ORDERS];
  const rows = sourceRows.filter(
    (o) =>
      (f === 'Tous' || o.marche === f) &&
      (!instrumentFilter || o.titre === instrumentFilter)
  );
  return (
    <div className="gsm-native-carnetmainscreen-ce0a3269e">
      <Breadcrumb items={['Accueil', "Carnet d'ordres"]} />
      <div className="gsm-native-carnetmainscreen-682e21f80">
        <h2
          className="gsm-native-carnetmainscreen-65a97134a"
          style={{ ...F_DISPLAY, color: C.ink }}
        >
          Carnet d'ordres
        </h2>
        <div className="gsm-native-carnetmainscreen-2ed2734c0">
          {instrumentFilter && (
            <button
              onClick={() => setInstrumentFilter(null)}
              className="gsm-native-carnetmainscreen-f6cf16e96"
              style={{ background: C.warningBackground, color: C.warningText }}
            >
              Instrument : {instrumentFilter} <X size={12} />
            </button>
          )}
          <div className="gsm-chip-scroll">
            {['Tous', 'BRVM', 'NGX', 'GSE'].map((m) => (
              <button
                key={m}
                onClick={() => setF(m)}
                className="gsm-native-carnetmainscreen-ce036a462"
                style={{
                  background: f === m ? C.activeBackground : C.surfaceInset,
                  color: f === m ? C.textPrimary : C.sub,
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>
      {cessionRows.length > 0 && (
        <Card
          className="gsm-native-carnetmainscreen-78fa25e3f"
          style={{ borderColor: C.gold, background: C.warningBackground }}
        >
          <div className="gsm-native-carnetmainscreen-7d8790b5e">
            <div>
              <Eyebrow>Cession_Retrait</Eyebrow>
              <div className="gsm-native-carnetmainscreen-f55fa1eb5" style={{ color: C.ink }}>
                Plan de cession transmis pour validation
              </div>
              <div className="gsm-native-carnetmainscreen-af672bdfe" style={{ color: C.sub }}>
                Ces ordres proviennent de l'optimisation des demandes de
                retrait. Ils restent à valider/fractionner avant exécution
                réelle.
              </div>
            </div>
            <div className="gsm-native-carnetmainscreen-ac104ee08">
              <Badge tone="gold">
                {cessionRows.length} ordre(s) importé(s)
              </Badge>
              {cessionA4 && (
                <Btn
                  tone="ghost"
                  onClick={() =>
                    setCessionA4ModalVisible(true)
                  }
                >
                  Revoir le récapitulatif A4
                </Btn>
              )}
            </div>
          </div>
        </Card>
      )}

      <CessionA4Modal
        open={cessionA4ModalVisible}
        onClose={() => setCessionA4ModalVisible(false)}
        payload={cessionA4}
      />
      {rows.length === 0 && (
        <Card className="gsm-native-carnetmainscreen-aa02e8fb8" style={{ color: C.sub }}>
          Aucun ordre pour ce filtre.
        </Card>
      )}
      <Card className="gsm-native-carnetmainscreen-c42ba5495">
        <table className="gsm-native-carnetmainscreen-0c94011a6">
          <thead style={{ background: C.surfaceElevated }}>
            <tr>
              <Th>Réf.</Th>
              <Th>Sens</Th>
              <Th>Titre</Th>
              <Th>Marché</Th>
              <Th>Qté</Th>
              <Th>Prix</Th>
              <Th>Portefeuille</Th>
              <Th>Statut</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o, i) => (
              <tr
                key={o.id}
                style={{
                  borderTop: `1px solid ${C.line}`,
                  background: i % 2 ? C.rowAlternate : C.surfaceCard,
                }}
              >
                <Td mono>{o.id}</Td>
                <Td>
                  <Badge tone={o.sens === 'Achat' ? 'teal' : 'coral'}>
                    {o.sens}
                  </Badge>
                </Td>
                <Td className="gsm-native-carnetmainscreen-acd15ec66">{o.titre}</Td>
                <Td>
                  <Badge tone="navy">{o.marche}</Badge>
                </Td>
                <Td mono>{o.qte}</Td>
                <Td mono>
                  {o.prix} {o.devise}
                </Td>
                <Td>{o.pf}</Td>
                <Td>
                  <Badge
                    tone={
                      o.statut === 'Exécuté'
                        ? 'teal'
                        : o.statut === 'Annulé'
                        ? 'coral'
                        : 'gold'
                    }
                  >
                    {o.statut}
                  </Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export { Carnet };
