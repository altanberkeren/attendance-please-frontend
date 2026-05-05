"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Layers,
  Settings,
  GraduationCap,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

const NAV_GROUPS = [
  {
    label: "Main",
    items: [
      { title: "Overview",  href: "/overview",  icon: LayoutDashboard },
    ],
  },
  {
    label: "Academic",
    items: [
      { title: "Courses",          href: "/courses",          icon: BookOpen },
      { title: "Terms",            href: "/terms",            icon: CalendarDays },
      { title: "Course Offerings", href: "/course-offerings", icon: Layers },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      {/* ── Brand header ── */}
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
            <GraduationCap className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-sm text-sidebar-foreground">AttendanceApp</span>
            <span className="text-[10px] text-sidebar-foreground/50 font-medium tracking-wide uppercase">
              Spring 2025
            </span>
          </div>
        </div>
      </SidebarHeader>

      <Separator className="bg-sidebar-border" />

      {/* ── Navigation groups ── */}
      <SidebarContent className="px-2 py-3">
        {NAV_GROUPS.map((group) => (
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

      {/* ── User footer ── */}
      <Separator className="bg-sidebar-border" />
      <SidebarFooter className="p-3">
        <div className="flex items-center gap-2.5 px-1">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
              DK
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-sm font-medium text-sidebar-foreground truncate">Dogukan K.</span>
            <span className="text-[10px] text-sidebar-foreground/50 truncate">Administrator</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
