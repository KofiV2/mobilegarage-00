import React from 'react';
import PropTypes from 'prop-types';
import logger from '../utils/logger';
import './ErrorBoundary.css';

/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs the errors, and displays a fallback UI instead of crashing.
 *
 * Usage:
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 *
 * Features:
 * - Logs errors with full context to error tracking service
 * - Provides user-friendly error UI
 * - Allows error recovery via retry mechanism
 * - Supports custom fallback UI
 * - Integrates with structured logging system
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to error reporting service
    logger.error('React ErrorBoundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.name || 'Unknown',
      errorCount: this.state.errorCount + 1
    });

    // Update state with error details
    this.setState({
      error,
      errorInfo,
      errorCount: this.state.errorCount + 1
    });

    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Call optional onReset callback
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReportIssue = () => {
    const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '9710554995611';
    const errorMessage = this.state.error?.message || 'Unknown error';
    const message = encodeURIComponent(
      `I encountered an error on the website:\n\nError: ${errorMessage}\n\nPlease help!`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-container">
            <div className="error-icon">⚠️</div>
            <h1 className="error-boundary-title">Oops! Something went wrong</h1>
            <p className="error-boundary-message">
              We're sorry for the inconvenience. An unexpected error occurred.
            </p>

            {this.props.showDetails && this.state.error && (
              <details className="error-details-expandable">
                <summary>Error Details (for debugging)</summary>
                <pre className="error-stack">
                  <strong>Error:</strong> {this.state.error.toString()}
                  {'\n\n'}
                  <strong>Component Stack:</strong>
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="error-boundary-actions">
              <button onClick={this.handleReset} className="btn-primary">
                Try Again
              </button>
              <button onClick={() => window.location.href = '/'} className="btn-secondary">
                Go to Homepage
              </button>
              <button onClick={this.handleReportIssue} className="btn-outline">
                Report Issue
              </button>
            </div>

            <p className="error-boundary-hint">
              If the problem persists, try refreshing the page or clearing your browser cache.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
  onError: PropTypes.func,
  onReset: PropTypes.func,
  name: PropTypes.string,
  showDetails: PropTypes.bool
};

ErrorBoundary.defaultProps = {
  fallback: null,
  onError: null,
  onReset: null,
  name: 'ErrorBoundary',
  showDetails: import.meta.env.MODE === 'development'
};

export default ErrorBoundary;
