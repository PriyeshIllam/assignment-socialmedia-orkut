'use client'

import { ReactNode } from 'react'
import AuthProvider, { useAuth } from './AuthProvider'
import Navbar from '../components/Navbar'

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <InnerLayout>{children}</InnerLayout>
    </AuthProvider>
  )
}

// Inner layout consumes the Auth context
function InnerLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  return (
    <>
      {!loading && user && <Navbar />}
      <main className="container">{children}</main>
    </>
  )
}
