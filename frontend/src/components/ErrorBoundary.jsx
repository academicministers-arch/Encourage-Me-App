import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Encourage Me crashed:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface px-6">
          <div className="max-w-md text-center bg-white rounded-xl2 shadow-card p-8">
            <h1 className="font-display text-xl font-bold text-navy mb-2">Something went off track</h1>
            <p className="text-sm text-ink/60 mb-6">
              An unexpected error occurred. Refreshing usually fixes it, and your data is safe.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-lg bg-navy text-white text-sm font-semibold hover:bg-navy-light transition-colors focus-ring"
            >
              Refresh page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
