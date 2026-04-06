import { Skeleton } from "@/components/ui/skeleton"

interface TableSkeletonProps {
  rows?: number
  columns?: number
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 p-4 border-b border-zinc-800">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1 bg-zinc-800" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1 bg-zinc-800" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="p-6 border border-zinc-800 rounded-lg space-y-4 bg-zinc-900/30">
      <Skeleton className="h-6 w-3/4 bg-zinc-800" />
      <Skeleton className="h-4 w-full bg-zinc-800" />
      <Skeleton className="h-4 w-2/3 bg-zinc-800" />
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="p-6 border border-zinc-800 rounded-lg bg-zinc-900/30">
      <Skeleton className="h-4 w-20 mb-2 bg-zinc-800" />
      <Skeleton className="h-8 w-16 bg-zinc-800" />
    </div>
  )
}
