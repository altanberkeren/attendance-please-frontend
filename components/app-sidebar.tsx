"use client";

import {
  BookOpen,
  ChevronUp,
  ClipboardCheck,
  GraduationCap,
  Layers,
  LayoutDashboard,
  LogOut,
  QrCode,
  Settings,
  User,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
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
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useProfilePhoto } from "@/hooks/use-profile-photo";
import { useGetApiCourseOfferings } from "@/lib/api/course-offerings/course-offerings";
import { getPrimaryRole } from "@/lib/auth/roles";

type NavItem = {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [{ title: "Overview", href: "/overview", icon: LayoutDashboard }],
  },
  {
    label: "Administration",
    items: [
      { title: "Courses", href: "/courses", icon: BookOpen },
      { title: "Course Offerings", href: "/course-offerings", icon: Layers },
      { title: "Attendance", href: "/attendance", icon: QrCode },
      { title: "Users", href: "/users", icon: Users },
    ],
  },
  {
    label: "Account",
    items: [{ title: "Settings", href: "/settings", icon: Settings }],
  },
];

const STAFF_NAV_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [{ title: "Overview", href: "/overview", icon: LayoutDashboard }],
  },
  {
    label: "Teaching",
    items: [
      { title: "My Courses", href: "/staff-courses", icon: GraduationCap },
      { title: "Attendance", href: "/attendance", icon: QrCode },
    ],
  },
  {
    label: "Account",
    items: [{ title: "Settings", href: "/settings", icon: Settings }],
  },
];

const STUDENT_NAV_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [{ title: "Overview", href: "/overview", icon: LayoutDashboard }],
  },
  {
    label: "Academic",
    items: [
      { title: "My Courses", href: "/my-courses", icon: GraduationCap },
      { title: "My Attendance", href: "/my-attendance", icon: ClipboardCheck },
    ],
  },
  {
    label: "Account",
    items: [{ title: "Settings", href: "/settings", icon: Settings }],
  },
];

const FALLBACK_NAV_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [{ title: "Overview", href: "/overview", icon: LayoutDashboard }],
  },
  {
    label: "Account",
    items: [{ title: "Settings", href: "/settings", icon: Settings }],
  },
];

function getNavGroups(user: Parameters<typeof getPrimaryRole>[0]): NavGroup[] {
  const role = getPrimaryRole(user);
  if (role === "Admin") return ADMIN_NAV_GROUPS;
  if (role === "Staff") return STAFF_NAV_GROUPS;
  if (role === "Student") return STUDENT_NAV_GROUPS;
  return FALLBACK_NAV_GROUPS;
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { photoUrl } = useProfilePhoto();
  const userId = user?.id ?? null;
  const role = getPrimaryRole(user);
  const { data: assignedOfferings = [] } = useGetApiCourseOfferings(
    userId ? { staffUserId: userId } : undefined,
    { query: { enabled: !!userId && role === "Student", retry: false } },
  );
  const navGroups =
    role === "Student" && assignedOfferings.length > 0
      ? [
          ...STUDENT_NAV_GROUPS.slice(0, 2),
          {
            label: "Teaching",
            items: [
              { title: "Assisted Courses", href: "/staff-courses", icon: GraduationCap },
              { title: "Attendance", href: "/attendance", icon: QrCode },
            ],
          },
          ...STUDENT_NAV_GROUPS.slice(2),
        ]
      : getNavGroups(user);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Sidebar>
      {/* ── Brand header ── */}
      <SidebarHeader className="p-4">
        <Link href="/overview" className="flex items-center gap-2.5">
          <Image
            src="/ius-logo-medium.png"
            alt="IUS Logo"
            width={32}
            height={32}
            className="shrink-0 rounded"
          />
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-sm text-sidebar-foreground">
              AttendanceApp
            </span>
            <span className="text-[10px] text-sidebar-foreground/50 font-medium tracking-wide uppercase">
              Spring 2025
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <Separator className="bg-sidebar-border" />

      {/* ── Navigation groups ── */}
      <SidebarContent className="px-2 py-3">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] font-semibold tracking-wider uppercase text-sidebar-foreground/40 px-2 mb-1">
              {group.label}
            </SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link
                        href={item.href}
                        className="flex items-center gap-2.5"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
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
                    {photoUrl && (
                      <AvatarImage
                        src={photoUrl}
                        alt={user?.displayName ?? "User"}
                      />
                    )}
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
                      {user?.initials ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.displayName ?? "User"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email ?? ""}
                    </span>
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
                    <span className="text-sm font-semibold">
                      {user?.displayName ?? "User"}
                    </span>
                    <span className="text-xs text-muted-foreground break-all">
                      {user?.email ?? ""}
                    </span>
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
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
