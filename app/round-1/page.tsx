'use client'

import { useEffect, useState } from 'react'
import { getDJs, addVote, checkIfVoted, getVotedDJ, getVotingState, DJ } from '@/lib/supabase'
import { generateDeviceId } from '@/lib/fingerprint'
import DJCard from '@/components/DJCard'
import VotingTimer from '@/components/VotingTimer'
import Image from 'next/image'

export default function Round1Page() {
  const [djs, setDjs] = useState<DJ[]>([])
  const [loading, setLoading] = useState(true)
  const [deviceId, setDeviceId] = useState<string>('')
  const [hasVoted, setHasVoted] = useState(false)
  const [votedDjId, setVotedDjId] = useState<number | null>(null)
  const [votingActive, setVotingActive] = useState(false)
  const [votingStartedAt, setVotingStartedAt] = useState<string | null>(null)
  const [error, setError] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')

  useEffect(() => {
    const initializePage = async () => {
      try {
        // Verificăm starea votării
        const votingState = await getVotingState()
        if (!votingState?.round_1_active) {
          setError('Votarea în prima rundă nu este activă')
          setLoading(false)
          return
        }
        setVotingActive(true)
        setVotingStartedAt(votingState.round_1_started_at || null)

        // Încărcăm DJ-ii
        const djsData = await getDJs()
        setDjs(djsData)

        // Obținem ID-ul dispozitivului
        const id = await generateDeviceId()
        setDeviceId(id)

        // Verificăm dacă utilizatorul a votat deja și pentru cine
        try {
          const voted = await checkIfVoted(id, 1)
          setHasVoted(voted)
          
          if (voted) {
            const djId = await getVotedDJ(id, 1)
            setVotedDjId(djId)
          }
        } catch (voteCheckError: any) {
          console.warn('Eroare la verificarea votului:', voteCheckError?.message || voteCheckError)
          // Continuăm lucrul, presupunând că utilizatorul nu a votat
          setHasVoted(false)
          setVotedDjId(null)
        }

        if (hasVoted) {
          setSuccessMessage('Mulțumim pentru votul dumneavoastră! Ați votat deja în prima rundă.')
        }
      } catch (error: any) {
        console.warn('Eroare la inițializare:', error?.message || error)
        setError('Eroare la încărcarea datelor')
      } finally {
        setLoading(false)
      }
    }

    initializePage()

    // Verificăm periodic starea votării
    const checkVotingStatus = async () => {
      try {
        const votingState = await getVotingState()
        if (!votingState?.round_1_active && votingActive) {
          setVotingActive(false)
          setError('Votarea în prima rundă s-a încheiat!')
        }
      } catch (error) {
        console.warn('Eroare la verificarea stării votării:', error)
      }
    }

    const interval = setInterval(checkVotingStatus, 5000) // Verificăm la fiecare 5 secunde
    return () => clearInterval(interval)
  }, [votingActive])

  const handleVote = async (djId: number) => {
    if (!deviceId || hasVoted) return

    try {
      // Verificăm starea actuală a votării înainte de a trimite votul
      const currentVotingState = await getVotingState()
      if (!currentVotingState?.round_1_active) {
        setError('Votarea în prima rundă s-a încheiat deja!')
        setVotingActive(false)
        return
      }

      await addVote(djId, deviceId, 1)
      setHasVoted(true)
      setVotedDjId(djId)
      setSuccessMessage('Mulțumim pentru votul dumneavoastră!')
      setError('')
    } catch (error: any) {
      console.warn('Eroare la votare:', error?.message || error)
      if (error?.code === '23505') {
        setError('Ați votat deja în această rundă')
        setHasVoted(true)
        // Încercăm să obținem ID-ul DJ-ului pentru care s-a votat deja
        try {
          const djId = await getVotedDJ(deviceId, 1)
          setVotedDjId(djId)
        } catch (getVoteError) {
          console.warn('Eroare la obținerea informațiilor despre vot:', getVoteError)
        }
      } else {
        setError('Eroare la votare. Încercați din nou.')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-xl" style={{color: '#B6221A'}}>Se încarcă...</p>
        </div>
      </div>
    )
  }

  if (error && !votingActive) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4" style={{color: '#B6221A'}}>Votarea nu este disponibilă</h1>
          <p className="mb-6" style={{color: '#B6221A'}}>{error}</p>
        
        </div>
      </div>
    )
  }

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
        
        {/* Titlu */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4" style={{color: '#B6221A'}}>
            Runda 1
          </h1>
          <p className="text-xl mb-2" style={{color: '#B6221A'}}>
            Alegeți DJ-ul dumneavoastră preferat
          </p>
          <p className="text-sm" style={{color: '#B6221A', opacity: 0.8}}>
            Votarea este disponibilă doar o singură dată
          </p>
        </div>

        {/* Timer */}
        <VotingTimer 
          startedAt={votingStartedAt}
          round={1}
          duration={180}
        />

        {/* Mesaje */}
        {successMessage && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="rounded-lg p-4 text-center" style={{backgroundColor: 'rgba(182, 34, 26, 0.1)', border: '1px solid #B6221A'}}>
              <p className="font-semibold" style={{color: '#B6221A'}}>{successMessage}</p>
            </div>
          </div>
        )}

        {error && votingActive && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="rounded-lg p-4 text-center" style={{backgroundColor: 'rgba(182, 34, 26, 0.2)', border: '1px solid #B6221A'}}>
              <p className="font-semibold" style={{color: '#B6221A'}}>{error}</p>
            </div>
          </div>
        )}

        {/* Carduri DJ */}
        {djs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {djs.map((dj) => (
              <DJCard
                key={dj.id}
                dj={dj}
                onVote={handleVote}
                disabled={!votingActive}
                votedDjId={votedDjId}
              />
            ))}
          </div>
        ) : (
          <div className="text-center">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-bold mb-4" style={{color: '#B6221A'}}>DJ-ii nu au fost găsiți</h2>
              <p style={{color: '#B6221A'}}>Lista DJ-ilor este încă goală</p>
            </div>
          </div>
        )}

        {/* Informații despre votare */}
        {hasVoted && (
          <div className="mt-12 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-4" style={{color: '#B6221A'}}>Votul a fost acceptat!</h2>
              <p className="mb-4" style={{color: '#B6221A'}}>
                Mulțumim pentru participarea la votare! Votul dumneavoastră a fost înregistrat.
              </p>
              <p className="text-sm" style={{color: '#B6221A', opacity: 0.8}}>
                Urmăriți rezultatele pe ecranele evenimentului.
                A doua rundă va începe după finalizarea primei.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}