'use client'

import { useEffect, useState } from 'react'

const Confetti = () => {
  const [pieces, setPieces] = useState<any[]>([])
  const [animations, setAnimations] = useState('');

  useEffect(() => {
    let newPieces = [];
    let keyframes = '';
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#FFD700', '#C0C0C0'];

    for (let i = 0; i < 300; i++) {
      const size = Math.random() * 8 + 4;
      const horizontalMovement = Math.random() * 200 - 100;
      const fallDuration = Math.random() * 4 + 4;
      const fallDelay = Math.random() * 5;
      const animationName = `fall-${i}`;

      keyframes += `
        @keyframes ${animationName} {
          0% {
            transform: translateY(-10vh) translateX(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) translateX(${horizontalMovement}px) rotate(720deg);
            opacity: 0;
          }
        }
      `;

      newPieces.push({
        id: i,
        style: {
          left: `${Math.random() * 100}%`,
          width: `${size}px`,
          height: `${size * (Math.random() > 0.5 ? 1 : 0.5)}px`,
          backgroundColor: colors[Math.floor(Math.random() * colors.length)],
          animation: `${animationName} ${fallDuration}s ${fallDelay}s linear forwards`,
        },
      });
    }

    setAnimations(keyframes);
    setPieces(newPieces);
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden z-50 pointer-events-none">
      <style jsx>{`
        .confetti-piece {
          position: absolute;
          top: 0;
        }
        ${animations}
      `}</style>
      {pieces.map(piece => (
        <div key={piece.id} className="confetti-piece" style={piece.style} />
      ))}
    </div>
  )
}

export default Confetti