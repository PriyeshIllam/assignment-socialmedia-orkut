import './globals.scss'
import { ReactNode } from 'react'

export const metadata = {
  title: 'Orkut Clone',
  description: 'Fullstack social app using Next.js + Supabase',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="container">{children}</main>
      </body>
    </html>
  )
}
