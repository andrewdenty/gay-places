export default function VenueLoading() {
  return (
    <div className="animate-pulse pt-8 sm:pt-10 pb-14">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <div className="h-3 w-28 rounded bg-muted" />
        <div className="h-3 w-12 rounded bg-muted" />
      </div>

      {/* Venue name */}
      <div className="h-8 w-56 rounded bg-muted mb-2" />
      {/* Subtitle */}
      <div className="h-4 w-36 rounded bg-muted mb-8" />

      {/* Photo gallery placeholder */}
      <div className="aspect-[4/3] w-full rounded bg-muted mb-8" />

      {/* Details rows */}
      <div className="space-y-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-4 border-b border-muted">
            <div className="h-4 w-4 rounded bg-muted" />
            <div className="h-4 w-48 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="mt-8 space-y-2">
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-3/4 rounded bg-muted" />
      </div>
    </div>
  );
}
