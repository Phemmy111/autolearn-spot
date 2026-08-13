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
        {/* Logo - Top Center Emblem Area */}
        {logoSrc && (
          <div
            style={{
              position: 'absolute',
              top: '35px',
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
                width: '55px',
                height: '55px',
                objectFit: 'contain',
              }}
            />
          </div>
        )}

        {/* Title - Inside Title Box */}
        {title && (
          <div
            style={{
              position: 'absolute',
              top: '95px',
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
                fontSize: '28px',
                fontWeight: 700,
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                textShadow: '0px 2px 8px rgba(0,0,0,0.8)',
                maxWidth: '600px',
                textAlign: 'center',
                lineHeight: 1.2,
              }}
            >
              {title}
            </span>
          </div>
        )}

        {/* Subtitle - Below Title Box */}
        {subtitle && (
          <div
            style={{
              position: 'absolute',
              top: '135px',
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
                fontSize: '14px',
                fontWeight: 400,
                color: '#ffffff',
                letterSpacing: '1px',
                opacity: 0.95,
                textShadow: '0px 1px 4px rgba(0,0,0,0.6)',
              }}
            >
              {subtitle}
            </span>
          </div>
        )}

        {/* Student Name - Large Central Area */}
        <div
          style={{
            position: 'absolute',
            top: '195px',
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
              fontSize: '80px',
              color: '#ffffff',
              lineHeight: 1,
              textShadow: '0px 4px 12px rgba(0,0,0,0.8)',
              maxWidth: '800px',
              textAlign: 'center',
            }}
          >
            {name}
          </span>
        </div>

        {/* Body Text - Below Student Name */}
        {bodyText && (
          <div
            style={{
              position: 'absolute',
              top: '280px',
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
                fontSize: '16px',
                fontWeight: 400,
                color: '#ffffff',
                letterSpacing: '0.5px',
                opacity: 0.9,
                textShadow: '0px 1px 4px rgba(0,0,0,0.6)',
              }}
            >
              {bodyText}
            </span>
          </div>
        )}

        {/* Course - Below Body Text, Above Seal */}
        {course && (
          <div
            style={{
              position: 'absolute',
              top: '305px',
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
                fontWeight: 600,
                color: accentColor || '#00f0ff',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                textShadow: '0px 2px 8px rgba(0,0,0,0.8)',
              }}
            >
              {course}
            </span>
          </div>
        )}

        {/* Date - Lower-Left Line Area */}
        <div
          style={{
            position: 'absolute',
            top: '660px',
            left: '220px',
            width: '250px',
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            zIndex: 20,
          }}
        >
          <span
            style={{
              fontSize: '14px',
              color: '#ffffff',
              fontWeight: 500,
              textShadow: '0px 1px 4px rgba(0,0,0,0.6)',
            }}
          >
            {date}
          </span>
        </div>

        {/* Signature - Lower-Right Line Area */}
        <div
          style={{
            position: 'absolute',
            top: '600px',
            right: '220px',
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
                width: '100px',
                height: '40px',
                objectFit: 'contain',
                marginBottom: '4px',
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
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#ffffff',
                  marginBottom: '1px',
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
                  fontSize: '10px',
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

        {/* Certificate ID - Subtle Position */}
        {certificateId && (
          <div
            style={{
              position: 'absolute',
              top: '690px',
              right: '220px',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              zIndex: 20,
            }}
          >
            <span
              style={{
                fontSize: '10px',
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

        {/* QR Code - Subtle Side Position */}
        {(qrEnabled !== false) && (
          <div
            style={{
              position: 'absolute',
              top: '645px',
              left: '120px',
              display: 'flex',
              width: '60px',
              height: '60px',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
              padding: '3px',
              borderRadius: '3px',
              border: `1px solid ${accentColor || '#00ffaa'}`,
              opacity: 0.9,
            }}
          >
            {qrData && (
              <svg
                width="54"
                height="54"
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

        {/* Footer - Bottom Center */}
        {footer && (
          <div
            style={{
              position: 'absolute',
              bottom: '35px',
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
                fontSize: '10px',
                color: '#ffffff',
                fontWeight: 400,
                opacity: 0.75,
                letterSpacing: '0.5px',
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
