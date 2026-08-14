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

/*
 * The background artwork is the design source of truth.
 * This component deliberately renders dynamic content only inside
 * the visual zones reserved by the approved certificate artwork.
 *
 * Zone map for the current 1200x800 artwork:
 * - Logo:             top centre
 * - Title/subtitle:   upper gold frame
 * - Student name:     focal zone below upper frame
 * - Body text:        immediately below student name
 * - Course/program:   INSIDE the large lower gold frame
 * - Date:             lower-left credential line
 * - Signature:        lower-right credential line
 * - Graduation seal:  already baked into the background; never duplicate it
 * - QR:               small/subordinate, only when real QR data exists
 * - Certificate ID:   very subtle bottom-right
 * - Footer:           bottom centre
 */

function safeText(value: string | undefined, fallback = ''): string {
  const text = (value ?? '').trim()
  return text || fallback
}

/**
 * Deterministic font fitting for server/PDF rendering.
 * We avoid browser-only measurement APIs so the same component behaves
 * consistently in preview and generated certificates.
 */
function fitFontSize(
  text: string,
  baseSize: number,
  maxChars: number,
  minSize: number,
): number {
  const length = text.trim().length
  if (length <= maxChars) return baseSize

  const ratio = maxChars / Math.max(length, maxChars)
  return Math.max(minSize, Math.floor(baseSize * ratio))
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
  qrDestination: _qrDestination,
  footer,
  accentColor,
}: CertificateTemplateProps) {
  const accent = accentColor || '#00e5ff'

  const displayTitle = safeText(title, 'Certificate of Completion')
  const displaySubtitle = safeText(subtitle, 'This certifies that')
  const displayBody = safeText(bodyText, 'has successfully completed the')
  const displayCourse = safeText(course, 'n8n Automation')
  const displayName = safeText(name, 'Student Name')
  const displayDate = safeText(date)
  const displayFounder = safeText(founderName)
  const displaySignatureText = safeText(signatureText)
  const displayFooter = safeText(footer)

  const titleSize = fitFontSize(displayTitle, 24, 31, 16)
  const subtitleSize = fitFontSize(displaySubtitle, 11, 42, 9)
  const nameSize = fitFontSize(displayName, 68, 18, 38)
  const bodySize = fitFontSize(displayBody, 16, 46, 11)
  const courseSize = fitFontSize(displayCourse, 24, 28, 13)
  const founderSize = fitFontSize(displayFounder, 12, 25, 9)
  const signatureTextSize = fitFontSize(displaySignatureText, 10, 24, 8)
  const footerSize = fitFontSize(displayFooter, 10, 72, 8)

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
      {/* ================================================================
          APPROVED BACKGROUND
          ================================================================ */}
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
            background:
              'linear-gradient(135deg, #03101f 0%, #07172a 48%, #020914 100%)',
            zIndex: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 18,
              border: `2px solid ${accent}`,
              opacity: 0.32,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 28,
              border: `1px solid ${accent}`,
              opacity: 0.15,
            }}
          />
        </div>
      )}

      {/* Very light readability overlay. Does not add text or icons. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.06), rgba(0,0,0,0.015) 48%, rgba(0,0,0,0.10))',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* ================================================================
          1. LOGO ZONE
          The background contains a dedicated top-centre logo housing.
          ================================================================ */}
      {logoSrc && (
        <div
          style={{
            position: 'absolute',
            top: 38,
            left: 0,
            width: CANVAS_WIDTH,
            height: 72,
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
              width: 62,
              height: 62,
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>
      )}

      {/* ================================================================
          2. TITLE + SUBTITLE
          These belong INSIDE the upper gold frame.
          ================================================================ */}
      <div
        style={{
          position: 'absolute',
          top: 148,
          left: 155,
          width: 890,
          height: 55,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 790,
            color: '#ffffff',
            fontSize: titleSize,
            lineHeight: 1.05,
            fontWeight: 700,
            letterSpacing: '1.35px',
            textTransform: 'uppercase',
            textShadow: '0 2px 7px rgba(0,0,0,0.78)',
            whiteSpace: 'nowrap',
          }}
        >
          {displayTitle}
        </div>

        <div
          style={{
            marginTop: 5,
            maxWidth: 650,
            color: 'rgba(255,255,255,0.92)',
            fontSize: subtitleSize,
            lineHeight: 1.1,
            fontWeight: 400,
            letterSpacing: '0.8px',
            textShadow: '0 1px 4px rgba(0,0,0,0.7)',
            whiteSpace: 'nowrap',
          }}
        >
          {displaySubtitle}
        </div>
      </div>

      {/* ================================================================
          3. STUDENT NAME
          Dedicated focal zone immediately below the title frame.
          ================================================================ */}
      <div
        style={{
          position: 'absolute',
          top: 218,
          left: 105,
          width: 990,
          height: 70,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: '100%',
            color: '#ffffff',
            fontFamily: '"GreatVibes", "Brush Script MT", cursive',
            fontSize: nameSize,
            lineHeight: 1,
            fontWeight: 400,
            textShadow: '0 3px 10px rgba(0,0,0,0.85)',
            whiteSpace: 'nowrap',
          }}
        >
          {displayName}
        </div>
      </div>

      {/* Fine divider supporting the name without creating another content box. */}
      <div
        style={{
          position: 'absolute',
          top: 289,
          left: 285,
          width: 630,
          height: 1,
          background:
            'linear-gradient(to right, transparent, rgba(255,255,255,0.48), transparent)',
          opacity: 0.8,
          zIndex: 9,
        }}
      />

      {/* ================================================================
          4. BODY TEXT
          ================================================================ */}
      <div
        style={{
          position: 'absolute',
          top: 298,
          left: 180,
          width: 840,
          height: 32,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 790,
            color: '#ffffff',
            fontSize: bodySize,
            lineHeight: 1.15,
            fontWeight: 400,
            letterSpacing: '0.2px',
            textShadow: '0 1px 5px rgba(0,0,0,0.78)',
            whiteSpace: 'nowrap',
          }}
        >
          {displayBody}
        </div>
      </div>

      {/* ================================================================
          5. COURSE / PROGRAM
          CRITICAL: this is centered INSIDE the large lower gold frame.
          ================================================================ */}
      <div
        style={{
          position: 'absolute',
          top: 482,
          left: 125,
          width: 950,
          height: 82,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '0 35px',
          boxSizing: 'border-box',
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 820,
            color: accent,
            fontSize: courseSize,
            lineHeight: 1.12,
            fontWeight: 700,
            letterSpacing: '0.85px',
            textTransform: 'uppercase',
            textShadow: '0 2px 8px rgba(0,0,0,0.82)',
            whiteSpace: 'normal',
            overflowWrap: 'anywhere',
          }}
        >
          {displayCourse}
        </div>
      </div>

      {/* ================================================================
          6. DATE
          Use the existing lower-left artwork line as the visual anchor.
          The background is responsible for the line/decoration.
          ================================================================ */}
      {displayDate && (
        <div
          style={{
            position: 'absolute',
            left: 145,
            bottom: 101,
            width: 285,
            height: 34,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          <span
            style={{
              color: '#ffffff',
              fontSize: 12,
              lineHeight: 1.1,
              fontWeight: 500,
              textShadow: '0 1px 4px rgba(0,0,0,0.72)',
              whiteSpace: 'nowrap',
            }}
          >
            {displayDate}
          </span>
        </div>
      )}

      {/* ================================================================
          7. SIGNATURE / FOUNDER
          Use the existing lower-right artwork line as the anchor.
          ================================================================ */}
      <div
        style={{
          position: 'absolute',
          right: 145,
          bottom: 87,
          width: 300,
          height: 74,
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
              width: 138,
              height: 34,
              objectFit: 'contain',
              display: 'block',
              marginBottom: 1,
            }}
          />
        )}

        {displaySignatureText && (
          <div
            style={{
              color: 'rgba(255,255,255,0.82)',
              fontSize: signatureTextSize,
              lineHeight: 1.1,
              letterSpacing: '0.45px',
              marginTop: 2,
              whiteSpace: 'nowrap',
            }}
          >
            {displaySignatureText}
          </div>
        )}

        {displayFounder && (
          <div
            style={{
              color: '#ffffff',
              fontSize: founderSize,
              lineHeight: 1.1,
              fontWeight: 600,
              marginTop: 2,
              textShadow: '0 1px 4px rgba(0,0,0,0.72)',
              whiteSpace: 'nowrap',
            }}
          >
            {displayFounder}
          </div>
        )}
      </div>

      {/* ================================================================
          8. QR
          Subtle, small and conditional. No empty placeholder.
          ================================================================ */}
      {qrEnabled !== false && qrData && (
        <div
          style={{
            position: 'absolute',
            right: 42,
            bottom: 73,
            width: 52,
            height: 52,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            padding: 3,
            borderRadius: 2,
            opacity: 0.84,
            zIndex: 10,
          }}
        >
          <svg
            width="46"
            height="46"
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

      {/* ================================================================
          9. CERTIFICATE ID
          Quiet metadata; never competes with the certificate content.
          ================================================================ */}
      {certificateId && (
        <div
          style={{
            position: 'absolute',
            right: 62,
            bottom: 47,
            maxWidth: 245,
            color: 'rgba(255,255,255,0.48)',
            fontSize: 8,
            lineHeight: 1.15,
            letterSpacing: '0.35px',
            textAlign: 'right',
            zIndex: 10,
            whiteSpace: 'nowrap',
          }}
        >
          {certificateId}
        </div>
      )}

      {/* ================================================================
          10. FOOTER
          ================================================================ */}
      {displayFooter && (
        <div
          style={{
            position: 'absolute',
            left: 140,
            bottom: 18,
            width: 920,
            height: 18,
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
              color: 'rgba(255,255,255,0.72)',
              fontSize: footerSize,
              lineHeight: 1.1,
              fontWeight: 400,
              letterSpacing: '0.45px',
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
              whiteSpace: 'nowrap',
            }}
          >
            {displayFooter}
          </div>
        </div>
      )}
    </div>
  )
}
