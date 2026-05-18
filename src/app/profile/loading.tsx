export default function ProfileLoading() {
  return (
    <div className="space-y-4 p-4 pb-safe-nav">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 animate-pulse rounded-full bg-surface" />
        <div className="space-y-2">
          <div className="h-5 w-32 animate-pulse rounded-full bg-surface" />
          <div className="h-4 w-24 animate-pulse rounded-full bg-surface" />
        </div>
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-[26px] bg-surface shadow-soft"
          />
        ))}
      </div>
    </div>
  )
}
