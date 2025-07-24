'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        <div>
          <div className="flex justify-center mb-8">
            <Image
              src="/images/logof.png"
              alt="DJ Battle Logo"
              width={200}
              height={200}
              className="max-w-full h-auto"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary">
            Votare DJ
          </h1>
          <p className="text-xl mb-8 text-secondary">
            Sistem de votare pentru cel mai bun DJ în două runde
          </p>
          
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {/* Runda 1 */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-primary text-center mb-4">Runda 1</h3>
              <Link href="/round-1" className="btn-primary block text-center w-full">
                Votare
              </Link>
              <Link href="/round-1-results" className="btn-primary block text-center w-full">
                Rezultate
              </Link>
            </div>
            
            {/* Runda 2 */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-primary text-center mb-4">Runda 2 - Finala</h3>
              <Link href="/round-2" className="btn-secondary block text-center w-full">
                Votare
              </Link>
              <Link href="/round-2-results" className="btn-secondary block text-center w-full">
                Rezultate
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}