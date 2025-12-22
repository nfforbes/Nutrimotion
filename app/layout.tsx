import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'Nutrimotion',
  description: 'Nutrition and Training Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Header />
        <main className="main-content">
          {children}
        </main>
      </body>
    </html>
  )
}

