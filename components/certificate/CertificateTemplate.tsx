import React from 'react'

export function CertificateTemplate({
  name,
  date,
}: {
  name: string
  date: string
  logoUrl?: string
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
        backgroundColor: '#0f172a',
        color: '#ffffff',
        fontFamily: 'serif',
        padding: '40px',
        position: 'relative',
      }}
    >
      {/* Outer Border */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          border: '2px solid #00e0ff',
          position: 'relative',
          padding: '40px',
        }}
      >
        {/* Corner Accents - Top Left */}
        <div style={{ position: 'absolute', top: '-3px', left: '-3px', width: '40px', height: '6px', backgroundColor: '#00e0ff' }} />
        <div style={{ position: 'absolute', top: '-3px', left: '-3px', width: '6px', height: '40px', backgroundColor: '#00e0ff' }} />
        {/* Corner Accents - Top Right */}
        <div style={{ position: 'absolute', top: '-3px', right: '-3px', width: '40px', height: '6px', backgroundColor: '#00e0ff' }} />
        <div style={{ position: 'absolute', top: '-3px', right: '-3px', width: '6px', height: '40px', backgroundColor: '#00e0ff' }} />
        {/* Corner Accents - Bottom Left */}
        <div style={{ position: 'absolute', bottom: '-3px', left: '-3px', width: '40px', height: '6px', backgroundColor: '#00e0ff' }} />
        <div style={{ position: 'absolute', bottom: '-3px', left: '-3px', width: '6px', height: '40px', backgroundColor: '#00e0ff' }} />
        {/* Corner Accents - Bottom Right */}
        <div style={{ position: 'absolute', bottom: '-3px', right: '-3px', width: '40px', height: '6px', backgroundColor: '#00e0ff' }} />
        <div style={{ position: 'absolute', bottom: '-3px', right: '-3px', width: '6px', height: '40px', backgroundColor: '#00e0ff' }} />

        {/* Inner Border */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', bottom: '10px', border: '1px solid rgba(0, 224, 255, 0.3)' }} />

        {/* Top Section - Logo & Title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '30px',
            border: '3px solid #00e0ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px'
          }}>
            <span style={{ color: '#00e0ff', fontSize: '30px', fontWeight: 'bold', fontFamily: 'sans-serif' }}>A</span>
          </div>
          <span style={{ fontSize: '28px', fontWeight: 'bold', letterSpacing: '4px', fontFamily: 'sans-serif' }}>AUTOLEARN SPOT</span>
          <span style={{ fontSize: '12px', marginTop: '5px', letterSpacing: '2px', color: '#b9cacb', fontFamily: 'sans-serif' }}>LEARN · AUTOMATE · SUCCEED</span>
          <span style={{ fontSize: '12px', marginTop: '15px', fontStyle: 'italic', color: '#5d5f63' }}>Powered by Moon Space Network (MSN)</span>
        </div>

        {/* Middle Section - Certification */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center', marginTop: '-20px' }}>
          <span style={{ fontSize: '14px', letterSpacing: '6px', color: '#b9cacb', textTransform: 'uppercase' as const, fontFamily: 'sans-serif' }}>
            This is to certify that
          </span>

          <span style={{
            fontSize: '72px',
            fontStyle: 'italic',
            fontWeight: 400,
            color: '#ffffff',
            marginTop: '20px',
            marginBottom: '10px',
            fontFamily: 'serif',
          }}>
            {name}
          </span>

          {/* Underline */}
          <div style={{ width: '600px', height: '1px', backgroundColor: '#b9cacb', marginTop: '5px', marginBottom: '20px' }} />

          <span style={{ fontSize: '20px', color: '#b9cacb', letterSpacing: '1px' }}>
            has successfully completed the
          </span>
          <span style={{ fontSize: '42px', color: '#00e0ff', fontWeight: 'bold', letterSpacing: '2px', marginTop: '10px', fontFamily: 'sans-serif' }}>
            n8n Automation
          </span>
          <span style={{ fontSize: '20px', color: '#b9cacb', letterSpacing: '1px', marginTop: '10px' }}>
            coursework and final assessment
          </span>
        </div>

        {/* Bottom Section - Date, Badge, Signature */}
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 40px', marginBottom: '30px' }}>
          {/* Date */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '200px' }}>
            <span style={{ fontSize: '18px', color: '#ffffff', marginBottom: '5px' }}>Date: {date}</span>
            <div style={{ width: '200px', height: '1px', backgroundColor: '#5d5f63', marginTop: '5px', marginBottom: '5px' }} />
            <span style={{ fontSize: '14px', color: '#b9cacb', letterSpacing: '1px', fontFamily: 'sans-serif' }}>Instructor</span>
          </div>

          {/* Badge / Seal */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100px', height: '100px' }}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="1.5">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" fill="#00f0ff" fillOpacity="0.2"/>
              <path d="M19.3 10.2c.2-.5.5-.9 1-1.2.4-.3.8-.7.8-1.2 0-.6-.3-1.1-.8-1.4-.4-.2-.8-.6-1-1.1-.2-.5-.3-1.1-.8-1.4-.5-.2-1.1-.3-1.5-.7-.4-.4-.6-1-.9-1.4-.4-.4-1-.6-1.5-.6-.6 0-1.2.2-1.7.5-.5.2-1.1.2-1.6 0-.5-.3-1.1-.5-1.7-.5-.6 0-1.1.2-1.5.6-.4.4-.6 1-.9 1.4-.4.4-1 .5-1.5.7-.5.3-.7.9-.8 1.4-.2.5-.6.9-1 1.1-.5.3-.8-.8-.8 1.4 0-.5-.4-.9-.8-1.2-.5-.3-.8-.7-1-1.2Z" />
              <path d="M7 16.5l-1.5 4.5 3-1.5 3 1.5-1.5-4.5" strokeLinejoin="round" />
              <path d="M17 16.5l1.5 4.5-3-1.5-3 1.5 1.5-4.5" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Signature */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '200px' }}>
            <span style={{ fontSize: '32px', fontStyle: 'italic', color: '#00e0ff', marginBottom: '0px' }}>A. Signature</span>
            <div style={{ width: '200px', height: '1px', backgroundColor: '#5d5f63', marginTop: '5px', marginBottom: '5px' }} />
            <span style={{ fontSize: '14px', color: '#b9cacb', letterSpacing: '1px', fontFamily: 'sans-serif' }}>Director, MSN</span>
          </div>

          {/* QR Code Placeholder */}
          <div style={{ display: 'flex', width: '80px', height: '80px', backgroundColor: '#ffffff', padding: '5px', borderRadius: '4px' }}>
            <svg width="70" height="70" viewBox="0 0 24 24" fill="#000000">
              <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h-3v2h3v-2zm-3 2v2h-2v-2h2zm3 2v-2h-2v2h-2v2h4v-2h-2zm-5 0v2h2v-2h-2zm-2-4h2v2h-2v-2zm2 4h-2v-2h2v2z" />
            </svg>
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: 'absolute', bottom: '15px', display: 'flex', justifyContent: 'center', width: '100%' }}>
          <span style={{ fontSize: '10px', color: '#5d5f63', fontFamily: 'sans-serif' }}>
            © 2026 Moon Space Network - All Rights Reserved
          </span>
        </div>
      </div>
    </div>
  )
}
