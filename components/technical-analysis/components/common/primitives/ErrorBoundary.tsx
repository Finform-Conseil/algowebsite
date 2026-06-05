import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

/**
 * Error Boundary for TechnicalAnalysis components
 * Catches runtime errors and prevents app crashes
 */
export class TechnicalAnalysisErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging (but don't spam console in production)
    if (process.env.NODE_ENV === 'development') {
      console.error('TechnicalAnalysis Error Boundary:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;

      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
      }

      return (
        <div
          style={{
            padding: "20px",
            backgroundColor: "#fee",
            border: "1px solid #fcc",
            borderRadius: "4px",
            color: "#c33",
            fontFamily: "system-ui, sans-serif"
          }}
        >
          <h3 style={{ margin: "0 0 10px 0" }}>Erreur dans l&apos;analyse technique</h3>
          <p style={{ margin: "0 0 15px 0" }}>
            Une erreur s&apos;est produite. Veuillez rafraîchir la page ou réessayer.
          </p>
          {this.state.error && (
            <details style={{ marginBottom: "15px" }}>
              <summary style={{ cursor: "pointer" }}>Détails techniques</summary>
              <pre style={{
                backgroundColor: "#f5f5f5",
                padding: "10px",
                borderRadius: "4px",
                fontSize: "12px",
                overflow: "auto",
                marginTop: "10px"
              }}>
                {this.state.error.message}
              </pre>
            </details>
          )}
          <button
            onClick={this.handleRetry}
            style={{
              padding: "8px 16px",
              backgroundColor: "#2962ff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Réessayer
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Default error fallback component
 */
export const DefaultErrorFallback: React.FC<{ error?: Error; retry: () => void }> = ({
  error: _error,
  retry
}) => (
  <div
    style={{
      padding: "20px",
      backgroundColor: "#fff3cd",
      border: "1px solid #ffeaa7",
      borderRadius: "4px",
      color: "#856404"
    }}
  >
    <h4>Erreur de chargement</h4>
    <p>Le composant d&apos;analyse technique a rencontré une erreur.</p>
    <button onClick={retry} style={{ marginTop: "10px", padding: "5px 10px" }}>
      Réessayer
    </button>
  </div>
);
