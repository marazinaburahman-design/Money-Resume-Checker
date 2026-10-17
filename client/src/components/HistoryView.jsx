export default function HistoryView({
  analyses = [],
  loading = false,
  onSelectAnalysis,
  onNewAnalysis,
  onRefresh,
}) {
  const getScoreBadge = (score) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60';
    if (score >= 65) return 'text-amber-400 bg-amber-950/40 border-amber-800/60';
    return 'text-rose-400 bg-rose-950/40 border-rose-800/60';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">
            My Evaluation History
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            View and compare previous resume evaluations stored in MongoDB.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="px-3 py-2 text-xs font-semibold text-zinc-300 bg-zinc-800/90 hover:bg-zinc-700 hover:text-white border border-zinc-700/80 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Refresh history"
          >
            <svg
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={onNewAnalysis}
            className="px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Analysis</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && analyses.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-5 bg-[#141722] border border-zinc-800 rounded-2xl animate-pulse flex items-center justify-between"
            >
              <div className="space-y-2 w-2/3">
                <div className="h-4 bg-zinc-800 rounded-md w-1/3" />
                <div className="h-3 bg-zinc-850 rounded-md w-2/3" />
              </div>
              <div className="h-10 w-16 bg-zinc-800 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && analyses.length === 0 && (
        <div className="bg-[#141722] border border-zinc-800 rounded-2xl p-8 sm:p-12 text-center space-y-4">
          <div className="w-14 h-14 bg-violet-950/40 border border-violet-800/40 text-violet-400 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-100">No evaluations found yet</h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
              Upload your first PDF resume to generate a readiness score and start building your evaluation history.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={onNewAnalysis}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-xl transition-all cursor-pointer shadow-xs inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Upload Resume Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Analyses List */}
      {analyses.length > 0 && (
        <div className="space-y-3.5">
          {analyses.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectAnalysis(item)}
              className="bg-[#141722] border border-zinc-800 hover:border-zinc-700 hover:bg-[#181C28] rounded-2xl p-5 shadow-2xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-950/60 text-violet-300 border border-violet-850">
                    {item.jobRole || item.role}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {item.originalFilename && (
                    <span className="text-xs text-zinc-500 truncate max-w-[200px]">
                      • {item.originalFilename}
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-300 line-clamp-1 leading-relaxed">
                  {item.summary || 'Resume analysis completed with skill detection and actionable suggestions.'}
                </p>

                <div className="flex items-center gap-3 text-xs text-zinc-500 pt-0.5">
                  <span className="text-emerald-400 font-medium">
                    ✓ {item.skillsFound?.length || 0} skills detected
                  </span>
                  <span>•</span>
                  <span className="text-rose-400 font-medium">
                    ! {item.skillsMissing?.length || 0} missing
                  </span>
                </div>
              </div>

              {/* Score & View Button */}
              <div className="flex items-center gap-4 justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-800/80 flex-shrink-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-zinc-100 tracking-tight">
                    {item.score}
                  </span>
                  <span className="text-xs text-zinc-500 font-semibold">/100</span>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getScoreBadge(
                    item.score
                  )}`}
                >
                  {item.score >= 80 ? 'Competitive' : item.score >= 65 ? 'Moderate' : 'Needs Work'}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAnalysis(item);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-violet-600 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
