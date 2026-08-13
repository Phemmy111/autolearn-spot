import React from 'react'

interface QRCodeData {
  modules: {
    size: number;
    data: boolean[];
  };
}

export function CertificateTemplate({
  name,
  date,
  qrData,
  backgroundSrc,
  title,
  subtitle,
  bodyText,
  founderName,
  signatureUrl,
  signatureText,
  qrEnabled,
  qrDestination,
  footer,
  accentColor,
}: {
  name: string
  date: string
  logoSrc?: string
  qrData?: QRCodeData
  backgroundSrc?: string
  title?: string
  subtitle?: string
  bodyText?: string
  founderName?: string
  signatureUrl?: string
  signatureText?: string
  qrEnabled?: boolean
  qrDestination?: string
  footer?: string
  accentColor?: string
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
      {/* Background Image - The flawless template */}
      {backgroundSrc ? (
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
      ) : (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '1200px',
            height: '800px',
            background: `linear-gradient(135deg, ${accentColor || '#00f0ff'} 0%, #1a1a2e 100%)`,
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
        <div
          style={{
            position: 'absolute',
            top: '330px', // Moved up to sit neatly above the flourish line and below "THIS IS TO CERTIFY THAT"
            left: '0',
            width: '1200px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontFamily: '"GreatVibes", cursive',
              fontSize: '100px', // Slightly larger to match the grand scale of the template
              color: '#ffffff',
              lineHeight: 1,
              textShadow: '0px 0px 15px rgba(255,255,255,0.3)'
            }}
          >
            {name}
          </span>
        </div>

        {/* Date Overlay */}
        <div
          style={{
            position: 'absolute',
            top: '655px', // Dropped down 10px to sit right on the line
            left: '260px', // Pushed slightly right to be perfectly centered over the line
            width: '200px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '18px',
              color: '#ffffff',
              fontWeight: 500,
            }}
          >
            {date}
          </span>
        </div>

        {/* QR Code */}
        {(qrEnabled !== false) && (
          <div
            style={{
              position: 'absolute',
              bottom: '180px', 
              right: '110px', // Positioned beautifully in the empty space above the signature
              display: 'flex',
              width: '100px',
              height: '100px',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
              padding: '5px',
              borderRadius: '8px',
              border: `2px solid ${accentColor || '#00ffaa'}`,
              boxShadow: `0 0 15px ${accentColor || 'rgba(0, 255, 170, 0.4)'}`
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
                  return <rect key={i} x={x} y={y} width="1.05" height="1.05" />
                })}
              </svg>
            )}
          </div>
        )}

        {/* Footer */}
        {footer && (
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '0',
              width: '1200px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '14px',
                color: '#ffffff',
                fontWeight: 400,
                opacity: 0.8,
              }}
            >
              {footer}
            </span>
          </div>
        )}

      </div>
    </div>
  )
}
