'use client';

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  UtensilsCrossed,
  Users,
  UserCircle,
} from "lucide-react"

const sidebarItems = [
  {
    title: "Social Feed",
    href: "/protected/social",
    icon: Users,
  },
  {
    title: "Food Log",
    href: "/protected/food-log",
    icon: UtensilsCrossed,
  },
  {
    title: "Profile",
    href: "/protected/profile",
    icon: UserCircle,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <nav className="space-y-2 py-4">
      <div className="px-3 py-2">
        <div className="space-y-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === item.href ? "bg-accent" : "transparent"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
} 