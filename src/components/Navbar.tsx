'use client'

import Link from 'next/link'
import { useAuth } from '@/app/AuthProvider'

export default function Navbar() {
  const { user, loading } = useAuth()

  if (loading) return null

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '1rem 0',
      borderBottom: '1px solid #ddd'
    }}>
      <Link href="/">🏠 Home</Link>
      <div>
        {user ? (
          <>
            <span style={{ marginRight: '1rem' }}>Hi, {user.email}</span>
            <Link href="/auth/logout">Logout</Link>
          </>
        ) : (
          <>
            <Link href="/auth/login" style={{ marginRight: '1rem' }}>Login</Link>
            <Link href="/auth/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}
