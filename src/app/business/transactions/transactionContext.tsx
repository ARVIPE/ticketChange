"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { transactionService } from "./transactionService"
import type { Transaccion } from "./ITransaccionMgt"

interface TransactionContextType {
  transacciones: Transaccion[]
  loading: boolean
  error: string | null
  consultarTransaccion: (transaccionId: number) => Promise<{ transaccion: Transaccion | null; error?: string }>
  listarTransaccionesUsuario: () => Promise<void>
}

// Default context value
const defaultContextValue: TransactionContextType = {
  transacciones: [],
  loading: false,
  error: null,
  consultarTransaccion: async () => ({ transaccion: null, error: "Context not initialized" }),
  listarTransaccionesUsuario: async () => {},
}

const TransactionContext = createContext<TransactionContextType>(defaultContextValue)

export const TransactionProvider = ({ children }: { children: React.ReactNode }) => {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const listarTransaccionesUsuario = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        setError("Usuario no autenticado")
        return
      }

      const { transacciones, error } = await transactionService.listarTransaccionesUsuario(userData.user.id)
      if (error) {
        setError(error)
      } else {
        setTransacciones(transacciones)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const consultarTransaccion = async (transaccionId: number) => {
    try {
      return await transactionService.consultarTransaccion(transaccionId)
    } catch (error: any) {
      return { transaccion: null, error: error.message }
    }
  }

  // Create the actual context value
  const contextValue: TransactionContextType = {
    transacciones,
    loading,
    error,
    consultarTransaccion,
    listarTransaccionesUsuario,
  }

  return <TransactionContext.Provider value={contextValue}>{children}</TransactionContext.Provider>
}

export const useTransaction = () => useContext(TransactionContext)

// Import supabase for user authentication
import { supabase } from "../../lib/supabaseClient"
