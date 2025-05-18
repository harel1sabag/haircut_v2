import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    // ניתן להוסיף כאן שליחת שגיאה לשרת או קונסול
    console.error('React ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, textAlign: 'center', color: 'red' }}>
          <h2>אופס! התרחשה שגיאה באפליקציה.</h2>
          <pre style={{ direction: 'ltr', textAlign: 'left', background: '#fff0f0', padding: 16, borderRadius: 8 }}>
            {this.state.error && this.state.error.toString()}
            {'\n'}
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children; 
  }
}

export default ErrorBoundary;
