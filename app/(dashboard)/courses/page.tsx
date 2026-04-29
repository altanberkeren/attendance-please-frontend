"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { z } from "zod"
import { Course, MOCK_COURSES } from "@/lib/mock/courses"
import { DataTable } from "@/components/data-table/data-table"
import { RowActions } from "@/components/data-table/row-actions"
import { CrudDialog, FieldDef } from "@/components/crud-dialog"

const courseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().min(1, "Description is required"),
})

type CourseFormValues = z.infer<typeof courseSchema>

const fields: FieldDef[] = [
  { name: "name", label: "Name", placeholder: "Introduction to Computer Science" },
  { name: "code", label: "Code", placeholder: "CS101" },
  { name: "description", label: "Description", placeholder: "Course description" },
]

const emptyDefaults: CourseFormValues = { name: "", code: "", description: "" }

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(course: Course) {
    setEditing(course)
    setDialogOpen(true)
  }

  function handleDelete(id: string) {
    setCourses((prev) => prev.filter((c) => c.id !== id))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleSubmit(raw: any) {
    const values = raw as CourseFormValues
    if (editing) {
      setCourses((prev) =>
        prev.map((c) => (c.id === editing.id ? { ...c, ...values } : c))
      )
    } else {
      setCourses((prev) => [...prev, { id: Date.now().toString(), ...values }])
    }
  }

  const columns: ColumnDef<Course>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "code", header: "Code" },
    { accessorKey: "description", header: "Description" },
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
        <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
        <p className="text-sm text-muted-foreground">Manage your course catalog.</p>
      </div>
      <DataTable columns={columns} data={courses} onAdd={openCreate} addLabel="Add Course" />
      <CrudDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Course" : "New Course"}
        schema={courseSchema}
        defaultValues={
          editing
            ? { name: editing.name, code: editing.code, description: editing.description }
            : emptyDefaults
        }
        fields={fields}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
