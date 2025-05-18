"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "../../core/auth/userContext"
import { useEvent } from "../../business/events/eventContext"
import Navbar from "../../components/navbar/navbar"
import { TicketSaleProcess } from "../../processes/ticketSale"

interface Evento {
  id: number
  name: string
  date: string
  place: string
  price: number
  capacity: number
  description?: string
}

export default function CompradorPage() {
  const { user } = useUser()
  const router = useRouter()
  const { listarEventos, eventos, loading: eventosLoading } = useEvent()
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [disponibilidad, setDisponibilidad] = useState<Record<number, number>>({})
  const [loadingDisponibilidad, setLoadingDisponibilidad] = useState<Record<number, boolean>>({})

  useEffect(() => {
    listarEventos()
  }, [listarEventos])

  const checkDisponibilidad = async (eventoId: number) => {
    try {
      setLoadingDisponibilidad((prev) => ({ ...prev, [eventoId]: true }))
      const { disponibles, error } = await eventService.consultarDisponibilidad(eventoId)

      if (error) {
        console.error("Error al consultar disponibilidad:", error)
        return
      }

      setDisponibilidad((prev) => ({ ...prev, [eventoId]: disponibles }))
    } catch (error) {
      console.error("Error al consultar disponibilidad:", error)
    } finally {
      setLoadingDisponibilidad((prev) => ({ ...prev, [eventoId]: false }))
    }
  }

  const comprarEntrada = async (evento: Evento) => {
    // Verificar si el usuario está autenticado
    if (!user) {
      setError("Debes iniciar sesión para comprar")
      setTimeout(() => setError(null), 3000)
      return
    }

    // Verificar si el usuario es un comprador
    if (user.role !== "comprador") {
      setError(`Solo los compradores pueden comprar tickets. Tu rol es: ${user.role}`)
      setTimeout(() => setError(null), 3000)
      return
    }

    setMensaje(null)
    setError(null)

    try {
      // Check availability first
      await checkDisponibilidad(evento.id)
      const disponibles = disponibilidad[evento.id] || 0

      if (disponibles <= 0) {
        setError(`Lo sentimos, no hay entradas disponibles para ${evento.name}`)
        setTimeout(() => setError(null), 3000)
        return
      }

      // Process the purchase
      const { success, message, ticketIds } = await TicketSaleProcess.procesarCompra(evento.id, 1)

      if (!success) {
        setError(message)
      } else {
        setMensaje(message)
        // Update availability after purchase
        await checkDisponibilidad(evento.id)
      }
    } catch (error: any) {
      setError(error.message)
    }

    setTimeout(() => {
      setMensaje(null)
      setError(null)
    }, 3000)
  }

  // Load initial availability for all events
  useEffect(() => {
    if (eventos.length > 0) {
      eventos.forEach((evento) => {
        checkDisponibilidad(evento.id)
      })
    }
  }, [eventos])

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <h1 className="text-3xl font-bold mb-6 text-center">Eventos Disponibles</h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventosLoading ? (
            <p className="col-span-3 text-center text-xl">Cargando eventos...</p>
          ) : eventos.length === 0 ? (
            <p className="col-span-3 text-center text-xl text-gray-500">No hay eventos disponibles.</p>
          ) : (
            eventos
              .filter((evento) => !evento.canceled)
              .map((evento) => (
                <div key={evento.id} className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition">
                  <h2 className="text-xl font-semibold mb-2">{evento.name}</h2>
                  <p className="text-gray-600 mb-1">📅 {evento.date}</p>
                  <p className="text-gray-600 mb-2">📍 {evento.place}</p>
                  <p className="text-green-600 font-bold mb-2">💶 {evento.price} €</p>

                  <div className="mb-4">
                    {loadingDisponibilidad[evento.id] ? (
                      <p className="text-sm text-gray-500">Verificando disponibilidad...</p>
                    ) : (
                      <p className="text-sm font-medium">
                        🎟 Disponibles: {disponibilidad[evento.id] !== undefined ? disponibilidad[evento.id] : "?"}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => comprarEntrada(evento)}
                    disabled={
                      !user ||
                      user.role !== "comprador" ||
                      loadingDisponibilidad[evento.id] ||
                      (disponibilidad[evento.id] !== undefined && disponibilidad[evento.id] <= 0)
                    }
                    className="bg-blue-600 text-white py-2 px-4 rounded-xl hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {disponibilidad[evento.id] !== undefined && disponibilidad[evento.id] <= 0
                      ? "Agotado"
                      : !user
                        ? "Inicia sesión para comprar"
                        : user.role !== "comprador"
                          ? "Solo compradores pueden comprar"
                          : "Comprar entrada"}
                  </button>
                </div>
              ))
          )}
        </div>

        {mensaje && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-xl shadow-md mt-4">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-xl shadow-md mt-4">
            {error}
          </div>
        )}
      </div>
    </>
  )
}

// Import eventService for direct access to consultarDisponibilidad
import { eventService } from "../../business/events/eventService"
