"use client";

import { useAuth } from "@/hooks/use-auth";
import { getPrimaryRole } from "@/lib/auth/roles";
import { StaffOverview } from "./_components/staff-overview";
import AdminDashboard from "./admin-dashboard";
import { StudentDashboard } from "./student-dashboard";

export default function OverviewPage() {
  const { user } = useAuth();
  const role = getPrimaryRole(user);

  if (role === "Admin") return <AdminDashboard />;
  if (role === "Staff") return <StaffOverview />;
  if (role === "Student") return <StudentDashboard />;

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
      <p className="text-sm text-muted-foreground">
        Your account does not have an assigned application role yet.
      </p>
    </div>
  );
}
