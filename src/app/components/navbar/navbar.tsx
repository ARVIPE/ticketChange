"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useUser } from "../../core/auth/userContext"

export default function Navbar() {
  const { user, logout } = useUser()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <nav className="bg-blue-600 text-white py-4 px-6 shadow-md">
      <div className="flex justify-between items-center max-w-6xl mx-auto">
        <Link href="/">
          <span className="text-xl font-bold cursor-pointer">TicketChange</span>
        </Link>

        {/* Dynamic Navigation */}
        <div className="hidden md:flex space-x-6">
          {/* Todos los usuarios pueden ver eventos */}
          <Link href="/buyer">
            <span className="hover:underline cursor-pointer">Eventos</span>
          </Link>

          {/* Solo compradores pueden ver sus tickets y el marketplace */}
          {user && (user.role === "comprador" || user.role === "vendedor") && (
            <>
              <Link href="/my-tickets">
                <span className="hover:underline cursor-pointer">Mis Tickets</span>
              </Link>

              <Link href="/transactions">
                <span className="hover:underline cursor-pointer">Mis Transacciones</span>
              </Link>

              {user.role === "comprador" && (
                <Link href="/marketplace">
                  <span className="hover:underline cursor-pointer">Marketplace</span>
                </Link>
              )}
            </>
          )}

          {/* Solo organizadores pueden acceder al panel de organizador */}
          {user?.role === "organizador" && (
            <Link href="/organiser">
              <span className="hover:underline cursor-pointer">Panel Organizador</span>
            </Link>
          )}

          {/* Solo vendedores pueden acceder al panel de vendedor */}
          {user?.role === "vendedor" && (
            <Link href="/seller">
              <span className="hover:underline cursor-pointer">Panel Vendedor</span>
            </Link>
          )}
        </div>

        {/* Logout */}
        {user ? (
          <div className="flex items-center space-x-4">
            <span className="text-sm hidden md:inline">
              {user.email} ({user.role})
            </span>
            <button className="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <div className="space-x-4">
            <Link href="/login">
              <button className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-200">Login</button>
            </Link>
            <Link href="/signup">
              <button className="bg-green-500 px-4 py-2 rounded-lg hover:bg-green-600">Sign Up</button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
