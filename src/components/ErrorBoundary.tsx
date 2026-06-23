import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // TODO: Add error reporting service integration
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          background: 'var(--bg-0)',
          color: 'var(--fg-1)',
          fontFamily: 'var(--font-body)',
        }}>
          <div style={{
            maxWidth: '500px',
            textAlign: 'center',
          }}>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '1rem',
              color: 'var(--danger)',
            }}>
              Something went wrong
            </h1>
            
            <p style={{
              fontSize: '0.875rem',
              color: 'var(--fg-3)',
              marginBottom: '1.5rem',
              lineHeight: 1.6,
            }}>
              An unexpected error occurred. This has been logged and we'll look into it.
            </p>

            {this.state.error && (
              <details style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                background: 'var(--bg-2)',
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
                textAlign: 'left',
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  color: 'var(--fg-4)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  Error Details
                </summary>
                <pre style={{
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  color: 'var(--fg-5)',
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  background: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  background: 'var(--bg-3)',
                  color: 'var(--fg-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                }}
              >
                Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
