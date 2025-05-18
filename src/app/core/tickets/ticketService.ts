import { supabase } from "../../lib/supabaseClient"
import type { ITicketMgt, Ticket } from "./ITicketMgt"

export class TicketService implements ITicketMgt {
  async emitirTicket(ventaId: number): Promise<{ success: boolean; ticketId?: number; error?: string }> {
    try {
      // Get sale information
      const { data: venta, error: ventaError } = await supabase
        .from("sales")
        .select("user_email, events_name, price")
        .eq("id", ventaId)
        .single()

      if (ventaError || !venta) {
        throw new Error(ventaError?.message || "Venta no encontrada")
      }

      // Get event information
      const { data: evento, error: eventoError } = await supabase
        .from("events")
        .select("id")
        .eq("name", venta.events_name)
        .single()

      if (eventoError || !evento) {
        throw new Error(eventoError?.message || "Evento no encontrado")
      }

      // Generate QR code (in a real app, this would be a proper QR code)
      const qrCode = `TICKET-${ventaId}-${Date.now()}`

      // Create ticket
      const { data, error } = await supabase
        .from("tickets")
        .insert([
          {
            venta_id: ventaId,
            evento_id: evento.id,
            evento_nombre: venta.events_name,
            usuario_email: venta.user_email,
            fecha_emision: new Date().toISOString(),
            precio: venta.price,
            usado: false,
            en_reventa: false,
            qr_code: qrCode,
          },
        ])
        .select()

      if (error) throw error

      return { success: true, ticketId: data[0].id }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async validarTicket(ticketId: number): Promise<{ valid: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.from("tickets").select("usado, en_reventa").eq("id", ticketId).single()

      if (error) throw error

      // A ticket is valid if it's not used and not in resale
      return { valid: !data.usado && !data.en_reventa }
    } catch (error: any) {
      return { valid: false, error: error.message }
    }
  }

  async consultarTicket(ticketId: number): Promise<{ ticket: Ticket | null; error?: string }> {
    try {
      const { data, error } = await supabase.from("tickets").select("*").eq("id", ticketId).single()

      if (error) throw error

      if (!data) return { ticket: null, error: "Ticket no encontrado" }

      const ticket: Ticket = {
        id: data.id,
        ventaId: data.venta_id,
        eventoId: data.evento_id,
        eventoNombre: data.evento_nombre,
        usuarioEmail: data.usuario_email,
        fechaEmision: data.fecha_emision,
        precio: data.precio,
        usado: data.usado,
        enReventa: data.en_reventa,
        precioReventa: data.precio_reventa,
        qrCode: data.qr_code,
      }

      return { ticket }
    } catch (error: any) {
      return { ticket: null, error: error.message }
    }
  }

  async consultarTicketsUsuario(userId: string): Promise<{ tickets: Ticket[]; error?: string }> {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error("Usuario no autenticado")

      const { data, error } = await supabase.from("tickets").select("*").eq("usuario_email", userData.user.email)

      if (error) throw error

      const tickets: Ticket[] = data.map((item) => ({
        id: item.id,
        ventaId: item.venta_id,
        eventoId: item.evento_id,
        eventoNombre: item.evento_nombre,
        usuarioEmail: item.usuario_email,
        fechaEmision: item.fecha_emision,
        precio: item.precio,
        usado: item.usado,
        enReventa: item.en_reventa,
        precioReventa: item.precio_reventa,
        qrCode: item.qr_code,
      }))

      return { tickets }
    } catch (error: any) {
      return { tickets: [], error: error.message }
    }
  }

  async marcarTicketUsado(ticketId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from("tickets").update({ usado: true }).eq("id", ticketId)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async marcarTicketEnReventa(ticketId: number, precio: number): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ en_reventa: true, precio_reventa: precio })
        .eq("id", ticketId)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}

// Create a singleton instance
export const ticketService = new TicketService()
