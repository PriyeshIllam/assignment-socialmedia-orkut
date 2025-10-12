// src/app/layout.tsx
import './globals.scss'
import { ReactNode } from 'react'
import AuthProvider from './AuthProvider'
import ClientLayout from './ClientLayout'

export const metadata = {
  title: 'Orkut Clone',
  description: 'Fullstack social app using Next.js + Supabase',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ClientLayout>{children}</ClientLayout>
        </AuthProvider>
      </body>
    </html>
  )
}
