export default function ResultsView({ result, onReset }) {
  if (!result) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200 ring-emerald-500/20';
    if (score >= 65) return 'text-amber-600 bg-amber-50 border-amber-200 ring-amber-500/20';
    return 'text-rose-600 bg-rose-50 border-rose-200 ring-rose-500/20';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Strong Candidate Match';
    if (score >= 65) return 'Moderate Match • Areas to Polish';
    return 'Requires Significant Enhancement';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Notice clarifying this is MVP structured mock output */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
        <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="text-xs sm:text-sm">
          <p className="font-semibold text-amber-950">Structured Preview Analysis</p>
          <p className="text-amber-800 mt-0.5 leading-relaxed">
            This is a preview template for the <strong>{result.role}</strong> role. The Groq AI engine integration and MongoDB persistence will be wired up in the next phase.
          </p>
        </div>
      </div>

      {/* Main Results Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
        {/* Score & Role Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
              <span>Target Role:</span>
              <span className="font-bold">{result.role}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Resume Readiness Evaluation
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-lg">
              {result.summary}
            </p>
          </div>

          {/* Score Badge */}
          <div className="flex items-center gap-4 sm:flex-col sm:items-end">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                {result.score}
              </span>
              <span className="text-slate-400 font-semibold text-lg">/100</span>
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

        {/* Skills Section (Found & Missing) */}
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
                <h3 className="text-sm font-bold text-slate-900">Skills Detected</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {result.skillsFound.length} Found
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Key competencies identified that align with entry-level benchmarks:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {result.skillsFound.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white text-slate-800 border border-slate-200 shadow-2xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {skill}
                </span>
              ))}
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
                <h3 className="text-sm font-bold text-slate-900">Missing Competencies</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {result.skillsMissing.length} Missing
              </span>
            </div>
            <p className="text-xs text-slate-500">
              High-value developer skills commonly expected on candidate shortlists:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {result.skillsMissing.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white text-rose-700 border border-rose-200 shadow-2xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Exactly 3 Improvements */}
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
            <span className="text-xs text-slate-400 font-medium">Plain-language recommendations</span>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {result.improvements.map((item, idx) => (
              <div
                key={item.id || idx}
                className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            Ready to test another draft or switch your target role?
          </p>
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
