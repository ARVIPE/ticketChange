import type { ITransaccionMgt, Transaccion } from "./ITransaccionMgt"

export interface IReventaMgt extends ITransaccionMgt {
  publicarReventa(ticketId: number, precio: number): Promise<{ success: boolean; reventaId?: number; error?: string }>
  comprarReventa(reventaId: number): Promise<{ success: boolean; ventaId?: number; error?: string }>
  listarReventas(): Promise<{ reventas: Reventa[]; error?: string }>
}

export interface Reventa extends Transaccion {
  ticketId: number
  precioOriginal: number
  vendedorEmail: string
}
