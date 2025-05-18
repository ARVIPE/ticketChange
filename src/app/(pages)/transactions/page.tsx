"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "../../core/auth/userContext"
import { useTransaction } from "../../business/transactions/transactionContext"
import Navbar from "../../components/navbar/navbar"
import type { Transaccion } from "../../business/transactions/ITransaccionMgt"

export default function TransactionsPage() {
  const { user } = useUser()
  const router = useRouter()
  const { transacciones, loading, error, listarTransaccionesUsuario, consultarTransaccion } = useTransaction()
  const [selectedTransaction, setSelectedTransaction] = useState<Transaccion | null>(null)
  const [transactionDetails, setTransactionDetails] = useState<Transaccion | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)

  useEffect(() => {
    // Verify if the user is authenticated
    if (!user) {
      router.push("/login")
      return
    }

    // Load transactions
    listarTransaccionesUsuario()
  }, [user, router, listarTransaccionesUsuario])

  const handleViewDetails = async (transaccionId: number) => {
    setDetailsLoading(true)
    setDetailsError(null)

    try {
      const { transaccion, error } = await consultarTransaccion(transaccionId)
      if (error) {
        setDetailsError(error)
      } else if (transaccion) {
        setTransactionDetails(transaccion)
        setSelectedTransaction(transaccion)
      } else {
        setDetailsError("No se encontró la transacción")
      }
    } catch (err: any) {
      setDetailsError(err.message)
    } finally {
      setDetailsLoading(false)
    }
  }

  const closeDetails = () => {
    setSelectedTransaction(null)
    setTransactionDetails(null)
  }

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  // Helper function to get status badge color
  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "completada":
        return "bg-green-100 text-green-800"
      case "cancelada":
        return "bg-red-100 text-red-800"
      case "pendiente":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Helper function to get transaction type badge color
  const getTypeColor = (tipo: string) => {
    switch (tipo) {
      case "venta":
        return "bg-blue-100 text-blue-800"
      case "reventa":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (!user) {
    return null // Don't render anything while redirecting
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Mis Transacciones</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 max-w-lg mx-auto">
            <strong className="font-bold">Error:</strong> <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center">
            <p className="text-xl">Cargando transacciones...</p>
          </div>
        ) : transacciones.length === 0 ? (
          <div className="text-center">
            <p className="text-xl text-gray-500">No tienes transacciones.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Tipo
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Evento
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Precio
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Fecha
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Estado
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transacciones.map((transaccion) => (
                  <tr key={transaccion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaccion.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(transaccion.tipo)}`}>
                        {transaccion.tipo === "venta" ? "Venta" : "Reventa"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaccion.eventoNombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaccion.precio} €</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaccion.fecha)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(transaccion.estado)}`}>
                        {transaccion.estado.charAt(0).toUpperCase() + transaccion.estado.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(transaccion.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Ver detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Transaction Details Modal */}
        {selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Detalles de la Transacción</h2>

              {detailsLoading ? (
                <p className="text-center">Cargando detalles...</p>
              ) : detailsError ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  <strong className="font-bold">Error:</strong> <span>{detailsError}</span>
                </div>
              ) : transactionDetails ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <p className="font-semibold">ID:</p>
                    <p>{transactionDetails.id}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="font-semibold">Tipo:</p>
                    <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(transactionDetails.tipo)}`}>
                      {transactionDetails.tipo === "venta" ? "Venta" : "Reventa"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <p className="font-semibold">Usuario:</p>
                    <p>{transactionDetails.usuarioEmail}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="font-semibold">Evento:</p>
                    <p>{transactionDetails.eventoNombre}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="font-semibold">Precio:</p>
                    <p>{transactionDetails.precio} €</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="font-semibold">Fecha:</p>
                    <p>{formatDate(transactionDetails.fecha)}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="font-semibold">Estado:</p>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(transactionDetails.estado)}`}>
                      {transactionDetails.estado.charAt(0).toUpperCase() + transactionDetails.estado.slice(1)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500">No se encontraron detalles.</p>
              )}

              <button
                onClick={closeDetails}
                className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
