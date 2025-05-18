"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { eventService } from "./eventService"
import type { Evento, EventoInput, EventoFiltros } from "./IEventsMgt"

interface EventContextType {
  eventos: Evento[]
  loading: boolean
  error: string | null
  crearEvento: (evento: EventoInput) => Promise<{ success: boolean; eventoId?: number; error?: string }>
  modificarEvento: (eventoId: number, datos: Partial<EventoInput>) => Promise<{ success: boolean; error?: string }>
  cancelarEvento: (eventoId: number) => Promise<{ success: boolean; error?: string }>
  consultarEvento: (eventoId: number) => Promise<{ evento: Evento | null; error?: string }>
  listarEventos: (filtros?: EventoFiltros) => Promise<void>
  consultarDisponibilidad: (eventoId: number) => Promise<{ disponibles: number; error?: string }>
}

// Crear un valor de contexto por defecto
const defaultContextValue: EventContextType = {
  eventos: [],
  loading: false,
  error: null,
  crearEvento: async () => ({ success: false, error: "Context not initialized" }),
  modificarEvento: async () => ({ success: false, error: "Context not initialized" }),
  cancelarEvento: async () => ({ success: false, error: "Context not initialized" }),
  consultarEvento: async () => ({ evento: null, error: "Context not initialized" }),
  listarEventos: async () => {},
  consultarDisponibilidad: async () => ({ disponibles: 0, error: "Context not initialized" }),
}

const EventContext = createContext<EventContextType>(defaultContextValue)

export const EventProvider = ({ children }: { children: React.ReactNode }) => {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const listarEventos = useCallback(async (filtros?: EventoFiltros) => {
    try {
      setLoading(true)
      setError(null)
      const { eventos, error } = await eventService.listarEventos(filtros)
      if (error) {
        setError(error)
      } else {
        setEventos(eventos)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const crearEvento = async (evento: EventoInput) => {
    try {
      console.log("Creando evento:", evento)
      const result = await eventService.crearEvento(evento)
      console.log("Resultado:", result)
      if (result.success) {
        // Refresh the event list
        await listarEventos()
      }
      return result
    } catch (error: any) {
      console.error("Error al crear evento:", error)
      return { success: false, error: error.message }
    }
  }

  const modificarEvento = async (eventoId: number, datos: Partial<EventoInput>) => {
    try {
      console.log("Modificando evento:", eventoId, datos)
      const result = await eventService.modificarEvento(eventoId, datos)
      console.log("Resultado:", result)
      if (result.success) {
        // Refresh the event list
        await listarEventos()
      }
      return result
    } catch (error: any) {
      console.error("Error al modificar evento:", error)
      return { success: false, error: error.message }
    }
  }

  const cancelarEvento = async (eventoId: number) => {
    try {
      console.log("Cancelando evento:", eventoId)
      const result = await eventService.cancelarEvento(eventoId)
      console.log("Resultado:", result)
      if (result.success) {
        // Refresh the event list
        await listarEventos()
      }
      return result
    } catch (error: any) {
      console.error("Error al cancelar evento:", error)
      return { success: false, error: error.message }
    }
  }

  const consultarEvento = async (eventoId: number) => {
    try {
      return await eventService.consultarEvento(eventoId)
    } catch (error: any) {
      return { evento: null, error: error.message }
    }
  }

  const consultarDisponibilidad = async (eventoId: number) => {
    try {
      return await eventService.consultarDisponibilidad(eventoId)
    } catch (error: any) {
      return { disponibles: 0, error: error.message }
    }
  }

  // Crear el valor real del contexto
  const contextValue: EventContextType = {
    eventos,
    loading,
    error,
    crearEvento,
    modificarEvento,
    cancelarEvento,
    consultarEvento,
    listarEventos,
    consultarDisponibilidad,
  }

  return <EventContext.Provider value={contextValue}>{children}</EventContext.Provider>
}

export const useEvent = () => useContext(EventContext)
