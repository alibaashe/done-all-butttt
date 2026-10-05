import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class AppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AppErrorBoundary] Uncaught rendering exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    try {
      window.location.reload();
    } catch {}
  };

  private handleGoHome = () => {
    try {
      localStorage.removeItem('wadaage_current_ride');
      window.location.href = window.location.origin + window.location.pathname;
    } catch {
      this.handleReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-black text-white">
                {this.props.fallbackTitle || 'Khalad ayaa dhacay (System Recovered)'}
              </h2>
              <p className="text-xs text-slate-400">
                {this.props.fallbackMessage || 'Khalad yar ayaa ku yimid daaqadda. Fadlan dib u celi si xidhiidhka dalabku u sii socdo.'}
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left overflow-auto max-h-24">
                <p className="font-mono text-[10px] text-rose-400">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-900/30"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Dib u Cusboonaysii (Reload)</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center space-x-1 transition border border-slate-700"
              >
                <Home className="w-4 h-4" />
                <span>Bogga Hore</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
