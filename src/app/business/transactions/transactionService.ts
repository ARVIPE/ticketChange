import { supabase } from "../../lib/supabaseClient"
import type { ITransaccionMgt, Transaccion } from "./ITransaccionMgt"
import type { IVentaMgt } from "./IVentaMgt"
import type { IReventaMgt, Reventa } from "./IReventaMgt"
import { ticketService } from "../../core/tickets/ticketService"
import { eventService } from "../events/eventService"

export class TransactionService implements ITransaccionMgt, IVentaMgt, IReventaMgt {
  // Base Transaction Methods
  async consultarTransaccion(transaccionId: number): Promise<{ transaccion: Transaccion | null; error?: string }> {
    try {
      const { data, error } = await supabase.from("transactions").select("*").eq("id", transaccionId).single()

      if (error) throw error

      if (!data) return { transaccion: null, error: "Transacción no encontrada" }

      const transaccion: Transaccion = {
        id: data.id,
        tipo: data.tipo,
        usuarioEmail: data.usuario_email,
        eventoNombre: data.evento_nombre,
        precio: data.precio,
        fecha: data.fecha,
        estado: data.estado,
      }

      return { transaccion }
    } catch (error: any) {
      return { transaccion: null, error: error.message }
    }
  }

  async listarTransaccionesUsuario(userId: string): Promise<{ transacciones: Transaccion[]; error?: string }> {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error("Usuario no autenticado")

      const { data, error } = await supabase.from("transactions").select("*").eq("usuario_email", userData.user.email)

      if (error) throw error

      const transacciones: Transaccion[] = data.map((item) => ({
        id: item.id,
        tipo: item.tipo,
        usuarioEmail: item.usuario_email,
        eventoNombre: item.evento_nombre,
        precio: item.precio,
        fecha: item.fecha,
        estado: item.estado,
      }))

      return { transacciones }
    } catch (error: any) {
      return { transacciones: [], error: error.message }
    }
  }

  // Sale Methods (IVentaMgt)
  async comprarEntrada(
    eventoId: number,
    cantidad = 1,
  ): Promise<{ success: boolean; ventaId?: number; error?: string }> {
    try {
      // Check event availability
      const { evento, error: eventoError } = await eventService.consultarEvento(eventoId)
      if (eventoError || !evento) {
        throw new Error(eventoError || "Evento no encontrado")
      }

      if (evento.canceled) {
        throw new Error("El evento ha sido cancelado")
      }

      const { disponibles, error: dispError } = await eventService.consultarDisponibilidad(eventoId)
      if (dispError) throw new Error(dispError)

      if (disponibles < cantidad) {
        throw new Error(`Solo quedan ${disponibles} entradas disponibles`)
      }

      // Get current user
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error("Usuario no autenticado")

      // Create sale record
      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert([
          {
            user_email: userData.user.email,
            events_name: evento.name,
            price: evento.price,
            quantity: cantidad,
            selling_date: new Date().toISOString(),
          },
        ])
        .select()

      if (saleError) throw saleError

      // Create transaction record
      const { error: transError } = await supabase.from("transactions").insert([
        {
          tipo: "venta",
          usuario_email: userData.user.email,
          evento_nombre: evento.name,
          evento_id: eventoId,
          precio: evento.price * cantidad,
          fecha: new Date().toISOString(),
          estado: "completada",
          venta_id: saleData[0].id,
        },
      ])

      if (transError) throw transError

      // Issue tickets
      for (let i = 0; i < cantidad; i++) {
        await ticketService.emitirTicket(saleData[0].id)
      }

      return { success: true, ventaId: saleData[0].id }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async cancelarCompra(ventaId: number): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if the sale exists
      const { data: venta, error: ventaError } = await supabase.from("sales").select("*").eq("id", ventaId).single()

      if (ventaError || !venta) {
        throw new Error(ventaError?.message || "Venta no encontrada")
      }

      // Get current user
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error("Usuario no autenticado")

      // Verify ownership
      if (venta.user_email !== userData.user.email) {
        throw new Error("No tienes permiso para cancelar esta compra")
      }

      // Update transaction status
      const { error: transError } = await supabase
        .from("transactions")
        .update({ estado: "cancelada" })
        .eq("venta_id", ventaId)

      if (transError) throw transError

      // Mark tickets as used (invalidate them)
      const { data: tickets, error: ticketsError } = await supabase.from("tickets").select("id").eq("venta_id", ventaId)

      if (ticketsError) throw ticketsError

      for (const ticket of tickets) {
        await ticketService.marcarTicketUsado(ticket.id)
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Resale Methods (IReventaMgt)
  async publicarReventa(
    ticketId: number,
    precio: number,
  ): Promise<{ success: boolean; reventaId?: number; error?: string }> {
    try {
      // Check if the ticket exists and is valid
      const { ticket, error: ticketError } = await ticketService.consultarTicket(ticketId)
      if (ticketError || !ticket) {
        throw new Error(ticketError || "Ticket no encontrado")
      }

      // Validate ticket
      const { valid, error: validError } = await ticketService.validarTicket(ticketId)
      if (validError) throw new Error(validError)
      if (!valid) {
        throw new Error("El ticket no es válido para reventa")
      }

      // Get current user
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error("Usuario no autenticado")

      // Verify ownership
      if (ticket.usuarioEmail !== userData.user.email) {
        throw new Error("No eres el propietario de este ticket")
      }

      // Mark ticket as in resale
      await ticketService.marcarTicketEnReventa(ticketId, precio)

      // Create resale record
      const { data: resaleData, error: resaleError } = await supabase
        .from("resales")
        .insert([
          {
            ticket_id: ticketId,
            seller_email: userData.user.email,
            price: precio,
            original_price: ticket.precio,
            evento_nombre: ticket.eventoNombre,
            fecha: new Date().toISOString(),
            estado: "pendiente",
          },
        ])
        .select()

      if (resaleError) throw resaleError

      // Create transaction record
      const { error: transError } = await supabase.from("transactions").insert([
        {
          tipo: "reventa",
          usuario_email: userData.user.email,
          evento_nombre: ticket.eventoNombre,
          precio: precio,
          fecha: new Date().toISOString(),
          estado: "pendiente",
          reventa_id: resaleData[0].id,
        },
      ])

      if (transError) throw transError

      return { success: true, reventaId: resaleData[0].id }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async comprarReventa(reventaId: number): Promise<{ success: boolean; ventaId?: number; error?: string }> {
    try {
      // Check if the resale exists
      const { data: reventa, error: reventaError } = await supabase
        .from("resales")
        .select("*")
        .eq("id", reventaId)
        .single()

      if (reventaError || !reventa) {
        throw new Error(reventaError?.message || "Reventa no encontrada")
      }

      if (reventa.estado !== "pendiente") {
        throw new Error("Esta reventa ya no está disponible")
      }

      // Get current user
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error("Usuario no autenticado")

      // Prevent buying your own resale
      if (reventa.seller_email === userData.user.email) {
        throw new Error("No puedes comprar tu propia reventa")
      }

      // Create sale record
      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert([
          {
            user_email: userData.user.email,
            events_name: reventa.evento_nombre,
            price: reventa.price,
            quantity: 1,
            selling_date: new Date().toISOString(),
            resale_id: reventaId,
          },
        ])
        .select()

      if (saleError) throw saleError

      // Update resale status
      const { error: updateError } = await supabase
        .from("resales")
        .update({ estado: "completada", buyer_email: userData.user.email })
        .eq("id", reventaId)

      if (updateError) throw updateError

      // Update transaction status
      const { error: transError } = await supabase
        .from("transactions")
        .update({ estado: "completada" })
        .eq("reventa_id", reventaId)

      if (transError) throw transError

      // Update ticket ownership
      const { error: ticketError } = await supabase
        .from("tickets")
        .update({ usuario_email: userData.user.email, en_reventa: false })
        .eq("id", reventa.ticket_id)

      if (ticketError) throw ticketError

      // Create new transaction for the buyer
      const { error: buyerTransError } = await supabase.from("transactions").insert([
        {
          tipo: "reventa",
          usuario_email: userData.user.email,
          evento_nombre: reventa.evento_nombre,
          precio: reventa.price,
          fecha: new Date().toISOString(),
          estado: "completada",
          venta_id: saleData[0].id,
        },
      ])

      if (buyerTransError) throw buyerTransError

      return { success: true, ventaId: saleData[0].id }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }



  async listarReventas(): Promise<{ reventas: Reventa[]; error?: string }> {
    try {
      const { data, error } = await supabase.from("resales").select("*").eq("estado", "pendiente")

      if (error) throw error

      const reventas: Reventa[] = data.map((item) => ({
        id: item.id,
        tipo: "reventa",
        usuarioEmail: item.seller_email,
        eventoNombre: item.evento_nombre,
        precio: item.price,
        fecha: item.fecha,
        estado: item.estado,
        ticketId: item.ticket_id,
        precioOriginal: item.original_price,
        vendedorEmail: item.seller_email,
      }))

      return { reventas }
    } catch (error: any) {
      return { reventas: [], error: error.message }
    }
  }
}

// Create a singleton instance
export const transactionService = new TransactionService()
