"use client"

import { useRouter } from "next/navigation"
import { Users, UserCog, CalendarCheck } from "lucide-react"
import { type CourseOffering } from "@/lib/mock/course-offerings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  Completed: "default",
  Scheduled: "secondary",
  Cancelled: "destructive",
}

export function OfferingDetail({ offering }: { offering: CourseOffering }) {
  const router = useRouter()

  if (!offering) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.back()} className="text-sm text-muted-foreground hover:underline">
          ← Back
        </button>
        <p className="text-muted-foreground">Course offering not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/course-offerings">Course Offerings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{offering.courseName} — {offering.section}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <CardTitle>{offering.courseName}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Term</p>
            <p className="font-medium">{offering.termName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Section</p>
            <p className="font-medium">{offering.section}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Enrolled</p>
            <p className="font-medium">{offering.students.length} students</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">
            <Users className="mr-2 h-4 w-4" />
            Enrolled Students ({offering.students.length})
          </TabsTrigger>
          <TabsTrigger value="staff">
            <UserCog className="mr-2 h-4 w-4" />
            Staff ({offering.staff.length})
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <CalendarCheck className="mr-2 h-4 w-4" />
            Sessions ({offering.sessions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Enrolled At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offering.students.length ? (
                  offering.students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell>{s.enrolledAt}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-20 text-center text-muted-foreground">
                      No enrolled students.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="staff" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offering.staff.length ? (
                  offering.staff.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.role}</TableCell>
                      <TableCell>{s.email}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-20 text-center text-muted-foreground">
                      No staff assigned.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offering.sessions.length ? (
                  offering.sessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.date}</TableCell>
                      <TableCell className="font-medium">{s.topic}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[s.status] ?? "secondary"}>
                          {s.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-20 text-center text-muted-foreground">
                      No sessions yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
