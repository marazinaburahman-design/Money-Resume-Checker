export default function ResultsView({ result, onReset }) {
  if (!result) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200 ring-emerald-500/20';
    if (score >= 65) return 'text-amber-700 bg-amber-50 border-amber-200 ring-amber-500/20';
    return 'text-rose-700 bg-rose-50 border-rose-200 ring-rose-500/20';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Competitive Candidate Match';
    if (score >= 65) return 'Moderate Match • Key Gaps Identified';
    return 'Needs Significant Improvement';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Verified AI Analysis Banner */}
      <div className="flex items-start gap-3.5 p-4 sm:p-5 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl text-indigo-950 shadow-xs">
        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-slate-900">
              AI Evaluation Completed
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
              Powered by Groq AI ({result.meta?.model || 'LLM'})
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Resume content was objectively analyzed against real junior hiring benchmarks for the{' '}
            <strong>{result.role}</strong> role.
          </p>
          {result.meta?.wasTruncated && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-1.5 mt-2">
              Note: Resume exceeded maximum evaluation token limit and was safely truncated to 12,000 characters.
            </p>
          )}
        </div>
      </div>

      {/* Main Results Dashboard Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
        {/* Score & Summary Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <span>Target Role:</span>
              <strong className="font-bold">{result.role}</strong>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Candidate Readiness Score
            </h2>
            <p className="text-sm text-slate-600 max-w-xl leading-relaxed">
              {result.summary}
            </p>
          </div>

          {/* Score Badge & Synchronized Progress Bar */}
          <div className="flex flex-col sm:items-end flex-shrink-0 min-w-[170px]">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                {result.score}
              </span>
              <span className="text-slate-400 font-semibold text-lg">/100</span>
            </div>

            {/* Visual Score Meter / Progress Bar (strictly synchronized with result.score) */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden my-2 border border-slate-200/60">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  result.score >= 80
                    ? 'bg-emerald-500'
                    : result.score >= 65
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, result.score))}%` }}
              />
            </div>

            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ring-1 ${getScoreColor(
                result.score
              )}`}
            >
              {getScoreLabel(result.score)}
            </span>
          </div>
        </div>

        {/* Skills Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Skills Found */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Skills Detected in Resume</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {result.skillsFound?.length || 0} Found
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Evidence of these skills was explicitly identified in your document:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {result.skillsFound && result.skillsFound.length > 0 ? (
                result.skillsFound.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white text-slate-800 border border-slate-200 shadow-2xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No recognized role-specific skills found.</p>
              )}
            </div>
          </div>

          {/* Skills Missing */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Missing Key Skills</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {result.skillsMissing?.length || 0} Missing
              </span>
            </div>
            <p className="text-xs text-slate-500">
              High-frequency requirements for {result.role} roles not detected in your resume:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {result.skillsMissing && result.skillsMissing.length > 0 ? (
                result.skillsMissing.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white text-rose-700 border border-rose-200 shadow-2xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No major skill gaps identified.</p>
              )}
            </div>
          </div>
        </div>

        {/* Top 3 Actionable Suggestions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Top 3 Actionable Improvements
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Prioritized for junior hiring</span>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {result.suggestions?.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {typeof item === 'string' ? item : item.description || item.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button & Metadata */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            <span>Model: {result.meta?.model || 'Groq AI'} • Evaluated at {new Date(result.meta?.evaluatedAt || Date.now()).toLocaleTimeString()}</span>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Analyze Another Resume
          </button>
        </div>
      </div>
    </div>
  );
}
