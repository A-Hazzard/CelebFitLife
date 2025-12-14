import { Skeleton } from "../skeleton";

export function DashboardHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-4 mb-8 bg-gray-900/40 p-4 md:p-6 rounded-3xl border border-white/5 backdrop-blur-sm w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
        <div className="w-full md:w-auto">
          <Skeleton className="h-8 md:h-9 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-full md:w-24" />
      </div>
      <div className="md:hidden w-full">
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
      <div className="hidden md:flex gap-3">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  );
}

export function MetricsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-gray-900/40 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
          <div className="flex justify-between items-start mb-4">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-8 w-32" />
        </div>
      ))}
    </div>
  );
}

export function RevenueChartSkeleton() {
  return (
    <div className="bg-gray-900/40 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="h-[300px]">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    </div>
  );
}

export function VoteChartSkeleton() {
  return (
    <div className="bg-gray-900/40 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <div className="hidden md:block">
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
      <div className="block md:hidden">
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    </div>
  );
}

export function DeviceChartSkeleton() {
  return (
    <div className="bg-gray-900/40 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
      <Skeleton className="h-6 w-32 mb-6" />
      <div className="h-[300px] flex items-center justify-center">
        <Skeleton className="h-64 w-64 rounded-full" />
      </div>
    </div>
  );
}

export function RecentActivityTableSkeleton() {
  return (
    <div className="bg-gray-900/40 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
      <Skeleton className="h-6 w-40 mb-6" />
      {/* Desktop Table Skeleton */}
      <div className="hidden md:block">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 pb-4 border-b border-gray-800/50">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
      {/* Mobile Cards Skeleton */}
      <div className="block md:hidden space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-gray-800/30 p-4 rounded-xl border border-white/5">
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-8 w-full">
        <DashboardHeaderSkeleton />
        <MetricsCardsSkeleton />
        <RevenueChartSkeleton />
        <div className="grid md:grid-cols-2 gap-8">
          <VoteChartSkeleton />
          <DeviceChartSkeleton />
        </div>
        <RecentActivityTableSkeleton />
      </div>
    </div>
  );
}
