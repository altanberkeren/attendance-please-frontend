"use client"

import { useState } from "react"
import { CheckCircle2, XCircle, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PresentStudent {
  id: string | number
  name: string
  studentId: string
  via?: "auto" | "manual"
  markedAt?: string
}

export interface AbsentStudent {
  id: string | number
  name: string
  studentId: string
}

type FilterTab = "all" | "present" | "absent"

interface AttendanceRosterProps {
  present: PresentStudent[]
  absent:  AbsentStudent[]
  mode?:   "compact" | "full"
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AttendanceRoster({ present, absent, mode = "full" }: AttendanceRosterProps) {
  const [query,     setQuery]     = useState("")
  const [activeTab, setActiveTab] = useState<FilterTab>("all")

  const q = query.toLowerCase()

  const filteredPresent = present.filter(
    s => s.name.toLowerCase().includes(q) || s.studentId.includes(q)
  )
  const filteredAbsent = absent.filter(
    s => s.name.toLowerCase().includes(q) || s.studentId.includes(q)
  )

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all",     label: "All",     count: present.length + absent.length },
    { key: "present", label: "Present", count: present.length },
    { key: "absent",  label: "Absent",  count: absent.length  },
  ]

  const showPresent = activeTab === "all" || activeTab === "present"
  const showAbsent  = activeTab === "all" || activeTab === "absent"

  const visiblePresent = showPresent ? filteredPresent : []
  const visibleAbsent  = showAbsent  ? filteredAbsent  : []
  const totalVisible   = visiblePresent.length + visibleAbsent.length

  return (
    <div className="space-y-3">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b pb-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            {tab.label}
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
              activeTab === tab.key
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search by name or student ID..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>

      {/* Result count when searching */}
      {q && (
        <p className="text-xs text-muted-foreground">
          {totalVisible} result{totalVisible !== 1 ? "s" : ""} for &quot;{query}&quot;
        </p>
      )}

      {/* No results */}
      {totalVisible === 0 && (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
          <Search className="h-6 w-6 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No students found</p>
        </div>
      )}

      {/* Present list */}
      {showPresent && visiblePresent.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
            Present ({visiblePresent.length})
          </p>
          <div className={cn("grid gap-1.5", mode === "full" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
            {visiblePresent.map(s => (
              <div
                key={String(s.id)}
                className="flex items-center gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{s.studentId}</p>
                </div>
                {s.via === "manual" && (
                  <span className="text-[9px] border rounded px-1 py-0.5 text-muted-foreground shrink-0">M</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Absent list */}
      {showAbsent && visibleAbsent.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
            Absent ({visibleAbsent.length})
          </p>
          <div className={cn("grid gap-1.5", mode === "full" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
            {visibleAbsent.map(s => (
              <div
                key={String(s.id)}
                className="flex items-center gap-2.5 rounded-lg border border-red-500/20 bg-red-50 dark:bg-red-950/20 px-3 py-2"
              >
                <XCircle className="h-3.5 w-3.5 text-red-500 dark:text-red-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-muted-foreground">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{s.studentId}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
