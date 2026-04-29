"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { z } from "zod"
import { Term, MOCK_TERMS } from "@/lib/mock/terms"
import { DataTable } from "@/components/data-table/data-table"
import { RowActions } from "@/components/data-table/row-actions"
import { CrudDialog, FieldDef } from "@/components/crud-dialog"

const termSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
})

type TermFormValues = z.infer<typeof termSchema>

const fields: FieldDef[] = [
  { name: "name", label: "Name", placeholder: "Fall 2025" },
  { name: "startDate", label: "Start Date", type: "date" },
  { name: "endDate", label: "End Date", type: "date" },
]

const emptyDefaults: TermFormValues = { name: "", startDate: "", endDate: "" }

export default function TermsPage() {
  const [terms, setTerms] = useState<Term[]>(MOCK_TERMS)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Term | null>(null)

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(term: Term) {
    setEditing(term)
    setDialogOpen(true)
  }

  function handleDelete(id: string) {
    setTerms((prev) => prev.filter((t) => t.id !== id))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleSubmit(raw: any) {
    const values = raw as TermFormValues
    if (editing) {
      setTerms((prev) =>
        prev.map((t) => (t.id === editing.id ? { ...t, ...values } : t))
      )
    } else {
      setTerms((prev) => [...prev, { id: Date.now().toString(), ...values }])
    }
  }

  const columns: ColumnDef<Term>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "startDate", header: "Start Date" },
    { accessorKey: "endDate", header: "End Date" },
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
        <h1 className="text-2xl font-semibold tracking-tight">Terms</h1>
        <p className="text-sm text-muted-foreground">Manage academic terms and their date ranges.</p>
      </div>
      <DataTable columns={columns} data={terms} onAdd={openCreate} addLabel="Add Term" />
      <CrudDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Term" : "New Term"}
        schema={termSchema}
        defaultValues={
          editing
            ? { name: editing.name, startDate: editing.startDate, endDate: editing.endDate }
            : emptyDefaults
        }
        fields={fields}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
