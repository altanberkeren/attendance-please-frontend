"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { z } from "zod"
import { ExternalLink } from "lucide-react"
import { CourseOffering, MOCK_COURSE_OFFERINGS } from "@/lib/mock/course-offerings"
import { DataTable } from "@/components/data-table/data-table"
import { RowActions } from "@/components/data-table/row-actions"
import { CrudDialog, FieldDef } from "@/components/crud-dialog"
import { Button } from "@/components/ui/button"

const offeringSchema = z.object({
  courseName: z.string().min(1, "Course name is required"),
  termName: z.string().min(1, "Term name is required"),
  section: z.string().min(1, "Section is required"),
})

type OfferingFormValues = z.infer<typeof offeringSchema>

const fields: FieldDef[] = [
  { name: "courseName", label: "Course Name", placeholder: "Introduction to Computer Science" },
  { name: "termName", label: "Term", placeholder: "Fall 2025" },
  { name: "section", label: "Section", placeholder: "A" },
]

const emptyDefaults: OfferingFormValues = { courseName: "", termName: "", section: "" }

export default function CourseOfferingsPage() {
  const router = useRouter()
  const [offerings, setOfferings] = useState<CourseOffering[]>(MOCK_COURSE_OFFERINGS)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CourseOffering | null>(null)

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(offering: CourseOffering) {
    setEditing(offering)
    setDialogOpen(true)
  }

  function handleDelete(id: string) {
    setOfferings((prev) => prev.filter((o) => o.id !== id))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleSubmit(raw: any) {
    const values = raw as OfferingFormValues
    if (editing) {
      setOfferings((prev) =>
        prev.map((o) => (o.id === editing.id ? { ...o, ...values } : o))
      )
    } else {
      const newOffering: CourseOffering = {
        id: Date.now().toString(),
        courseId: "",
        termId: "",
        students: [],
        staff: [],
        sessions: [],
        ...values,
      }
      setOfferings((prev) => [...prev, newOffering])
    }
  }

  const columns: ColumnDef<CourseOffering>[] = [
    { accessorKey: "courseName", header: "Course" },
    { accessorKey: "termName", header: "Term" },
    { accessorKey: "section", header: "Section" },
    {
      id: "view",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/course-offerings/${row.original.id}`)}
        >
          <ExternalLink className="mr-1 h-3.5 w-3.5" />
          Details
        </Button>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActions
          onEdit={() => openEdit(row.original)}
          onDelete={() => handleDelete(row.original.id)}
        />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Course Offerings</h1>
        <p className="text-sm text-muted-foreground">Manage course offerings by term and section.</p>
      </div>
      <DataTable columns={columns} data={offerings} onAdd={openCreate} addLabel="Add Offering" />
      <CrudDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Course Offering" : "New Course Offering"}
        schema={offeringSchema}
        defaultValues={
          editing
            ? { courseName: editing.courseName, termName: editing.termName, section: editing.section }
            : emptyDefaults
        }
        fields={fields}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
