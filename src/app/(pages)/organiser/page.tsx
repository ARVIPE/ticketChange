"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "../../core/auth/userContext"
import { useEvent } from "../../business/events/eventContext"
import Navbar from "../../components/navbar/navbar"
import type { Evento, EventoInput } from "../../business/events/IEventsMgt"

export default function OrganiserPage() {
  const { user, loading: userLoading } = useUser()
  const {
    crearEvento,
    modificarEvento,
    cancelarEvento,
    consultarEvento,
    listarEventos,
    eventos,
    loading: eventosLoading,
    error: eventosError,
  } = useEvent()
  const router = useRouter()

  const [formData, setFormData] = useState<EventoInput>({
    name: "",
    date: "",
    place: "",
    price: 0,
    capacity: 0,
    description: "",
    organizerId: "",
  })

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [editingEventId, setEditingEventId] = useState<number | null>(null)
  const [viewingEventId, setViewingEventId] = useState<number | null>(null)
  const [viewingEvent, setViewingEvent] = useState<Evento | null>(null)

  useEffect(() => {
    // Redirect if not an organizer
    if (!userLoading && (!user || user.role !== "organizador")) {
      router.push("/")
      return
    }

    // Set organizer ID in form data
    if (user) {
      setFormData((prev) => ({ ...prev, organizerId: user.id }))
      setDebugInfo(`Usuario: ${JSON.stringify(user)}`)
    }

    // Load events
    listarEventos().catch((err) => {
      console.error("Error al listar eventos:", err)
      setDebugInfo((prev) => `${prev || ""}\nError al listar eventos: ${err.message}`)
    })
  }, [user, userLoading, router, listarEventos])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" || name === "capacity" ? Number(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setDebugInfo(`Enviando formulario: ${JSON.stringify(formData)}`)

    try {
      // Validate form
      if (!formData.name || !formData.date || !formData.place || formData.price <= 0 || formData.capacity <= 0) {
        setError("Por favor, completa todos los campos correctamente")
        return
      }

      // Ensure organizerId is set
      if (!formData.organizerId && user) {
        setFormData((prev) => ({ ...prev, organizerId: user.id }))
        setDebugInfo((prev) => `${prev || ""}\nEstableciendo organizerId: ${user.id}`)
      }

      const eventData = { ...formData }
      setDebugInfo((prev) => `${prev || ""}\nDatos del evento: ${JSON.stringify(eventData)}`)

      let result

      if (editingEventId) {
        // Updating existing event
        result = await modificarEvento(editingEventId, eventData)
        if (result.success) {
          setSuccess(`Evento "${formData.name}" actualizado con éxito`)
          setEditingEventId(null)
        } else {
          setError(result.error || "Error al actualizar el evento")
        }
      } else {
        // Creating new event
        result = await crearEvento(eventData)
        if (result.success) {
          setSuccess(`Evento "${formData.name}" creado con éxito`)
        } else {
          setError(result.error || "Error al crear el evento")
        }
      }

      setDebugInfo((prev) => `${prev || ""}\nRespuesta: ${JSON.stringify(result)}`)

      if (result.success) {
        // Reset form
        setFormData({
          name: "",
          date: "",
          place: "",
          price: 0,
          capacity: 0,
          description: "",
          organizerId: user?.id || "",
        })

        // Refresh events list
        listarEventos()
      }
    } catch (error: any) {
      console.error("Error en handleSubmit:", error)
      setError(error.message)
      setDebugInfo((prev) => `${prev || ""}\nError en handleSubmit: ${error.message}`)
    }
  }

  const handleEdit = async (eventoId: number) => {
    try {
      const { evento, error } = await consultarEvento(eventoId)
      if (error || !evento) {
        setError(error || "Error al consultar el evento")
        return
      }

      // Set form data with event details
      setFormData({
        name: evento.name,
        date: evento.date,
        place: evento.place,
        price: evento.price,
        capacity: evento.capacity,
        description: evento.description || "",
        organizerId: evento.organizerId,
      })

      setEditingEventId(eventoId)
      setSuccess("Editando evento: " + evento.name)
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleCancelEdit = () => {
    setEditingEventId(null)
    setFormData({
      name: "",
      date: "",
      place: "",
      price: 0,
      capacity: 0,
      description: "",
      organizerId: user?.id || "",
    })
    setSuccess(null)
  }

  const handleCancelEvent = async (eventoId: number) => {
    try {
      const { success, error } = await cancelarEvento(eventoId)
      if (!success) {
        setError(error || "Error al cancelar el evento")
        return
      }

      setSuccess("Evento cancelado con éxito")
      listarEventos()
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleViewEvent = async (eventoId: number) => {
    try {
      const { evento, error } = await consultarEvento(eventoId)
      if (error || !evento) {
        setError(error || "Error al consultar el evento")
        return
      }

      setViewingEvent(evento)
      setViewingEventId(eventoId)
    } catch (error: any) {
      setError(error.message)
    }
  }

  const closeEventDetails = () => {
    setViewingEvent(null)
    setViewingEventId(null)
  }

  if (userLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-xl">Cargando...</p>
      </div>
    )
  }

  if (!user || user.role !== "organizador") {
    return null // No renderizar nada mientras redirige
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Panel de Organizador</h1>

        {eventosError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Error al cargar eventos:</strong> <span>{eventosError}</span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Create/Edit Event Form */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">{editingEventId ? "Editar Evento" : "Crear Nuevo Evento"}</h2>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <strong className="font-bold">Error:</strong> <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Evento
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="place" className="block text-sm font-medium text-gray-700 mb-1">
                  Lugar
                </label>
                <input
                  type="text"
                  id="place"
                  name="place"
                  value={formData.place}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Precio (€)
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price || ""}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidad (número de tickets)
                </label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={formData.capacity || ""}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
                >
                  {editingEventId ? "Actualizar Evento" : "Crear Evento"}
                </button>

                {editingEventId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 bg-gray-300 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-400 transition"
                  >
                    Cancelar Edición
                  </button>
                )}
              </div>
            </form>

      
          </div>

          {/* Events List */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Mis Eventos</h2>

            {eventosLoading ? (
              <p>Cargando eventos...</p>
            ) : eventos.length === 0 ? (
              <p className="text-gray-500">No has creado ningún evento todavía.</p>
            ) : (
              <div className="space-y-4">
                {eventos
                  .filter((evento) => evento.organizerId === user?.id)
                  .map((evento) => (
                    <div key={evento.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">{evento.name}</h3>
                          <p className="text-sm text-gray-600">📅 {evento.date}</p>
                          <p className="text-sm text-gray-600">📍 {evento.place}</p>
                          <p className="text-sm text-gray-600">🎟 Capacidad: {evento.capacity} tickets</p>
                          <p className="font-semibold text-green-600">💶 {evento.price} €</p>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              evento.canceled ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                            }`}
                          >
                            {evento.canceled ? "Cancelado" : "Activo"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={() => handleViewEvent(evento.id)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Ver Detalles
                        </button>

                        {!evento.canceled && (
                          <>
                            <button
                              onClick={() => handleEdit(evento.id)}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              Editar
                            </button>

                            <button
                              onClick={() => handleCancelEvent(evento.id)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              Cancelar Evento
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      {viewingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Detalles del Evento</h2>

            <div className="space-y-3">
              <p>
                <strong>Nombre:</strong> {viewingEvent.name}
              </p>
              <p>
                <strong>Fecha:</strong> {viewingEvent.date}
              </p>
              <p>
                <strong>Lugar:</strong> {viewingEvent.place}
              </p>
              <p>
                <strong>Precio:</strong> {viewingEvent.price} €
              </p>
              <p>
                <strong>Capacidad:</strong> {viewingEvent.capacity} tickets
              </p>
              <p>
                <strong>Estado:</strong> {viewingEvent.canceled ? "Cancelado" : "Activo"}
              </p>

              {viewingEvent.description && (
                <div>
                  <strong>Descripción:</strong>
                  <p className="mt-1">{viewingEvent.description}</p>
                </div>
              )}
            </div>

            <button
              onClick={closeEventDetails}
              className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
