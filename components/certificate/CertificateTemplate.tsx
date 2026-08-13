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
  course,
  certificateId,
  logoSrc,
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
  course?: string
  certificateId?: string
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
      {/* Background Image - Clean design without hardcoded text */}
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
            background: `linear-gradient(135deg, ${accentColor || '#00f0ff'} 0%, #1a1a2e 50%, #0a0a0e 100%)`,
            zIndex: 0,
          }}
        >
          {/* Decorative border */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              right: '20px',
              bottom: '20px',
              border: `3px solid ${accentColor || '#00f0ff'}`,
              borderRadius: '10px',
              opacity: 0.3,
            }}
          />
          {/* Corner decorations */}
          <div
            style={{
              position: 'absolute',
              top: '30px',
              left: '30px',
              width: '50px',
              height: '50px',
              borderTop: `4px solid ${accentColor || '#00f0ff'}`,
              borderLeft: `4px solid ${accentColor || '#00f0ff'}`,
              opacity: 0.5,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '30px',
              right: '30px',
              width: '50px',
              height: '50px',
              borderTop: `4px solid ${accentColor || '#00f0ff'}`,
              borderRight: `4px solid ${accentColor || '#00f0ff'}`,
              opacity: 0.5,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '30px',
              left: '30px',
              width: '50px',
              height: '50px',
              borderBottom: `4px solid ${accentColor || '#00f0ff'}`,
              borderLeft: `4px solid ${accentColor || '#00f0ff'}`,
              opacity: 0.5,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '30px',
              right: '30px',
              width: '50px',
              height: '50px',
              borderBottom: `4px solid ${accentColor || '#00f0ff'}`,
              borderRight: `4px solid ${accentColor || '#00f0ff'}`,
              opacity: 0.5,
            }}
          />
        </div>
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
        {/* Logo - Top Center */}
        {logoSrc && (
          <div
            style={{
              position: 'absolute',
              top: '55px',
              left: '0',
              width: '1200px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 20,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt="Logo"
              style={{
                width: '80px',
                height: '80px',
                objectFit: 'contain',
              }}
            />
          </div>
        )}

        {/* Title - Inside title box area */}
        {title && (
          <div
            style={{
              position: 'absolute',
              top: '115px',
              left: '0',
              width: '1200px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 20,
            }}
          >
            <span
              style={{
                fontFamily: '"Roboto", sans-serif',
                fontSize: '36px',
                fontWeight: 700,
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '3px',
                textShadow: '0px 2px 8px rgba(0,0,0,0.8)',
                maxWidth: '900px',
                textAlign: 'center',
                lineHeight: 1.2,
              }}
            >
              {title}
            </span>
          </div>
        )}

        {/* Subtitle - Inside subtitle box area */}
        {subtitle && (
          <div
            style={{
              position: 'absolute',
              top: '165px',
              left: '0',
              width: '1200px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 20,
            }}
          >
            <span
              style={{
                fontFamily: '"Roboto", sans-serif',
                fontSize: '18px',
                fontWeight: 400,
                color: '#ffffff',
                letterSpacing: '2px',
                opacity: 0.95,
                textShadow: '0px 1px 4px rgba(0,0,0,0.6)',
              }}
            >
              {subtitle}
            </span>
          </div>
        )}

        {/* Student Name - Large central area */}
        <div
          style={{
            position: 'absolute',
            top: '235px',
            left: '0',
            width: '1200px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 20,
          }}
        >
          <span
            style={{
              fontFamily: '"GreatVibes", cursive',
              fontSize: '90px',
              color: '#ffffff',
              lineHeight: 1,
              textShadow: '0px 4px 12px rgba(0,0,0,0.8)',
              maxWidth: '1000px',
              textAlign: 'center',
            }}
          >
            {name}
          </span>
        </div>

        {/* Body Text - Below student name */}
        {bodyText && (
          <div
            style={{
              position: 'absolute',
              top: '325px',
              left: '0',
              width: '1200px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 20,
            }}
          >
            <span
              style={{
                fontFamily: '"Roboto", sans-serif',
                fontSize: '20px',
                fontWeight: 400,
                color: '#ffffff',
                letterSpacing: '1px',
                opacity: 0.9,
                textShadow: '0px 1px 4px rgba(0,0,0,0.6)',
              }}
            >
              {bodyText}
            </span>
          </div>
        )}

        {/* Course - Below body text, above seal */}
        {course && (
          <div
            style={{
              position: 'absolute',
              top: '355px',
              left: '0',
              width: '1200px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 20,
            }}
          >
            <span
              style={{
                fontFamily: '"Roboto", sans-serif',
                fontSize: '24px',
                fontWeight: 600,
                color: accentColor || '#00f0ff',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                textShadow: '0px 2px 8px rgba(0,0,0,0.8)',
              }}
            >
              {course}
            </span>
          </div>
        )}

        {/* Date - Lower-left line area */}
        <div
          style={{
            position: 'absolute',
            top: '635px',
            left: '180px',
            width: '250px',
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            zIndex: 20,
          }}
        >
          <span
            style={{
              fontSize: '16px',
              color: '#ffffff',
              fontWeight: 500,
              textShadow: '0px 1px 4px rgba(0,0,0,0.6)',
            }}
          >
            {date}
          </span>
        </div>

        {/* Signature - Lower-right line area */}
        <div
          style={{
            position: 'absolute',
            top: '580px',
            right: '180px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 20,
          }}
        >
          {signatureUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={signatureUrl}
              alt="Signature"
              style={{
                width: '120px',
                height: '50px',
                objectFit: 'contain',
                marginBottom: '5px',
              }}
            />
          )}
          <div
            style={{
              textAlign: 'center',
            }}
          >
            {founderName && (
              <div
                style={{
                  fontFamily: '"Roboto", sans-serif',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#ffffff',
                  marginBottom: '2px',
                  textShadow: '0px 1px 4px rgba(0,0,0,0.6)',
                }}
              >
                {founderName}
              </div>
            )}
            {signatureText && (
              <div
                style={{
                  fontFamily: '"Roboto", sans-serif',
                  fontSize: '12px',
                  fontWeight: 400,
                  color: '#ffffff',
                  opacity: 0.85,
                  textShadow: '0px 1px 4px rgba(0,0,0,0.6)',
                }}
              >
                {signatureText}
              </div>
            )}
          </div>
        </div>

        {/* Certificate ID - Subtle, positioned away from major content */}
        {certificateId && (
          <div
            style={{
              position: 'absolute',
              top: '665px',
              right: '180px',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              zIndex: 20,
            }}
          >
            <span
              style={{
                fontSize: '12px',
                color: '#ffffff',
                fontWeight: 400,
                opacity: 0.6,
                fontFamily: '"Roboto", sans-serif',
                letterSpacing: '0.5px',
              }}
            >
              {certificateId}
            </span>
          </div>
        )}

        {/* QR Code - Subtle side position */}
        {(qrEnabled !== false) && (
          <div
            style={{
              position: 'absolute',
              top: '620px',
              left: '80px',
              display: 'flex',
              width: '70px',
              height: '70px',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
              padding: '4px',
              borderRadius: '4px',
              border: `1px solid ${accentColor || '#00ffaa'}`,
              opacity: 0.9,
            }}
          >
            {qrData && (
              <svg
                width="62"
                height="62"
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

        {/* Footer - Bottom center */}
        {footer && (
          <div
            style={{
              position: 'absolute',
              bottom: '25px',
              left: '0',
              width: '1200px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 20,
            }}
          >
            <span
              style={{
                fontSize: '12px',
                color: '#ffffff',
                fontWeight: 400,
                opacity: 0.75,
                letterSpacing: '1px',
                textShadow: '0px 1px 4px rgba(0,0,0,0.6)',
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
