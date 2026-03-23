export default function CountryLoading() {
  return (
    <div className="animate-pulse pt-8 pb-6 sm:pt-10 sm:pb-8">
      {/* Region label */}
      <div className="h-3 w-16 rounded bg-muted mb-2" />
      {/* Country name */}
      <div className="h-9 w-44 rounded bg-muted mb-3" />
      {/* Description */}
      <div className="h-4 w-full max-w-[360px] rounded bg-muted mb-10 sm:mb-14" />

      {/* Map placeholder */}
      <div className="h-[300px] w-full rounded-lg bg-muted mb-10" />

      {/* City list */}
      <div className="space-y-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-5 border-b border-muted">
            <div>
              <div className="h-4 w-32 rounded bg-muted mb-2" />
              <div className="h-3 w-20 rounded bg-muted" />
            </div>
            <div className="h-4 w-4 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
