'use client'

import { useEffect, useState } from 'react'
import { 
  getVotingState,
  updateVotingState, 
  getVoteResults, 
  resetAllVotes, 
  getDJs,
  supabase 
} from '@/lib/supabase'
import QRCode from 'qrcode'

interface VoteResult {
  dj_id: number
  name: string
  votes: number
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [votingState, setVotingState] = useState<any>(null)
  const [round1Results, setRound1Results] = useState<VoteResult[]>([])
  const [round2Results, setRound2Results] = useState<VoteResult[]>([])
  const [loading, setLoading] = useState(false)
  const [qrCodes, setQrCodes] = useState<{round1: string, round2: string}>({round1: '', round2: ''})
  const [totalDJs, setTotalDJs] = useState(0)

  const ADMIN_PASSWORD = 'dj2024admin' // În proiectul real să se folosească variabile de mediu

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
      generateQRCodes()
      
      // Ne abonăm la modificări
      const channel = supabase
        .channel('admin-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, loadData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'voting_state' }, loadData)
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [isAuthenticated])

  const generateQRCodes = async () => {
    try {
      const baseUrl = window.location.origin
      const round1QR = await QRCode.toDataURL(`${baseUrl}/round-1`)
      const round2QR = await QRCode.toDataURL(`${baseUrl}/round-2`)
      setQrCodes({ round1: round1QR, round2: round2QR })
    } catch (error) {
      console.error('Eroare la generarea codurilor QR:', error)
    }
  }

  const loadData = async () => {
    try {
      const [state, r1Results, r2Results, djs] = await Promise.all([
        getVotingState(),
        getVoteResults(1),
        getVoteResults(2),
        getDJs()
      ])
      
      setVotingState(state)
      setRound1Results(r1Results as VoteResult[])
      setRound2Results(r2Results as VoteResult[])
      setTotalDJs(djs.length)
    } catch (error) {
      console.error('Eroare la încărcarea datelor:', error)
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
    } else {
      alert('Parolă incorectă')
    }
  }

  const startRound1 = async () => {
    setLoading(true)
    try {
      await updateVotingState({ 
        round_1_active: true, 
        round_2_active: false,
        round_1_started_at: new Date().toISOString()
      })
      await loadData()
    } catch (error) {
      console.error('Eroare la pornirea rundei 1:', error)
    } finally {
      setLoading(false)
    }
  }

  const stopRound1 = async () => {
    setLoading(true)
    try {
      await updateVotingState({ round_1_active: false })
      await loadData()
    } catch (error) {
      console.error('Eroare la oprirea rundei 1:', error)
    } finally {
      setLoading(false)
    }
  }

  const startRound2 = async () => {
    setLoading(true)
    try {
      // Determinăm top-2 din prima rundă
      const top2 = round1Results.slice(0, 2).map(r => r.dj_id)
      
      if (top2.length !== 2) {
        alert('Rezultate insuficiente pentru determinarea finaliștilor')
        return
      }

      await updateVotingState({ 
        round_1_active: false,
        round_2_active: true, 
        round_1_finalists: top2,
        round_2_started_at: new Date().toISOString()
      })
      await loadData()
    } catch (error) {
      console.error('Eroare la pornirea rundei 2:', error)
    } finally {
      setLoading(false)
    }
  }

  const stopRound2 = async () => {
    setLoading(true)
    try {
      await updateVotingState({ round_2_active: false })
      await loadData()
    } catch (error) {
      console.error('Eroare la oprirea rundei 2:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('Sunteți sigur că doriți să resetați TOATE voturile? Această acțiune nu poate fi anulată!')) {
      return
    }
    
    setLoading(true)
    try {
      await resetAllVotes()
      await loadData()
      alert('Toate voturile au fost resetate')
    } catch (error) {
      console.error('Eroare la resetarea voturilor:', error)
      alert('Eroare la resetarea voturilor')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{backgroundColor: '#ffc700'}}>
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center text-primary">Panou Admin</h1>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-primary">Parolă</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg focus:outline-none" style={{backgroundColor: '#ffffff', border: '2px solid #B6221A', color: '#B6221A'}}
                placeholder="Introduceți parola"
                required
              />
            </div>
            <button type="submit" className="w-full btn-primary">
              Conectare
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4" style={{backgroundColor: '#ffc700'}}>
      <div className="max-w-7xl mx-auto">
        {/* Titlu */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-primary">
            Panou Admin
          </h1>
          <p className="text-primary" style={{opacity: 0.8}}>Gestionarea sistemului de votare</p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Gestionarea rundelor */}
          <div className="space-y-6">
            {/* Starea sistemului */}
            <div className="admin-card">
              <h2 className="text-xl font-bold mb-4">Starea sistemului</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg" style={{backgroundColor: '#ffc700', border: '2px solid #B6221A'}}>
                  <h3 className="font-semibold mb-2 text-primary">Runda 1</h3>
                  <div className="inline-block px-3 py-1 rounded-full text-sm" style={{
                    backgroundColor: votingState?.round_1_active ? '#B6221A' : '#ffffff',
                    color: votingState?.round_1_active ? '#ffffff' : '#B6221A',
                    border: '2px solid #B6221A'
                  }}>
                    {votingState?.round_1_active ? '🟢 Activ' : '🔴 Inactiv'}
                  </div>
                  <p className="text-sm mt-2 text-primary" style={{opacity: 0.8}}>
                    Voturi: {round1Results.reduce((sum, r) => sum + r.votes, 0)}
                  </p>
                </div>
                <div className="p-4 rounded-lg" style={{backgroundColor: '#ffc700', border: '2px solid #B6221A'}}>
                  <h3 className="font-semibold mb-2 text-primary">Runda 2</h3>
                  <div className="inline-block px-3 py-1 rounded-full text-sm" style={{
                    backgroundColor: votingState?.round_2_active ? '#B6221A' : '#ffffff',
                    color: votingState?.round_2_active ? '#ffffff' : '#B6221A',
                    border: '2px solid #B6221A'
                  }}>
                    {votingState?.round_2_active ? '🟢 Activ' : '🔴 Inactiv'}
                  </div>
                  <p className="text-sm mt-2 text-primary" style={{opacity: 0.8}}>
                    Voturi: {round2Results.reduce((sum, r) => sum + r.votes, 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Gestionarea Rundei 1 */}
            <div className="admin-card">
              <h2 className="text-xl font-bold mb-4">Runda 1 - Gestionare</h2>
              <div className="flex flex-wrap gap-3 mb-4">
                <button
                  onClick={startRound1}
                  disabled={loading || votingState?.round_1_active}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Pornește Runda 1
                </button>
                <button
                  onClick={stopRound1}
                  disabled={loading || !votingState?.round_1_active}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{backgroundColor: '#ffffff', color: '#B6221A', border: '2px solid #B6221A'}}
                >
                  Oprește Runda 1
                </button>
              </div>
              
              {round1Results.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Liderii Rundei 1:</h3>
                  <div className="space-y-2">
                    {round1Results.slice(0, 4).map((result, index) => (
                      <div key={result.dj_id} className="flex justify-between items-center p-2 rounded" style={{backgroundColor: '#ffc700', border: '2px solid #B6221A', color: '#B6221A'}}>
                        <span>#{index + 1} {result.name}</span>
                        <span className="font-bold">{result.votes} voturi</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Gestionarea Rundei 2 */}
            <div className="admin-card">
              <h2 className="text-xl font-bold mb-4">Runda 2 - Finala</h2>
              <div className="flex flex-wrap gap-3 mb-4">
                <button
                  onClick={startRound2}
                  disabled={loading || votingState?.round_2_active || round1Results.length < 2}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🔁 Pornește Finala
                </button>
                <button
                  onClick={stopRound2}
                  disabled={loading || !votingState?.round_2_active}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{backgroundColor: '#ffffff', color: '#B6221A', border: '2px solid #B6221A'}}
                >
                  Oprește Finala
                </button>
              </div>
              
              {votingState?.round_1_finalists && (
                <div>
                  <h3 className="font-semibold mb-2">Finaliștii:</h3>
                  <div className="space-y-2">
                    {round1Results.filter(r => votingState.round_1_finalists.includes(r.dj_id)).map((finalist, index) => (
                      <div key={finalist.dj_id} className="flex justify-between items-center p-2 rounded" style={{backgroundColor: '#ffc700', border: '2px solid #B6221A', color: '#B6221A'}}>
                        <span>{finalist.name}</span>
                        <span className="text-sm" style={{color: '#B6221A', opacity: 0.6}}>Runda 1: {finalist.votes} voturi</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {round2Results.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Rezultatele Finalei:</h3>
                  <div className="space-y-2">
                    {round2Results.map((result, index) => (
                      <div key={result.dj_id} className="flex justify-between items-center p-2 rounded" style={{backgroundColor: '#ffc700', border: '2px solid #B6221A', color: '#B6221A'}}>
                        <span>#{index + 1} {result.name}</span>
                        <span className="font-bold">{result.votes} voturi</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Zonă periculoasă */}
            <div className="admin-card" style={{border: '3px solid #B6221A', backgroundColor: '#ffeeee'}}>
              <h2 className="text-xl font-bold mb-4 text-primary">Zonă periculoasă</h2>
              <button
                onClick={handleReset}
                disabled={loading}
                className="btn-secondary disabled:opacity-50"
                style={{backgroundColor: '#B6221A', color: '#ffffff'}}
              >
                Resetează toate voturile
              </button>
              <p className="text-sm mt-2 text-primary" style={{opacity: 0.8}}>
                Șterge toate voturile și resetează starea sistemului
              </p>
            </div>
          </div>
        </div>

        {/* Indicator de încărcare */}
        {loading && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{backgroundColor: 'rgba(182, 34, 26, 0.5)'}}>
            <div className="p-6 rounded-lg text-center" style={{backgroundColor: '#ffffff', color: '#B6221A', border: '3px solid #B6221A'}}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{borderBottomColor: '#B6221A'}}></div>
              <p className="text-primary font-semibold">Procesare...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}