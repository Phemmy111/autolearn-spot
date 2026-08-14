import React from 'react'

interface QRCodeData {
  modules: {
    size: number
    data: boolean[]
  }
}

interface CertificateTemplateProps {
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
}

const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 800

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
  qrDestination: _qrDestination,
  footer,
  accentColor,
}: CertificateTemplateProps) {
  const accent = accentColor || '#00e5ff'

  return (
    <div
      style={{
        position: 'relative',
        width: `${CANVAS_WIDTH}px`,
        height: `${CANVAS_HEIGHT}px`,
        overflow: 'hidden',
        fontFamily: '"Roboto", Arial, sans-serif',
        background: '#06101f',
      }}
    >
      {/* Background artwork only. No certificate text is baked in here. */}
      {backgroundSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backgroundSrc}
          alt="Certificate background"
          style={{
            position: 'absolute',
            inset: 0,
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
            objectFit: 'cover',
            zIndex: 0,
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
            background:
              'linear-gradient(135deg, #03101f 0%, #07172a 48%, #020914 100%)',
            zIndex: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '18px',
              border: `2px solid ${accent}`,
              opacity: 0.32,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: '28px',
              border: `1px solid ${accent}`,
              opacity: 0.15,
            }}
          />
        </div>
      )}

      {/* Soft overlay improves text readability without changing the artwork. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.08), rgba(0,0,0,0.02) 45%, rgba(0,0,0,0.14))',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* ================================================================
          HEADER ZONE
          The background has a dedicated logo area at the top centre.
          ================================================================ */}

      {logoSrc && (
        <div
          style={{
            position: 'absolute',
            top: 28,
            left: 0,
            width: CANVAS_WIDTH,
            height: 68,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt="AutoLearn Spot logo"
            style={{
              width: 68,
              height: 68,
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>
      )}

      {title && (
        <div
          style={{
            position: 'absolute',
            top: 94,
            left: 120,
            width: 960,
            minHeight: 38,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          <div
            style={{
              maxWidth: 820,
              color: '#ffffff',
              fontSize: 26,
              lineHeight: 1.15,
              fontWeight: 700,
              letterSpacing: '1.8px',
              textTransform: 'uppercase',
              textShadow: '0 2px 8px rgba(0,0,0,0.75)',
              whiteSpace: 'normal',
            }}
          >
            {title}
          </div>
        </div>
      )}

      {subtitle && (
        <div
          style={{
            position: 'absolute',
            top: 132,
            left: 150,
            width: 900,
            minHeight: 22,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          <div
            style={{
              maxWidth: 760,
              color: '#ffffff',
              fontSize: 14,
              lineHeight: 1.25,
              fontWeight: 400,
              letterSpacing: '1.2px',
              textShadow: '0 1px 5px rgba(0,0,0,0.7)',
            }}
          >
            {subtitle}
          </div>
        </div>
      )}

      {/* ================================================================
          RECIPIENT ZONE
          Student name is deliberately the largest text on the certificate.
          ================================================================ */}

      <div
        style={{
          position: 'absolute',
          top: 165,
          left: 110,
          width: 980,
          minHeight: 82,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 900,
            color: '#ffffff',
            fontFamily: '"GreatVibes", "Brush Script MT", cursive',
            fontSize: 70,
            lineHeight: 1.05,
            fontWeight: 400,
            textShadow: '0 3px 12px rgba(0,0,0,0.85)',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </div>
      </div>

      {/* Decorative divider beneath the student's name. */}
      <div
        style={{
          position: 'absolute',
          top: 244,
          left: 285,
          width: 630,
          height: 1,
          background:
            'linear-gradient(to right, transparent, rgba(255,255,255,0.55), transparent)',
          zIndex: 9,
        }}
      />

      {/* ================================================================
          COMPLETION ZONE
          Body text and course are a single visual unit.
          ================================================================ */}

      {bodyText && (
        <div
          style={{
            position: 'absolute',
            top: 255,
            left: 170,
            width: 860,
            minHeight: 24,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          <div
            style={{
              maxWidth: 820,
              color: '#ffffff',
              fontSize: 18,
              lineHeight: 1.25,
              fontWeight: 400,
              letterSpacing: '0.25px',
              textShadow: '0 1px 5px rgba(0,0,0,0.75)',
            }}
          >
            {bodyText}
          </div>
        </div>
      )}

      {course && (
        <div
          style={{
            position: 'absolute',
            top: 282,
            left: 130,
            width: 940,
            minHeight: 36,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          <div
            style={{
              maxWidth: 860,
              color: accent,
              fontSize: 27,
              lineHeight: 1.15,
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
              whiteSpace: 'normal',
            }}
          >
            {course}
          </div>
        </div>
      )}

      {/* ================================================================
          LOWER CREDENTIAL ZONE
          These positions align with the open lower portion of the supplied
          background. The seal itself is intentionally NOT drawn here because
          the background artwork already provides the graduation/seal area.
          ================================================================ */}

      {/* Date */}
      <div
        style={{
          position: 'absolute',
          left: 155,
          bottom: 105,
          width: 285,
          height: 42,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: '100%',
            paddingBottom: 7,
            borderBottom: '1px solid rgba(255,255,255,0.72)',
            color: '#ffffff',
            fontSize: 14,
            lineHeight: 1.2,
            fontWeight: 500,
            textShadow: '0 1px 4px rgba(0,0,0,0.7)',
          }}
        >
          {date}
        </div>
        <div
          style={{
            marginTop: 5,
            color: 'rgba(255,255,255,0.78)',
            fontSize: 11,
            letterSpacing: '0.7px',
            textTransform: 'uppercase',
          }}
        >
          Date
        </div>
      </div>

      {/* Signature */}
      <div
        style={{
          position: 'absolute',
          right: 150,
          bottom: 96,
          width: 300,
          height: 58,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center',
          textAlign: 'center',
          zIndex: 10,
        }}
      >
        {signatureUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={signatureUrl}
            alt="Signature"
            style={{
              width: 150,
              height: 38,
              objectFit: 'contain',
              display: 'block',
              marginBottom: 2,
            }}
          />
        )}

        <div
          style={{
            width: '100%',
            paddingBottom: 6,
            borderBottom: '1px solid rgba(255,255,255,0.72)',
          }}
        />

        {signatureText && (
          <div
            style={{
              marginTop: 5,
              color: 'rgba(255,255,255,0.82)',
              fontSize: 11,
              lineHeight: 1.2,
              letterSpacing: '0.6px',
            }}
          >
            {signatureText}
          </div>
        )}

        {founderName && (
          <div
            style={{
              marginTop: 2,
              color: '#ffffff',
              fontSize: 13,
              lineHeight: 1.2,
              fontWeight: 600,
              textShadow: '0 1px 4px rgba(0,0,0,0.7)',
            }}
          >
            {founderName}
          </div>
        )}
      </div>

      {/* ================================================================
          QR CODE
          Never render an empty QR placeholder. If QR is disabled or data
          is unavailable, this entire element disappears.
          ================================================================ */}

      {qrEnabled !== false && qrData && (
        <div
          style={{
            position: 'absolute',
            right: 58,
            bottom: 92,
            width: 64,
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            padding: 4,
            borderRadius: 2,
            opacity: 0.92,
            zIndex: 10,
          }}
        >
          <svg
            width="56"
            height="56"
            viewBox={`0 0 ${qrData.modules.size} ${qrData.modules.size}`}
            fill="#000000"
            shapeRendering="crispEdges"
            aria-label="Certificate verification QR code"
          >
            {Array.from(qrData.modules.data).map((isDark, index) => {
              if (!isDark) return null

              const size = qrData.modules.size
              const x = index % size
              const y = Math.floor(index / size)

              return (
                <rect
                  key={index}
                  x={x}
                  y={y}
                  width="1.05"
                  height="1.05"
                />
              )
            })}
          </svg>
        </div>
      )}

      {/* Certificate ID - deliberately subtle and separated from the footer. */}
      {certificateId && (
        <div
          style={{
            position: 'absolute',
            right: 70,
            bottom: 53,
            maxWidth: 250,
            color: 'rgba(255,255,255,0.52)',
            fontSize: 9,
            lineHeight: 1.2,
            letterSpacing: '0.45px',
            textAlign: 'right',
            zIndex: 10,
          }}
        >
          Certificate ID: {certificateId}
        </div>
      )}

      {/* Footer */}
      {footer && (
        <div
          style={{
            position: 'absolute',
            left: 120,
            bottom: 20,
            width: 960,
            minHeight: 18,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          <div
            style={{
              maxWidth: 850,
              color: 'rgba(255,255,255,0.78)',
              fontSize: 11,
              lineHeight: 1.2,
              fontWeight: 400,
              letterSpacing: '0.55px',
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
            }}
          >
            {footer}
          </div>
        </div>
      )}
    </div>
  )
}
