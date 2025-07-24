'use client'

import { useEffect, useState } from 'react'

interface FloatingElement {
  id: number
  svg: string
  x: number
  y: number
  size: number
  speed: number
  direction: number
  rotation: number
  rotationSpeed: number
}

export default function AnimatedBackground() {
  const [elements, setElements] = useState<FloatingElement[]>([])

  useEffect(() => {
    const svgFiles = [
      '/SVG/Ресурс 1.svg',
      '/SVG/Ресурс 2.svg', 
      '/SVG/Ресурс 3.svg',
      '/SVG/Ресурс 4.svg',
      '/SVG/Ресурс 5.svg',
      '/SVG/Ресурс 6.svg'
    ]

    // Создаем случайные элементы
    const newElements: FloatingElement[] = []
    for (let i = 0; i < 15; i++) {
      newElements.push({
        id: i,
        svg: svgFiles[Math.floor(Math.random() * svgFiles.length)],
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 40 + 20, // 20-60px
        speed: Math.random() * 0.5 + 0.1, // 0.1-0.6
        direction: Math.random() * 360,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 2 // -1 to 1
      })
    }
    setElements(newElements)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setElements(prev => prev.map(element => {
        let newX = element.x + Math.cos(element.direction * Math.PI / 180) * element.speed
        let newY = element.y + Math.sin(element.direction * Math.PI / 180) * element.speed
        let newDirection = element.direction

        // Отскок от границ
        if (newX <= 0 || newX >= 100) {
          newDirection = 180 - element.direction
          newX = Math.max(0, Math.min(100, newX))
        }
        if (newY <= 0 || newY >= 100) {
          newDirection = -element.direction
          newY = Math.max(0, Math.min(100, newY))
        }

        return {
          ...element,
          x: newX,
          y: newY,
          direction: newDirection,
          rotation: element.rotation + element.rotationSpeed
        }
      }))
    }, 50)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
      {elements.map(element => (
        <div
          key={element.id}
          className="absolute transition-all duration-75 ease-linear"
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
            width: `${element.size}px`,
            height: `${element.size}px`,
            transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
            opacity: 0.7
          }}
        >
          <img
            src={element.svg}
            alt=""
            className="w-full h-full"
            style={{
              filter: 'blur(0.5px)'
            }}
          />
        </div>
      ))}
    </div>
  )
}