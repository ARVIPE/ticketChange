import type { ITransaccionMgt, Transaccion } from "./ITransaccionMgt"

export interface IVentaMgt extends ITransaccionMgt {
  comprarEntrada(eventoId: number, cantidad: number): Promise<{ success: boolean; ventaId?: number; error?: string }>
  cancelarCompra(ventaId: number): Promise<{ success: boolean; error?: string }>
}

export interface Venta extends Transaccion {
  eventoId: number
  cantidad: number
}
