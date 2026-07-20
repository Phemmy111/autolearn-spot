import React from 'react'

export function CertificateTemplate({
  name,
  date,
  logoUrl
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
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
        color: '#ffffff',
        fontFamily: 'sans-serif',
        padding: '40px',
        position: 'relative',
        boxSizing: 'border-box'
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
          border: '2px solid #00f0ff',
          position: 'relative',
          padding: '40px',
          boxSizing: 'border-box'
        }}
      >
        {/* Corner Accents */}
        <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '40px', height: '40px', borderTop: '6px solid #00f0ff', borderLeft: '6px solid #00f0ff' }} />
        <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '40px', height: '40px', borderTop: '6px solid #00f0ff', borderRight: '6px solid #00f0ff' }} />
        <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '40px', height: '40px', borderBottom: '6px solid #00f0ff', borderLeft: '6px solid #00f0ff' }} />
        <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '40px', height: '40px', borderBottom: '6px solid #00f0ff', borderRight: '6px solid #00f0ff' }} />

        {/* Inner Border */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', bottom: '10px', border: '1px solid rgba(0, 240, 255, 0.3)', pointerEvents: 'none' }} />

        {/* Top Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px' }}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" style={{ width: '60px', height: '60px', marginBottom: '10px' }} />
          ) : (
            <div style={{ width: '60px', height: '60px', borderRadius: '30px', border: '3px solid #00f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
              <span style={{ color: '#00f0ff', fontSize: '30px', fontWeight: 'bold' }}>A</span>
            </div>
          )}
          <h1 style={{ fontSize: '28px', margin: '0', fontWeight: 'bold', letterSpacing: '4px' }}>AUTOLEARN SPOT</h1>
          <p style={{ fontSize: '12px', margin: '5px 0 0 0', letterSpacing: '2px', color: '#b9cacb' }}>LEARN • AUTOMATE • SUCCEED</p>
          <p style={{ fontSize: '12px', margin: '15px 0 0 0', fontStyle: 'italic', color: '#5d5f63' }}>Powered by Moon Space Network (MSN)</p>
        </div>

        {/* Middle Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center', marginTop: '-20px' }}>
          <p style={{ fontSize: '14px', letterSpacing: '6px', color: '#b9cacb', margin: '0 0 30px 0', textTransform: 'uppercase' }}>
            This is to certify that
          </p>
          
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 style={{ 
              fontSize: '80px', 
              margin: '0', 
              fontFamily: 'serif', 
              fontStyle: 'italic',
              fontWeight: 'normal',
              color: '#ffffff'
            }}>
              {name}
            </h2>
            <div style={{ width: '120%', height: '1px', background: 'linear-gradient(90deg, transparent, #b9cacb, transparent)', marginTop: '20px', marginBottom: '20px' }} />
          </div>

          <p style={{ fontSize: '20px', color: '#b9cacb', margin: '10px 0', letterSpacing: '1px' }}>
            has successfully completed the
          </p>
          <h3 style={{ fontSize: '42px', margin: '10px 0 0 0', color: '#00f0ff', fontWeight: 'bold', letterSpacing: '2px' }}>
            n8n Automation
          </h3>
          <p style={{ fontSize: '20px', color: '#b9cacb', margin: '10px 0', letterSpacing: '1px' }}>
            coursework and final assessment
          </p>
        </div>

        {/* Bottom Section */}
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 40px', marginBottom: '20px' }}>
          {/* Date */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '200px' }}>
            <span style={{ fontSize: '20px', color: '#ffffff', marginBottom: '5px' }}>Date: {date}</span>
            <div style={{ width: '100%', height: '1px', backgroundColor: '#5d5f63', margin: '5px 0' }} />
            <span style={{ fontSize: '14px', color: '#b9cacb', letterSpacing: '1px' }}>Instructor</span>
          </div>

          {/* Badge/Seal */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100px', height: '100px' }}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="1.5">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" fill="#00f0ff" fillOpacity="0.2"/>
              <path d="M19.3 10.2c.2-.5.5-.9 1-1.2.4-.3.8-.7.8-1.2 0-.6-.3-1.1-.8-1.4-.4-.2-.8-.6-1-1.1-.2-.5-.3-1.1-.8-1.4-.5-.2-1.1-.3-1.5-.7-.4-.4-.6-1-.9-1.4-.4-.4-1-.6-1.5-.6-.6 0-1.2.2-1.7.5-.5.2-1.1.2-1.6 0-.5-.3-1.1-.5-1.7-.5-.6 0-1.1.2-1.5.6-.4.4-.6 1-.9 1.4-.4.4-1 .5-1.5.7-.5.3-.7.9-.8 1.4-.2.5-.6.9-1 1.1-.5.3-.8.8-.8 1.4 0 .5.4.9.8 1.2.5.3.8.7 1 1.2.2.5.3 1.1.8 1.4.5.2 1.1.3 1.5.7.4.4.6 1 .9 1.4.4.4 1 .6 1.5.6.6 0 1.2-.2 1.7-.5.5-.2 1.1-.2 1.6 0 .5.3 1.1.5 1.7.5.6 0 1.1-.2 1.5-.6.4-.4.6-1 .9-1.4.4-.4 1-.5 1.5-.7.5-.3.7-.9.8-1.4.2-.5.6-.9 1-1.1.5-.3.8-.8.8-1.4 0-.5-.4-.9-.8-1.2-.5-.3-.8-.7-1-1.2Z" />
              <path d="M7 16.5l-1.5 4.5 3-1.5 3 1.5-1.5-4.5" strokeLinejoin="round" />
              <path d="M17 16.5l1.5 4.5-3-1.5-3 1.5 1.5-4.5" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Signature */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '200px' }}>
            <span style={{ fontSize: '32px', fontFamily: 'serif', fontStyle: 'italic', color: '#00f0ff', marginBottom: '0px' }}>A. Signature</span>
            <div style={{ width: '100%', height: '1px', backgroundColor: '#5d5f63', margin: '5px 0' }} />
            <span style={{ fontSize: '14px', color: '#b9cacb', letterSpacing: '1px' }}>Founder, Femi Adeleke</span>
          </div>

          {/* QR Code Placeholder */}
          <div style={{ display: 'flex', width: '80px', height: '80px', backgroundColor: '#ffffff', padding: '5px', borderRadius: '4px' }}>
            <svg width="100%" height="100%" viewBox="0 0 24 24" fill="#000000">
              <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h-3v2h3v-2zm-3 2v2h-2v-2h2zm3 2v-2h-2v2h-2v2h4v-2h-2zm-5 0v2h2v-2h-2zm-2-4h2v2h-2v-2zm2 4h-2v-2h2v2z" />
            </svg>
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: 'absolute', bottom: '15px', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <p style={{ fontSize: '10px', color: '#5d5f63', margin: '0' }}>
            © 2026 Moon Space Network - All Rights Reserved
          </p>
        </div>
      </div>
    </div>
  )
}
