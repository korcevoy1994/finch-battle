import FingerprintJS from '@fingerprintjs/fingerprintjs'

let fpPromise: Promise<any> | null = null

export async function getFingerprint(): Promise<string> {
  try {
    // Verificăm dacă FingerprintJS este disponibil în browser
    if (typeof window === 'undefined') {
      throw new Error('FingerprintJS este disponibil doar în browser')
    }
    
    // Inițializăm FingerprintJS doar o dată
    if (!fpPromise) {
      fpPromise = FingerprintJS.load({
        // Dezactivăm unele surse de date care pot cauza erori
        debug: false
      })
    }
    
    const fp = await fpPromise
    const result = await fp.get()
    
    return result.visitorId
  } catch (error) {
    console.warn('Eroare la obținerea fingerprint-ului:', error)
    // Returnăm ID de rezervă
    return `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export async function generateDeviceId(): Promise<string> {
  try {
    // Verificăm că suntem în browser
    if (typeof window === 'undefined') {
      return `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    const fingerprint = await getFingerprint()
    
    // Obținem în siguranță parametri suplimentari
    const userAgent = navigator?.userAgent || 'unknown'
    const screenResolution = (typeof screen !== 'undefined') ? `${screen.width}x${screen.height}` : 'unknown'
    const timezone = (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone
      } catch {
        return 'unknown'
      }
    })()
    
    // Creăm identificator compus
    const deviceData = {
      fingerprint,
      userAgent: userAgent.slice(0, 50), // Limităm lungimea
      screen: screenResolution,
      timezone
    }
    
    // Hash simplu pentru crearea unui ID unic
    const deviceString = JSON.stringify(deviceData)
    let hash = 0
    for (let i = 0; i < deviceString.length; i++) {
      const char = deviceString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convertim în număr pe 32 de biți
    }
    
    return `${fingerprint}_${Math.abs(hash).toString(36)}`
  } catch (error) {
    console.warn('Eroare la generarea device ID:', error)
    // Rezervă: folosim ID aleatoriu cu timestamp
    return `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}