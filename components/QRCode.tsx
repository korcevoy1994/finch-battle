'use client'

import { useEffect, useState } from 'react'
import QRCodeLib from 'qrcode'

interface QRCodeProps {
  className?: string
  url?: string
}

export default function QRCode({ className = '', url }: QRCodeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const targetUrl = url || window.location.href
        const qrDataUrl = await QRCodeLib.toDataURL(targetUrl, {
          width: 240,
          margin: 1,
          color: {
            dark: '#B6221A',
            light: '#FFFFFF'
          }
        })
        setQrCodeUrl(qrDataUrl)
      } catch (error) {
        console.error('Ошибка генерации QR кода:', error)
      }
    }

    generateQRCode()
  }, [url])

  if (!qrCodeUrl) return null

  return (
    <div className={`fixed bottom-4 left-4 z-50 ${className}`}>
      <div className="bg-white p-2 rounded-lg shadow-lg border-2" style={{ borderColor: '#B6221A' }}>
        <img 
          src={qrCodeUrl} 
          alt="QR код страницы" 
          className="w-40 h-40"
        />
      </div>
    </div>
  )
}