"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "../../core/auth/userContext"
import Navbar from "../../components/navbar/navbar"
import { TicketResaleProcess } from "../../processes/ticketResale"
import type { Reventa } from "../../business/transactions/IReventaMgt"

export default function MarketplacePage() {
  const { user } = useUser()
  const router = useRouter()
  const [reventas, setReventas] = useState<Reventa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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

    loadReventas()
  }, [user, router])

  const loadReventas = async () => {
    setLoading(true)
    try {
      const { reventas, error } = await transactionService.listarReventas()
      if (error) {
        setError(error)
      } else {
        setReventas(reventas)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const comprarReventa = async (reventaId: number) => {
    if (!user) {
      setError("Debes iniciar sesión para comprar")
      setTimeout(() => setError(null), 3000)
      return
    }

    if (user.role !== "comprador") {
      setError(`Solo los compradores pueden comprar tickets. Tu rol es: ${user.role}`)
      setTimeout(() => setError(null), 3000)
      return
    }

    try {
      const { success, message, ticketId } = await TicketResaleProcess.comprarTicketReventa(reventaId)

      if (!success) {
        setError(message)
      } else {
        setSuccess(message)
        // Reload reventas to update list
        await loadReventas()
      }
    } catch (err: any) {
      setError(err.message)
    }

    setTimeout(() => {
      setSuccess(null)
      setError(null)
    }, 3000)
  }

  if (!user || user.role !== "comprador") {
    return null // No renderizar nada mientras redirige
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Marketplace de Reventa</h1>

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
          <p className="text-center text-xl">Cargando tickets en reventa...</p>
        ) : reventas.length === 0 ? (
          <p className="text-center text-xl text-gray-500">No hay tickets en reventa disponibles.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reventas.map((reventa) => (
              <div key={reventa.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-400">
                <h3 className="font-bold text-lg mb-2">{reventa.eventoNombre}</h3>
                <p className="text-sm text-gray-600 mb-1">
                  📅 Publicado: {new Date(reventa.fecha).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600 mb-1">🧑‍💼 Vendedor: {reventa.vendedorEmail}</p>

                <div className="flex items-center space-x-2 mb-4">
                  <p className="line-through text-sm text-gray-500">💶 {reventa.precioOriginal} €</p>
                  <p className="font-bold text-orange-600">💶 {reventa.precio} €</p>
                </div>

                {user && user.email !== reventa.vendedorEmail && (
                  <button
                    onClick={() => comprarReventa(reventa.id)}
                    className="w-full bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 transition"
                  >
                    Comprar
                  </button>
                )}

                {user && user.email === reventa.vendedorEmail && (
                  <p className="text-center text-sm text-gray-500 italic">Este es tu ticket en reventa</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// Import transactionService for direct access to listarReventas
import { transactionService } from "../../business/transactions/transactionService"
