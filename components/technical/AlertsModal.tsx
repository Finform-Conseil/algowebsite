'use client';

import { useState } from 'react';

interface AlertCondition {
  id: string;
  field: 'price' | 'volume';
  interval: string;
  operator: '>' | '<' | '>=' | '<=' | '==';
  value: number;
}

interface AlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSymbol: string;
  onCreateAlert: (alert: any) => void;
}

const INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M'];

export default function AlertsModal({ isOpen, onClose, currentSymbol, onCreateAlert }: AlertsModalProps) {
  const [activeTab, setActiveTab] = useState<'conditions' | 'settings'>('conditions');
  const [conditions, setConditions] = useState<AlertCondition[]>([
    { id: '1', field: 'price', interval: '1d', operator: '>', value: 0 },
  ]);
  const [trigger, setTrigger] = useState<'once' | 'everytime'>('once');
  const [expirationDate, setExpirationDate] = useState('');
  const [alertName, setAlertName] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  if (!isOpen) return null;

  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        id: Date.now().toString(),
        field: 'price',
        interval: '1d',
        operator: '>',
        value: 0,
      },
    ]);
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id));
  };

  const updateCondition = (id: string, field: keyof AlertCondition, value: any) => {
    setConditions(
      conditions.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSubmit = () => {
    onCreateAlert({
      symbol: currentSymbol,
      conditions,
      trigger,
      expirationDate,
      name: alertName,
      message: alertMessage,
    });
    onClose();
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="alerts-modal">
        <div className="alerts-modal__header">
          <h3>Créer une Alerte</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="alerts-modal__tabs">
          <button
            className={`tab-btn ${activeTab === 'conditions' ? 'active' : ''}`}
            onClick={() => setActiveTab('conditions')}
          >
            Conditions
          </button>
          <button
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Paramètres
          </button>
        </div>

        <div className="alerts-modal__body">
          {activeTab === 'conditions' ? (
            <div className="conditions-tab">
              {/* Symbol (readonly) */}
              <div className="form-group">
                <label className="form-label">Symbole</label>
                <input type="text" className="form-input" value={currentSymbol} readOnly disabled />
              </div>

              {/* Conditions */}
              <div className="form-group">
                <div className="form-label-with-action">
                  <label className="form-label">Conditions</label>
                  <button className="btn btn--small btn--primary" onClick={addCondition}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Ajouter
                  </button>
                </div>

                <div className="conditions-list">
                  {conditions.map((condition, index) => (
                    <div key={condition.id} className="condition-item">
                      <div className="condition-fields">
                        <select
                          className="form-select"
                          value={condition.field}
                          onChange={(e) => updateCondition(condition.id, 'field', e.target.value)}
                        >
                          <option value="price">Price</option>
                          <option value="volume">Volume</option>
                        </select>

                        <select
                          className="form-select"
                          value={condition.interval}
                          onChange={(e) => updateCondition(condition.id, 'interval', e.target.value)}
                        >
                          {INTERVALS.map((interval) => (
                            <option key={interval} value={interval}>
                              {interval}
                            </option>
                          ))}
                        </select>

                        <select
                          className="form-select form-select--operator"
                          value={condition.operator}
                          onChange={(e) => updateCondition(condition.id, 'operator', e.target.value)}
                        >
                          <option value=">">{'>'}</option>
                          <option value="<">{'<'}</option>
                          <option value=">=">{'>='}</option>
                          <option value="<=">{'<='}</option>
                          <option value="==">{'=='}</option>
                        </select>

                        <input
                          type="number"
                          className="form-input"
                          placeholder="Valeur"
                          value={condition.value}
                          onChange={(e) => updateCondition(condition.id, 'value', parseFloat(e.target.value))}
                        />
                      </div>

                      {conditions.length > 1 && (
                        <button
                          className="remove-condition-btn"
                          onClick={() => removeCondition(condition.id)}
                          title="Supprimer"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Trigger */}
              <div className="form-group">
                <label className="form-label">Déclencheur</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="trigger"
                      value="once"
                      checked={trigger === 'once'}
                      onChange={(e) => setTrigger(e.target.value as 'once')}
                    />
                    <span>Une seule fois</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="trigger"
                      value="everytime"
                      checked={trigger === 'everytime'}
                      onChange={(e) => setTrigger(e.target.value as 'everytime')}
                    />
                    <span>À chaque fois</span>
                  </label>
                </div>
              </div>

              {/* Expiration Date */}
              <div className="form-group">
                <label className="form-label">Date d'expiration</label>
                <input
                  type="date"
                  className="form-input"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="settings-tab">
              {/* Alert Name */}
              <div className="form-group">
                <label className="form-label">Nom de l'alerte</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: AAPL dépasse 200$"
                  value={alertName}
                  onChange={(e) => setAlertName(e.target.value)}
                />
              </div>

              {/* Alert Message */}
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea
                  className="form-textarea"
                  placeholder="Message à envoyer lors du déclenchement..."
                  rows={6}
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                />
              </div>

              {/* Notification Channels */}
              <div className="form-group">
                <label className="form-label">Canaux de notification</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>Notification push</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    <span>Email</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    <span>SMS</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="alerts-modal__footer">
          <button className="btn btn--secondary" onClick={onClose}>
            Annuler
          </button>
          <button className="btn btn--primary" onClick={handleSubmit}>
            Créer l'alerte
          </button>
        </div>
      </div>
    </>
  );
}
