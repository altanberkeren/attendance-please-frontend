"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { Scan } from "lucide-react"

function QRDisplay() {
  const params  = useSearchParams()
  const course  = params.get("c")  ?? "Course"
  const module  = params.get("m")  ?? ""
  const section = params.get("s")  ?? ""
  const baseToken = params.get("t") ?? `att://session?ts=${Date.now()}`

  const [token, setToken] = useState(baseToken)

  const refresh = useCallback(() => {
    setToken(`att://session?base=${encodeURIComponent(baseToken)}&ts=${Date.now()}`)
  }, [baseToken])

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const id = setInterval(refresh, 120_000)
    return () => clearInterval(id)
  }, [refresh])

  const qrSize = 360

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center pt-12 pb-0 px-8 select-none">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <Scan className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-white text-2xl font-bold tracking-tight">AttendancePlease</span>
      </div>

      {/* Session info */}
      <div className="flex items-center gap-2.5 flex-wrap justify-center mb-24">
        <span className="text-white/90 text-lg font-mono font-bold">{course}</span>
        {module  && <><span className="text-white/30">·</span><span className="text-white/60 text-base">{module}</span></>}
        {section && <><span className="text-white/30">·</span><span className="text-white/60 text-base">{section}</span></>}
      </div>

      {/* QR — fills remaining space */}
      <div className="p-6 rounded-3xl bg-white shadow-2xl shadow-black/60">
        <QRCodeSVG value={token} size={qrSize} level="M" includeMargin={false} />
      </div>
    </div>
  )
}

export default function QRPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white/40 text-sm">Loading…</div>
      </div>
    }>
      <QRDisplay />
    </Suspense>
  )
}
