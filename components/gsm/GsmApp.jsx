'use client';

import { GsmAppShell } from './GsmAppShell';
import {
  GSM_DOCUMENTATION,
  openDocumentationPdf,
  downloadDocumentationPdf,
} from './features/documentation/DocumentationAssets';

export default function App() {
  return (
    <GsmAppShell
      documentation={GSM_DOCUMENTATION}
      onOpenDocumentation={openDocumentationPdf}
      onDownloadDocumentation={downloadDocumentationPdf}
    />
  );
}
