export default function OrdersLoading() {
  return (
    <div className="space-y-4 p-4 pb-safe-nav">
      <div className="h-8 w-24 animate-pulse rounded-full bg-surface" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-[26px] bg-surface shadow-soft"
          />
        ))}
      </div>
    </div>
  )
}
