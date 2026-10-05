import React from 'react';
import { Bug, RefreshCw, MessageSquare } from 'lucide-react';
import { bugReportService } from '../services/bugReportService';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Auto-report the crash
    this.reportError(error, errorInfo);
  }

  reportError = async (error, errorInfo) => {
    try {
      // Capture screenshot
      const screenshot = await bugReportService.captureScreenshot();
      
      // Get user info from props or localStorage
      const userId = this.props.userId || null;
      const username = this.props.username || 
        (typeof localStorage !== 'undefined' ? localStorage.getItem('tcg_warrior_username') : null) || 
        'Guest Player';

      await bugReportService.submitBugReport({
        userId,
        username,
        errorType: 'crash',
        errorMessage: error.message || 'React Error Boundary caught an error',
        errorStack: error.stack + '\n\nComponent Stack:\n' + errorInfo.componentStack,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        gameState: this.props.gameState || null,
        matchId: this.props.matchId || null,
        screenshot
      });
    } catch (reportError) {
      console.error('[ErrorBoundary] Failed to report error:', reportError);
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleRestart = () => {
    // Clear game state and go to home
    try {
      localStorage.removeItem('kontrola_current_match');
      localStorage.removeItem('kontrola_player_id');
    } catch (e) {}
    
    window.location.href = window.location.origin + window.location.pathname;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'radial-gradient(circle at 50% 20%, #111a36 0%, #080d1e 60%, #040710 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            fontFamily: 'Bebas Neue, sans-serif'
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '2px solid rgba(255, 42, 85, 0.5)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '500px',
              textAlign: 'center',
              boxShadow: '0 0 40px rgba(255, 42, 85, 0.25)'
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'rgba(255, 42, 85, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
                border: '2px solid rgba(255, 42, 85, 0.3)'
              }}
            >
              <Bug size={40} style={{ color: '#ff2a55' }} />
            </div>

            {/* Title */}
            <h1
              style={{
                color: '#fff',
                fontSize: '1.8rem',
                fontWeight: '900',
                letterSpacing: '1.5px',
                margin: '0 0 12px 0',
                textTransform: 'uppercase'
              }}
            >
              SYSTEM CRASHED
            </h1>

            {/* Message */}
            <p
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '1rem',
                lineHeight: '1.5',
                margin: '0 0 24px 0'
              }}
            >
              The TCG Companion encountered an unexpected error and needs to restart.
              <br />
              <strong style={{ color: '#FBC80D' }}>Bug report automatically submitted.</strong>
            </p>

            {/* Error Details (Collapsible) */}
            <details
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '24px',
                textAlign: 'left'
              }}
            >
              <summary
                style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  marginBottom: '8px'
                }}
              >
                Technical Details (Click to expand)
              </summary>
              <pre
                style={{
                  color: '#ff8099',
                  fontSize: '0.75rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  maxHeight: '200px',
                  overflow: 'auto',
                  margin: 0
                }}
              >
                {this.state.error && this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: 'linear-gradient(135deg, #FBC80D, #0099cc)',
                  border: 'none',
                  color: '#fff',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  letterSpacing: '0.5px'
                }}
              >
                <RefreshCw size={18} />
                RELOAD PAGE
              </button>

              <button
                onClick={this.handleRestart}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#fff',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  letterSpacing: '0.5px'
                }}
              >
                <MessageSquare size={18} />
                RESTART APP
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

