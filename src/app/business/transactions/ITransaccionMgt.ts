export interface ITransaccionMgt {
  consultarTransaccion(transaccionId: number): Promise<{ transaccion: Transaccion | null; error?: string }>
  listarTransaccionesUsuario(userId: string): Promise<{ transacciones: Transaccion[]; error?: string }>
}

export interface Transaccion {
  id: number
  tipo: "venta" | "reventa"
  usuarioEmail: string
  eventoNombre: string
  precio: number
  fecha: string
  estado: "completada" | "cancelada" | "pendiente"
}
