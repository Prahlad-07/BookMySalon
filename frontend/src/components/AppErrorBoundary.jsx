/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
import React from 'react';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-xl w-full rounded-xl border border-red-300 bg-red-50 p-5 text-red-800">
            <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
            <p className="text-sm">The app encountered a runtime error. Open browser console for details.</p>
            {this.state.error?.message && <p className="text-xs mt-3">{this.state.error.message}</p>}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
