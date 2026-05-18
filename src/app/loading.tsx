// Root loading UI — shown while the home page JS chunk hydrates
export default function RootLoading() {
  return (
    <div className="space-y-4 p-4 pb-safe-nav">
      {/* Vendor list skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-[26px] bg-surface shadow-soft"
          />
        ))}
      </div>
    </div>
  )
}
