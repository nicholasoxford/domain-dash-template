export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-800 p-8">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-8">
          <div className="h-8 w-48 bg-purple-500/20 rounded-lg animate-pulse" />
          <div className="flex gap-4">
            <div className="h-10 w-32 bg-slate-800 rounded-lg animate-pulse" />
            <div className="h-10 w-24 bg-slate-800 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-800/50 p-6 rounded-lg">
              <div className="h-4 w-24 bg-purple-500/20 rounded animate-pulse mb-4" />
              <div className="h-8 w-16 bg-purple-500/20 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Recent Offers Table Skeleton */}
        <div className="bg-slate-800/50 rounded-lg p-6 mb-8">
          <div className="h-6 w-32 bg-purple-500/20 rounded animate-pulse mb-6" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex gap-4 items-center border-t border-slate-700 py-4"
              >
                <div className="h-4 w-24 bg-slate-700/50 rounded animate-pulse" />
                <div className="h-4 w-32 bg-slate-700/50 rounded animate-pulse" />
                <div className="h-4 w-48 bg-slate-700/50 rounded animate-pulse" />
                <div className="h-4 w-24 bg-slate-700/50 rounded animate-pulse" />
                <div className="h-4 w-64 bg-slate-700/50 rounded animate-pulse" />
                <div className="h-8 w-20 bg-slate-700/50 rounded animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Domain Stats Table Skeleton */}
        <div className="bg-slate-800/50 rounded-lg p-6">
          <div className="h-6 w-40 bg-purple-500/20 rounded animate-pulse mb-6" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex gap-4 items-center border-t border-slate-700 py-4"
              >
                <div className="h-4 w-32 bg-slate-700/50 rounded animate-pulse" />
                <div className="h-4 w-16 bg-slate-700/50 rounded animate-pulse" />
                <div className="h-4 w-24 bg-slate-700/50 rounded animate-pulse" />
                <div className="h-4 w-24 bg-slate-700/50 rounded animate-pulse" />
                <div className="h-4 w-24 bg-slate-700/50 rounded animate-pulse" />
                <div className="h-4 w-16 bg-slate-700/50 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Optional Loading Overlay */}
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-3 text-purple-400">
            <svg
              className="animate-spin h-8 w-8"
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
            <span className="text-lg font-medium">Loading dashboard...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
