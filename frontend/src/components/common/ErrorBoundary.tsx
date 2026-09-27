import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b1120] text-slate-100 flex flex-col items-center justify-center p-6 font-mono">
          <div className="max-w-md w-full bg-[#0f172a] border border-rose-900/80 rounded-lg p-6 shadow-2xl flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-950 text-rose-400 flex items-center justify-center border border-rose-800">
              <span className="material-symbols-outlined text-[28px]">warning</span>
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-white">System Standby / Recovery Active</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                An isolated UI rendering exception was recovered. The C4ISR background AI engine remains operational.
              </p>
            </div>
            {this.state.error && (
              <div className="w-full p-3 rounded bg-slate-950 border border-slate-800 text-[10px] text-rose-300 font-mono text-left overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 rounded bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] uppercase transition-colors cursor-pointer"
            >
              Reload Dashboard System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
