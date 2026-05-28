"use client"

import { useMemo } from "react"
import { useMsal } from "@azure/msal-react"
import { useGetApiUsers } from "@/lib/api/users/users"

/**
 * Returns the backend user record for the currently signed-in Azure AD account.
 * Matches by email (case-insensitive).
 */
export function useCurrentUser() {
  const { accounts } = useMsal()
  const account      = accounts[0] ?? null
  const email        = account?.username?.toLowerCase() ?? null

  const { data: users = [], isLoading } = useGetApiUsers()

  const currentUser = useMemo(() => {
    if (!email || !users.length) return null
    return users.find(u => u.email.toLowerCase() === email) ?? null
  }, [users, email])

  return {
    currentUser,
    userId:    currentUser?.id ?? null,
    isLoading,
  }
}
