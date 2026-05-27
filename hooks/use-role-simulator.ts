"use client"

import { useState, useCallback, useEffect } from "react"

export type SimulatedRole = "Admin" | "Staff"

const STORAGE_KEY = "dev_view_as"

function readStored(): SimulatedRole {
  if (typeof window === "undefined") return "Admin"
  const v = localStorage.getItem(STORAGE_KEY)
  return v === "Staff" ? "Staff" : "Admin"
}

/**
 * Dev-only role simulator.
 * Lets you toggle between Admin and Staff UI without changing your real Azure AD role.
 * The actual API token is untouched — this only controls which UI is rendered.
 */
export function useRoleSimulator() {
  const [viewAs, setViewAsState] = useState<SimulatedRole>("Admin")

  // Hydrate from localStorage after mount
  useEffect(() => {
    setViewAsState(readStored())
  }, [])

  const setViewAs = useCallback((role: SimulatedRole) => {
    localStorage.setItem(STORAGE_KEY, role)
    setViewAsState(role)
  }, [])

  const toggle = useCallback(() => {
    setViewAs(viewAs === "Admin" ? "Staff" : "Admin")
  }, [viewAs, setViewAs])

  return {
    viewAs,
    setViewAs,
    toggle,
    isStaffView: viewAs === "Staff",
    isAdminView: viewAs === "Admin",
  }
}
