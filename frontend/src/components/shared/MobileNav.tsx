"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  Menu,
  X,
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutGrid },
  { href: "/dashboard/forms", label: "Forms", icon: FileText },
  { href: "/dashboard/newsletters", label: "Newsletter Studio", icon: Mail },
  { href: "/dashboard/events", label: "Events", icon: Calendar },
  { href: "/dashboard/members", label: "Members", icon: Users },
  { href: "/dashboard/activity", label: "Activity", icon: Activity },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    router.push("/login")
    setOpen(false)
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

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

  return (
    <div className="md:hidden">
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black sticky top-0 z-50">
        <Image
          src="/logo+name-bg.png"
          alt="Synod"
          width={120}
          height={57}
          className="h-8 w-auto"
          priority
        />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="p-2 text-zinc-400 hover:text-white transition-colors">
              <Menu className="w-6 h-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-black border-white/5 p-0">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <span className="text-sm font-medium text-white">Menu</span>
                <button 
                  onClick={() => setOpen(false)}
                  className="p-1 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 text-sm rounded-md transition-all",
                        active
                          ? "text-white bg-white/10"
                          : "text-zinc-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-3 p-2 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-500 flex items-center justify-center text-sm text-white font-bold border border-white/10">
                    {user?.name?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{userMeta}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sign out
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
