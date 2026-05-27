"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, GraduationCap, CalendarCheck, Settings,
} from "lucide-react"
import {
  Sidebar, SidebarContent, SidebarGroup,
  SidebarGroupLabel, SidebarHeader, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

const NAV = [
  {
    label: "Main",
    items: [
      { title: "Overview",   href: "/overview",   icon: LayoutDashboard },
    ],
  },
  {
    label: "My Work",
    items: [
      { title: "My Courses", href: "/my-courses", icon: GraduationCap },
      { title: "Sessions",   href: "/sessions",   icon: CalendarCheck },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Settings",   href: "/settings",   icon: Settings },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      {/* ── Brand ── */}
      <SidebarHeader className="p-4">
        <Link href="/overview" className="flex items-center gap-2.5">
          <Image src="/ius-logo-medium.png" alt="IUS Logo" width={32} height={32} className="shrink-0 rounded" />
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-sm text-sidebar-foreground">AttendanceApp</span>
            <span className="text-[10px] text-sidebar-foreground/50 font-medium tracking-wide uppercase">Spring 2025</span>
          </div>
        </Link>
      </SidebarHeader>

      <Separator className="bg-sidebar-border" />

      {/* ── Nav ── */}
      <SidebarContent className="px-2 py-3">
        {NAV.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] font-semibold tracking-wider uppercase text-sidebar-foreground/40 px-2 mb-1">
              {group.label}
            </SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href} className="flex items-center gap-2.5">
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}
