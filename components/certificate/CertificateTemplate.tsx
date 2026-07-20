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
        backgroundColor: '#0c0e12', // Dark background matching the app
        color: '#ffffff',
        fontFamily: 'sans-serif',
        padding: '40px',
        border: '10px solid #00f0ff', // Cyan border
        boxSizing: 'border-box',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {logoUrl && (
          <img
            src={logoUrl}
            alt="Logo"
            style={{ width: '80px', height: '80px', marginBottom: '20px' }}
          />
        )}
        <h1 style={{ fontSize: '64px', margin: '0 0 20px 0', fontWeight: 'bold' }}>
          Certificate of Completion
        </h1>
        <p style={{ fontSize: '24px', color: '#b9cacb', margin: '0 0 40px 0' }}>
          This certifies that
        </p>
        <h2 style={{ fontSize: '72px', margin: '0 0 40px 0', color: '#00f0ff', fontStyle: 'italic' }}>
          {name}
        </h2>
        <p style={{ fontSize: '24px', color: '#b9cacb', margin: '0 0 60px 0' }}>
          has successfully completed the required quizzes and coursework.
        </p>
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', padding: '0 100px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '200px', height: '2px', backgroundColor: '#00f0ff', marginBottom: '10px' }} />
            <span style={{ fontSize: '20px', color: '#5d5f63' }}>Date Completed</span>
            <span style={{ fontSize: '24px' }}>{date}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '200px', height: '2px', backgroundColor: '#00f0ff', marginBottom: '10px' }} />
            <span style={{ fontSize: '20px', color: '#5d5f63' }}>Authorized Signature</span>
            <span style={{ fontSize: '24px' }}>AutoLearn Spot</span>
          </div>
        </div>
      </div>
    </div>
  )
}
