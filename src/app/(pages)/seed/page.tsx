"use client"

import { useState } from "react"
import { eventService } from "../../business/events/eventService"
import Navbar from "../../components/navbar/navbar"

export default function SeedPage() {
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSeedEvents = async () => {
    setLoading(true)
    setResult(null)

    try {
      const events = [
        {
          name: "Concierto de Rock",
          date: "2023-12-15",
          place: "Estadio Metropolitano",
          price: 45.99,
          capacity: 100,
          description: "Gran concierto de rock con las mejores bandas",
          organizerId: null, // Se asignará después
        },
        {
          name: "Festival de Jazz",
          date: "2023-12-20",
          place: "Parque del Retiro",
          price: 35.5,
          capacity: 50,
          description: "Festival anual de jazz con artistas internacionales",
          organizerId: null,
        },
        {
          name: "Teatro: Romeo y Julieta",
          date: "2023-12-25",
          place: "Teatro Real",
          price: 25.0,
          capacity: 30,
          description: "Representación clásica de la obra de Shakespeare",
          organizerId: null,
        },
      ]

      // Obtener el usuario actual para asignar como organizador
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        for (const event of events) {
          event.organizerId = data.user.id
          const { success, error, eventoId } = await eventService.crearEvento(event)
          if (!success) {
            setResult((prev) => `${prev || ""}\nError al crear evento ${event.name}: ${error}`)
          } else {
            setResult((prev) => `${prev || ""}\nEvento creado: ${event.name} (ID: ${eventoId})`)
          }
        }
      } else {
        setResult("No hay usuario autenticado. Inicia sesión primero.")
      }
    } catch (error: any) {
      setResult(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Herramienta de Datos de Prueba</h1>

        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Insertar Datos de Prueba</h2>

          <button
            onClick={handleSeedEvents}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300"
          >
            {loading ? "Insertando datos..." : "Insertar Eventos de Prueba"}
          </button>

          {result && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2">Resultado:</h3>
              <pre className="whitespace-pre-wrap text-sm">{result}</pre>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Import supabase for user authentication
import { supabase } from "../../lib/supabaseClient"
