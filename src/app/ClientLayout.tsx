// src/app/ClientLayout.tsx
'use client' // MUST be first line

import { ReactNode } from 'react'
import { useAuth } from './AuthProvider'
import Navbar from '../components/Navbar'

export default function ClientLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  return (
    <>
      {!loading && user && <Navbar />}
      <main className="container">{children}</main>
    </>
  )
}
