import React from 'react'

export function CertificateTemplate({
  name,
  date,
  qrData,
  backgroundSrc,
}: {
  name: string
  date: string
  logoSrc?: string
  qrData?: any
  backgroundSrc?: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        width: '1200px',
        height: '800px',
        position: 'relative',
        fontFamily: '"Roboto", sans-serif',
      }}
    >
      {/* Background Image - The perfectly blank template */}
      {backgroundSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backgroundSrc}
          alt="Certificate Background"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '1200px',
            height: '800px',
            objectFit: 'cover',
            zIndex: 0,
          }}
        />
      )}

      {/* Dynamic Overlay Layer */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '1200px',
          height: '800px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
        }}
      >
        {/* Student Name */}
          <span style={{
            fontSize: '90px',
            color: '#ffffff',
            marginTop: '25px',
            marginBottom: '10px',
            fontFamily: '"GreatVibes", cursive',
            lineHeight: 1.2,
            textShadow: '0 0 20px rgba(255,255,255,0.2)'
          }}>
            {name}
          </span>

          {/* Elegant Flourish Underline */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '700px', marginTop: '5px' }}>
            <svg viewBox="0 0 700 20" width="100%" height="20" fill="none">
              <path d="M 0 10 Q 350 0 700 10" stroke="#b9cacb" strokeWidth="1" />
              <path d="M 100 12 Q 350 2 600 12" stroke="#b9cacb" strokeWidth="0.5" />
              <circle cx="350" cy="8" r="4" fill="#00e0ff" />
            </svg>
          </div>
        </div>

        {/* Bottom Section - Date, Badge, Signature */}
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 100px', position: 'absolute', bottom: '110px' }}>
          
          {/* Date */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '220px' }}>
            <span style={{ fontSize: '18px', color: '#ffffff', marginBottom: '5px' }}>Date: {date}</span>
            <div style={{ width: '100%', height: '1px', backgroundColor: '#385060', marginTop: '5px', marginBottom: '5px' }} />
            <span style={{ fontSize: '14px', color: '#88a0b0', letterSpacing: '2px' }}>Instructor</span>
          </div>

          {/* Badge / Seal */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100px', height: '100px', position: 'relative', top: '15px' }}>
            <svg viewBox="0 0 100 100" fill="none" width="100%" height="100%">
              {/* Starburst badge background */}
              <path d="M50 5 L55 20 L70 15 L65 30 L80 35 L70 45 L85 55 L70 60 L75 75 L60 70 L55 85 L50 70 L45 85 L40 70 L25 75 L30 60 L15 55 L30 45 L20 35 L35 30 L30 15 L45 20 Z" fill="#00e0ff" fillOpacity="0.2" stroke="#00e0ff" strokeWidth="2" />
              <circle cx="50" cy="45" r="22" fill="#0a101a" stroke="#00ffaa" strokeWidth="3" />
              <circle cx="50" cy="45" r="15" fill="#00e0ff" />
              <path d="M40 85 L40 95 L50 90 L60 95 L60 85" fill="none" stroke="#00e0ff" strokeWidth="2" />
            </svg>
          </div>

          {/* Signature - Founder */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '220px' }}>
            <span style={{ fontSize: '42px', color: '#00e0ff', marginBottom: '-5px', fontFamily: '"GreatVibes", cursive', lineHeight: 1 }}>F. Adeleke</span>
            <div style={{ width: '100%', height: '1px', backgroundColor: '#385060', marginTop: '5px', marginBottom: '5px' }} />
            <span style={{ fontSize: '14px', color: '#88a0b0', letterSpacing: '2px' }}>Founder, Femi Adeleke</span>
          </div>

        </div>

        {/* QR Code in bottom right corner */}
        <div
          style={{
            position: 'absolute',
            bottom: '75px', 
            right: '80px',
            display: 'flex',
            width: '100px',
            height: '100px',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            padding: '5px',
            borderRadius: '8px',
            border: '2px solid #00e0ff',
          }}
        >
          {qrData && (
            <svg
              width="90"
              height="90"
              viewBox={`0 0 ${qrData.modules.size} ${qrData.modules.size}`}
              fill="#000000"
            >
              {Array.from(qrData.modules.data).map((isDark, i) => {
                if (!isDark) return null
                const size = qrData.modules.size
                const x = i % size
                const y = Math.floor(i / size)
                return <rect key={i} x={x} y={y} width="1.05" height="1.05" /> // slight overlap to prevent anti-aliasing gaps
              })}
            </svg>
          )}
        </div>

        {/* Footer */}
        <div style={{ position: 'absolute', bottom: '15px', display: 'flex', justifyContent: 'center', width: '100%' }}>
          <span style={{ fontSize: '11px', color: '#385060', letterSpacing: '1px' }}>
            © 2026 Moon Space Network - All Rights Reserved
          </span>
        </div>

      </div>
    </div>
  )
}
