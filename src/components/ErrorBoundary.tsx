// @ts-nocheck
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    const { children } = (this as any).props;
    const { hasError, error } = (this as any).state;
    
    if (hasError) {
      let errorMessage = "An unexpected error occurred in the financial engine.";
      let isFirebaseError = false;

      try {
        if (error) {
          const parsed = JSON.parse(error.message);
          if (parsed.error && parsed.operationType) {
            errorMessage = `Vault Access Error: ${parsed.error}`;
            isFirebaseError = true;
          }
        }
      } catch (e) {
        // Not a JSON error, use original message
        if (error) {
          errorMessage = error.message;
        }
      }

      return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 font-sans">
          <div className="glass p-10 rounded-[48px] max-w-lg w-full text-center space-y-8 border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[100px] -mr-32 -mt-32" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 rounded-3xl bg-rose-500/10 flex items-center justify-center mb-6 border border-rose-500/20 shadow-xl">
                <AlertTriangle className="text-rose-400" size={40} />
              </div>
              <h2 className="text-3xl font-display font-black text-white italic tracking-tighter uppercase mb-2">System Disruption</h2>
              <p className="text-slate-400 font-medium leading-relaxed">
                {isFirebaseError ? "A secure data synchronization failure has been detected." : "The application encountered a critical runtime exception."}
              </p>
            </div>

            <div className="relative z-10 p-5 bg-white/5 rounded-2xl border border-white/5 text-left">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Error Diagnostic</p>
              <p className="text-xs font-mono text-rose-300 break-words">{errorMessage}</p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="relative z-10 w-full flex items-center justify-center gap-3 py-4 bg-brand-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-brand-500 transition-all shadow-xl shadow-brand-500/20"
            >
              <RefreshCcw size={20} />
              Re-initialize Session
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
