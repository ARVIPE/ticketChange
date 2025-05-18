"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "../../core/auth/userContext"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login, loading } = useUser()

  const handleSignIn = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { success, error } = await login(email, password)

      if (!success) {
        setError("Error de inicio de sesión: " + (error || "Credenciales inválidas"))
        return
      }

      // The redirection is handled in the userContext after successful login
    } catch (err: any) {
      setError("Error inesperado: " + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-xl">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-xl font-bold text-center mb-6">Login</h1>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-3">
            <strong className="font-bold">Error:</strong> <span>{error}</span>
          </div>
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-3"
          disabled={isLoading}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
          disabled={isLoading}
        />
        <button
          onClick={handleSignIn}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
          disabled={isLoading}
        >
          {isLoading ? "Iniciando sesión..." : "Sign In"}
        </button>
      </div>
    </div>
  )
}
