import { transactionService } from "../business/transactions/transactionService"
import { ticketService } from "../core/tickets/ticketService"

export class TicketResaleProcess {
  /**
   * Process to put a ticket for resale
   * @param ticketId Ticket ID
   * @param precio Resale price
   */
  static async publicarTicketReventa(
    ticketId: number,
    precio: number,
  ): Promise<{ success: boolean; message: string; reventaId?: number }> {
    try {
      // 1. Validate the ticket
      const { ticket, error: ticketError } = await ticketService.consultarTicket(ticketId)
      if (ticketError || !ticket) {
        return { success: false, message: ticketError || "Ticket no encontrado" }
      }

      const { valid, error: validError } = await ticketService.validarTicket(ticketId)
      if (validError) {
        return { success: false, message: validError }
      }

      if (!valid) {
        return { success: false, message: "El ticket no es válido para reventa" }
      }

      // 2. Publish the resale
      const { success, reventaId, error } = await transactionService.publicarReventa(ticketId, precio)
      if (!success || !reventaId) {
        return { success: false, message: error || "Error al publicar la reventa" }
      }

      return {
        success: true,
        message: "Ticket publicado para reventa correctamente",
        reventaId,
      }
    } catch (error: any) {
      return { success: false, message: error.message }
    }
  }

  /**
   * Process to buy a ticket from resale
   * @param reventaId Resale ID
   */
  static async comprarTicketReventa(
    reventaId: number,
  ): Promise<{ success: boolean; message: string; ticketId?: number }> {
    try {
      // 1. Check if the resale exists
      const { data: reventa, error: reventaError } = await supabase
        .from("resales")
        .select("*")
        .eq("id", reventaId)
        .single()

      if (reventaError || !reventa) {
        return { success: false, message: reventaError?.message || "Reventa no encontrada" }
      }

      if (reventa.estado !== "pendiente") {
        return { success: false, message: "Esta reventa ya no está disponible" }
      }

      // 2. Process the purchase
      const { success, ventaId, error } = await transactionService.comprarReventa(reventaId)
      if (!success) {
        return { success: false, message: error || "Error al procesar la compra" }
      }

      return {
        success: true,
        message: "Compra de reventa realizada con éxito",
        ticketId: reventa.ticket_id,
      }
    } catch (error: any) {
      return { success: false, message: error.message }
    }
  }
}

// Import supabase for direct database access
import { supabase } from "../lib/supabaseClient"
