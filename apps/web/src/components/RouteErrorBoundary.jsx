import React from 'react';
import { useNavigate } from 'react-router-dom';
import './RouteErrorBoundary.css';

class RouteErrorBoundaryClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorDetails = {
      error,
      errorInfo,
      route: this.props.routeName || window.location.pathname,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Log to console with route context
    console.group(`%c Route Error: ${errorDetails.route}`, 'color: orange; font-weight: bold; font-size: 12px;');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Route:', errorDetails.route);
    console.groupEnd();

    this.setState({
      error,
      errorInfo
    });

    // Call parent error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorDetails);
    }

    // Log to Sentry if available
    if (window.Sentry && typeof window.Sentry.captureException === 'function') {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          },
          route: {
            name: errorDetails.route,
            url: errorDetails.url
          }
        },
        tags: {
          errorType: 'route',
          route: errorDetails.route
        }
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleGoBack = () => {
    if (this.props.navigate) {
      this.props.navigate(-1);
    } else {
      window.history.back();
    }
  };

  handleGoHome = () => {
    if (this.props.navigate) {
      this.props.navigate('/');
    } else {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      const isProduction = import.meta.env.MODE === 'production';
      const showDetails = !isProduction && this.state.error;

      return (
        <div className="route-error-boundary">
          <div className="route-error-content">
            <div className="route-error-icon">🚧</div>
            <h2>Unable to Load This Page</h2>
            <p className="route-error-message">
              This page encountered an error and couldn't be displayed. Please try refreshing or go back to the previous page.
            </p>

            {showDetails && (
              <details className="route-error-details">
                <summary>Error Details (Development Only)</summary>
                <div className="route-error-stack">
                  <strong>Route:</strong>
                  <pre>{this.props.routeName || window.location.pathname}</pre>
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
                </div>
              </details>
            )}

            <div className="route-error-actions">
              <button onClick={this.handleReset} className="btn-primary">
                Try Again
              </button>
              <button onClick={this.handleGoBack} className="btn-secondary">
                Go Back
              </button>
              <button onClick={this.handleGoHome} className="btn-secondary">
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component to use React Router's useNavigate hook
const RouteErrorBoundary = ({ children, routeName, onError }) => {
  const navigate = useNavigate();

  return (
    <RouteErrorBoundaryClass
      routeName={routeName}
      onError={onError}
      navigate={navigate}
    >
      {children}
    </RouteErrorBoundaryClass>
  );
};

export default RouteErrorBoundary;
