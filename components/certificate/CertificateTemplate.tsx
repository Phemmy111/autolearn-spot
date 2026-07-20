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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '90px',
            height: '90px',
            borderRadius: '45px',
            border: '3px solid #00e0ff',
          }}>
            <span style={{ fontSize: '36px', color: '#00e0ff', fontWeight: 'bold', fontFamily: 'sans-serif' }}>✦</span>
          </div>

          {/* Signature */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '200px' }}>
            <span style={{ fontSize: '28px', fontStyle: 'italic', color: '#00e0ff', marginBottom: '0px' }}>F. Adeleke</span>
            <div style={{ width: '200px', height: '1px', backgroundColor: '#5d5f63', marginTop: '5px', marginBottom: '5px' }} />
            <span style={{ fontSize: '14px', color: '#b9cacb', letterSpacing: '1px', fontFamily: 'sans-serif' }}>Founder, Femi Adeleke</span>
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
