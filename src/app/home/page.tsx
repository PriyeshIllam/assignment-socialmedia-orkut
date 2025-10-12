'use client'

import { useAuth } from '../AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoggedInHome() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) return <p>Loading...</p>
  if (!user) return null

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Welcome to Orkut, {user.email}!</h1>
      <p>This is your logged-in home page 🎉</p>
      <p>
        From here, you can access your feed, posts, and communities (to be added next).
      </p>
    </div>
  )
}
