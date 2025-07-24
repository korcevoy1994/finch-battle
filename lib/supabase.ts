import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Verificăm dacă variabilele de mediu sunt configurate
const isSupabaseConfigured = 
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project.supabase.co' &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your-anon-key-here'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export { isSupabaseConfigured }

// Tipuri pentru baza de date
export interface DJ {
  id: number
  name: string
  image_url?: string
  description?: string
  created_at: string
}

export interface Vote {
  id: number
  dj_id: number
  fingerprint: string
  round: 1 | 2
  created_at: string
}

export interface VotingState {
  id: number
  round_1_active: boolean
  round_2_active: boolean
  round_1_finalists?: number[]
  round_1_started_at?: string
  round_2_started_at?: string
  created_at: string
  updated_at: string
}

// Funcții pentru lucrul cu DJ-ii
export async function getDJs() {
  try {
    const { data, error } = await supabase
      .from('djs')
      .select('*')
      .order('name')
    
    if (error) {
      console.warn('Eroare la încărcarea DJ-ilor:', error.message)
      throw error
    }
    return data as DJ[]
  } catch (error: any) {
    console.warn('Eroare la obținerea listei de DJ-i:', error?.message || error)
    throw error
  }
}

// Funcții pentru lucrul cu voturile
export async function addVote(djId: number, fingerprint: string, round: 1 | 2) {
  try {
    const { data, error } = await supabase
      .from('votes')
      .insert({
        dj_id: djId,
        fingerprint,
        round
      })
      .select()
    
    if (error) {
      console.warn('Eroare la adăugarea votului:', error.message)
      throw error
    }
    return data
  } catch (error: any) {
    console.warn('Eroare la votare:', error?.message || error)
    throw error
  }
}

export async function checkIfVoted(fingerprint: string, round: 1 | 2) {
  try {
    const { data, error } = await supabase
      .from('votes')
      .select('id')
      .eq('fingerprint', fingerprint)
      .eq('round', round)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.warn('Eroare la verificarea votului:', error.message)
      throw error
    }
    return !!data
  } catch (error: any) {
    if (error?.code === 'PGRST116') {
      // Înregistrarea nu a fost găsită - este normal
      return false
    }
    console.warn('Eroare la verificarea votului existent:', error?.message || error)
    throw error
  }
}

export async function getVotedDJ(fingerprint: string, round: 1 | 2): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('votes')
      .select('dj_id')
      .eq('fingerprint', fingerprint)
      .eq('round', round)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.warn('Eroare la obținerea votului:', error.message)
      throw error
    }
    return data?.dj_id || null
  } catch (error: any) {
    if (error?.code === 'PGRST116') {
      // Înregistrarea nu a fost găsită - este normal
      return null
    }
    console.warn('Eroare la obținerea informațiilor despre vot:', error?.message || error)
    throw error
  }
}

// Funcții pentru obținerea rezultatelor
export async function getVotes(round: 1 | 2) {
  try {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('round', round)
    
    if (error) {
      console.warn('Eroare la încărcarea voturilor:', error.message)
      throw error
    }
    return data as Vote[]
  } catch (error: any) {
    console.warn('Eroare la obținerea voturilor:', error?.message || error)
    throw error
  }
}

export async function getVoteResults(round: 1 | 2) {
  const { data, error } = await supabase
    .from('votes')
    .select(`
      dj_id,
      djs (name, image_url)
    `)
    .eq('round', round)
  
  if (error) throw error
  
  // Grupăm voturile pe DJ
  const results = data.reduce((acc: any, vote: any) => {
    const djId = vote.dj_id
    if (!acc[djId]) {
      acc[djId] = {
        dj_id: djId,
        name: vote.djs.name,
        image_url: vote.djs.image_url,
        votes: 0
      }
    }
    acc[djId].votes++
    return acc
  }, {})
  
  return Object.values(results).sort((a: any, b: any) => b.votes - a.votes)
}

// Funcții pentru gestionarea stării votării
export async function getVotingState() {
  try {
    const { data, error } = await supabase
      .from('voting_state')
      .select('*')
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.warn('Eroare la obținerea stării votării:', error.message)
      throw error
    }
    return data as VotingState | null
  } catch (error: any) {
    if (error?.code === 'PGRST116') {
      // Înregistrarea nu a fost găsită - returnăm null
      return null
    }
    console.warn('Eroare la obținerea stării votării:', error?.message || error)
    throw error
  }
}

export async function updateVotingState(updates: Partial<VotingState>) {
  const { data, error } = await supabase
    .from('voting_state')
    .upsert({
      id: 1,
      ...updates,
      updated_at: new Date().toISOString()
    })
    .select()
  
  if (error) throw error
  return data
}

// Funcție pentru resetarea tuturor voturilor
export async function resetAllVotes() {
  const { error } = await supabase
    .from('votes')
    .delete()
    .neq('id', 0) // Ștergem toate înregistrările
  
  if (error) throw error
  
  // Resetăm starea votării
  await updateVotingState({
    round_1_active: false,
    round_2_active: false,
    round_1_finalists: undefined
  })
}

// Funcție pentru obținerea finaliștilor din runda a doua
export async function getFinalistDJs() {
  try {
    // Obținem starea votării
    const { data: votingState, error: stateError } = await supabase
      .from('voting_state')
      .select('round_1_finalists')
      .single()
    
    if (stateError) throw stateError
    
    if (!votingState?.round_1_finalists || votingState.round_1_finalists.length === 0) {
      return []
    }
    
    // Obținem DJ-ii după ID-urile finaliștilor
    const { data, error } = await supabase
      .from('djs')
      .select('*')
      .in('id', votingState.round_1_finalists)
      .order('name')
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching finalist DJs:', error)
    return []
  }
}