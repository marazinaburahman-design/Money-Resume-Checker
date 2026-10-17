export default function Header({
  backendConnected,
  user,
  activeTab = "analyze",
  historyCount = 0,
  onTabChange,
  onOpenAuth,
  onLogout,
}) {
  return (
    <header className="border-b border-zinc-800/80 bg-[#0C0E14]/90 backdrop-blur-md sticky top-0 z-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div
          onClick={() => onTabChange && onTabChange("analyze")}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-violet-900/30 flex-shrink-0">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight leading-tight">
              AI Resume Analyzer
            </h1>
            <p className="text-xs text-zinc-500 hidden sm:block">
              Entry-Level Developer Readiness Diagnostics
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs (when logged in) */}
        {user && (
          <nav className="hidden md:flex items-center bg-[#151924] border border-zinc-800 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => onTabChange("analyze")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "analyze"
                  ? "bg-zinc-800 text-zinc-100 shadow-2xs font-bold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Analyze Resume
            </button>
            <button
              type="button"
              onClick={() => onTabChange("history")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "history"
                  ? "bg-zinc-800 text-zinc-100 shadow-2xs font-bold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span>History</span>
              {historyCount > 0 && (
                <span className="px-1.5 py-0.2 bg-violet-950 text-violet-300 border border-violet-800 rounded-full text-[10px] font-bold">
                  {historyCount}
                </span>
              )}
            </button>
          </nav>
        )}

        {/* Right Status & Auth Controls */}
        <div className="flex items-center gap-2.5">
          {/* API Health Indicator */}
          {backendConnected === true && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 hidden sm:inline-flex"
              title="Backend Express & MongoDB Connected"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              API Connected
            </span>
          )}
          {backendConnected === false && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-950/40 text-rose-400 border border-rose-900/60 hidden sm:inline-flex"
              title="Backend Server Unreachable"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              API Offline
            </span>
          )}

          {user ? (
            /* Logged In User Pill & Logout */
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-zinc-200 truncate max-w-[120px]">
                  {user.name}
                </span>
                <span className="text-[10px] text-zinc-500 truncate max-w-[120px]">
                  {user.email}
                </span>
              </div>

              {/* Mobile Tab Toggle */}
              <button
                type="button"
                onClick={() =>
                  onTabChange(activeTab === "analyze" ? "history" : "analyze")
                }
                className="md:hidden px-2.5 py-1 text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                {activeTab === "analyze" ? "History" : "Analyze"}
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-900/60 rounded-xl transition-colors cursor-pointer"
                title="Log out of your account"
              >
                Log Out
              </button>
            </div>
          ) : (
            /* Logged Out Buttons */
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenAuth("login")}
                className="px-3.5 py-1.5 text-xs font-semibold text-zinc-300 bg-zinc-800/80 hover:bg-zinc-700 hover:text-white border border-zinc-700/80 rounded-xl transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth("register")}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-xl transition-colors shadow-xs cursor-pointer shadow-violet-900/20"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
