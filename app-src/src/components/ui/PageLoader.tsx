// Page Loading Skeleton

export function PageLoader() {
  return (
    <div className="max-w-5xl mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 bg-[#0a101d] rounded w-1/3 mb-4" />
        <div className="h-4 bg-[#0a101d] rounded w-2/3 mb-2" />
        <div className="h-4 bg-[#0a101d] rounded w-1/2" />
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-6">
            <div className="h-4 bg-[#1d2839] rounded w-1/2 mb-4" />
            <div className="h-8 bg-[#1d2839] rounded w-3/4 mb-2" />
            <div className="h-3 bg-[#1d2839] rounded w-1/3" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-6">
            <div className="h-5 bg-[#1d2839] rounded w-1/4 mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-[#1d2839] rounded w-full" />
              <div className="h-4 bg-[#1d2839] rounded w-5/6" />
              <div className="h-4 bg-[#1d2839] rounded w-4/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Minimal loader for quick transitions
 */
export function MinimalPageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#1d2839] border-t-[#a6ed2a] rounded-full animate-spin" />
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    </div>
  )
}
