import './globals.scss'
import { ReactNode } from 'react'
import AuthProvider from './AuthProvider'
import Navbar from '../components/Navbar'

export const metadata = {
  title: 'Orkut Clone',
  description: 'Fullstack social app using Next.js + Supabase',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main className="container">{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
