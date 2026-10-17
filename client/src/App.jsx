import { useState, useEffect } from 'react';

export default function App() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/health');
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      setHealthStatus(data);
    } catch (err) {
      setError(err.message || 'Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6">
      <main className="w-full max-w-lg bg-slate-800/90 border border-slate-700 rounded-2xl p-8 shadow-xl backdrop-blur">
        <header className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Environment Initialized
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            AI Resume Analyzer
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Student developer career readiness diagnostics
          </p>
        </header>

        <section className="bg-slate-950/60 rounded-xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Backend Health Endpoint:</span>
            <code className="text-xs bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-mono">
              GET /api/health
            </code>
          </div>

          <div className="border-t border-slate-800 pt-3">
            {loading && (
              <p className="text-sm text-slate-400 italic">Testing connection to backend...</p>
            )}

            {error && (
              <div className="text-sm text-rose-400 bg-rose-950/30 border border-rose-800/50 rounded-lg p-3">
                <p className="font-medium">Connection failed</p>
                <p className="text-xs text-rose-300 mt-1">{error}</p>
                <p className="text-xs text-slate-400 mt-2">
                  Ensure the Express server is running on port 4000.
                </p>
              </div>
            )}

            {healthStatus && (
              <div className="text-sm text-emerald-300 bg-emerald-950/30 border border-emerald-800/50 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-semibold text-emerald-200">Server Connected</span>
                </div>
                <p className="text-xs text-slate-300">{healthStatus.message}</p>
                <p className="text-xs text-slate-500 font-mono">
                  Timestamp: {healthStatus.timestamp}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={checkHealth}
            disabled={loading}
            className="w-full mt-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            {loading ? 'Checking...' : 'Re-check Connection'}
          </button>
        </section>

        <footer className="mt-6 text-center text-xs text-slate-500">
          Vite Proxy: Port 5180 &rarr; Express: Port 4000
        </footer>
      </main>
    </div>
  );
}
