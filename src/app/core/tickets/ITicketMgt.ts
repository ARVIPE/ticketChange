export interface ITicketMgt {
  emitirTicket(ventaId: number): Promise<{ success: boolean; ticketId?: number; error?: string }>
  validarTicket(ticketId: number): Promise<{ valid: boolean; error?: string }>
  consultarTicket(ticketId: number): Promise<{ ticket: Ticket | null; error?: string }>
  consultarTicketsUsuario(userId: string): Promise<{ tickets: Ticket[]; error?: string }>
  marcarTicketUsado(ticketId: number): Promise<{ success: boolean; error?: string }>
  marcarTicketEnReventa(ticketId: number, precio: number): Promise<{ success: boolean; error?: string }>
}

export interface Ticket {
  id: number
  ventaId: number
  eventoId: number
  eventoNombre: string
  usuarioEmail: string
  fechaEmision: string
  precio: number
  usado: boolean
  enReventa: boolean
  precioReventa?: number
  qrCode?: string
}
