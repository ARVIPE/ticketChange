import { eventService } from "../business/events/eventService"
import { transactionService } from "../business/transactions/transactionService"

export class TicketSaleProcess {
  /**
   * Complete ticket sale process
   * @param eventoId Event ID
   * @param cantidad Number of tickets to buy
   */
  static async procesarCompra(
    eventoId: number,
    cantidad = 1,
  ): Promise<{ success: boolean; message: string; ticketIds?: number[] }> {
    try {
      // 1. Check event availability
      const { evento, error: eventoError } = await eventService.consultarEvento(eventoId)
      if (eventoError || !evento) {
        return { success: false, message: eventoError || "Evento no encontrado" }
      }

      if (evento.canceled) {
        return { success: false, message: "El evento ha sido cancelado" }
      }

      const { disponibles, error: dispError } = await eventService.consultarDisponibilidad(eventoId)
      if (dispError) {
        return { success: false, message: dispError }
      }

      if (disponibles < cantidad) {
        return { success: false, message: `Solo quedan ${disponibles} entradas disponibles` }
      }

      // 2. Process the purchase
      const { success, ventaId, error } = await transactionService.comprarEntrada(eventoId, cantidad)
      if (!success || !ventaId) {
        return { success: false, message: error || "Error al procesar la compra" }
      }

      // 3. Get the tickets
      const { data: tickets, error: ticketsError } = await supabase.from("tickets").select("id").eq("venta_id", ventaId)

      if (ticketsError) {
        return { success: false, message: ticketsError.message }
      }

      return {
        success: true,
        message: `Compra realizada con éxito. Se han emitido ${tickets.length} tickets.`,
        ticketIds: tickets.map((t: any) => t.id),
      }
    } catch (error: any) {
      return { success: false, message: error.message }
    }
  }
}

// Import supabase for direct database access
import { supabase } from "../lib/supabaseClient"
