"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2 } from "lucide-react"
import * as XLSX from "xlsx"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { usePostApiEnrollments } from "@/lib/api/enrollments/enrollments"

type RowStatus = "pending" | "success" | "error"
type Step = "upload" | "preview" | "importing"

interface ParsedStudent {
  student_no: string
  first_name: string
  last_name: string
  status: RowStatus
  error?: string
}

interface ColConfig {
  startRow: string
  noCol: string
  nameCol: string
  surnameCol: string
  sectionId: string
}

interface BulkEnrollModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseOfferingId: string | number
  onSuccess?: () => void
}

function colLetterToIndex(col: string): number {
  const upper = col.toUpperCase().trim()
  if (!upper) return 0
  let index = 0
  for (let i = 0; i < upper.length; i++) {
    index = index * 26 + (upper.charCodeAt(i) - 64)
  }
  return index - 1
}

function indexToColLetter(idx: number): string {
  let letter = ""
  let n = idx + 1
  while (n > 0) {
    n--
    letter = String.fromCharCode(65 + (n % 26)) + letter
    n = Math.floor(n / 26)
  }
  return letter
}

function parseWithConfig(rawRows: unknown[][], cfg: ColConfig): ParsedStudent[] {
  const startIdx = Math.max(0, parseInt(cfg.startRow || "1", 10) - 1)
  const noIdx = colLetterToIndex(cfg.noCol)
  const nameIdx = colLetterToIndex(cfg.nameCol)
  const surnameIdx = colLetterToIndex(cfg.surnameCol)

  const students: ParsedStudent[] = []
  for (const row of (rawRows as unknown[][]).slice(startIdx)) {
    const no = (row as unknown[])[noIdx] != null ? String((row as unknown[])[noIdx]).trim() : ""
    if (!no) continue
    students.push({
      student_no: no,
      first_name: (row as unknown[])[nameIdx] != null ? String((row as unknown[])[nameIdx]).trim() : "",
      last_name: (row as unknown[])[surnameIdx] != null ? String((row as unknown[])[surnameIdx]).trim() : "",
      status: "pending",
    })
  }
  return students
}

const DEFAULT_CONFIG: ColConfig = {
  startRow: "13",
  noCol: "A",
  nameCol: "B",
  surnameCol: "E",
  sectionId: "",
}

export function BulkEnrollModal({
  open,
  onOpenChange,
  courseOfferingId,
  onSuccess,
}: BulkEnrollModalProps) {
  const [step, setStep] = useState<Step>("upload")
  const [rawRows, setRawRows] = useState<unknown[][]>([])
  const [fileName, setFileName] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const [cfg, setCfg] = useState<ColConfig>(DEFAULT_CONFIG)
  const [students, setStudents] = useState<ParsedStudent[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { mutateAsync: enroll } = usePostApiEnrollments()

  const parseFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: "array" })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null, raw: true })
      setRawRows(rows as unknown[][])
      setFileName(file.name)
      setStep("preview")
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const handleFile = useCallback(
    (file: File) => {
      if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
        alert("Please upload a valid .xlsx, .xls or .csv file.")
        return
      }
      parseFile(file)
    },
    [parseFile]
  )

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  // Auto re-parse whenever config or raw data changes while on preview step
  useEffect(() => {
    if (step === "preview" && rawRows.length > 0) {
      setStudents(parseWithConfig(rawRows, cfg))
    }
  }, [cfg, rawRows, step])

  const handleImport = async () => {
    setStep("importing")
    const updated = students.map((s) => ({ ...s }))

    for (let i = 0; i < updated.length; i++) {
      try {
        await enroll({
          data: {
            userId: updated[i].student_no,
            courseOfferingId,
            sectionId: cfg.sectionId.trim(),
          },
        })
        updated[i].status = "success"
      } catch (err: unknown) {
        updated[i].status = "error"
        updated[i].error = err instanceof Error ? err.message : "Enrollment failed"
      }
      setStudents([...updated])
    }

    onSuccess?.()
  }

  const resetAndClose = () => {
    setStep("upload")
    setRawRows([])
    setStudents([])
    setFileName("")
    setCfg(DEFAULT_CONFIG)
    onOpenChange(false)
  }

  const isDone = step === "importing" && students.every((s) => s.status !== "pending")
  const successCount = students.filter((s) => s.status === "success").length
  const errorCount = students.filter((s) => s.status === "error").length

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className={cn(step === "upload" ? "sm:max-w-md" : "sm:max-w-4xl")}>
        <DialogHeader>
          <DialogTitle>Bulk Student Enrollment</DialogTitle>
          <DialogDescription>
            Upload a university attendance list (.xls / .xlsx) to enroll students in bulk.
          </DialogDescription>
        </DialogHeader>

        {/* ── Step 1: Upload ── */}
        {step === "upload" && (
          <div
            role="button"
            tabIndex={0}
            className={cn(
              "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-12 cursor-pointer select-none transition-colors",
              dragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
            )}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          >
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <p className="font-semibold">Drag your attendance list here</p>
              <p className="text-sm text-muted-foreground">or click to browse (.xls, .xlsx)</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        )}

        {/* ── Step 2: Configure + Preview (combined) ── */}
        {step === "preview" && (
          <div className="space-y-4">
            {/* Inputs — changes auto re-parse the table */}
            <div className="flex flex-wrap gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="startRow" className="text-xs">Start Row</Label>
                <Input
                  id="startRow"
                  value={cfg.startRow}
                  onChange={(e) => setCfg((c) => ({ ...c, startRow: e.target.value }))}
                  placeholder="13"
                  className="w-20"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="noCol" className="text-xs">Student No Col</Label>
                <Input
                  id="noCol"
                  value={cfg.noCol}
                  onChange={(e) => setCfg((c) => ({ ...c, noCol: e.target.value.toUpperCase() }))}
                  placeholder="B"
                  className="w-20"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nameCol" className="text-xs">First Name Col</Label>
                <Input
                  id="nameCol"
                  value={cfg.nameCol}
                  onChange={(e) => setCfg((c) => ({ ...c, nameCol: e.target.value.toUpperCase() }))}
                  placeholder="D"
                  className="w-20"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="surnameCol" className="text-xs">Last Name Col</Label>
                <Input
                  id="surnameCol"
                  value={cfg.surnameCol}
                  onChange={(e) => setCfg((c) => ({ ...c, surnameCol: e.target.value.toUpperCase() }))}
                  placeholder="E"
                  className="w-20"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sectionId" className="text-xs">Section ID</Label>
                <Input
                  id="sectionId"
                  value={cfg.sectionId}
                  onChange={(e) => setCfg((c) => ({ ...c, sectionId: e.target.value }))}
                  placeholder="e.g. 3"
                  className="w-28"
                />
              </div>
            </div>

            {/* Parsed students table */}
            <div className="rounded-md border max-h-72 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Student No</TableHead>
                    <TableHead>First Name</TableHead>
                    <TableHead>Last Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.length ? (
                    students.map((s, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                        <TableCell className="font-mono text-sm">{s.student_no}</TableCell>
                        <TableCell>{s.first_name}</TableCell>
                        <TableCell>{s.last_name}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-16 text-center text-muted-foreground text-sm">
                        No students found. Adjust the column settings above.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* ── Step 4: Importing ── */}
        {step === "importing" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{fileName}</span>
                <span className="text-muted-foreground">— {students.length} students</span>
              </div>
              {isDone && (
                <div className="flex gap-3 text-sm">
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    {successCount} enrolled
                  </span>
                  {errorCount > 0 && (
                    <span className="flex items-center gap-1 text-destructive">
                      <XCircle className="h-4 w-4" />
                      {errorCount} failed
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="rounded-md border max-h-80 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Student No</TableHead>
                    <TableHead>First Name</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s, i) => (
                    <TableRow
                      key={i}
                      className={cn(
                        s.status === "success" && "bg-green-50 dark:bg-green-950/20",
                        s.status === "error" && "bg-red-50 dark:bg-red-950/20"
                      )}
                    >
                      <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{s.student_no}</TableCell>
                      <TableCell>{s.first_name}</TableCell>
                      <TableCell>{s.last_name}</TableCell>
                      <TableCell className="text-right">
                        {s.status === "pending" && (
                          <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        {s.status === "success" && (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-0">
                            Enrolled
                          </Badge>
                        )}
                        {s.status === "error" && (
                          <Badge variant="destructive" title={s.error}>
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "upload" && (
            <Button variant="outline" onClick={resetAndClose}>
              Cancel
            </Button>
          )}
          {step === "preview" && (
            <>
              <Button
                variant="outline"
                onClick={() => { setStep("upload"); setRawRows([]); setStudents([]) }}
              >
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={students.length === 0 || !cfg.sectionId.trim()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Enroll {students.length} Students
              </Button>
            </>
          )}
          {step === "importing" && !isDone && (
            <p className="text-sm text-muted-foreground animate-pulse">Importing...</p>
          )}
          {isDone && <Button onClick={resetAndClose}>Close</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
