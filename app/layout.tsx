import './globals.css'
import AnimatedBackground from '@/components/AnimatedBackground'

export const metadata = {
  title: 'DJ Voting App',
  description: 'Sistem de votare pentru DJ în două runde',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ro">
      <body>
        <AnimatedBackground />
        <div className="min-h-screen relative">
          {children}
        </div>
      </body>
    </html>
  )
}