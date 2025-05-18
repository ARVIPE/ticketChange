"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User, UserRole } from "./IUsuarioMgt"
import { authService } from "./authService"
import { useRouter } from "next/navigation"

interface UserContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  signup: (email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>
}

// Create a default context value
const defaultContextValue: UserContextType = {
  user: null,
  loading: true,
  login: async () => ({ success: false, error: "Context not initialized" }),
  logout: async () => {},
  signup: async () => ({ success: false, error: "Context not initialized" }),
}

const UserContext = createContext<UserContextType>(defaultContextValue)

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for user on initial load
    const checkUser = async () => {
      try {
        const currentUser = await authService.obtenerUsuarioActual()
        setUser(currentUser)
      } catch (error) {
        console.error("Error checking user:", error)
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const result = await authService.iniciarSesion(email, password)
      if (result.success) {
        const user = await authService.obtenerUsuarioActual()
        setUser(user)

        // Redirect based on user role
        if (user?.role === "comprador") router.push("/buyer")
        else if (user?.role === "organizador") router.push("/organiser")
        else if (user?.role === "vendedor") router.push("/seller")
      }
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const logout = async () => {
    try {
      await authService.cerrarSesion()
      setUser(null)
      router.push("/login")
    } catch (error) {
      console.error("Error during logout:", error)
    }
  }

  const signup = async (email: string, password: string, role: UserRole) => {
    try {
      return await authService.registrarUsuario(email, password, role)
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Create the actual context value
  const contextValue: UserContextType = {
    user,
    loading,
    login,
    logout,
    signup,
  }

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
}

export const useUser = () => useContext(UserContext)
