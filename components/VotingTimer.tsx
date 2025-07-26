'use client'

import { useState, useEffect } from 'react'
import { updateVotingState } from '@/lib/supabase'

interface VotingTimerProps {
  startedAt?: string | null
  round: 1 | 2
  onTimeUp?: () => void
  duration?: number // în secunde, implicit 120 (2 minute)
  onStateChange?: (state: { isRunning: boolean; timeLeft: number }) => void
}

export default function VotingTimer({ startedAt, round, onTimeUp, duration = 180, onStateChange }: VotingTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    if (startedAt) {
      const startTime = new Date(startedAt).getTime()
      const now = Date.now()
      const elapsed = Math.floor((now - startTime) / 1000)
      const remaining = Math.max(0, duration - elapsed)
      
      setTimeLeft(remaining)
      setIsRunning(remaining > 0)
      onStateChange?.({ isRunning: remaining > 0, timeLeft: remaining })
      
      if (remaining <= 0) {
        // Dezactivăm automat votarea
        const stopVoting = async () => {
          try {
            if (round === 1) {
              await updateVotingState({ round_1_active: false })
            } else {
              await updateVotingState({ round_2_active: false })
            }
          } catch (error) {
            console.error('Eroare la dezactivarea votării:', error)
          }
        }
        stopVoting()
        
        if (onTimeUp) {
          onTimeUp()
        }
      }
    } else {
      setIsRunning(false)
      setTimeLeft(duration)
    }
  }, [startedAt, duration, onTimeUp])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            setIsRunning(false)
            // Dezactivăm automat votarea
            const stopVoting = async () => {
              try {
                if (round === 1) {
                  await updateVotingState({ round_1_active: false })
                } else {
                  await updateVotingState({ round_2_active: false })
                }
              } catch (error) {
                console.error('Eroare la dezactivarea votării:', error)
              }
            }
            stopVoting()
            
            onTimeUp?.()
            onStateChange?.({ isRunning: false, timeLeft: 0 })
            return 0
          }
          return prevTime - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isRunning, timeLeft, onTimeUp])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = () => {
    return ((duration - timeLeft) / duration) * 100
  }

  if (!startedAt || (!isRunning && timeLeft <= 0)) {
    return null
  }

  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <div 
        className="p-6 rounded-xl shadow-xl border-2"
        style={{
          backgroundColor: '#ffffff',
          border: '2px solid #000000',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
        }}
      >
        <div className="text-center">
          <div 
            className="text-4xl font-bold mb-4 tracking-wider"
            style={{ color: '#000000' }}
          >
            {formatTime(timeLeft)}
          </div>
          
          {/* Bara de progres */}
          <div 
            className="w-full h-3 rounded-full overflow-hidden mb-3"
            style={{ backgroundColor: '#f0f0f0', border: '1px solid #000000' }}
          >
            <div 
              className="h-full transition-all duration-1000 ease-linear"
              style={{
                backgroundColor: '#000000',
                width: `${getProgressPercentage()}%`
              }}
            />
          </div>
          
          <div 
            className="text-sm font-medium uppercase tracking-wide"
            style={{ color: '#000000', opacity: 0.7 }}
          >
            {timeLeft > 0 ? 'Timpul de votare' : 'Timpul a expirat!'}
          </div>
        </div>
      </div>
    </div>
  )
}
