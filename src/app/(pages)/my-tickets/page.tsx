"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "../../core/auth/userContext"
import { useTicket } from "../../core/tickets/ticketContext"
import Navbar from "../../components/navbar/navbar"
import type { Ticket } from "../../core/tickets/ITicketMgt"
import { TicketResaleProcess } from "../../processes/ticketResale"

export default function MyTicketsPage() {
  const { user } = useUser()
  const router = useRouter()
  const { consultarTicketsUsuario } = useTicket()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [reventaTicketId, setReventaTicketId] = useState<number | null>(null)
  const [precioReventa, setPrecioReventa] = useState<number>(0)

  useEffect(() => {
    // Verificar si el usuario está autenticado y es un comprador
    if (!user) {
      router.push("/login")
      return
    }

    if (user.role !== "comprador") {
      router.push("/")
      return
    }

    loadTickets()
  }, [user, router])

  const loadTickets = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { tickets, error } = await consultarTicketsUsuario()
      if (error) {
        setError(error)
      } else {
        setTickets(tickets)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReventa = async (ticketId: number) => {
    setReventaTicketId(ticketId)
    // Find the ticket to get its original price
    const ticket = tickets.find((t) => t.id === ticketId)
    if (ticket) {
      setPrecioReventa(ticket.precio)
    }
  }

  const confirmarReventa = async () => {
    if (!reventaTicketId || precioReventa <= 0) return

    try {
      const { success, message, reventaId } = await TicketResaleProcess.publicarTicketReventa(
        reventaTicketId,
        precioReventa,
      )

      if (!success) {
        setError(message)
      } else {
        setSuccess(message)
        // Reload tickets to update status
        await loadTickets()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setReventaTicketId(null)
      setPrecioReventa(0)
    }

    setTimeout(() => {
      setSuccess(null)
      setError(null)
    }, 3000)
  }

  const cancelarReventa = () => {
    setReventaTicketId(null)
    setPrecioReventa(0)
  }

  if (!user || user.role !== "comprador") {
    return null // No renderizar nada mientras redirige
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Mis Tickets</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 max-w-lg mx-auto">
            <strong className="font-bold">Error:</strong> <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 max-w-lg mx-auto">
            <span>{success}</span>
          </div>
        )}

        {loading ? (
          <p className="text-center text-xl">Cargando tickets...</p>
        ) : tickets.length === 0 ? (
          <p className="text-center text-xl text-gray-500">No tienes tickets.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                  ticket.usado ? "border-gray-400" : ticket.enReventa ? "border-orange-400" : "border-green-400"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg">{ticket.eventoNombre}</h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      ticket.usado
                        ? "bg-gray-100 text-gray-800"
                        : ticket.enReventa
                          ? "bg-orange-100 text-orange-800"
                          : "bg-green-100 text-green-800"
                    }`}
                  >
                    {ticket.usado ? "Usado" : ticket.enReventa ? "En Reventa" : "Válido"}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-1">🆔 Ticket #{ticket.id}</p>
                <p className="text-sm text-gray-600 mb-1">
                  📅 Emitido: {new Date(ticket.fechaEmision).toLocaleDateString()}
                </p>
                <p className="font-semibold text-green-600 mb-4">💶 {ticket.precio} €</p>

                {ticket.enReventa && (
                  <p className="text-sm font-medium text-orange-600 mb-4">
                    Precio de reventa: {ticket.precioReventa} €
                  </p>
                )}

                {!ticket.usado && !ticket.enReventa && (
                  <button
                    onClick={() => handleReventa(ticket.id)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                  >
                    Poner en reventa
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal de reventa */}
        {reventaTicketId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Poner ticket en reventa</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio de reventa (€)</label>
                <input
                  type="number"
                  value={precioReventa}
                  onChange={(e) => setPrecioReventa(Number.parseFloat(e.target.value))}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={confirmarReventa}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                >
                  Confirmar
                </button>
                <button
                  onClick={cancelarReventa}
                  className="flex-1 bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
