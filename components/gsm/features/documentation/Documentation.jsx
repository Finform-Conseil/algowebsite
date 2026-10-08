import { BookOpen, ChevronRight, Download, ExternalLink, Home } from 'lucide-react';
import { Badge, Card, Eyebrow } from '../../shared/ui/UiAtoms';
import { Breadcrumb } from '../../shared/ui/Navigation';
import { C, F_BODY, F_DISPLAY, F_MONO } from '../../shared/theme/theme';

function ClientDocumentationBreadcrumb({ items }) {
  return (
    <div className="gsm-native-documentation-1dfd7088c" style={{ color: C.sub, ...F_BODY }}>
      <Home size={13} />
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className="gsm-native-documentation-7c359f1d5">
          {index > 0 && <ChevronRight size={13} />}
          <span style={{ color: index === items.length - 1 ? C.ink : C.sub, fontWeight: index === items.length - 1 ? 600 : 500 }}>
            {item}
          </span>
        </span>
      ))}
    </div>
  );
}

export function DocumentationScreen({
  mode = 'gestionnaire',
  documents,
  onOpenDocument,
  onDownloadDocument,
}) {
  return (
    <div className="gsm-native-documentation-5622658a9">
      {mode === 'client' ? (
        <ClientDocumentationBreadcrumb items={['Espace Client', 'Documentation']} />
      ) : (
        <Breadcrumb items={['Accueil', 'Documentation']} />
      )}

      <div className="gsm-native-documentation-86d93311b">
        <div>
          <Eyebrow>Centre documentaire</Eyebrow>
          <h2 className="gsm-native-documentation-65c2d22a2" style={{ ...F_DISPLAY, color: C.ink }}>
            Documentation du logiciel OPCVM GSM
          </h2>
          <div className="gsm-native-documentation-562b1d781" style={{ color: C.sub }}>
            Retrouvez ici le guide d'utilisation destiné aux utilisateurs
            Gestion sous mandat et Gestion libre, ainsi que les documents
            techniques de référence. Chaque document peut être consulté dans le
            navigateur ou téléchargé localement.
          </div>
        </div>
        <Badge tone="navy">{documents.length} documents disponibles</Badge>
      </div>

      <div className="gsm-native-documentation-e6b163a6a">
        {[
          { label: 'Bibliothèque', value: 'Guides & architecture', detail: 'Utilisation, données, flux et intégrité' },
          { label: 'Guide utilisateur', value: 'Version 1.0', detail: 'Mise à jour du 15/09/2026' },
          { label: 'Format', value: 'PDF', detail: 'Consultable et téléchargeable' },
        ].map((item) => (
          <Card key={item.label} className="gsm-native-documentation-f59709f6b">
            <div className="gsm-native-documentation-ec1d10590" style={{ color: C.sub }}>{item.label}</div>
            <div className="gsm-native-documentation-6a0d1e0b5" style={{ color: C.ink, ...F_DISPLAY }}>{item.value}</div>
            <div className="gsm-native-documentation-cbd9fd6a5" style={{ color: C.sub }}>{item.detail}</div>
          </Card>
        ))}
      </div>

      <Card className="gsm-native-documentation-c5c44fc80">
        <div className="gsm-native-documentation-24d5882c2">
          <div>
            <Eyebrow>Documents disponibles</Eyebrow>
            <div className="gsm-native-documentation-f7cab7a2b" style={{ color: C.ink }}>
              Guides d'utilisation et référentiels techniques
            </div>
          </div>
          <Badge tone="gold">Bibliothèque interne</Badge>
        </div>

        <div className="gsm-native-documentation-1cc1e319d">
          {documents.map((document) => (
            <div key={document.id} className="gsm-responsive-header gsm-document-card gsm-native-documentation-ce54874fd"
              style={{ borderColor: C.line, background: C.surfaceElevated }}>
              <div className="gsm-document-card__content gsm-native-documentation-ccc1adbbc">
                <div className="gsm-native-documentation-e3a9b7aaf"
                  style={{ background: C.infoBackground, color: C.indigo }}>
                  <BookOpen size={20} />
                </div>

                <div className="gsm-native-documentation-1a5b74116">
                  <div className="gsm-native-documentation-174833a63">
                    <div className="gsm-native-documentation-065ec4995" style={{ color: C.ink }}>{document.title}</div>
                    <Badge tone="slate">{document.format}</Badge>
                  </div>
                  <div className="gsm-native-documentation-c8eadf4ce" style={{ color: C.sub }}>
                    {document.description}
                  </div>
                  <div className="gsm-native-documentation-0bdaa8e43" style={{ color: C.sub, ...F_MONO }}>
                    <span>{document.category}</span>
                    <span>Version {document.version}</span>
                    <span>Mise à jour {document.updatedAt}</span>
                  </div>
                </div>
              </div>

              <div className="gsm-responsive-actions gsm-document-card__actions gsm-native-documentation-f83356860">
                <button type="button" onClick={() => onOpenDocument(document)}
                  className="gsm-native-documentation-d67258fea"
                  style={{ borderColor: C.line, color: C.indigo, background: C.surfaceCard, cursor: 'pointer' }}>
                  <ExternalLink size={14} />
                  Ouvrir le PDF
                </button>
                <button type="button" onClick={() => onDownloadDocument(document)}
                  className="gsm-native-documentation-860a6f6f3"
                  style={{ background: C.surfaceElevated, color: C.textPrimary, cursor: 'pointer' }}>
                  <Download size={14} />
                  Télécharger
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="gsm-native-documentation-c5c44fc80" style={{ borderColor: C.gold }}>
        <Eyebrow>Disponibilité des documents</Eyebrow>
        <div className="gsm-native-documentation-f7cab7a2b" style={{ color: C.ink }}>
          Guide utilisateur immédiatement disponible
        </div>
        <div className="gsm-native-documentation-15323f597" style={{ color: C.sub }}>
          Le guide utilisateur est embarqué directement dans cette version de
          l'interface : les boutons Ouvrir le PDF et Télécharger fonctionnent
          sans fichier externe. Les autres documents techniques conservent leur
          chemin dans
          <code className="gsm-native-documentation-822ee4d12" style={{ background: C.surfaceInset, color: C.navy, ...F_MONO }}>
            public/documentation/
          </code>
          et pourront ensuite être servis par la table documents et une API sécurisée.
        </div>
      </Card>
    </div>
  );
}
