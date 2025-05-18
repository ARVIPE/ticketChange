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
        <Link href="/buyer">
          <span className="text-xl font-bold cursor-pointer">TicketChange</span>
        </Link>

        {/* Dynamic Navigation */}
        <div className="hidden md:flex space-x-6">
          <Link href="/buyer">
            <span className="hover:underline cursor-pointer">Dashboard</span>
          </Link>

          {user?.role === "organizador" && (
            <Link href="/organizador">
              <span className="hover:underline cursor-pointer">Event Organizer</span>
            </Link>
          )}
          {user?.role === "vendedor" && (
            <Link href="/vendedor">
              <span className="hover:underline cursor-pointer">Seller Panel</span>
            </Link>
          )}
        </div>

        {/* Logout */}
        {user ? (
          <button className="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600" onClick={handleLogout}>
            Logout
          </button>
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
