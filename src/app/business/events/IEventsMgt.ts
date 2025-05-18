export interface IEventsMgt {
  crearEvento(evento: EventoInput): Promise<{ success: boolean; eventoId?: number; error?: string }>
  modificarEvento(eventoId: number, datos: Partial<EventoInput>): Promise<{ success: boolean; error?: string }>
  cancelarEvento(eventoId: number): Promise<{ success: boolean; error?: string }>
  consultarEvento(eventoId: number): Promise<{ evento: Evento | null; error?: string }>
  listarEventos(filtros?: EventoFiltros): Promise<{ eventos: Evento[]; error?: string }>
  consultarDisponibilidad(eventoId: number): Promise<{ disponibles: number; error?: string }>
}

export interface EventoInput {
  name: string
  date: string
  place: string
  price: number
  capacity: number
  description?: string
  organizerId: string
}

export interface Evento extends EventoInput {
  id: number
  canceled: boolean
}

export interface EventoFiltros {
  fecha?: string
  lugar?: string
  precioMin?: number
  precioMax?: number
  organizerId?: string
}
