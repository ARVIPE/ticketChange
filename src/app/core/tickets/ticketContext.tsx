"use client"

import type React from "react"

import { createContext, useContext } from "react"
import { ticketService } from "./ticketService"
import type { Ticket } from "./ITicketMgt"

interface TicketContextType {
  consultarTicketsUsuario: () => Promise<{ tickets: Ticket[]; error?: string }>
  marcarTicketEnReventa: (ticketId: number, precio: number) => Promise<{ success: boolean; error?: string }>
  validarTicket: (ticketId: number) => Promise<{ valid: boolean; error?: string }>
}

const defaultTicketContext: TicketContextType = {
  consultarTicketsUsuario: async () => ({ tickets: [], error: "Context not initialized" }),
  marcarTicketEnReventa: async () => ({ success: false, error: "Context not initialized" }),
  validarTicket: async () => ({ valid: false, error: "Context not initialized" }),
}

const TicketContext = createContext<TicketContextType>(defaultTicketContext)

export const TicketProvider = ({ children }: { children: React.ReactNode }) => {
  const consultarTicketsUsuario = async () => {
    try {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        return { tickets: [], error: "Usuario no autenticado" }
      }
      return await ticketService.consultarTicketsUsuario(data.user.id)
    } catch (error: any) {
      return { tickets: [], error: error.message }
    }
  }

  const marcarTicketEnReventa = async (ticketId: number, precio: number) => {
    try {
      return await ticketService.marcarTicketEnReventa(ticketId, precio)
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const validarTicket = async (ticketId: number) => {
    try {
      return await ticketService.validarTicket(ticketId)
    } catch (error: any) {
      return { valid: false, error: error.message }
    }
  }

  const contextValue: TicketContextType = {
    consultarTicketsUsuario,
    marcarTicketEnReventa,
    validarTicket,
  }

  return <TicketContext.Provider value={contextValue}>{children}</TicketContext.Provider>
}

export const useTicket = () => useContext(TicketContext)

// Import supabase for user authentication
import { supabase } from "../../lib/supabaseClient"
