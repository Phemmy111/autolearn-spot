import React from 'react'

export function CertificateTemplate({
  name,
  date,
  logoSrc,
  qrCodeUrl,
}: {
  name: string
  date: string
  logoSrc?: string
  qrCodeUrl?: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '1200px',
        height: '800px',
        backgroundImage: 'linear-gradient(135deg, #0b1524, #020611)',
        color: '#ffffff',
        fontFamily: '"Roboto", sans-serif',
        padding: '30px',
        position: 'relative',
      }}
    >
      {/* Outer Glow & Border */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          border: '1px solid #14303f',
          backgroundColor: '#0a101a',
          position: 'relative',
          padding: '40px',
          overflow: 'hidden'
        }}
      >
        {/* Intricate Corners - Top Left */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100px', height: '100px', display: 'flex' }}>
          <svg viewBox="0 0 100 100" fill="none" width="100%" height="100%">
            <path d="M0,0 L100,0 L100,4 L4,4 L4,100 L0,100 Z" fill="#00e0ff" />
            <path d="M15,15 L60,15 L60,17 L17,17 L17,60 L15,60 Z" fill="#00ffaa" />
            <path d="M70,14 L85,14 L85,18 L70,18 Z" fill="#00e0ff" />
            <path d="M14,70 L18,70 L18,85 L14,85 Z" fill="#00e0ff" />
          </svg>
        </div>
        {/* Intricate Corners - Top Right */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', display: 'flex', transform: 'scaleX(-1)' }}>
          <svg viewBox="0 0 100 100" fill="none" width="100%" height="100%">
            <path d="M0,0 L100,0 L100,4 L4,4 L4,100 L0,100 Z" fill="#00e0ff" />
            <path d="M15,15 L60,15 L60,17 L17,17 L17,60 L15,60 Z" fill="#00ffaa" />
            <path d="M70,14 L85,14 L85,18 L70,18 Z" fill="#00e0ff" />
            <path d="M14,70 L18,70 L18,85 L14,85 Z" fill="#00e0ff" />
          </svg>
        </div>
        {/* Intricate Corners - Bottom Left */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100px', height: '100px', display: 'flex', transform: 'scaleY(-1)' }}>
          <svg viewBox="0 0 100 100" fill="none" width="100%" height="100%">
            <path d="M0,0 L100,0 L100,4 L4,4 L4,100 L0,100 Z" fill="#00e0ff" />
            <path d="M15,15 L60,15 L60,17 L17,17 L17,60 L15,60 Z" fill="#00ffaa" />
            <path d="M70,14 L85,14 L85,18 L70,18 Z" fill="#00e0ff" />
            <path d="M14,70 L18,70 L18,85 L14,85 Z" fill="#00e0ff" />
          </svg>
        </div>
        {/* Intricate Corners - Bottom Right */}
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '100px', height: '100px', display: 'flex', transform: 'scaleX(-1) scaleY(-1)' }}>
          <svg viewBox="0 0 100 100" fill="none" width="100%" height="100%">
            <path d="M0,0 L100,0 L100,4 L4,4 L4,100 L0,100 Z" fill="#00e0ff" />
            <path d="M15,15 L60,15 L60,17 L17,17 L17,60 L15,60 Z" fill="#00ffaa" />
            <path d="M70,14 L85,14 L85,18 L70,18 Z" fill="#00e0ff" />
            <path d="M14,70 L18,70 L18,85 L14,85 Z" fill="#00e0ff" />
          </svg>
        </div>

        {/* Top Section - Logo & Title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '15px',
            position: 'relative'
          }}>
            {/* Tech Logo */}
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt="Logo" width="80" height="80" style={{ objectFit: 'contain' }} />
            ) : (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 100 100" fill="none" width="100%" height="100%">
                  <circle cx="50" cy="50" r="45" stroke="#00e0ff" strokeWidth="2" strokeDasharray="5,5" />
                  <circle cx="50" cy="50" r="35" stroke="#00ffaa" strokeWidth="3" />
                  <circle cx="15" cy="50" r="4" fill="#00e0ff" />
                  <circle cx="85" cy="50" r="4" fill="#00e0ff" />
                </svg>
                <span style={{ color: '#00ffaa', fontSize: '40px', fontWeight: 'bold', fontFamily: '"Roboto", sans-serif' }}>A</span>
              </div>
            )}
          </div>
          <span style={{ fontSize: '32px', fontWeight: 'bold', letterSpacing: '6px', color: '#ffffff' }}>AUTOLEARN SPOT</span>
          <span style={{ fontSize: '13px', marginTop: '5px', letterSpacing: '4px', color: '#00e0ff' }}>LEARN · AUTOMATE · SUCCEED</span>
          <span style={{ fontSize: '12px', marginTop: '12px', marginBottom: '20px', fontStyle: 'italic', color: '#5d6f83' }}>Powered by Moon Space Network (MSN)</span>
        </div>

        {/* Middle Section - Certification */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          <span style={{ fontSize: '14px', letterSpacing: '8px', color: '#88a0b0', textTransform: 'uppercase' as const }}>
            This is to certify that
          </span>

          <span style={{
            fontSize: '90px',
            color: '#ffffff',
            marginTop: '25px',
            marginBottom: '10px',
            fontFamily: 'GreatVibes',
            lineHeight: 1.2
          }}>
            {name}
          </span>

          {/* Elegant Flourish Underline */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '700px', marginTop: '5px', marginBottom: '25px' }}>
            <svg viewBox="0 0 700 20" width="100%" height="20" fill="none">
              <path d="M 0 10 Q 350 0 700 10" stroke="#b9cacb" strokeWidth="1" />
              <path d="M 100 12 Q 350 2 600 12" stroke="#b9cacb" strokeWidth="0.5" />
              <circle cx="350" cy="8" r="4" fill="#00e0ff" />
            </svg>
          </div>

          <span style={{ fontSize: '20px', color: '#88a0b0', letterSpacing: '2px' }}>
            has successfully completed the
          </span>
          <span style={{ fontSize: '46px', color: '#00e0ff', fontWeight: 'bold', letterSpacing: '3px', marginTop: '15px' }}>
            n8n Automation
          </span>
          <span style={{ fontSize: '20px', color: '#88a0b0', letterSpacing: '2px', marginTop: '15px' }}>
            coursework and final assessment
          </span>
        </div>

        {/* Bottom Section - Date, Badge, Signature */}
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 50px', marginBottom: '20px' }}>
          {/* Date */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '220px' }}>
            <span style={{ fontSize: '18px', color: '#ffffff', marginBottom: '5px' }}>Date: {date}</span>
            <div style={{ width: '100%', height: '1px', backgroundColor: '#385060', marginTop: '5px', marginBottom: '5px' }} />
            <span style={{ fontSize: '14px', color: '#88a0b0', letterSpacing: '2px' }}>Instructor</span>
          </div>

          {/* Badge / Seal */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100px', height: '100px' }}>
            <svg viewBox="0 0 100 100" fill="none" width="100%" height="100%">
              {/* Starburst badge background */}
              <path d="M50 5 L55 20 L70 15 L65 30 L80 35 L70 45 L85 55 L70 60 L75 75 L60 70 L55 85 L50 70 L45 85 L40 70 L25 75 L30 60 L15 55 L30 45 L20 35 L35 30 L30 15 L45 20 Z" fill="#00e0ff" fillOpacity="0.2" stroke="#00e0ff" strokeWidth="2" />
              <circle cx="50" cy="45" r="22" fill="#0a101a" stroke="#00ffaa" strokeWidth="3" />
              <circle cx="50" cy="45" r="15" fill="#00e0ff" />
              <path d="M40 85 L40 95 L50 90 L60 95 L60 85" fill="none" stroke="#00e0ff" strokeWidth="2" />
            </svg>
          </div>

          {/* Signature */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '220px' }}>
            <span style={{ fontSize: '42px', color: '#00e0ff', marginBottom: '-5px', fontFamily: 'GreatVibes', lineHeight: 1 }}>F. Adeleke</span>
            <div style={{ width: '100%', height: '1px', backgroundColor: '#385060', marginTop: '5px', marginBottom: '5px' }} />
            <span style={{ fontSize: '14px', color: '#88a0b0', letterSpacing: '2px' }}>Founder, Femi Adeleke</span>
          </div>

          {/* QR Code */}
          <div style={{ display: 'flex', width: '90px', height: '90px', backgroundColor: '#ffffff', padding: '5px', borderRadius: '8px', border: '2px solid #00e0ff', alignItems: 'center', justifyContent: 'center' }}>
            {qrCodeUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrCodeUrl} alt="QR Code" width="80" height="80" style={{ objectFit: 'contain' }} />
            ) : (
              <svg width="100%" height="100%" viewBox="0 0 24 24" fill="#000000">
                <path d="M2 2h6v6H2V2zm2 2v2h2V4H4zm10-2h6v6h-6V2zm2 2v2h2V4h-2zM2 14h6v6H2v-6zm2 2v2h2v-2H4zm14-2h-2v2h2v-2zm-4 4h2v2h-2v-2zm-2-2h2v2h-2v-2zm4 2h2v2h-2v-2zm-6 0h2v2h-2v-2zm-2-6h2v2h-2v-2zm2 2h2v2h-2v-2zm0 4h2v2h-2v-2zm6-4h2v2h-2v-2zm-8-2h6v2h-6v-2zm-2-2h12v2H8v-2zm12 2h2v2h-2v-2zM8 4h2v6H8V4zm2 2h2v2h-2V6zm-2 6h2v2H8v-2z" />
              </svg>
            )}
          </div>
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
