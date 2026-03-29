export default function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-dark p-6 max-w-[1440px] mx-auto space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-dark-card rounded-2xl h-16 border border-dark-border" />

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-dark-card rounded-2xl h-28 border border-dark-border" />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-dark-card rounded-2xl h-80 border border-dark-border" />
        <div className="bg-dark-card rounded-2xl h-80 border border-dark-border" />
      </div>

      {/* Table */}
      <div className="bg-dark-card rounded-2xl h-64 border border-dark-border" />
    </div>
  )
}
