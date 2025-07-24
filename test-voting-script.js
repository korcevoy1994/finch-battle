// Încărcăm variabilele de mediu din .env.local
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')

// Configurări Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Funcție pentru adăugarea unui vot
async function addVote(djId, fingerprint, round) {
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
  } catch (error) {
    console.warn('Eroare la votare:', error?.message || error)
    throw error
  }
}

// Funcție pentru obținerea listei de DJ-i
async function getDJs() {
  try {
    const { data, error } = await supabase
      .from('djs')
      .select('*')
      .order('id')
    
    if (error) {
      console.warn('Eroare la încărcarea DJ-ilor:', error.message)
      throw error
    }
    return data
  } catch (error) {
    console.warn('Eroare la obținerea DJ-ilor:', error?.message || error)
    throw error
  }
}

// Funcție pentru generarea unei amprente unice
function generateFingerprint() {
  return 'test_auto_' + crypto.randomBytes(16).toString('hex')
}

// Funcție pentru selecția aleatorie a DJ-ului cu ponderi
function getRandomDJId(djIds) {
  // Ponderi pentru fiecare DJ (se poate configura)
  const weights = {
    1: 0.4,  // DJ Maxim - 40%
    2: 0.2,  // DJ Anna - 20%
    3: 0.3,  // DJ Alex - 30%
    4: 0.1   // DJ Maria - 10%
  }
  
  const random = Math.random()
  let cumulative = 0
  
  for (const djId of djIds) {
    cumulative += weights[djId] || (1 / djIds.length)
    if (random <= cumulative) {
      return djId
    }
  }
  
  // Fallback - selecție aleatorie
  return djIds[Math.floor(Math.random() * djIds.length)]
}

// Funcția principală de testare
async function runVotingTest() {
  console.log('🎧 Lansarea testării automate a votării...')
  console.log('⏱️  Durata: 2 minute')
  console.log('📊 Interval de votare: 2-8 secunde')
  console.log('')
  
  try {
    // Obținem lista de DJ-i
    const djs = await getDJs()
    if (!djs || djs.length === 0) {
      console.error('❌ Nu s-au găsit DJ-i în baza de date')
      return
    }
    
    console.log('👥 DJ-i găsiți:', djs.map(dj => `${dj.id}: ${dj.name}`).join(', '))
    console.log('')
    
    const djIds = djs.map(dj => dj.id)
    const round = 1 // Votăm în prima rundă
    const duration = 2 * 60 * 1000 // 2 minute în milisecunde
    const startTime = Date.now()
    
    let voteCount = 0
    let successCount = 0
    let errorCount = 0
    
    // Funcție pentru un vot
    const castVote = async () => {
      if (Date.now() - startTime >= duration) {
        return false // Timpul a expirat
      }
      
      try {
        const djId = getRandomDJId(djIds)
        const fingerprint = generateFingerprint()
        
        await addVote(djId, fingerprint, round)
        voteCount++
        successCount++
        
        const djName = djs.find(dj => dj.id === djId)?.name || `DJ ${djId}`
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        console.log(`✅ Vot #${voteCount} pentru ${djName} (${elapsed}s)`)
        
      } catch (error) {
        errorCount++
        console.log(`❌ Eroare vot #${voteCount + 1}:`, error.message)
      }
      
      return true // Continuăm
    }
    
    // Planificator de voturi
    const scheduleNextVote = () => {
      if (Date.now() - startTime >= duration) {
        // Finalizarea testării
        console.log('')
        console.log('🏁 Testarea finalizată!')
        console.log(`📈 Statistici:`)
        console.log(`   Total încercări: ${voteCount}`)
        console.log(`   Reușite: ${successCount}`)
        console.log(`   Erori: ${errorCount}`)
        console.log(`   Timp de funcționare: ${Math.floor((Date.now() - startTime) / 1000)}s`)
        return
      }
      
      // Întârziere aleatorie de la 2 la 8 secunde
      const delay = Math.random() * 6000 + 2000
      
      setTimeout(async () => {
        const shouldContinue = await castVote()
        if (shouldContinue) {
          scheduleNextVote()
        }
      }, delay)
    }
    
    // Lansăm primul vot
    scheduleNextVote()
    
  } catch (error) {
    console.error('❌ Eroare la inițializarea testării:', error)
  }
}

// Verificarea variabilelor de mediu
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ Eroare: Nu sunt configurate variabilele de mediu NEXT_PUBLIC_SUPABASE_URL și NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.log('💡 Creați fișierul .env.local cu configurările Supabase')
  process.exit(1)
}

// Lansarea testării
runVotingTest().catch(console.error)