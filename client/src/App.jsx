import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header.jsx';
import RoleSelector from './components/RoleSelector.jsx';
import FileUpload from './components/FileUpload.jsx';
import ResultsView from './components/ResultsView.jsx';
import ErrorAlert from './components/ErrorAlert.jsx';
import AuthModal from './components/AuthModal.jsx';
import HistoryView from './components/HistoryView.jsx';

export default function App() {
  // Navigation tabs: 'analyze' | 'history'
  const [activeTab, setActiveTab] = useState('analyze');

  // Application UI states: 'idle' | 'selected' | 'loading' | 'success' | 'error'
  const [uiState, setUiState] = useState('idle');

  // Form selections
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Field-specific validation errors
  const [fileError, setFileError] = useState('');
  const [roleError, setRoleError] = useState('');

  // General backend/network error
  const [generalError, setGeneralError] = useState('');

  // Analysis result data from backend
  const [analysisResult, setAnalysisResult] = useState(null);

  // Backend API connection check
  const [backendConnected, setBackendConnected] = useState(null);

  // Authentication states
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  // History state
  const [analysesHistory, setAnalysesHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch personal analyses for logged-in user
  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/analyses', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysesHistory(data.analyses || []);
      }
    } catch {
      // Silent fail on history polling
    } finally {
      setHistoryLoading(false);
    }
  }, [user]);

  // Check health and current session on initial load
  useEffect(() => {
    async function initApp() {
      // 1. Probe health endpoint
      try {
        const healthRes = await fetch('/api/health');
        setBackendConnected(healthRes.ok);
      } catch {
        setBackendConnected(false);
      }

      // 2. Probe current authenticated session via HTTP-only cookie
      try {
        const authRes = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.success && authData.user) {
            setUser(authData.user);
          }
        }
      } catch {
        // Not authenticated
      } finally {
        setAuthLoading(false);
      }
    }

    initApp();
  }, []);

  // Sync history when user logs in or activeTab switches to history
  useEffect(() => {
    if (user) {
      fetchHistory();
    } else {
      setAnalysesHistory([]);
    }
  }, [user, fetchHistory]);

  // Handle file selection and local validation
  const handleFileSelect = (file, validationError) => {
    if (validationError) {
      setFileError(validationError);
      setSelectedFile(null);
      setUiState('idle');
      return;
    }

    setFileError('');
    setSelectedFile(file);
    setGeneralError('');
    setUiState('selected');
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setFileError('');
    setUiState('idle');
  };

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setRoleError('');
    setGeneralError('');
  };

  // Submit to POST /api/analyze with FormData
  const handleAnalyze = async (e) => {
    e.preventDefault();

    // Prevent duplicate submissions while in flight
    if (uiState === 'loading') return;

    // Authentication Guard: prompt user to log in before analyzing
    if (!user) {
      setAuthMode('login');
      setAuthModalOpen(true);
      setGeneralError('Please sign in or create an account to analyze and save your resume.');
      return;
    }

    let hasClientValidationError = false;

    if (!selectedFile) {
      setFileError('Please upload a PDF resume before analyzing.');
      hasClientValidationError = true;
    } else {
      setFileError('');
    }

    if (!selectedRole) {
      setRoleError('Please select a target developer role.');
      hasClientValidationError = true;
    } else {
      setRoleError('');
    }

    if (hasClientValidationError) return;

    // Transition to Loading state
    setUiState('loading');
    setGeneralError('');

    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);
      formData.append('role', selectedRole);

      // Post through Vite proxy to Express backend with cookie credentials
      const response = await fetch('/api/analyze', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json().catch(() => ({
        success: false,
        error: `Server responded with HTTP ${response.status}`,
      }));

      if (!response.ok || !data.success) {
        if (response.status === 401) {
          setUser(null);
          setAuthMode('login');
          setAuthModalOpen(true);
          setGeneralError('Session expired. Please sign in again.');
        } else {
          setGeneralError(data.error || 'An unexpected error occurred during processing.');
        }
        setUiState('error');
        return;
      }

      // Success: display genuine AI analysis results
      console.log('[Frontend] API response received with score:', data.score);
      setAnalysisResult(data);
      setUiState('success');

      // Refresh history list in the background
      fetchHistory();
    } catch (networkErr) {
      setGeneralError(
        networkErr.message === 'Failed to fetch'
          ? 'Cannot connect to the backend server. Please verify the Express server is running on port 4000.'
          : networkErr.message || 'Network error occurred while uploading.'
      );
      setUiState('error');
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setSelectedFile(null);
    setSelectedRole('');
    setFileError('');
    setRoleError('');
    setGeneralError('');
    setUiState('idle');
  };

  const handleRetryAfterError = () => {
    setGeneralError('');
    setUiState(selectedFile ? 'selected' : 'idle');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore network errors on logout
    }
    setUser(null);
    setAnalysesHistory([]);
    setActiveTab('analyze');
    handleReset();
  };

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (authedUser) => {
    setUser(authedUser);
    setGeneralError('');
  };

  // Determine if required inputs are missing
  const isInputsMissing = !selectedFile || !selectedRole;

  return (
    <div className="min-h-screen bg-[#0A0C10] text-zinc-100 flex flex-col font-sans antialiased selection:bg-violet-900/60 selection:text-violet-100">
      {/* Top Header */}
      <Header
        backendConnected={backendConnected}
        user={user}
        activeTab={activeTab}
        historyCount={analysesHistory.length}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'analyze' && uiState === 'success') {
            // Keep current result if returning
          }
        }}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
       <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* View Mode 1: History Tab */}
        {activeTab === 'history' && (
          <HistoryView
            analyses={analysesHistory}
            loading={historyLoading}
            onSelectAnalysis={(item) => {
              setAnalysisResult(item);
              setUiState('success');
              setActiveTab('analyze');
            }}
            onNewAnalysis={() => {
              handleReset();
              setActiveTab('analyze');
            }}
            onRefresh={fetchHistory}
          />
        )}

        {/* View Mode 2: Analyze Tab */}
        {activeTab === 'analyze' && (
          <>
            {/* Results Screen (Success State) */}
            {uiState === 'success' && analysisResult ? (
              <div className="space-y-4">
                {/* Secondary navigation to history */}
                {user && (
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveTab('history')}
                      className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      ← Back to Evaluation History
                    </button>
                  </div>
                )}
                <ResultsView result={analysisResult} onReset={handleReset} />
              </div>
            ) : (
              /* Intake & Analysis Form (Idle, Selected, Loading, Error States) */
              <div className="space-y-8">
                {/* Title & Introduction */}
                 <div className="text-center max-w-2xl mx-auto space-y-3">
                   <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-950/60 text-violet-300 border border-violet-850">
                     <span>Final-Year Student Career Toolkit</span>
                   </div>
                   <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight">
                     AI Resume Analyzer
                   </h2>
                   <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                     Benchmark your developer resume against junior hiring expectations using Groq AI. Upload your PDF to receive an instant readiness score, detected skills, missing competencies, and tailored improvements.
                   </p>
                 </div>

                {/* Unauthenticated Info Banner */}
                {!authLoading && !user && (
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#141724] border border-zinc-800 rounded-xl gap-4">
                    <div className="flex items-center gap-3">
                       <div className="w-9 h-9 rounded-lg bg-violet-600 text-white flex items-center justify-center flex-shrink-0">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                         </svg>
                       </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-200">
                          Account Required to Analyze & Save
                        </h4>
                        <p className="text-xs text-zinc-400">
                          Sign in or register to securely store and view your evaluation history.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenAuth('login')}
                         className="px-3.5 py-1.5 text-xs font-semibold text-zinc-300 bg-zinc-800/80 hover:bg-zinc-700 hover:text-white border border-zinc-700 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                       >
                         Sign In
                       </button>
                       <button
                         type="button"
                         onClick={() => handleOpenAuth('register')}
                         className="px-3.5 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                       >
                        Register
                      </button>
                    </div>
                  </div>
                )}

                {/* Error Banner when in Error State */}
                {uiState === 'error' && (
                  <ErrorAlert
                    message={generalError}
                    onRetry={handleRetryAfterError}
                    onDismiss={() => setGeneralError('')}
                  />
                )}

                 {/* Main Form Card */}
                 <form
                   onSubmit={handleAnalyze}
                   className="bg-[#131622] border border-zinc-800/90 rounded-xl p-6 sm:p-8 shadow-lg space-y-8"
                 >
                   {/* Step 1: Upload */}
                   <FileUpload
                     selectedFile={selectedFile}
                     onFileSelect={handleFileSelect}
                     onFileRemove={handleFileRemove}
                     error={fileError}
                     disabled={uiState === 'loading'}
                   />

                   {/* Step 2: Role Selector */}
                   <RoleSelector
                     selectedRole={selectedRole}
                     onSelectRole={handleRoleSelect}
                     error={roleError}
                     disabled={uiState === 'loading'}
                   />

                  {/* Submit Button & Loading State */}
                   <div className="pt-2">
                     <button
                       type="submit"
                       disabled={uiState === 'loading' || isInputsMissing}
                       className="w-full py-3.5 px-6 rounded-lg bg-violet-600 hover:bg-violet-500 active:bg-violet-700 disabled:bg-zinc-850 disabled:text-zinc-500 disabled:border-zinc-800 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                     >
                       {uiState === 'loading' ? (
                         <>
                           <svg
                             className="animate-spin h-4 w-4 text-white"
                             xmlns="http://www.w3.org/2000/svg"
                             fill="none"
                             viewBox="0 0 24 24"
                             aria-hidden="true"
                           >
                             <circle
                               className="opacity-25"
                               cx="12"
                               cy="12"
                               r="10"
                               stroke="currentColor"
                               strokeWidth="4"
                             />
                             <path
                               className="opacity-75"
                               fill="currentColor"
                               d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                             />
                           </svg>
                           <span>Analyzing Resume...</span>
                         </>
                       ) : (
                         <>
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                             <path
                               strokeLinecap="round"
                               strokeLinejoin="round"
                               strokeWidth={2}
                               d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                             />
                           </svg>
                           <span>Analyze Resume</span>
                         </>
                       )}
                     </button>
                   </div>

                  {/* Status Indicator */}
                  <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                    <span>
                      User Session:{' '}
                      <strong className={user ? 'text-emerald-400' : 'text-zinc-500'}>
                        {user ? user.name : 'Guest (Sign in required)'}
                      </strong>
                    </span>
                    <span className="font-mono">Current State: {uiState}</span>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-[#0C0E14] py-6 text-center text-xs text-zinc-500">
        <div className="max-w-4xl mx-auto px-4">
          <p>AI Resume Analyzer • Frontend: Port 5180 | Backend: Port 4000</p>
          <p className="mt-1 text-zinc-600">
            Secure in-memory processing. Resumes are evaluated with Groq AI and stored securely per user account in MongoDB.
          </p>
        </div>
      </footer>
    </div>
  );
}
