// src/app/layout.tsx
import './globals.scss'
import { ReactNode } from 'react'
import ClientLayout from './ClientLayout'

export const metadata = {
  title: 'Orkut Clone',
  description: 'Fullstack social app using Next.js + Supabase',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
