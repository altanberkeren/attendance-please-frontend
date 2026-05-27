"use client"

import { useMemo } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useGetApiUsers } from "@/lib/api/users/users"

/**
 * Returns the current logged-in user's database record (id, name, email, role).
 * Matches by email from the Azure AD / MSAL token against /api/Users.
 */
export function useCurrentUser() {
  const { user: authUser } = useAuth()
  const { data: allUsers, isLoading } = useGetApiUsers()

  const currentUser = useMemo(() => {
    if (!authUser?.email || !allUsers) return null
    return (
      allUsers.find(
        (u) => u.email.toLowerCase() === authUser.email.toLowerCase()
      ) ?? null
    )
  }, [authUser?.email, allUsers])

  return { currentUser, isLoading }
}
