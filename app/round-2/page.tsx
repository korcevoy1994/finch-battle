'use client'

import { useEffect, useState } from 'react'
import { getDJs, addVote, checkIfVoted, getVotedDJ, getVotingState, DJ } from '@/lib/supabase'
import { generateDeviceId } from '@/lib/fingerprint'
import DJCard from '@/components/DJCard'
import VotingTimer from '@/components/VotingTimer'
import Image from 'next/image'

export default function Round2Page() {
  const [finalistDJs, setFinalistDJs] = useState<DJ[]>([])
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
        if (!votingState?.round_2_active) {
          setError('Votarea în a doua rundă nu este activă')
          setLoading(false)
          return
        }
        setVotingActive(true)
        setVotingStartedAt(votingState.round_2_started_at || null)

        // Verificăm dacă există finaliști
        if (!votingState.round_1_finalists || votingState.round_1_finalists.length !== 2) {
          setError('Finaliștii celei de-a doua runde nu au fost încă determinați')
          setLoading(false)
          return
        }

        // Încărcăm toți DJ-ii și filtrăm finaliștii
        const allDJs = await getDJs()
        const finalists = allDJs.filter(dj => votingState.round_1_finalists!.includes(dj.id))
        setFinalistDJs(finalists)

        // Obținem ID-ul dispozitivului
        const id = await generateDeviceId()
        setDeviceId(id)

        // Verificăm dacă utilizatorul a votat deja în a doua rundă și pentru cine
        try {
          const voted = await checkIfVoted(id, 2)
          setHasVoted(voted)
          
          if (voted) {
            const djId = await getVotedDJ(id, 2)
            setVotedDjId(djId)
          }
        } catch (voteCheckError: any) {
          console.warn('Eroare la verificarea votului:', voteCheckError?.message || voteCheckError)
          // Continuăm lucrul, presupunând că utilizatorul nu a votat
          setHasVoted(false)
          setVotedDjId(null)
        }

        if (hasVoted) {
          setSuccessMessage('Mulțumim pentru votul dumneavoastră! Ați votat deja în runda finală.')
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
        if (!votingState?.round_2_active && votingActive) {
          setVotingActive(false)
          setError('Votarea în a doua rundă s-a încheiat!')
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
      if (!currentVotingState?.round_2_active) {
        setError('Votarea în a doua rundă s-a încheiat deja!')
        setVotingActive(false)
        return
      }

      await addVote(djId, deviceId, 2)
      setHasVoted(true)
      setVotedDjId(djId)
      setSuccessMessage('Mulțumim pentru votul dumneavoastră în runda finală!')
      setError('')
    } catch (error: any) {
      console.warn('Eroare la votare:', error?.message || error)
      if (error?.code === '23505') {
        setError('Ați votat deja în această rundă')
        setHasVoted(true)
        // Încercăm să obținem ID-ul DJ-ului pentru care s-a votat deja
        try {
          const djId = await getVotedDJ(deviceId, 2)
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
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4" style={{borderBottomColor: '#B6221A'}}></div>
          <p className="text-xl" style={{color: '#B6221A'}}>Se încarcă finaliștii...</p>
        </div>
      </div>
    )
  }

  if (error && !votingActive) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4" style={{color: '#B6221A'}}>Finala nu este disponibilă</h1>
          <p className="mb-6" style={{color: '#B6221A'}}>{error}</p>
          <p className="text-sm" style={{color: '#B6221A', opacity: 0.8}}>
            Așteptați finalizarea primei runde și determinarea finaliștilor
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
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
            FINALA
          </h1>
          <p className="text-xl mb-2" style={{color: '#B6221A'}}>
            Alegeți câștigătorul dintre cei doi finaliști
          </p>
          <p className="text-sm" style={{color: '#B6221A', opacity: 0.8}}>
            Votul decisiv - doar o singură dată
          </p>
        </div>

        {/* Timer */}
        <VotingTimer 
          startedAt={votingStartedAt}
          round={2}
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

        {/* Carduri finaliști */}
        {finalistDJs.length === 2 ? (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{color: '#ffc700'}}>⚡ FINALIȘTII ⚡</h2>
              <p style={{color: '#B6221A'}}>Cei doi cei mai buni DJ din prima rundă</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {finalistDJs.map((dj, index) => (
                <div key={dj.id} className="relative">
                  {/* Numărul finalistului */}
                  <div className="absolute -top-4 -left-4 z-10">
                    <div className="font-bold text-lg w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{backgroundColor: '#ffc700', color: '#B6221A'}}>
                      {index + 1}
                    </div>
                  </div>
                  
                  <DJCard
                    dj={dj}
                    onVote={handleVote}
                    disabled={!votingActive}
                    votedDjId={votedDjId}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-bold mb-4" style={{color: '#B6221A'}}>Finaliștii nu sunt determinați</h2>
              <p style={{color: '#B6221A'}}>Așteptarea finalizării primei runde</p>
            </div>
          </div>
        )}

        {/* Informații despre votare */}
        {hasVoted && (
          <div className="mt-12 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-4" style={{color: '#ffc700'}}>Votul în finală a fost acceptat!</h2>
              <p className="mb-4" style={{color: '#B6221A'}}>
                Mulțumim pentru participarea la votarea finală! Votul dumneavoastră este foarte important.
              </p>
              <p className="text-sm" style={{color: '#B6221A', opacity: 0.8}}>
                Rezultatele finalei vor fi anunțate pe ecranele evenimentului.
                Urmăriți sumarea rezultatelor!
              </p>
            </div>
          </div>
        )}

        {/* Elemente decorative pentru finală */}
        {votingActive && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden">

          </div>
        )}
      </div>
    </div>
  )
}