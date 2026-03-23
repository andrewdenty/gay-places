export default function CityLoading() {
  return (
    <div className="animate-pulse pt-8 pb-6 sm:pt-10 sm:pb-8">
      {/* Country label */}
      <div className="h-3 w-20 rounded bg-muted mb-2" />
      {/* City name */}
      <div className="h-9 w-48 rounded bg-muted mb-3" />
      {/* Description */}
      <div className="h-4 w-full max-w-[400px] rounded bg-muted mb-10 sm:mb-14" />

      {/* City image placeholder */}
      <div className="aspect-square w-full rounded bg-muted mb-10" />

      {/* Filter pills */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-muted" />
        ))}
      </div>

      {/* Venue cards */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-4 border-b border-muted">
            <div className="flex-1">
              <div className="h-4 w-40 rounded bg-muted mb-2" />
              <div className="h-3 w-24 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
