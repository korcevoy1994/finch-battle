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
                radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.4) 0%, transparent 50%),
                linear-gradient(
                  to bottom,
                  #FFF8DC 0%,
                  #FFD700 25%,
                  #F0C814 50%,
                  #DAA520 75%,
                  #B8860B 100%
                );
             transition: height 1.2s cubic-bezier(0.4, 0.0, 0.2, 1);
             transition-delay: ${delay}s;
             height: ${animate ? fillPercentage : 0}%;
             border-radius: 0 0 25px 25px;
             box-shadow: 
               inset -3px 0 8px rgba(0, 0, 0, 0.1),
               inset 3px 0 8px rgba(255, 255, 255, 0.2),
               inset 0 2px 8px rgba(0, 0, 0, 0.1),
               inset 0 -2px 4px rgba(255, 255, 255, 0.2);
          }
          

           }
           
           .beer-carbonation {
             position: absolute;
             bottom: 0;
             left: 0;
             right: 0;
             height: 100%;
             background: 
               radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.4) 1px, transparent 2px),
               radial-gradient(circle at 60% 70%, rgba(255, 255, 255, 0.3) 1px, transparent 2px),
               radial-gradient(circle at 80% 90%, rgba(255, 255, 255, 0.5) 0.5px, transparent 1px),
               radial-gradient(circle at 40% 85%, rgba(255, 255, 255, 0.3) 0.8px, transparent 1.5px);
             background-size: 25px 25px, 30px 30px, 15px 15px, 20px 20px;
             animation: carbonation-float 4s infinite linear;
             animation-delay: ${delay + 1}s;
             opacity: ${animate && fillPercentage > 15 ? 0.8 : 0};
             transition: opacity 1s ease-in-out;
           }
          
          .beer-foam-inside {
             position: absolute;
             top: -12px;
             left: 0;
             right: 0;
             height: 20px;
             background: 
               radial-gradient(ellipse at 25% 60%, rgba(255, 255, 255, 0.95) 30%, transparent 70%),
               radial-gradient(ellipse at 75% 40%, rgba(255, 255, 255, 0.9) 25%, transparent 65%),
               radial-gradient(ellipse at 50% 80%, rgba(255, 255, 255, 0.85) 35%, transparent 75%),
               linear-gradient(
                 to bottom,
                 rgba(255, 255, 255, 0.95) 0%,
                 rgba(255, 248, 220, 0.9) 30%,
                 rgba(255, 248, 220, 0.7) 70%,
                 rgba(255, 248, 220, 0.5) 100%
               );
             border-radius: 60% 60% 0 0;
             filter: blur(0.5px);
             box-shadow: 
               0 -2px 4px rgba(255, 255, 255, 0.8),
               inset 0 2px 4px rgba(0, 0, 0, 0.05),
               inset 0 -3px 6px rgba(0, 0, 0, 0.1),
               0 2px 4px rgba(0, 0, 0, 0.2);
             animation: foam-wobble 3s infinite ease-in-out;
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
          

          
          @keyframes foam-bubble {
             0%, 100% { transform: scale(1) translateY(0); opacity: 0.8; }
             50% { transform: scale(1.2) translateY(-2px); opacity: 1; }
           }
           
           @keyframes foam-wobble {
             0%, 100% { 
               border-radius: 60% 40% 45% 55% / 70% 80% 20% 30%;
               transform: scale(1);
             }
             33% { 
               border-radius: 45% 55% 60% 40% / 80% 70% 30% 20%;
               transform: scale(1.02);
             }
             66% { 
               border-radius: 55% 45% 40% 60% / 75% 85% 25% 35%;
               transform: scale(0.98);
             }
           }
           
           @keyframes carbonation-float {
             0% { transform: translateY(0); }
             100% { transform: translateY(-20px); }
           }
           
           @keyframes bubble-rise {
             0% { transform: translateY(0) scale(1); opacity: 0; }
             10% { opacity: 1; }
             90% { opacity: 1; }
             100% { transform: translateY(-60px) scale(0.5); opacity: 0; }
           }
           
           @keyframes liquid-wave {
             0%, 100% { 
               transform: scaleX(1) scaleY(1);
               filter: brightness(1);
             }
             50% { 
               transform: scaleX(1.01) scaleY(1.02);
               filter: brightness(1.1);
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