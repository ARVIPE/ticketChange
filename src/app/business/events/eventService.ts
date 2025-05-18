import { supabase } from "../../lib/supabaseClient"
import type { Evento, EventoFiltros, EventoInput, IEventsMgt } from "./IEventsMgt"

export class EventService implements IEventsMgt {
  async crearEvento(evento: EventoInput): Promise<{ success: boolean; eventoId?: number; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("events")
        .insert([
          {
            name: evento.name,
            date: evento.date,
            place: evento.place,
            price: evento.price,
            capacity: evento.capacity,
            description: evento.description || "",
            organizer_id: evento.organizerId,
            canceled: false,
          },
        ])
        .select()

      if (error) throw error

      return { success: true, eventoId: data[0].id }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async modificarEvento(eventoId: number, datos: Partial<EventoInput>): Promise<{ success: boolean; error?: string }> {
    try {
      // Convert from camelCase to snake_case for database
      const dbData: any = {}
      if (datos.name) dbData.name = datos.name
      if (datos.date) dbData.date = datos.date
      if (datos.place) dbData.place = datos.place
      if (datos.price) dbData.price = datos.price
      if (datos.capacity) dbData.capacity = datos.capacity
      if (datos.description) dbData.description = datos.description
      if (datos.organizerId) dbData.organizer_id = datos.organizerId

      const { error } = await supabase.from("events").update(dbData).eq("id", eventoId)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async cancelarEvento(eventoId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from("events").update({ canceled: true }).eq("id", eventoId)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async consultarEvento(eventoId: number): Promise<{ evento: Evento | null; error?: string }> {
    try {
      const { data, error } = await supabase.from("events").select("*").eq("id", eventoId).single()

      if (error) throw error

      if (!data) return { evento: null, error: "Evento no encontrado" }

      const evento: Evento = {
        id: data.id,
        name: data.name,
        date: data.date,
        place: data.place,
        price: data.price,
        capacity: data.capacity,
        description: data.description,
        organizerId: data.organizer_id,
        canceled: data.canceled,
      }

      return { evento }
    } catch (error: any) {
      return { evento: null, error: error.message }
    }
  }

  async listarEventos(filtros?: EventoFiltros): Promise<{ eventos: Evento[]; error?: string }> {
    try {
      let query = supabase.from("events").select("*")

      // Apply filters if provided
      if (filtros) {
        if (filtros.fecha) query = query.eq("date", filtros.fecha)
        if (filtros.lugar) query = query.ilike("place", `%${filtros.lugar}%`)
        if (filtros.precioMin) query = query.gte("price", filtros.precioMin)
        if (filtros.precioMax) query = query.lte("price", filtros.precioMax)
        if (filtros.organizerId) query = query.eq("organizer_id", filtros.organizerId)
      }

      const { data, error } = await query

      if (error) throw error

      const eventos: Evento[] = data.map((item) => ({
        id: item.id,
        name: item.name,
        date: item.date,
        place: item.place,
        price: item.price,
        capacity: item.capacity,
        description: item.description,
        organizerId: item.organizer_id,
        canceled: item.canceled,
      }))

      return { eventos }
    } catch (error: any) {
      return { eventos: [], error: error.message }
    }
  }

  async consultarDisponibilidad(eventoId: number): Promise<{ disponibles: number; error?: string }> {
    try {
      // Get event capacity
      const { data: evento, error: eventoError } = await supabase
        .from("events")
        .select("capacity")
        .eq("id", eventoId)
        .single()

      if (eventoError || !evento) {
        throw new Error(eventoError?.message || "Evento no encontrado")
      }

      // Count sold tickets
      const { count, error: ticketsError } = await supabase
        .from("tickets")
        .select("*", { count: "exact" })
        .eq("evento_id", eventoId)

      if (ticketsError) throw ticketsError

      const disponibles = evento.capacity - (count || 0)
      return { disponibles }
    } catch (error: any) {
      return { disponibles: 0, error: error.message }
    }
  }
}

// Create a singleton instance
export const eventService = new EventService()
