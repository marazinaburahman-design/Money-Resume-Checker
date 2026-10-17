import { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import RoleSelector from './components/RoleSelector.jsx';
import FileUpload from './components/FileUpload.jsx';
import ResultsView from './components/ResultsView.jsx';
import ErrorAlert from './components/ErrorAlert.jsx';
import { MOCK_ANALYSIS_DATA } from './mockData.js';

export default function App() {
  // Application UI states: 'idle' | 'selected' | 'loading' | 'success' | 'error'
  const [uiState, setUiState] = useState('idle');

  // Form selections
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Field-specific validation errors
  const [fileError, setFileError] = useState('');
  const [roleError, setRoleError] = useState('');

  // General operation error
  const [generalError, setGeneralError] = useState('');

  // Analysis result placeholder data
  const [analysisResult, setAnalysisResult] = useState(null);

  // Backend API connection check
  const [backendConnected, setBackendConnected] = useState(null);

  // Developer simulation helper for error state testing
  const [simulateErrorNext, setSimulateErrorNext] = useState(false);

  // Probe backend health endpoint via Vite proxy on initial load
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          setBackendConnected(true);
        } else {
          setBackendConnected(false);
        }
      } catch {
        setBackendConnected(false);
      }
    }
    checkHealth();
  }, []);

  // Handle file selection and validation
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

  // Form submission / analysis trigger
  const handleAnalyze = async (e) => {
    e.preventDefault();

    let hasError = false;

    if (!selectedFile) {
      setFileError('Please upload a PDF resume before analyzing.');
      hasError = true;
    } else {
      setFileError('');
    }

    if (!selectedRole) {
      setRoleError('Please select a target developer role.');
      hasError = true;
    } else {
      setRoleError('');
    }

    if (hasError) return;

    // Transition to Loading state
    setUiState('loading');
    setGeneralError('');

    // Simulate async analysis processing time
    setTimeout(() => {
      // If error simulation is toggled or special trigger file is used
      if (simulateErrorNext || selectedFile?.name?.toLowerCase().includes('error')) {
        setGeneralError(
          'Failed to process the resume document. The PDF structure could not be parsed or the backend service timed out. Please try again.'
        );
        setUiState('error');
        return;
      }

      // Success: populate structured role-specific placeholder data
      const data = MOCK_ANALYSIS_DATA[selectedRole] || MOCK_ANALYSIS_DATA['Full-stack Developer'];
      setAnalysisResult(data);
      setUiState('success');
    }, 1400);
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
    setSimulateErrorNext(false);
    setUiState(selectedFile ? 'selected' : 'idle');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      <Header backendConnected={backendConnected} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Results Screen (Success State) */}
        {uiState === 'success' && analysisResult ? (
          <ResultsView result={analysisResult} onReset={handleReset} />
        ) : (
          /* Intake & Analysis Form (Idle, Selected, Loading, Error States) */
          <div className="space-y-8">
            {/* Title & Introduction */}
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <span>Final-Year Student Career Toolkit</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                AI Resume Analyzer
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Benchmark your developer resume against real junior hiring expectations. Get an instant readiness score, discover missing technical skills, and receive 3 plain-language improvements.
              </p>
            </div>

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
              className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6"
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
                  disabled={uiState === 'loading'}
                  className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-400 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed select-none"
                >
                  {uiState === 'loading' ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
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
                      <span>Analyzing Resume & Benchmarking Skills...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

              {/* Developer Testing Controls (Helpful for quick verification) */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                <span>UI State: <strong className="text-slate-600 font-mono">{uiState}</strong></span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer hover:text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={simulateErrorNext}
                    onChange={(e) => setSimulateErrorNext(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Simulate error on next submission</span>
                </label>
              </div>
            </form>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4">
          <p>AI Resume Analyzer • Frontend: Port 5180 | Backend: Port 4000</p>
          <p className="mt-1 text-slate-400">
            Groq API integration & MongoDB persistence prepared for next phase.
          </p>
        </div>
      </footer>
    </div>
  );
}
