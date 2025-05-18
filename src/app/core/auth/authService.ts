import { supabase } from "../../lib/supabaseClient"
import type { IUsuarioMgt, User, UserProfile, UserRole } from "./IUsuarioMgt"

export class AuthService implements IUsuarioMgt {
  async registrarUsuario(
    email: string,
    password: string,
    role: UserRole,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError

      // Create user profile in the users table
      // Note: We're using email as the primary key now
      const { error: profileError } = await supabase.from("users").insert([
        {
          email,
          role,
        },
      ])

      if (profileError) throw profileError

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async iniciarSesion(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async cerrarSesion(): Promise<void> {
    await supabase.auth.signOut()
  }

  async verificarCuenta(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      // This would typically involve verifying a token sent via email
      // For Supabase, this is handled automatically via email links
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async obtenerUsuarioActual(): Promise<User | null> {
    const { data } = await supabase.auth.getUser()
    if (!data.user) return null

    const { data: userData, error } = await supabase
      .from("users")
      .select("email, role")
      .eq("email", data.user.email)
      .single()

    if (error || !userData) return null

    return {
      id: data.user.id, // Mantenemos el ID de auth.users para referencia
      email: userData.email,
      role: userData.role,
    }
  }

  async actualizarPerfil(userData: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> {
    try {
      const { data } = await supabase.auth.getUser()
      if (!data.user) throw new Error("No authenticated user")

      const { error } = await supabase.from("users").update(userData).eq("email", data.user.email)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}

// Create a singleton instance
export const authService = new AuthService()
