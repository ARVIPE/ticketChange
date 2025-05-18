"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "../../core/auth/userContext"
import type { UserRole } from "../../core/auth/IUsuarioMgt"

export default function Signup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>("comprador")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const { signup } = useUser()

  const handleSignUp = async () => {
    setError(null)
    setMessage(null)

    if (!email || !password) {
      setError("Por favor, completa todos los campos")
      return
    }

    const { success, error } = await signup(email, password, role)

    if (!success) {
      setError(error || "Error al registrarse")
      return
    }

    setMessage("Registro exitoso! Revisa tu email para verificar tu cuenta.")
    setTimeout(() => {
      router.push("/login")
    }, 3000)
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-xl font-bold text-center mb-6">Sign Up</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-3">
            <strong className="font-bold">Error:</strong> <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-3">
            <span>{message}</span>
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Role:</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="comprador">Comprador</option>
            <option value="organizador">Organizador</option>
            <option value="vendedor">Vendedor</option>
          </select>
        </div>

        <button onClick={handleSignUp} className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600">
          Sign Up
        </button>
      </div>
    </div>
  )
}
