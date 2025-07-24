'use client'

import { useEffect, useState } from 'react'
import { getVoteResults, supabase, isSupabaseConfigured } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

interface VotingResultsProps {
  round: 1 | 2
  title: string
  showChart?: boolean
}

interface VoteResult {
  dj_id: number
  name: string
  image_url?: string
  votes: number
}

interface ChartProps {
  type: 'bar' | 'pie'
  data: VoteResult[]
  colors: string[]
}

// Dynamic import for recharts components
const Chart = dynamic(() => import('@/components/ChartWrapper'), { ssr: false }) as ComponentType<ChartProps>

const COLORS = ['#B6221A', '#ffc700', 'rgba(182, 34, 26, 0.8)', 'rgba(255, 199, 0, 0.8)', 'rgba(182, 34, 26, 0.6)', 'rgba(255, 199, 0, 0.6)']

export default function VotingResults({ round, title, showChart = true }: VotingResultsProps) {
  const [results, setResults] = useState<VoteResult[]>([])
  const [loading, setLoading] = useState(true)
  const [totalVotes, setTotalVotes] = useState(0)

  const fetchResults = async () => {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Supabase nu este configurat, se folosesc date de test')
        setResults([])
        setTotalVotes(0)
        return
      }
      
      const data = await getVoteResults(round)
      setResults(data as VoteResult[])
      setTotalVotes(data.reduce((sum: number, result: any) => sum + result.votes, 0))
    } catch (error) {
      console.error('Eroare la încărcarea rezultatelor:', error)
      setResults([])
      setTotalVotes(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResults()

    // Ne abonăm la modificări în timp real doar dacă Supabase este configurat
    if (!isSupabaseConfigured) {
      return
    }

    const channel = supabase
      .channel('votes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `round=eq.${round}`
        },
        () => {
          fetchResults()
        }
      )
      .subscribe()

    return () => {
      try {
        supabase.removeChannel(channel)
      } catch (error) {
        console.warn('Eroare la deconectarea canalului:', error)
      }
    }
  }, [round])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4" style={{borderBottomColor: '#B6221A'}}></div>
          <p className="text-xl text-primary">Se încarcă rezultatele...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Titlul */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-primary">
            {title}
          </h1>
          <p className="text-xl text-secondary">
            Total voturi: <span className="font-bold text-primary">{totalVotes}</span>
          </p>
        </div>

        {results.length === 0 ? (
          <div className="text-center">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-bold mb-4 text-primary">Nu sunt voturi încă</h2>
              <p className="text-secondary">Rezultatele vor apărea după primele voturi</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-8">
            {/* Tabelul rezultatelor */}
            <div>
              <h2 className="text-2xl font-bold mb-6 text-center text-primary">Rezultatele votării</h2>
              <div className="space-y-4">
                {results.map((result, index) => {
                  const percentage = totalVotes > 0 ? (result.votes / totalVotes * 100).toFixed(1) : '0'
                  return (
                    <div key={result.dj_id} className="flex items-center justify-between p-4 rounded-lg" style={{backgroundColor: 'rgba(255, 255, 255, 0.7)'}}>
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl font-bold text-muted w-8">
                          #{index + 1}
                        </div>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                          {result.image_url ? (
                            <img 
                              src={result.image_url} 
                              alt={result.name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-primary">{result.name}</h3>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{result.votes}</div>
                        <div className="text-sm text-muted">{percentage}%</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Graficele */}
            {showChart && results.length > 0 && (
              <div className="grid md:grid-cols-2 gap-8">
                {/* Diagrama cu bare */}
                <div>
                  <h3 className="text-xl font-bold mb-4 text-center text-primary">Diagrama cu bare</h3>
                  <Chart type="bar" data={results} colors={COLORS} />
                </div>

                {/* Diagrama circulară */}
                <div>
                  <h3 className="text-xl font-bold mb-4 text-center text-primary">Diagrama circulară</h3>
                  <Chart type="pie" data={results} colors={COLORS} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Indicatorul de actualizare automată */}
        <div className="fixed bottom-4 right-4">
          <div className="px-3 py-2 rounded-full text-sm flex items-center" style={{backgroundColor: '#B6221A', color: '#ffc700'}}>
            <div className="w-2 h-2 rounded-full animate-pulse mr-2" style={{backgroundColor: '#ffc700'}}></div>
            Actualizare în timp real
          </div>
        </div>
      </div>
    </div>
  )
}