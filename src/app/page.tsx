'use client'

import './home.scss'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabaseClient'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // local state for login form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // redirect if logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/home')
    }
  }, [user, loading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      router.push('/home')
    }

    setIsSubmitting(false)
  }

  if (loading) return <p>Loading...</p>
  if (user) return null // prevent flicker while redirecting

  return (
    <div className="home">
      <div className="content">
        <div className="left-section">
          <div className="logo">orkut</div>
          <p>Connect with friends and family using scraps and instant messaging.</p>
          <p>Discover new people through friends of friends and communities.</p>
          <p>Share your videos, pictures, and passions all in one place.</p>
        </div>

        <div className="login-box">
          <h2>Login to Orkut with your Supabase Account</h2>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label>
              <input type="checkbox" /> Remember me on this computer
            </label>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
            {error && <p className="error">{error}</p>}
          </form>
<div className="links">
  <p>Not a member yet? <Link href="/auth/register">Sign up now!</Link></p>
</div>

        </div>
      </div>

      <footer>
        <Link href="#">About</Link> | <Link href="#">Help Center</Link> |{' '}
        <Link href="#">Safety Center</Link> | <Link href="#">Privacy</Link> |{' '}
        <Link href="#">Terms</Link>
      </footer>
    </div>
  )
}
