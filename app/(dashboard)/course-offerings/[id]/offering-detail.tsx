"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Scan,
  Trash2,
  Upload,
  UserCog,
  Users,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { BulkEnrollModal } from "@/components/enrollment/bulk-enroll-modal";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getGetApiAttendancesMatrixQueryKey,
  useGetApiAttendancesMatrix,
} from "@/lib/api/attendances/attendances";
import {
  getGetApiCourseOfferingStaffsQueryKey,
  useDeleteApiCourseOfferingStaffsId,
  useGetApiCourseOfferingStaffs,
  usePostApiCourseOfferingStaffs,
  usePutApiCourseOfferingStaffsId,
} from "@/lib/api/course-offering-staffs/course-offering-staffs";
import { useGetApiCourseOfferingsId } from "@/lib/api/course-offerings/course-offerings";
import {
  getGetApiEnrollmentsQueryKey,
  useDeleteApiEnrollmentsId,
  useGetApiEnrollments,
  usePostApiEnrollments,
  usePutApiEnrollmentsIdSection,
} from "@/lib/api/enrollments/enrollments";
import type {
  CourseOfferingStaffDto,
  CreateModuleCommand,
  EnrollmentDto,
  ModuleDto,
  SectionDto,
  SessionDto,
  UpdateModuleCommand,
} from "@/lib/api/model";
import {
  AttendanceStatus,
  CourseOfferingStaffAccessLevel,
  CourseOfferingStaffScope,
} from "@/lib/api/model";
import {
  getGetApiModulesQueryKey,
  useDeleteApiModulesId,
  useGetApiModules,
  usePostApiModules,
  usePutApiModulesId,
} from "@/lib/api/modules/modules";
import {
  getGetApiSectionsQueryKey,
  useDeleteApiSectionsId,
  useGetApiSections,
  usePostApiSections,
  usePutApiSectionsId,
} from "@/lib/api/sections/sections";
import {
  getGetApiSessionsQueryKey,
  useGetApiSessions,
} from "@/lib/api/sessions/sessions";
import { useGetApiUsers } from "@/lib/api/users/users";
import { getPrimaryRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import { EditEnrollmentDialog, ManualEnrollmentDialog } from "./enrollment-dialogs";
import { EmptyTabState } from "./detail-shared";
import { ModuleManager, SectionManager } from "./managers";
import { StaffAssignmentDialog, StaffEditDialog } from "./staff-dialogs";
import {
  STATUS_STYLE,
  calcDuration,
  fmtDate,
  fmtTime,
  methodIcon,
  methodLabel,
  shortStatus,
} from "./offering-detail-utils";

function StaffOfferingDetail({ offeringId }: { offeringId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const primaryRole = getPrimaryRole(user);
  const isAdmin = primaryRole === "Admin";
  const isGlobalStaff = primaryRole === "Staff";
  const currentUserId = user?.id == null ? null : String(user.id);
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const defaultTab = ["modules", "matrix", "sections", "staff", "students", "sessions"].includes(
    requestedTab ?? "",
  )
    ? (requestedTab ?? "matrix")
    : "matrix";
  const requestedSectionId = searchParams.get("sectionId");
  const [bulkEnrollOpen, setBulkEnrollOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<CourseOfferingStaffDto | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string>(
    requestedSectionId ?? "all",
  );
  const [editingEnrollment, setEditingEnrollment] =
    useState<EnrollmentDto | null>(null);

  const { data: apiOffering, isLoading: loadingOfferings } =
    useGetApiCourseOfferingsId(offeringId);
  const { data: apiMatrix, isLoading: loadingMatrix } =
    useGetApiAttendancesMatrix({ courseOfferingId: offeringId });
  const { data: apiStaff = [], isLoading: loadingStaff } =
    useGetApiCourseOfferingStaffs({ courseOfferingId: offeringId });
  const { data: apiSections = [], isLoading: loadingSections } =
    useGetApiSections({ courseOfferingId: offeringId });
  const { data: apiModules = [], isLoading: loadingModules } =
    useGetApiModules({ courseOfferingId: offeringId });
  const { data: apiEnrollments = [], isLoading: loadingEnrollments } =
    useGetApiEnrollments({ courseOfferingId: offeringId });
  const { data: apiSessions = [], isLoading: loadingSessions } =
    useGetApiSessions({ courseOfferingId: offeringId });
  const { mutateAsync: enrollStudent } = usePostApiEnrollments();
  const { mutateAsync: deleteEnrollment } = useDeleteApiEnrollmentsId();
  const assignStaff = usePostApiCourseOfferingStaffs();
  const updateStaff = usePutApiCourseOfferingStaffsId();
  const removeStaff = useDeleteApiCourseOfferingStaffsId();
  const { mutateAsync: updateEnrollmentSection } =
    usePutApiEnrollmentsIdSection();
  const createSection = usePostApiSections();
  const updateSection = usePutApiSectionsId();
  const deleteSection = useDeleteApiSectionsId();
  const createModule = usePostApiModules();
  const updateModule = usePutApiModulesId();
  const deleteModule = useDeleteApiModulesId();

  const header = apiOffering;
  const displayName = header?.courseTitle ?? "Course Offering";
  const displayCode = header?.courseCode ?? `Offering #${offeringId}`;
  const displayTerm = header?.termCode ?? "Current term";

  const sections = apiSections;
  const modules = apiModules;
  const matrix = apiMatrix;
  const enrollments = apiEnrollments;
  const staff = apiStaff;
  const sessions = apiSessions;
  const assignedStaffKeys = new Set(
    staff.map(
      (person) =>
        `${person.userId}:${person.scope}:${person.scope === CourseOfferingStaffScope.Section ? String(person.sectionId) : ""}`,
    ),
  );
  const ownStaffAssignments = currentUserId
    ? staff.filter((person) => String(person.userId) === currentUserId)
    : [];
  const isOfferingOwner = ownStaffAssignments.some(
    (person) =>
      person.accessLevel === CourseOfferingStaffAccessLevel.Owner &&
      person.scope === CourseOfferingStaffScope.Offering,
  );
  const ownedSectionIds = new Set(
    ownStaffAssignments
      .filter(
        (person) =>
          person.accessLevel === CourseOfferingStaffAccessLevel.Owner &&
          person.scope === CourseOfferingStaffScope.Section &&
          person.sectionId != null,
      )
      .map((person) => String(person.sectionId)),
  );
  const hasInstructorAccess = isAdmin || isGlobalStaff || ownStaffAssignments.some(
    (person) =>
      person.accessLevel === CourseOfferingStaffAccessLevel.Owner ||
      person.accessLevel === CourseOfferingStaffAccessLevel.Instructor,
  );
  const canManageStaff = isAdmin || isOfferingOwner || ownedSectionIds.size > 0;
  const manageableStaffSections = isAdmin || isOfferingOwner
    ? sections
    : sections.filter((section) => ownedSectionIds.has(String(section.id)));
  const canManageStaffAssignment = (person: CourseOfferingStaffDto) => {
    if (isAdmin) return true;
    if (person.accessLevel === CourseOfferingStaffAccessLevel.Owner) return false;
    if (person.scope === CourseOfferingStaffScope.Offering) return isOfferingOwner;
    return isOfferingOwner || (person.sectionId != null && ownedSectionIds.has(String(person.sectionId)));
  };
  const { data: apiUsers = [], isLoading: loadingUsers } = useGetApiUsers({ query: { enabled: canManageStaff } });
  const selectedSection =
    activeSectionId === "all"
      ? null
      : (sections.find((section) => String(section.id) === activeSectionId) ??
        null);
  const showSectionColumn = !selectedSection;
  const sectionNameById = new Map(
    sections.map((section) => [String(section.id), section.name]),
  );
  const filteredEnrollments = selectedSection
    ? enrollments.filter(
        (student) => String(student.sectionId) === String(selectedSection.id),
      )
    : enrollments;
  const matrixModules = modules
    .map((module) => ({
      moduleId: module.id,
      title: module.title,
      orderIndex: module.orderIndex,
    }))
    .sort((a, b) => Number(a.orderIndex) - Number(b.orderIndex));
  const filteredMatrix = matrix
    ? {
        ...matrix,
        modules: matrixModules,
        students: (selectedSection
          ? matrix.students.filter(
              (student) =>
                String(student.currentSectionId) === String(selectedSection.id),
            )
          : matrix.students
        ).map((student) => {
          const statusByModuleId = new Map(
            matrix.modules.map((module, index) => [
              String(module.moduleId),
              student.attendanceStatuses[index],
            ]),
          );
          return {
            ...student,
            attendanceStatuses: matrixModules.map(
              (module) => statusByModuleId.get(String(module.moduleId)) ?? "",
            ),
          };
        }),
      }
    : undefined;
  const filteredSessions = selectedSection
    ? sessions.filter(
        (session) => String(session.sectionId) === String(selectedSection.id),
      )
    : sessions;
  const enrollmentByMatrixStudentId = new Map(
    enrollments.map((student) => [
      student.userId == null ? String(-Number(student.id)) : String(student.userId),
      student,
    ]),
  );

  const enrollmentParams = { courseOfferingId: offeringId };
  const sectionsParams = { courseOfferingId: offeringId };
  const modulesParams = { courseOfferingId: offeringId };
  const sessionsParams = { courseOfferingId: offeringId };
  const staffParams = { courseOfferingId: offeringId };
  const matrixParams = { courseOfferingId: offeringId };

  function invalidateDetailQueries() {
    queryClient.invalidateQueries({
      queryKey: getGetApiEnrollmentsQueryKey(enrollmentParams),
    });
    queryClient.invalidateQueries({
      queryKey: getGetApiSectionsQueryKey(sectionsParams),
    });
    queryClient.invalidateQueries({
      queryKey: getGetApiModulesQueryKey(modulesParams),
    });
    queryClient.invalidateQueries({
      queryKey: getGetApiSessionsQueryKey(sessionsParams),
    });
    queryClient.invalidateQueries({
      queryKey: getGetApiCourseOfferingStaffsQueryKey(staffParams),
    });
    queryClient.invalidateQueries({
      queryKey: getGetApiAttendancesMatrixQueryKey(matrixParams),
    });
  }

  const matrixLoading = loadingMatrix;
  const staffLoading = loadingStaff;
  const enrollmentLoading = loadingEnrollments || loadingSections;
  const sessionsLoading = loadingSessions;
  const sectionsLoading = loadingSections;
  const modulesLoading = loadingModules;
  const sectionMutationPending =
    createSection.isPending || updateSection.isPending || deleteSection.isPending;
  const moduleMutationPending =
    createModule.isPending || updateModule.isPending || deleteModule.isPending;
  const staffMutationPending = assignStaff.isPending || updateStaff.isPending || removeStaff.isPending;
  const pageLoading = loadingOfferings && !apiOffering;

  const totalPresent =
    filteredMatrix?.students.reduce(
      (count, student) =>
        count +
        student.attendanceStatuses.filter(
          (status) =>
            status === AttendanceStatus.Present ||
            status === AttendanceStatus.Late,
        ).length,
      0,
    ) ?? 0;
  const totalCells = filteredMatrix
    ? filteredMatrix.students.length * filteredMatrix.modules.length
    : 0;
  const attendanceRate = totalCells
    ? Math.round((totalPresent / totalCells) * 100)
    : 0;

  async function handleManualAdd(student: {
    userId: number | string | null;
    studentNumber: string;
    importedName: string | null;
    sectionId: number | string;
    sectionName: string;
  }) {
    await enrollStudent({
      data: {
        userId: student.userId,
        studentNumber: student.studentNumber,
        importedName: student.importedName,
        courseOfferingId: offeringId,
        sectionId: student.sectionId,
      },
    });
    invalidateDetailQueries();
  }

  async function handleRemoveEnrollment(enrollment: EnrollmentDto) {
    await deleteEnrollment({ id: enrollment.id });
    invalidateDetailQueries();
  }

  async function handleCreateSection(name: string) {
    await createSection.mutateAsync({
      data: { courseOfferingId: offeringId, name },
    });
    invalidateDetailQueries();
  }

  async function handleRenameSection(section: SectionDto, name: string) {
    await updateSection.mutateAsync({
      id: section.id,
      data: { id: section.id, name },
    });
    invalidateDetailQueries();
  }

  async function handleDeleteSection(section: SectionDto) {
    await deleteSection.mutateAsync({ id: section.id });
    if (activeSectionId === String(section.id)) setActiveSectionId("all");
    invalidateDetailQueries();
  }

  async function refreshAfterModuleChange() {
    invalidateDetailQueries();
    await queryClient.refetchQueries({
      queryKey: getGetApiAttendancesMatrixQueryKey(matrixParams),
    });
  }

  async function handleCreateModule(module: CreateModuleCommand) {
    await createModule.mutateAsync({ data: module });
    await refreshAfterModuleChange();
  }

  async function handleBulkCreateModules(modulesToCreate: CreateModuleCommand[]) {
    for (const module of modulesToCreate) {
      await createModule.mutateAsync({ data: module });
    }
    await refreshAfterModuleChange();
  }

  async function handleUpdateModule(id: ModuleDto["id"], module: UpdateModuleCommand) {
    await updateModule.mutateAsync({ id, data: module });
    await refreshAfterModuleChange();
  }

  async function handleReorderModules(modulesToUpdate: UpdateModuleCommand[]) {
    for (const module of modulesToUpdate) {
      await updateModule.mutateAsync({ id: module.id, data: module });
    }
    await refreshAfterModuleChange();
  }

  async function handleDeleteModule(module: ModuleDto) {
    await deleteModule.mutateAsync({ id: module.id });
    await refreshAfterModuleChange();
  }

  async function handleAssignStaff(assignment: {
    userId: number | string;
    scope: typeof CourseOfferingStaffScope[keyof typeof CourseOfferingStaffScope];
    accessLevel: typeof CourseOfferingStaffAccessLevel[keyof typeof CourseOfferingStaffAccessLevel];
    sectionId: number | string | null;
    roleTitle: string | null;
  }) {
    await assignStaff.mutateAsync({
      data: {
        courseOfferingId: offeringId,
        userId: assignment.userId,
        scope: assignment.scope,
        accessLevel: assignment.accessLevel,
        sectionId: assignment.sectionId,
        roleTitle: assignment.roleTitle,
      },
    });
    setStaffDialogOpen(false);
    invalidateDetailQueries();
  }

  async function handleUpdateStaff(assignment: {
    id: number | string;
    scope: typeof CourseOfferingStaffScope[keyof typeof CourseOfferingStaffScope];
    accessLevel: typeof CourseOfferingStaffAccessLevel[keyof typeof CourseOfferingStaffAccessLevel];
    sectionId: number | string | null;
    roleTitle: string | null;
  }) {
    await updateStaff.mutateAsync({
      id: assignment.id,
      data: {
        id: assignment.id,
        scope: assignment.scope,
        accessLevel: assignment.accessLevel,
        sectionId: assignment.sectionId,
        roleTitle: assignment.roleTitle,
      },
    });
    setEditingStaff(null);
    invalidateDetailQueries();
  }

  async function handleRemoveStaff(id: number | string) {
    await removeStaff.mutateAsync({ id });
    invalidateDetailQueries();
  }

  async function handleEditEnrollment(student: {
    userId: number | string;
    userName: string;
    sectionId: number | string;
    sectionName: string;
  }) {
    if (!editingEnrollment) return;

    await updateEnrollmentSection({
      id: editingEnrollment.id,
      data: { id: editingEnrollment.id, sectionId: student.sectionId },
    });
    invalidateDetailQueries();
    setEditingEnrollment(null);
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/my-courses">My Courses</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{displayCode}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono">
                  {displayCode}
                </Badge>
                <Badge variant="outline">{displayTerm}</Badge>
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight">
                {displayName}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Staff course workspace with attendance, enrollment and session
                controls.
              </p>
            </div>
            <Button
              onClick={() => router.push("/attendance")}
              className="gap-2 self-start"
            >
              <Scan className="h-4 w-4" />
              Start Session
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              {
                label: "Students",
                value: filteredEnrollments.length,
                icon: Users,
              },
              { label: "Modules", value: modules.length, icon: Layers },
              { label: "Staff", value: staff.length, icon: UserCog },
              {
                label: "Attendance",
                value: `${attendanceRate}%`,
                icon: CheckCircle2,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border bg-muted/30 p-3"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <item.icon className="h-3.5 w-3.5 text-primary" />
                  {item.label}
                </div>
                <p className="mt-1 text-xl font-bold tabular-nums">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {sections.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Section
          </span>
          <button
            type="button"
            onClick={() => setActiveSectionId("all")}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
              activeSectionId === "all"
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background hover:border-primary/40 hover:bg-primary/5",
            )}
          >
            All Sections
          </button>
          {sections.map((section) => (
            <button
              key={String(section.id)}
              type="button"
              onClick={() => setActiveSectionId(String(section.id))}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                activeSectionId === String(section.id)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background hover:border-primary/40 hover:bg-primary/5",
              )}
            >
              {section.name}
            </button>
          ))}
        </div>
      )}

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="matrix">Attendance Matrix</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="staff">Assigned Staff</TabsTrigger>
          <TabsTrigger value="students">Enrollment Students</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="modules">
          <ModuleManager
            courseOfferingId={offeringId}
            modules={modules}
            sessions={sessions}
            loading={modulesLoading}
            pending={moduleMutationPending}
            canManage={hasInstructorAccess}
            onCreate={handleCreateModule}
            onBulkCreate={handleBulkCreateModules}
            onUpdate={handleUpdateModule}
            onReorder={handleReorderModules}
            onDelete={handleDeleteModule}
          />
        </TabsContent>

        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attendance Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              {matrixLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : !filteredMatrix ||
                filteredMatrix.modules.length === 0 ||
                filteredMatrix.students.length === 0 ? (
                <EmptyTabState
                  icon={CheckCircle2}
                  title="No attendance data yet"
                  description="Attendance appears here after modules, students, and sessions are created."
                />
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Legend:</span>
                    {[
                      [AttendanceStatus.Present, "Present"],
                      [AttendanceStatus.Late, "Late"],
                      [AttendanceStatus.Absent, "Absent"],
                      [AttendanceStatus.Excused, "Excused"],
                    ].map(([status, label]) => (
                      <span key={status} className="inline-flex items-center gap-1">
                        <span
                          className={cn(
                            "inline-flex h-5 w-5 items-center justify-center rounded-none text-[10px] font-bold",
                            STATUS_STYLE[status],
                          )}
                        >
                          {shortStatus(status)}
                        </span>
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className="overflow-x-auto rounded-md border">
                    <Table className="w-auto">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-28 border-r">Student ID</TableHead>
                        <TableHead className="min-w-48 border-r">Student</TableHead>
                        {showSectionColumn && <TableHead className="border-r">Section</TableHead>}
                        {filteredMatrix.modules.map((module) => (
                          <TableHead
                            key={String(module.moduleId)}
                            className="h-36 w-7 min-w-7 border-x p-0 text-center align-bottom"
                            title={module.title}
                          >
                            <div className="mx-auto flex h-32 w-7 items-end justify-center overflow-hidden pb-2">
                              <span className="block max-h-30 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium [writing-mode:vertical-rl] rotate-180">
                                {module.title}
                              </span>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMatrix.students.map((student) => {
                        const enrollment = enrollmentByMatrixStudentId.get(String(student.studentId));
                        return (
                          <TableRow key={String(student.studentId)}>
                            <TableCell className="h-7 border-r px-2 py-0 font-mono text-xs text-muted-foreground">
                              <span>{enrollment?.studentNumber ?? student.studentId}</span>
                              {enrollment && !enrollment.isLinkedUser ? (
                                <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                  pending
                                </span>
                              ) : null}
                            </TableCell>
                            <TableCell className="h-7 border-r px-2 py-0 font-medium">
                              {student.studentName}
                            </TableCell>
                            {showSectionColumn && (
                              <TableCell className="h-7 border-r px-2 py-0">{student.currentSectionName}</TableCell>
                            )}
                            {filteredMatrix.modules.map((module, index) => {
                              const status = student.attendanceStatuses[index] ?? "";
                              return (
                                <TableCell
                                  key={`${student.studentId}-${module.moduleId}`}
                                  className="h-7 w-7 min-w-7 p-0 text-center"
                                  title={status || "No attendance recorded"}
                                >
                                  <span
                                    className={cn(
                                      "flex h-7 w-7 items-center justify-center rounded-none border-0 text-[11px] font-bold",
                                      STATUS_STYLE[status] ??
                                        "bg-muted text-muted-foreground",
                                    )}
                                  >
                                    {shortStatus(status)}
                                  </span>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sections">
          <SectionManager
            sections={sections}
            enrollments={enrollments}
            sessions={sessions}
            activeSectionId={activeSectionId}
            loading={sectionsLoading}
            pending={sectionMutationPending}
            canManage={hasInstructorAccess}
            onSelect={setActiveSectionId}
            onCreate={handleCreateSection}
            onRename={handleRenameSection}
            onDelete={handleDeleteSection}
          />
        </TabsContent>

        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">Assigned Staff</CardTitle>
                {canManageStaff ? (
                  <Button size="sm" onClick={() => setStaffDialogOpen(true)} disabled={loadingUsers || staffMutationPending}>
                    <Plus className="mr-2 h-4 w-4" />
                    Assign
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              {staffLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : staff.length === 0 ? (
                <EmptyTabState
                  icon={UserCog}
                  title="No staff assigned"
                  description="Assign course access so instructors and assistants can manage this offering."
                  action={canManageStaff ? (
                    <Button size="sm" onClick={() => setStaffDialogOpen(true)} disabled={loadingUsers || staffMutationPending}>
                      <Plus className="mr-2 h-4 w-4" />
                      Assign first staff
                    </Button>
                  ) : null}
                />
              ) : (
                <div className="space-y-4">
                  {[CourseOfferingStaffScope.Offering, CourseOfferingStaffScope.Section].map((scope) => {
                    const scopedStaff = staff.filter((person) => person.scope === scope);
                    if (scopedStaff.length === 0) return null;
                    return (
                      <div key={scope} className="space-y-2">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          {scope === CourseOfferingStaffScope.Offering ? "Offering access" : "Section access"}
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {scopedStaff.map((person) => {
                            const canManageThisAssignment = canManageStaffAssignment(person);
                            return (
                              <div key={String(person.id)} className="rounded-lg border p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="truncate font-medium">{person.userName}</p>
                                    <p className="truncate text-xs text-muted-foreground">{person.userEmail}</p>
                                  </div>
                                  {canManageThisAssignment ? (
                                    <div className="flex gap-1">
                                      <Button size="icon-xs" variant="ghost" disabled={staffMutationPending} onClick={() => setEditingStaff(person)} aria-label={`Edit ${person.userName}`}>
                                        <Pencil className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button size="icon-xs" variant="ghost" className="text-destructive hover:text-destructive" disabled={staffMutationPending} onClick={() => handleRemoveStaff(person.id)} aria-label={`Remove ${person.userName}`}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  ) : null}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  <Badge variant="secondary">{person.accessLevel}</Badge>
                                  <Badge variant="outline">{person.userRole}</Badge>
                                  {person.sectionName ? <Badge variant="outline">{person.sectionName}</Badge> : null}
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">
                                  {person.roleTitle ?? (person.scope === CourseOfferingStaffScope.Section ? "Section staff" : "Offering staff")}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">Enrollment Students</CardTitle>
                {hasInstructorAccess ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setManualOpen(true)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Student
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setBulkEnrollOpen(true)}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Import from Excel
                    </Button>
                  </div>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              {enrollmentLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredEnrollments.length === 0 ? (
                <EmptyTabState
                  icon={Users}
                  title="No enrolled students"
                  description="Add students manually or import an Excel list before taking attendance."
                  action={hasInstructorAccess ? (
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setManualOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add first student
                      </Button>
                      <Button size="sm" onClick={() => setBulkEnrollOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Import from Excel
                      </Button>
                    </div>
                  ) : null}
                />
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Student ID</TableHead>
                        {showSectionColumn && <TableHead>Section</TableHead>}
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEnrollments.map((student) => (
                        <TableRow key={String(student.id)}>
                          <TableCell className="font-medium">
                            {student.userName}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {student.studentNumber}
                            {!student.isLinkedUser ? (
                              <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                pending
                              </span>
                            ) : null}
                          </TableCell>
                          {showSectionColumn && (
                            <TableCell>{student.sectionName}</TableCell>
                          )}
                          <TableCell className="text-right">
                            {hasInstructorAccess ? (
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="icon-xs"
                                  variant="ghost"
                                  onClick={() => setEditingEnrollment(student)}
                                  aria-label={`Edit ${student.userName}`}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon-xs"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleRemoveEnrollment(student)}
                                  aria-label={`Remove ${student.userName}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sessionsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredSessions.length === 0 ? (
                <EmptyTabState
                  icon={CalendarCheck}
                  title="No sessions yet"
                  description="Start an attendance session after modules and sections are ready."
                  action={hasInstructorAccess ? (
                    <Button size="sm" onClick={() => router.push("/attendance")}>
                      <Scan className="mr-2 h-4 w-4" />
                      Start first session
                    </Button>
                  ) : null}
                />
              ) : (
                filteredSessions.map((session: SessionDto) => {
                  const isOpen = session.status === "Open";
                  const sessionSectionName =
                    session.sectionName ??
                    (session.sectionId
                      ? sectionNameById.get(String(session.sectionId))
                      : null);
                  return (
                    <button
                      key={String(session.id)}
                      type="button"
                      onClick={() =>
                        router.push(
                          `/sessions/detail?id=${encodeURIComponent(String(session.id))}`,
                        )
                      }
                      className="w-full rounded-lg border p-4 text-left transition-all hover:border-primary/40 hover:bg-muted/30 hover:shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          {methodIcon(session.selectedMethod)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">
                              {session.moduleTitle}
                            </p>
                            {sessionSectionName && (
                              <span className="text-sm text-muted-foreground">
                                {sessionSectionName}
                              </span>
                            )}
                            <Badge variant={isOpen ? "default" : "secondary"}>
                              {isOpen ? "Open" : session.status}
                            </Badge>
                            <Badge variant="outline" className="gap-1.5">
                              {methodIcon(session.selectedMethod)}
                              {methodLabel(session.selectedMethod)}
                            </Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarCheck className="h-3.5 w-3.5" />
                              {fmtDate(session.openedAt)} ·{" "}
                              {fmtTime(session.openedAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {calcDuration(session.openedAt, session.closedAt)}
                            </span>
                            <span>By {session.openedByUserName}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {canManageStaff ? (
        <>
          <StaffAssignmentDialog
            open={staffDialogOpen}
            onOpenChange={setStaffDialogOpen}
            users={apiUsers}
            sections={manageableStaffSections}
            assignedKeys={assignedStaffKeys}
            pending={staffMutationPending}
            allowOfferingScope={isAdmin || isOfferingOwner}
            canAssignOwner={isAdmin}
            onAssign={handleAssignStaff}
          />
          <StaffEditDialog
            key={String(editingStaff?.id ?? "no-editing-staff")}
            open={!!editingStaff}
            onOpenChange={(open) => {
              if (!open) setEditingStaff(null);
            }}
            assignment={editingStaff}
            sections={manageableStaffSections}
            assignedKeys={assignedStaffKeys}
            pending={staffMutationPending}
            allowOfferingScope={isAdmin || isOfferingOwner}
            canAssignOwner={isAdmin}
            onUpdate={handleUpdateStaff}
          />
        </>
      ) : null}
      <BulkEnrollModal
        open={bulkEnrollOpen}
        onOpenChange={setBulkEnrollOpen}
        courseOfferingId={offeringId}
        onSuccess={invalidateDetailQueries}
      />
      <ManualEnrollmentDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        sections={sections}
        users={apiUsers.filter((candidate) => candidate.roles.includes("Student") || candidate.role === "Student")}
        onAdd={handleManualAdd}
      />
      <EditEnrollmentDialog
        key={String(editingEnrollment?.id ?? "no-editing-enrollment")}
        open={!!editingEnrollment}
        onOpenChange={(open) => {
          if (!open) setEditingEnrollment(null);
        }}
        enrollment={editingEnrollment}
        sections={sections}
        onSave={handleEditEnrollment}
      />
    </div>
  );
}

export function OfferingDetail({ offeringId }: { offeringId: string }) {
  return <StaffOfferingDetail offeringId={offeringId} />;
}
