"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutGrid, 
  FileText, 
  Mail,
  Calendar,
  Users,
  Activity,
  Settings,
  LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/stores"
import { useRouter } from "next/navigation"

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutGrid },
  { href: "/dashboard/forms", label: "Forms", icon: FileText },
  { href: "/dashboard/newsletters", label: "Newsletter Studio", icon: Mail },
  { href: "/dashboard/events", label: "Events", icon: Calendar },
  { href: "/dashboard/members", label: "Members", icon: Users },
  { href: "/dashboard/activity", label: "Activity", icon: Activity },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const userMeta =
    typeof user?.organization === "string"
      ? user.organization
      : user?.organization &&
          typeof user.organization === "object" &&
          "name" in user.organization &&
          typeof user.organization.name === "string"
        ? user.organization.name
        : user?.role
          ? String(user.role)
          : ""

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-white/5 bg-black h-screen sticky top-0">
      <div className="p-6 mb-4">
        <Image
          src="/logo+name-bg.png"
          alt="Synod"
          width={200}
          height={95}
          className="h-auto w-66"
          priority
        />
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <div className="px-2 mb-2 text-xs font-medium uppercase tracking-wider text-zinc-600">
          Dashboard
        </div>
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-2 py-2 text-sm rounded-md transition-all group",
                active
                  ? "text-zinc-100 bg-white/5 shadow-sm ring-1 ring-white/5"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
              )}
            >
              <Icon className={cn("w-4 h-4", active ? "text-white" : "group-hover:text-white")} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 p-2">
          <div className="w-8 h-8 rounded-full bg-linear-to-tr from-zinc-700 to-zinc-500 flex items-center justify-center text-xs text-white font-bold border border-white/10">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-200 font-medium truncate">{user?.name}</p>
            <p className="text-[10px] text-zinc-500 truncate">{userMeta}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

