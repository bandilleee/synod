import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: number
  icon: LucideIcon
  className?: string
  valueClassName?: string
}

export function StatCard({ title, value, icon: Icon, className, valueClassName }: StatCardProps) {
  return (
    <div className={cn(
      "p-6 border border-white/5 rounded-lg bg-zinc-900/30",
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-zinc-500">{title}</span>
        <div className="p-2 bg-white/5 rounded-md">
          <Icon className="w-4 h-4 text-zinc-400" />
        </div>
      </div>
      <p className={cn("text-3xl font-semibold text-white", valueClassName)}>{value}</p>
    </div>
  )
}
