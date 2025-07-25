'use client'

import { useEffect, useState } from 'react'
import QRCodeLib from 'qrcode'

interface QRCodeProps {
  className?: string
  url?: string
}

export default function QRCode({ className = '', url }: QRCodeProps) {
  const [qrCodeSvg, setQrCodeSvg] = useState<string>('')

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const targetUrl = url || window.location.href
        const qrSvgString = await QRCodeLib.toString(targetUrl, {
          type: 'svg',
          width: 160,
          margin: 2,
          color: {
            dark: '#B6221A',
            light: '#FFFFFF'
          }
        })
        setQrCodeSvg(qrSvgString)
      } catch (error) {
        console.error('Ошибка генерации QR кода:', error)
      }
    }

    generateQRCode()
  }, [url])

  if (!qrCodeSvg) return null

  return (
    <div className={`fixed bottom-4 left-4 z-50 ${className}`}>
      <div className="bg-white p-3 rounded-lg shadow-lg border-2" style={{ borderColor: '#B6221A' }}>
        <div 
          className="w-40 h-40 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
          dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
        />
      </div>
    </div>
  )
}