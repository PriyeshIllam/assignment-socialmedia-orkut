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
        <Link href="/scraps">Scraps</Link>
        <Link href="/communities">Communities</Link>

        <div className="dropdown">
          <button className="dropbtn">Applications ▾</button>
          <div className="dropdown-content">
            <Link href="#">Games</Link>
            <Link href="#">Music</Link>
            <Link href="#">Videos</Link>
          </div>
        </div>

        <button className="theme-btn">🎨 Get this theme</button>
      </div>

      <div className="search-area">
        <input type="text" placeholder="Search" />
        <button>search</button>
        <Link href="/auth/logout">Logout</Link>
      </div>
    </div>
  )
}
