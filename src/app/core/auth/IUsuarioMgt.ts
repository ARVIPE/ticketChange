export interface IUsuarioMgt {
  registrarUsuario(email: string, password: string, role: UserRole): Promise<{ success: boolean; error?: string }>
  iniciarSesion(email: string, password: string): Promise<{ success: boolean; error?: string }>
  cerrarSesion(): Promise<void>
  obtenerUsuarioActual(): Promise<User | null>
}

export type UserRole = "comprador" | "organizador" | "vendedor"

export interface User {
  id: string
  email: string
  role: UserRole
}

export interface UserProfile extends User {
  name?: string
  phone?: string
  address?: string
}
