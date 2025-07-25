'use client'

import BeerChartResults from '@/components/BeerChartResults'
import VotingTimer from '@/components/VotingTimer'
import QRCode from '@/components/QRCode'
import { useState, useEffect } from 'react'
import { getVotingState } from '@/lib/supabase'
import Image from 'next/image'

export default function Round2ResultsPage() {
  const [votingStartedAt, setVotingStartedAt] = useState<string | null>(null)
  const [timerState, setTimerState] = useState<{ isRunning: boolean; timeLeft: number }>({ isRunning: false, timeLeft: 0 })

  useEffect(() => {
    const checkVotingState = async () => {
      try {
        const state = await getVotingState()
        setVotingStartedAt(state?.round_2_active ? (state.round_2_started_at || null) : null)
      } catch (error) {
        console.error('Eroare la obținerea stării votării:', error)
      }
    }

    checkVotingState()
    const interval = setInterval(checkVotingState, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
             src="/images/logof.png"
             alt="DJ Battle Logo"
             width={150}
             height={150}
             className="max-w-full h-auto"
           />
        </div>
        
        <VotingTimer 
          startedAt={votingStartedAt}
          round={2}
          duration={120}
          onStateChange={setTimerState}
        />
        <BeerChartResults 
          round={2} 
          title="Rezultatele Finale"
          showConfetti={!timerState.isRunning && timerState.timeLeft === 0 && !votingStartedAt}
        />
      </div>
      <QRCode url="/round-2" />
    </div>
  )
}