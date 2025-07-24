'use client'

import { useState } from 'react'
import { DJ } from '@/lib/supabase'

interface DJCardProps {
  dj: DJ
  onVote: (djId: number) => Promise<void>
  disabled?: boolean
  votedDjId?: number | null
}

export default function DJCard({ dj, onVote, disabled = false, votedDjId = null }: DJCardProps) {
  const [isVoting, setIsVoting] = useState(false)

  const handleVote = async () => {
    if (disabled || votedDjId !== null || isVoting) return
    
    setIsVoting(true)
    try {
      await onVote(dj.id)
    } catch (error: any) {
      console.error('Eroare la votare:', error)
      // Procesarea suplimentară a erorilor
      if (error?.message) {
        console.warn('Detaliile erorii:', error.message)
      }
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div className={`text-center ${disabled || votedDjId !== null ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {/* Imaginea DJ-ului în cerc */}
      <div className="w-48 h-48 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-br from-slate-600 to-slate-800">
        {dj.image_url ? (
          <img 
            src={dj.image_url} 
            alt={dj.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Ascundem erorile de încărcare a imaginilor în consolă
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling?.classList.remove('hidden')
            }}
          />
        ) : null}
        <div className={`w-full h-full flex items-center justify-center text-6xl ${dj.image_url ? 'hidden' : ''}`}>
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-gray-400 rounded-full"></div>
          </div>
        </div>
      </div>
      
      {/* Informații despre DJ */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold mb-2 text-primary">{dj.name}</h3>
        {dj.description && (
          <p className="text-secondary text-sm">{dj.description}</p>
        )}
      </div>
      
      {/* Butonul de votare */}
      <button
        onClick={handleVote}
        disabled={disabled || votedDjId !== null || isVoting}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
          votedDjId === dj.id 
            ? 'cursor-not-allowed'
            : disabled || isVoting
            ? 'cursor-not-allowed'
            : 'btn-primary'
        }`}
        style={{
          backgroundColor: votedDjId === dj.id ? '#B6221A' : disabled || isVoting ? 'rgba(182, 34, 26, 0.5)' : '#B6221A',
          color: 'white'
        }}
      >
        {isVoting ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 mr-2" style={{borderBottomColor: 'white'}}></div>
            Votez...
          </div>
        ) : votedDjId === dj.id ? (
          'Votat'
        ) : (
          'Votează'
        )}
      </button>
    </div>
  )
}