import React from 'react';

/**
 * Resilient React Error Boundary for isolating view crashes (corrupt storage, lazy-chunk offline failure, etc.)
 * with one-tap recovery or local cache reset.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('PokéSearch UI ErrorBoundary caught error:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const title = this.props.title || 'Something went wrong in this panel';
    const message =
      this.state.error?.message ||
      'An unexpected error occurred while rendering this view.';

    return (
      <div
        role="alert"
        className="max-w-xl mx-auto my-8 p-5 pogo-glass-card border-2 border-rose-200 text-center space-y-3"
      >
        <h2 className="text-base font-extrabold text-[#123c4d]">{title}</h2>
        <p className="text-xs text-[#285d72] break-words">{message}</p>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={this.handleRetry}
            className="px-4 py-2 rounded-full text-xs font-extrabold pogo-pill-active cursor-pointer"
          >
            Try Again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-full text-xs font-bold pogo-pill cursor-pointer"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }
}
