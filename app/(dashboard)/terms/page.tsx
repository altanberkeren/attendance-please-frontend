"use client"

import { useState } from "react"
import { CalendarDays, Plus, Pencil, Trash2, Clock, MoreHorizontal, Loader2 } from "lucide-react"
import { useGetApiTerms, usePostApiTerms, usePutApiTermsId, useDeleteApiTermsId } from "@/lib/api/terms/terms"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { TermDto } from "@/lib/api/model"

// ── Helpers ───────────────────────────────────────────────────────────────────

function termStatus(start: string, end: string): "active" | "upcoming" | "past" {
  const now = new Date(), s = new Date(start), e = new Date(end)
  if (now >= s && now <= e) return "active"
  if (now < s) return "upcoming"
  return "past"
}

function durationDays(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000)
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function toInputDate(iso: string) {
  return iso.split("T")[0]
}

function StatusBadge({ status }: { status: "active" | "upcoming" | "past" }) {
  if (status === "active") return <Badge className="text-xs animate-pulse">Active</Badge>
  if (status === "upcoming") return <Badge variant="secondary" className="text-xs">Upcoming</Badge>
  return <Badge variant="outline" className="text-xs text-muted-foreground">Past</Badge>
}

// ── Term Dialog ───────────────────────────────────────────────────────────────

interface TermDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: TermDto | null
}

function TermDialog({ open, onOpenChange, editing }: TermDialogProps) {
  const qc = useQueryClient()
  const [code, setCode]           = useState(editing?.code ?? "")
  const [startDate, setStartDate] = useState(editing ? toInputDate(editing.startDate) : "")
  const [endDate, setEndDate]     = useState(editing ? toInputDate(editing.endDate) : "")

  const handleOpen = (v: boolean) => {
    if (v) {
      setCode(editing?.code ?? "")
      setStartDate(editing ? toInputDate(editing.startDate) : "")
      setEndDate(editing ? toInputDate(editing.endDate) : "")
    }
    onOpenChange(v)
  }

  const create = usePostApiTerms({
    mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/Terms"] }); onOpenChange(false) } },
  })
  const update = usePutApiTermsId({
    mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/Terms"] }); onOpenChange(false) } },
  })

  const isPending = create.isPending || update.isPending

  function handleSubmit() {
    if (!code.trim() || !startDate || !endDate) return
    if (editing) {
      update.mutate({ id: editing.id, data: { id: editing.id, code: code.trim(), startDate, endDate } })
    } else {
      create.mutate({ data: { code: code.trim(), startDate, endDate } })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Term" : "New Term"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Term Code <span className="text-destructive">*</span></Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="2025SP" />
          </div>
          <div className="space-y-1.5">
            <Label>Start Date <span className="text-destructive">*</span></Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>End Date <span className="text-destructive">*</span></Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!code.trim() || !startDate || !endDate || isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editing ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TermsPage() {
  const qc = useQueryClient()
  const { data: terms, isLoading } = useGetApiTerms()
  const deleteTerm = useDeleteApiTermsId({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/Terms"] }) },
  })

  const [dialogOpen, setDialog] = useState(false)
  const [editing, setEditing]   = useState<TermDto | null>(null)

  function openCreate() { setEditing(null); setDialog(true) }
  function openEdit(t: TermDto) { setEditing(t); setDialog(true) }

  const sorted = [...(terms ?? [])].sort((a, b) => {
    const sa = termStatus(a.startDate, a.endDate)
    const sb = termStatus(b.startDate, b.endDate)
    const order = { active: 0, upcoming: 1, past: 2 }
    return order[sa] - order[sb]
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-screen-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Terms</h1>
          <p className="text-sm text-muted-foreground">
            {(terms ?? []).length} academic term{(terms ?? []).length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Add Term
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <CalendarDays className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No terms yet</p>
          <p className="text-xs text-muted-foreground mt-1">Click "Add Term" to create your first academic term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((term) => {
            const status = termStatus(term.startDate, term.endDate)
            const days = durationDays(term.startDate, term.endDate)
            const isActive = status === "active"

            return (
              <Card
                key={String(term.id)}
                className={`group relative hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${isActive ? "border-primary/40 ring-1 ring-primary/20" : ""}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <StatusBadge status={status} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(term)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => deleteTerm.mutate({ id: term.id })}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="text-lg mt-2">{term.code}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground text-xs">Start</span>
                      <span className="font-medium text-xs ml-auto">{fmt(term.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground text-xs">End</span>
                      <span className="font-medium text-xs ml-auto">{fmt(term.endDate)}</span>
                    </div>
                  </div>
                  <div className="pt-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{days} days</span>
                      {isActive && <span className="text-primary font-medium">In progress</span>}
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isActive ? "bg-primary" : status === "upcoming" ? "bg-secondary" : "bg-muted-foreground/30"}`}
                        style={{
                          width: isActive
                            ? `${Math.min(100, ((Date.now() - new Date(term.startDate).getTime()) / (new Date(term.endDate).getTime() - new Date(term.startDate).getTime())) * 100)}%`
                            : status === "past" ? "100%" : "0%",
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" size="sm" className="flex-1 h-7 text-xs gap-1.5" onClick={() => openEdit(term)}>
                      <Pencil className="h-3 w-3" />Edit
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      className="flex-1 h-7 text-xs gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                      onClick={() => deleteTerm.mutate({ id: term.id })}
                    >
                      <Trash2 className="h-3 w-3" />Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          <button
            onClick={openCreate}
            className="group flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 min-h-[200px] transition-all duration-200"
          >
            <div className="h-10 w-10 rounded-full border-2 border-dashed border-muted-foreground/30 group-hover:border-primary/50 flex items-center justify-center transition-colors">
              <Plus className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
            </div>
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Add new term</span>
          </button>
        </div>
      )}

      <TermDialog open={dialogOpen} onOpenChange={setDialog} editing={editing} />
    </div>
  )
}
