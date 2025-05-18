import { supabase } from "../lib/supabaseClient"

export async function seedData() {
  try {
    // Insertar eventos de prueba
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .insert([
        {
          name: "Concierto de Rock",
          date: "2023-12-15",
          place: "Estadio Metropolitano",
          price: 45.99,
          capacity: 100,
          description: "Gran concierto de rock con las mejores bandas",
          canceled: false,
        },
        {
          name: "Festival de Jazz",
          date: "2023-12-20",
          place: "Parque del Retiro",
          price: 35.5,
          capacity: 50,
          description: "Festival anual de jazz con artistas internacionales",
          canceled: false,
        },
        {
          name: "Teatro: Romeo y Julieta",
          date: "2023-12-25",
          place: "Teatro Real",
          price: 25.0,
          capacity: 30,
          description: "Representación clásica de la obra de Shakespeare",
          canceled: false,
        },
      ])
      .select()

    if (eventsError) {
      console.error("Error al insertar eventos:", eventsError)
      return
    }

    console.log("Eventos insertados:", events)

    // Puedes añadir más datos de prueba aquí si lo necesitas

    return { success: true }
  } catch (error) {
    console.error("Error al sembrar datos:", error)
    return { success: false, error }
  }
}
