'use client'

import Link from 'next/link'
import { useAuth } from '@/app/AuthProvider'
import './navbar.scss'

export default function Navbar() {
  const { user, loading } = useAuth()

  if (loading) return null

  return (
    <div className="orkut-navbar">
     <Link href="/home" className="orkut-logo">
      orkut
    </Link>


      <div className="search-area">
        <Link href="/auth/logout">Logout</Link>
      </div>
    </div>
  )
}
