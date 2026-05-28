"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard, GraduationCap, Settings,
  LogOut, User, ChevronUp,
} from "lucide-react"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupLabel, SidebarHeader, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"
import { useProfilePhoto } from "@/hooks/use-profile-photo"

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
  const router   = useRouter()
  const { user, signOut } = useAuth()
  const { photoUrl } = useProfilePhoto()

  async function handleSignOut() {
    await signOut()
  }

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

      {/* ── User footer ── */}
      <Separator className="bg-sidebar-border" />
      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8">
                    {photoUrl && <AvatarImage src={photoUrl} alt={user?.displayName ?? "User"} />}
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
                      {user?.initials ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.displayName ?? "User"}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email ?? ""}</span>
                  </div>
                  <ChevronUp className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold">{user?.displayName ?? "User"}</span>
                    <span className="text-xs text-muted-foreground break-all">{user?.email ?? ""}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
