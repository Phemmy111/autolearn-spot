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
        {/* Logo */}
        {logoSrc && (
          <div
            style={{
              position: 'absolute',
              top: '40px',
              left: '60px',
              width: '120px',
              height: '120px',
              zIndex: 20,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt="Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </div>
        )}

        {/* Title */}
        {title && (
          <div
            style={{
              position: 'absolute',
              top: '120px',
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
                fontSize: '48px',
                fontWeight: 700,
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '4px',
                textShadow: '0px 0px 20px rgba(0,0,0,0.5)'
              }}
            >
              {title}
            </span>
          </div>
        )}

        {/* Subtitle */}
        {subtitle && (
          <div
            style={{
              position: 'absolute',
              top: '200px',
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
                fontWeight: 400,
                color: '#ffffff',
                letterSpacing: '2px',
                opacity: 0.9
              }}
            >
              {subtitle}
            </span>
          </div>
        )}

        {/* Student Name */}
        <div
          style={{
            position: 'absolute',
            top: '330px',
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
              fontSize: '100px',
              color: '#ffffff',
              lineHeight: 1,
              textShadow: '0px 0px 15px rgba(255,255,255,0.3)'
            }}
          >
            {name}
          </span>
        </div>

        {/* Body Text */}
        {bodyText && (
          <div
            style={{
              position: 'absolute',
              top: '450px',
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
                fontWeight: 500,
                color: '#ffffff',
                letterSpacing: '1px',
                opacity: 0.95
              }}
            >
              {bodyText}
            </span>
          </div>
        )}

        {/* Course */}
        {course && (
          <div
            style={{
              position: 'absolute',
              top: '490px',
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
                fontSize: '22px',
                fontWeight: 600,
                color: accentColor || '#00f0ff',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              {course}
            </span>
          </div>
        )}

        {/* Founder Name and Signature */}
        {(founderName || signatureUrl || signatureText) && (
          <div
            style={{
              position: 'absolute',
              bottom: '120px',
              left: '260px',
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
                  width: '150px',
                  height: '60px',
                  objectFit: 'contain',
                  marginBottom: '8px',
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
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#ffffff',
                    marginBottom: '4px',
                  }}
                >
                  {founderName}
                </div>
              )}
              {signatureText && (
                <div
                  style={{
                    fontFamily: '"Roboto", sans-serif',
                    fontSize: '14px',
                    fontWeight: 400,
                    color: '#ffffff',
                    opacity: 0.8,
                  }}
                >
                  {signatureText}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Date Overlay */}
        <div
          style={{
            position: 'absolute',
            top: '640px',
            left: '260px',
            width: '200px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 20,
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

        {/* Certificate ID */}
        {certificateId && (
          <div
            style={{
              position: 'absolute',
              top: '670px',
              right: '110px',
              width: '200px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 20,
            }}
          >
            <span
              style={{
                fontSize: '14px',
                color: '#ffffff',
                fontWeight: 400,
                opacity: 0.7,
                fontFamily: '"Roboto", sans-serif',
              }}
            >
              {certificateId}
            </span>
          </div>
        )}

        {/* QR Code */}
        {(qrEnabled !== false) && (
          <div
            style={{
              position: 'absolute',
              bottom: '220px', 
              right: '110px',
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
