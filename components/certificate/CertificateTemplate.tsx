import React from 'react'

export function CertificateTemplate({
  name,
  date,
  qrCodeUrl,
  backgroundSrc,
}: {
  name: string
  date: string
  logoSrc?: string
  qrCodeUrl?: string
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
      {/* Background Image - The "cooked" beautiful template */}
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
        <div
          style={{
            position: 'absolute',
            top: '390px', // Adjusted to match the blank space in the template
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
              fontSize: '85px',
              color: '#ffffff',
              lineHeight: 1,
            }}
          >
            {name}
          </span>
        </div>

        {/* Date */}
        <div
          style={{
            position: 'absolute',
            top: '648px', // Matched to Date line
            left: '143px', // Matched to Date label
            width: '240px',
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

        {/* QR Code Box */}
        <div
          style={{
            position: 'absolute',
            top: '625px', // Aligned with the QR code box on the bottom right
            left: '915px', // Position on the right
            display: 'flex',
            width: '80px',
            height: '80px',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            padding: '4px',
          }}
        >
          {qrCodeUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrCodeUrl}
              alt="QR Code"
              width="72"
              height="72"
              style={{ objectFit: 'contain' }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
