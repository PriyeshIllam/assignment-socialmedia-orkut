'use client'

import Link from 'next/link'
import { useAuth } from '@/app/AuthProvider'
import './navbar.scss'

export default function Navbar() {
  const { user, loading } = useAuth()

  if (loading) return null

  return (
    <div className="orkut-navbar">
      <div className="orkut-logo">orkut</div>

      <div className="orkut-links">
        <Link href="/home">Home</Link>
        <Link href="/profile">Profile</Link>
      </div>

      <div className="search-area">
        <Link href="/auth/logout">Logout</Link>
      </div>
    </div>
  )
}
