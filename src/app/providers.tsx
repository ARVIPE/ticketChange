"use client"

import type React from "react"
import { UserProvider } from "./core/auth/userContext"

export function UserProviderWrapper({ children }: { children: React.ReactNode }) {
  return <UserProvider>{children}</UserProvider>
}
