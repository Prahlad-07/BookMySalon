/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
import React from 'react';
import PropTypes from 'prop-types';

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
        <div className="flex min-h-screen items-center justify-center bg-paper px-6">
          <div className="max-w-md">
            <p className="eyebrow">Unexpected error</p>
            <h1 className="display mt-3 text-[48px] text-ink">Something went wrong.</h1>
            <p className="mt-3 text-ink-2">
              The page hit a problem it could not recover from. Reloading usually fixes it — your data is safe.
            </p>
            <button type="button" className="btn-dark mt-7" onClick={() => window.location.reload()}>
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

AppErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};
