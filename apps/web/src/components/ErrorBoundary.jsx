import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorDetails = {
      error,
      errorInfo,
      errorBoundary: this.props.name || 'Main',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      pathname: window.location.pathname
    };

    // Log to console with structured format
    console.group(`%c Error Boundary: ${errorDetails.errorBoundary}`, 'color: red; font-weight: bold; font-size: 14px;');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Context:', {
      boundary: errorDetails.errorBoundary,
      url: errorDetails.url,
      timestamp: errorDetails.timestamp
    });
    console.groupEnd();

    this.setState({
      error,
      errorInfo
    });

    // Log to Sentry if available
    const eventId = this.logToSentry(error, errorInfo, errorDetails);

    // Log to backend service
    this.logErrorToService(error, errorInfo, errorDetails);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorDetails);
    }

    if (eventId) {
      this.setState({ eventId });
    }
  }

  logToSentry = (error, errorInfo, errorDetails) => {
    // Check if Sentry is available (you can install @sentry/react)
    if (window.Sentry && typeof window.Sentry.captureException === 'function') {
      try {
        const eventId = window.Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack
            },
            errorBoundary: {
              name: errorDetails.errorBoundary,
              url: errorDetails.url,
              pathname: errorDetails.pathname
            }
          },
          tags: {
            errorBoundary: errorDetails.errorBoundary,
            environment: import.meta.env.MODE
          }
        });
        console.log('Error logged to Sentry with ID:', eventId);
        return eventId;
      } catch (err) {
        console.error('Failed to log to Sentry:', err);
      }
    }
    return null;
  };

  logErrorToService = async (error, errorInfo, errorDetails) => {
    // Only log to backend in production or if explicitly enabled
    if (import.meta.env.MODE === 'production' || import.meta.env.VITE_ENABLE_ERROR_LOGGING === 'true') {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/logs/error`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            error: error.toString(),
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            errorBoundary: errorDetails.errorBoundary,
            timestamp: errorDetails.timestamp,
            userAgent: errorDetails.userAgent,
            url: errorDetails.url,
            pathname: errorDetails.pathname,
            environment: import.meta.env.MODE
          })
        });

        if (!response.ok) {
          console.warn('Error logging service returned non-OK response:', response.status);
        }
      } catch (err) {
        console.error('Failed to log error to service:', err);
      }
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null
    });

    // Call custom reset handler if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportFeedback = () => {
    // If Sentry is available and we have an eventId, show feedback dialog
    if (window.Sentry && this.state.eventId && typeof window.Sentry.showReportDialog === 'function') {
      window.Sentry.showReportDialog({ eventId: this.state.eventId });
    } else {
      // Fallback to email or support page
      window.location.href = 'mailto:support@carwash.com?subject=Error Report';
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          resetError: this.handleReset
        });
      }

      // Default fallback UI
      const isProduction = import.meta.env.MODE === 'production';
      const showDetails = !isProduction && this.state.error;

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h1>{this.props.title || 'Oops! Something went wrong'}</h1>
            <p className="error-message">
              {this.props.message || "We're sorry for the inconvenience. The application encountered an unexpected error."}
            </p>

            {this.state.eventId && (
              <p className="error-id">
                Error ID: <code>{this.state.eventId}</code>
              </p>
            )}

            {showDetails && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <div className="error-stack">
                  <strong>Error:</strong>
                  <pre>{this.state.error.toString()}</pre>
                  <strong>Stack Trace:</strong>
                  <pre>{this.state.error.stack}</pre>
                  {this.state.errorInfo && (
                    <>
                      <strong>Component Stack:</strong>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                  <strong>Context:</strong>
                  <pre>{JSON.stringify({
                    boundary: this.props.name || 'Main',
                    url: window.location.href,
                    pathname: window.location.pathname,
                    timestamp: new Date().toISOString()
                  }, null, 2)}</pre>
                </div>
              </details>
            )}

            <div className="error-actions">
              <button onClick={this.handleReset} className="btn-primary">
                Try Again
              </button>
              <button onClick={this.handleReload} className="btn-secondary">
                Reload Page
              </button>
              {this.props.showHomeButton !== false && (
                <button onClick={this.handleGoHome} className="btn-secondary">
                  Go Home
                </button>
              )}
              {isProduction && (
                <button onClick={this.handleReportFeedback} className="btn-tertiary">
                  Report Issue
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
