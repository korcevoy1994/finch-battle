'use client'

import { useState, useEffect } from 'react'
import { getVotes, getDJs, getFinalistDJs, DJ, Vote } from '@/lib/supabase'
import Image from 'next/image'


interface VoteResult {
  dj: DJ
  votes: number
  percentage: number
}

interface BeerChartResultsProps {
  round: number
  title: string
  showConfetti?: boolean
  numberOfWinners?: number
}

export default function BeerChartResults({ round, title, showConfetti, numberOfWinners = 1 }: BeerChartResultsProps) {
  const [results, setResults] = useState<VoteResult[]>([])
  const [loading, setLoading] = useState(true)
  const [maxVotes, setMaxVotes] = useState(0)
  const [animate, setAnimate] = useState(false)
  const [winnerVoteCounts, setWinnerVoteCounts] = useState<Set<number>>(new Set())

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const [votes, djs] = await Promise.all([
          getVotes(round as 1 | 2),
          round === 2 ? getFinalistDJs() : getDJs()
        ])

        // Numărăm voturile pentru fiecare DJ
        const voteCount: { [key: number]: number } = {}
        votes.forEach((vote: Vote) => {
          voteCount[vote.dj_id] = (voteCount[vote.dj_id] || 0) + 1
        })

        const totalVotes = votes.length;

        // Sort vote counts to find the winner(s)
        const sortedVotes = Object.values(voteCount).sort((a, b) => b - a);
        const winningScores = sortedVotes.slice(0, numberOfWinners);
        const max = Math.max(...winningScores, 0);
        setMaxVotes(max);

        setWinnerVoteCounts(new Set(winningScores.filter(score => score > 0)));

        // Creăm rezultatele cu procente (fără sortare pentru poziții statice)
        const resultsData = djs.map((dj: DJ) => ({
          dj,
          votes: voteCount[dj.id] || 0,
          percentage: totalVotes > 0 ? ((voteCount[dj.id] || 0) / totalVotes) * 100 : 0
        }))

        setResults(resultsData)
        setLoading(false)
        
        // Lansăm animația cu o mică întârziere doar la prima încărcare
        if (!animate) {
          setTimeout(() => setAnimate(true), 100)
        }
      } catch (error) {
        console.error('Eroare la încărcarea rezultatelor:', error)
        setLoading(false)
      }
    }

    // Încărcarea inițială
    fetchResults()
    
    // Actualizare automată la fiecare 3 secunde
    const interval = setInterval(fetchResults, 3000)
    
    // Curățarea intervalului la demontarea componentei
    return () => clearInterval(interval)
  }, [round, animate])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-amber-600">Se încarcă rezultatele...</div>
      </div>
    )
  }

  return (
    <div className="w-full px-[5%] py-6">
      <h2 className="text-4xl font-bold text-center mb-12 text-amber-800">{title}</h2>
      
      <div className="flex justify-center items-end gap-16 w-full">
        {results.map((result, index) => (
          <BeerGlass 
            key={result.dj.id} 
            result={result} 
            maxVotes={maxVotes} 
            delay={index * 0.5}
            animate={animate}
            isWinner={!!showConfetti && winnerVoteCounts.has(result.votes)}
          />
        ))}
      </div>
    </div>
  )
}

interface BeerGlassProps {
  result: VoteResult
  maxVotes: number
  delay: number
  animate: boolean
  isWinner: boolean
}

function BeerGlass({ result, maxVotes, delay, animate, isWinner }: BeerGlassProps) {
  // Logica de umplere: proporțional cu numărul maxim de voturi
  // Dacă liderul are 100 de voturi, iar DJ-ul are 50 de voturi, umplerea va fi de 50%
  // Minimum 10% pentru vizualizare, maximum 80%
  const fillPercentage = result.votes > 0 ? Math.max(10, Math.min((result.votes / maxVotes) * 80, 80)) : 0
  
  return (
        <div 
          className="relative flex flex-col items-center space-y-4"
          style={{
            animation: isWinner ? 'scalePulse 2s ease-in-out infinite' : 'none'
          }}
        >
      {/* Beer Glass Container */}
      <div className="relative w-48 h-80">
        <style jsx global>{`
          @keyframes scalePulse {
            0%, 100% {
              transform: scale(1.05);
            }
            50% {
              transform: scale(1.15);
            }
          }
        `}</style>
        <style jsx>{`
           .beer-glass {
             width: 180px;
             height: 320px;
             background: 
               linear-gradient(90deg, 
                 rgba(255, 255, 255, 0.2) 0%, 
                 rgba(255, 255, 255, 0.05) 12.5%, 
                 rgba(0, 0, 0, 0.05) 25%, 
                 rgba(255, 255, 255, 0.1) 37.5%, 
                 rgba(255, 255, 255, 0.05) 50%, 
                 rgba(0, 0, 0, 0.05) 62.5%, 
                 rgba(255, 255, 255, 0.1) 75%, 
                 rgba(255, 255, 255, 0.05) 87.5%, 
                 rgba(0, 0, 0, 0.1) 100%
               ),
               linear-gradient(
                 135deg,
                 rgba(255, 255, 255, 0.15) 0%,
                 rgba(255, 255, 255, 0.08) 25%,
                 rgba(255, 255, 255, 0.03) 50%,
                 rgba(0, 0, 0, 0.05) 75%,
                 rgba(0, 0, 0, 0.15) 100%
               );
             border: 3px solid rgba(255, 255, 255, 0.25);
             border-radius: 8px 8px 25px 25px;
             position: relative;
             overflow: hidden;
             backdrop-filter: blur(15px);
             box-shadow: 
               0 12px 40px rgba(0, 0, 0, 0.4),
               0 4px 16px rgba(0, 0, 0, 0.2),
               inset 0 3px 12px rgba(255, 255, 255, 0.15),
               inset 0 -2px 8px rgba(0, 0, 0, 0.1),
               inset -5px 0 15px rgba(255, 255, 255, 0.3),
               inset 5px 0 15px rgba(0, 0, 0, 0.1),
               inset 20px 0 10px rgba(255, 255, 255, 0.1),
               inset -20px 0 10px rgba(0, 0, 0, 0.1),
               inset 40px 0 15px rgba(255, 255, 255, 0.05),
               inset -40px 0 15px rgba(0, 0, 0, 0.05);
             transform: perspective(200px) rotateY(-2deg);
             clip-path: polygon(5% 0%, 95% 0%, 85% 100%, 15% 100%);
           }
           
           .glass-highlight {
             position: absolute;
             top: 15px;
             left: 20px;
             width: 35px;
             height: 120px;
             background: linear-gradient(
               45deg,
               rgba(255, 255, 255, 0.8) 0%,
               rgba(255, 255, 255, 0.4) 30%,
               rgba(255, 255, 255, 0.1) 70%,
               transparent 100%
             );
             border-radius: 20px;
             transform: rotate(-8deg);
             filter: blur(1px);
           }
          
          .beer-liquid {
             position: absolute;
             bottom: 0;
             left: 0;
             right: 0;
             background: 
                radial-gradient(ellipse at 25% 15%, rgba(255, 255, 255, 0.6) 0%, transparent 40%),
                radial-gradient(ellipse at 75% 25%, rgba(255, 255, 255, 0.3) 0%, transparent 35%),
                radial-gradient(ellipse at 50% 80%, rgba(139, 69, 19, 0.2) 0%, transparent 60%),
                linear-gradient(
                  to bottom,
                  #FFF8DC 0%,
                  #FFE135 8%,
                  #FFD700 20%,
                  #F4C430 35%,
                  #E6B800 50%,
                  #DAA520 65%,
                  #CD853F 80%,
                  #B8860B 90%,
                  #8B4513 100%
                ),
                linear-gradient(
                  45deg,
                  rgba(255, 255, 255, 0.1) 0%,
                  transparent 30%,
                  rgba(139, 69, 19, 0.1) 70%,
                  transparent 100%
                );
             transition: height 1.2s cubic-bezier(0.4, 0.0, 0.2, 1);
             transition-delay: ${delay}s;
             height: ${animate ? fillPercentage : 0}%;
             border-radius: 0 0 25px 25px;
             box-shadow: 
               inset -4px 0 12px rgba(139, 69, 19, 0.3),
               inset 4px 0 12px rgba(255, 255, 255, 0.4),
               inset 0 3px 10px rgba(0, 0, 0, 0.2),
               inset 0 -3px 8px rgba(255, 255, 255, 0.3),
               0 0 20px rgba(218, 165, 32, 0.4);
             animation: liquid-wave 6s infinite ease-in-out;
             animation-delay: ${delay + 1}s;
          }
          

           }
           
           .beer-carbonation {
             position: absolute;
             bottom: 0;
             left: 0;
             right: 0;
             height: 100%;
             background: 
               radial-gradient(circle at 15% 85%, rgba(255, 255, 255, 0.7) 0.8px, transparent 1.5px),
               radial-gradient(circle at 35% 75%, rgba(255, 255, 255, 0.6) 1px, transparent 2px),
               radial-gradient(circle at 55% 90%, rgba(255, 255, 255, 0.8) 0.6px, transparent 1.2px),
               radial-gradient(circle at 75% 80%, rgba(255, 255, 255, 0.5) 1.2px, transparent 2.4px),
               radial-gradient(circle at 85% 95%, rgba(255, 255, 255, 0.9) 0.4px, transparent 0.8px),
               radial-gradient(circle at 25% 60%, rgba(255, 255, 255, 0.4) 0.7px, transparent 1.4px),
               radial-gradient(circle at 65% 65%, rgba(255, 255, 255, 0.6) 0.9px, transparent 1.8px),
               radial-gradient(circle at 45% 95%, rgba(255, 255, 255, 0.7) 0.5px, transparent 1px);
             background-size: 20px 20px, 25px 25px, 18px 18px, 30px 30px, 12px 12px, 22px 22px, 28px 28px, 16px 16px;
             animation: carbonation-float 5s infinite linear, carbonation-drift 8s infinite ease-in-out;
             animation-delay: ${delay + 1}s, ${delay + 0.5}s;
             opacity: ${animate && fillPercentage > 15 ? 0.9 : 0};
             transition: opacity 1.5s ease-in-out;
           }
          
          .beer-foam-inside {
             position: absolute;
             top: -15px;
             left: 0;
             right: 0;
             height: 25px;
             background: 
               radial-gradient(ellipse at 20% 40%, rgba(255, 255, 255, 0.98) 25%, transparent 60%),
               radial-gradient(ellipse at 80% 60%, rgba(255, 255, 255, 0.95) 20%, transparent 55%),
               radial-gradient(ellipse at 50% 20%, rgba(255, 255, 255, 0.92) 30%, transparent 65%),
               radial-gradient(ellipse at 35% 80%, rgba(255, 248, 220, 0.9) 35%, transparent 70%),
               radial-gradient(ellipse at 65% 30%, rgba(255, 248, 220, 0.85) 25%, transparent 60%),
               linear-gradient(
                 to bottom,
                 rgba(255, 255, 255, 0.98) 0%,
                 rgba(255, 252, 240, 0.95) 15%,
                 rgba(255, 248, 220, 0.92) 35%,
                 rgba(255, 245, 210, 0.88) 55%,
                 rgba(255, 240, 200, 0.8) 75%,
                 rgba(255, 235, 190, 0.7) 90%,
                 rgba(255, 230, 180, 0.6) 100%
               ),
               repeating-linear-gradient(
                 45deg,
                 transparent 0px,
                 rgba(255, 255, 255, 0.1) 1px,
                 transparent 2px,
                 rgba(255, 255, 255, 0.05) 3px
               );
             border-radius: 65% 55% 45% 75% / 80% 70% 60% 90%;
             filter: blur(0.3px);
             box-shadow: 
               0 -3px 8px rgba(255, 255, 255, 0.9),
               inset 0 3px 6px rgba(0, 0, 0, 0.08),
               inset 0 -4px 8px rgba(0, 0, 0, 0.12),
               0 3px 6px rgba(0, 0, 0, 0.25),
               inset 2px 0 4px rgba(255, 255, 255, 0.6),
               inset -2px 0 4px rgba(255, 255, 255, 0.6);
             animation: foam-wobble 4s infinite ease-in-out;
             animation-delay: ${delay + 2.5}s;
           }
          
          .beer-foam::before {
            content: '';
            position: absolute;
            top: 5px;
            left: 10%;
            width: 15px;
            height: 8px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            animation: foam-bubble 3s infinite ease-in-out;
            animation-delay: ${delay + 2}s;
          }
          
          .beer-foam::after {
            content: '';
            position: absolute;
            top: 3px;
            right: 15%;
            width: 12px;
            height: 6px;
            background: rgba(255, 255, 255, 0.6);
            border-radius: 50%;
            animation: foam-bubble 2.5s infinite ease-in-out;
            animation-delay: ${delay + 2.3}s;
          }
          
          .bubble {
            position: absolute;
            background: rgba(255, 255, 255, 0.6);
            border-radius: 50%;
            animation: bubble-rise 3s infinite ease-in-out;
          }
          
          .bubble-1 {
            width: 4px;
            height: 4px;
            left: 25%;
            bottom: 10%;
            animation-delay: ${delay + 2.5}s;
          }
          
          .bubble-2 {
            width: 3px;
            height: 3px;
            left: 60%;
            bottom: 15%;
            animation-delay: ${delay + 3}s;
          }
          
          .bubble-3 {
            width: 2px;
            height: 2px;
            left: 45%;
            bottom: 8%;
            animation-delay: ${delay + 3.5}s;
          }
          
          .bubble-4 {
            width: 3.5px;
            height: 3.5px;
            left: 70%;
            bottom: 25%;
            animation-delay: ${delay + 4}s;
          }
          
          .bubble-5 {
            width: 1.5px;
            height: 1.5px;
            left: 30%;
            bottom: 35%;
            animation-delay: ${delay + 4.5}s;
          }
          
          .bubble-6 {
            width: 2.5px;
            height: 2.5px;
            left: 80%;
            bottom: 12%;
            animation-delay: ${delay + 5}s;
          }
          

          
          @keyframes foam-bubble {
             0%, 100% { transform: scale(1) translateY(0); opacity: 0.8; }
             50% { transform: scale(1.2) translateY(-2px); opacity: 1; }
           }
           
           @keyframes foam-wobble {
             0%, 100% { 
               border-radius: 65% 45% 50% 60% / 75% 85% 25% 35%;
               transform: scale(1) rotate(0deg);
             }
             20% { 
               border-radius: 50% 60% 65% 45% / 80% 70% 30% 25%;
               transform: scale(1.03) rotate(0.5deg);
             }
             40% { 
               border-radius: 60% 50% 45% 65% / 70% 90% 35% 20%;
               transform: scale(0.97) rotate(-0.3deg);
             }
             60% { 
               border-radius: 45% 65% 55% 50% / 85% 75% 20% 40%;
               transform: scale(1.01) rotate(0.7deg);
             }
             80% { 
               border-radius: 55% 50% 60% 45% / 80% 80% 25% 30%;
               transform: scale(0.99) rotate(-0.2deg);
             }
           }
           
           @keyframes carbonation-float {
             0% { transform: translateY(0) scale(1); }
             25% { transform: translateY(-8px) scale(1.1); }
             50% { transform: translateY(-15px) scale(0.9); }
             75% { transform: translateY(-25px) scale(1.05); }
             100% { transform: translateY(-35px) scale(0.8); }
           }
           
           @keyframes carbonation-drift {
             0%, 100% { transform: translateX(0) rotate(0deg); }
             25% { transform: translateX(2px) rotate(1deg); }
             50% { transform: translateX(-1px) rotate(-0.5deg); }
             75% { transform: translateX(1px) rotate(0.8deg); }
           }
           
           @keyframes bubble-rise {
             0% { transform: translateY(0) scale(1); opacity: 0; }
             10% { opacity: 1; }
             90% { opacity: 1; }
             100% { transform: translateY(-60px) scale(0.5); opacity: 0; }
           }
           
           @keyframes liquid-wave {
             0%, 100% { 
               transform: scaleX(1) scaleY(1) rotate(0deg);
               filter: brightness(1) hue-rotate(0deg) saturate(1);
             }
             25% { 
               transform: scaleX(1.005) scaleY(1.01) rotate(0.2deg);
               filter: brightness(1.05) hue-rotate(2deg) saturate(1.1);
             }
             50% { 
               transform: scaleX(1.01) scaleY(1.02) rotate(0deg);
               filter: brightness(1.1) hue-rotate(0deg) saturate(1.2);
             }
             75% { 
               transform: scaleX(1.005) scaleY(1.01) rotate(-0.2deg);
               filter: brightness(1.05) hue-rotate(-2deg) saturate(1.1);
             }
           }
           
           .beer-logo {
             position: absolute;
             top: 50%;
             left: 50%;
             transform: translate(-50%, -50%);
             width: 60px;
             height: 60px;
             z-index: 10;
             opacity: 0.8;
             filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
           }
        `}</style>
        
        <div className="beer-glass">
           <div className="glass-highlight"></div>
           <div className="beer-liquid">
             <div className="beer-carbonation"></div>
 
             {animate && fillPercentage > 20 && (
               <>
                 <div className="bubble bubble-1"></div>
                 <div className="bubble bubble-2"></div>
                 <div className="bubble bubble-3"></div>
                 <div className="bubble bubble-4"></div>
                 <div className="bubble bubble-5"></div>
                 <div className="bubble bubble-6"></div>
               </>
             )}
             {animate && fillPercentage > 10 && (
               <div className="beer-foam-inside"></div>
             )}
           </div>
           <div className="beer-logo">
             <Image
               src="/images/logo.png"
               alt="Logo"
               width={60}
               height={60}
               className="w-full h-full object-contain"
             />
           </div>
         </div>
        

      </div>
      
      {/* DJ Info */}
      <div className="text-center space-y-2">
        <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-amber-600">
          <Image
            src={result.dj.image_url || '/default-dj.jpg'}
            alt={result.dj.name}
            width={128}
            height={128}
            className="w-full h-full object-cover"
          />
        </div>
        {isWinner && <div className="text-2xl font-bold text-black">Câștigător</div>}
        <h3 className="font-bold text-xl text-amber-800">{result.dj.name}</h3>
        <div className="bg-amber-100 border-2 border-amber-300 rounded-lg px-6 py-3 shadow-md">
          <div className="text-2xl font-bold text-amber-800">{result.votes} voturi</div>
        </div>
      </div>
    </div>
  )
}