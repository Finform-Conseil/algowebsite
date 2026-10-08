import { ArrowRight, X } from 'lucide-react';
import { fmt } from '../lib/finance';
import { Badge, Eyebrow, Td, Th } from './UiAtoms';
import { C } from '../theme/theme';

export interface AvailableWithdrawal {
  clientId: string;
  client?: string;
  chargeeClientele?: string;
  montant?: number;
  devise?: string;
  observationChargeeClientele?: string;
  modePaiement?: string;
  [key: string]: unknown;
}

export function AvailableWithdrawalsModal({
  open,
  items,
  onClose,
  onOpenClient,
  onOpenWithdrawals,
}: {
  open: boolean;
  items: AvailableWithdrawal[];
  onClose: () => void;
  onOpenClient?: (clientId: string) => void;
  onOpenWithdrawals: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="gsm-withdrawals-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="retraits-disponibles-title"
      onClick={onClose}
    >
      <div
        className="gsm-withdrawals-modal__panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="gsm-withdrawals-modal__header">
          <div>
            <Eyebrow>État cession-retrait</Eyebrow>
            <h3
              id="retraits-disponibles-title"
              className="gsm-withdrawals-modal__title"
            >
              Retraits disponibles
            </h3>
            <p className="gsm-withdrawals-modal__description">
              Fonds disponibles pour remise ou règlement au client.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="gsm-withdrawals-modal__close"
            aria-label="Fermer"
            title="Fermer"
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        <div className="gsm-withdrawals-modal__body">
          <table className="gsm-withdrawals-modal__table">
            <colgroup>
              <col className="gsm-withdrawals-modal__col-client" />
              <col className="gsm-withdrawals-modal__col-manager" />
              <col className="gsm-withdrawals-modal__col-amount" />
              <col />
              <col className="gsm-withdrawals-modal__col-payment" />
            </colgroup>
            <thead className="gsm-withdrawals-modal__table-head">
              <tr>
                <Th>Client</Th>
                <Th>Chargée de clientèle</Th>
                <Th>
                  Montant de retrait disponible
                </Th>
                <Th>
                  Observation du chargé de clientèle
                </Th>
                <Th>Mode de paiement</Th>
              </tr>
            </thead>

            <tbody>
              {items.map((item, index) => (
                <tr
                  key={`${item.clientId}-${item.modePaiement || ''}-${index}`}
                  className="gsm-withdrawals-modal__row"
                  style={{
                    background:
                      index % 2 ? C.rowAlternate : C.surfaceCard,
                  }}
                >
                  <Td>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenClient?.(item.clientId);
                      }}
                      className="gsm-native-availablewithdrawalsmodal-9551398ee"
                      style={{ color: C.indigo }}
                      title={`Ouvrir le portefeuille de ${item.client || 'ce client'}`}
                    >
                      {item.client || 'Client'}
                    </button>
                  </Td>

                  <Td className="gsm-native-availablewithdrawalsmodal-4d32574df">
                    {item.chargeeClientele ||
                      'Non renseignée'}
                  </Td>

                  <Td mono className="gsm-native-availablewithdrawalsmodal-4d32574df">
                    <span
                      style={{
                        color: C.teal,
                        fontWeight: 700,
                      }}
                    >
                      {fmt(Number(item.montant || 0))}{' '}
                      {item.devise || ''}
                    </span>
                  </Td>

                  <Td>
                    <div
                      className="gsm-withdrawals-modal__observation"
                      style={{ color: C.sub }}
                    >
                      {item.observationChargeeClientele ||
                        'Aucune observation renseignée.'}
                    </div>
                  </Td>

                  <Td>
                    <Badge tone="teal">
                      {item.modePaiement ||
                        'Non renseigné'}
                    </Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="gsm-withdrawals-modal__footer">
          <div className="gsm-withdrawals-modal__count">
            <span className="gsm-withdrawals-modal__count-dot" aria-hidden="true" />
            {items.length} retrait{items.length > 1 ? 's' : ''} disponible{items.length > 1 ? 's' : ''}
          </div>

          <div className="gsm-withdrawals-modal__actions">
            <button
              type="button"
              className="gsm-btn gsm-btn--secondary"
              onClick={onClose}
            >
              Fermer
            </button>
            <button
              type="button"
              className="gsm-btn gsm-btn--primary"
              onClick={() => {
                onClose();
                onOpenWithdrawals();
              }}
            >
              Ouvrir Cession / Retrait
              <ArrowRight size={16} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
