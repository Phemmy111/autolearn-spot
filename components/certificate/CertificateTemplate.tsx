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

/**
 * Keep typography stable on the fixed 1200x800 certificate canvas.
 * Long values shrink gradually instead of overflowing or colliding with
 * neighbouring certificate fields.
 */
function fitFontSize(
  text: string | undefined,
  preferred: number,
  minimum: number,
  maxChars: number,
) {
  if (!text) return preferred

  const length = text.trim().length
  if (length <= maxChars) return preferred

  const reduction = Math.min(0.42, ((length - maxChars) / maxChars) * 0.55)
  return Math.max(minimum, Math.round(preferred * (1 - reduction)))
}

function safeText(text: string | undefined, fallback = '') {
  return text?.trim() || fallback
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

  const certificateTitle = safeText(title, 'Certificate of Completion')
  const certificateSubtitle = safeText(subtitle, 'This certifies that')
  const certificateBody = safeText(bodyText, 'has successfully completed the')
  const certificateCourse = safeText(course, 'n8n Automation')
  const certificateFounder = safeText(founderName, 'AutoLearn Spot')
  const certificateSignatureText = safeText(signatureText, 'Founder')
  const certificateName = safeText(name, 'Student Name')

  /*
   * The current production background already contains the AutoLearn Spot
   * branding and graduation medallion. Do not draw a second logo over it.
   *
   * If a caller deliberately omits the background, the configured logo is
   * still rendered in the header so the component remains self-contained.
   */
  const renderDynamicLogo = !backgroundSrc && !!logoSrc

  const titleSize = fitFontSize(certificateTitle, 27, 18, 28)
  const subtitleSize = fitFontSize(certificateSubtitle, 14, 11, 22)
  const nameSize = fitFontSize(certificateName, 68, 42, 22)
  const bodySize = fitFontSize(certificateBody, 18, 13, 38)
  const courseSize = fitFontSize(certificateCourse, 25, 16, 30)
  const founderSize = fitFontSize(certificateFounder, 12, 9, 20)
  const footerSize = fitFontSize(footer, 10, 8, 70)

  return (
    <div
      style={{
        position: 'relative',
        width: `${CANVAS_WIDTH}px`,
        height: `${CANVAS_HEIGHT}px`,
        overflow: 'hidden',
        fontFamily: '"Roboto", Arial, sans-serif',
        background: '#030b18',
        color: '#ffffff',
      }}
    >
      {/* ================================================================
          BACKGROUND
          Artwork only. All editable certificate content is rendered below.
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
            display: 'block',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(135deg, #020915 0%, #07172b 48%, #020812 100%)',
            zIndex: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 18,
              border: `2px solid ${accent}`,
              opacity: 0.35,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 30,
              border: '1px solid rgba(255,255,255,0.16)',
            }}
          />
        </div>
      )}

      {/* Very light readability veil. It must never overpower the artwork. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.02), rgba(0,0,0,0.01) 50%, rgba(0,0,0,0.10))',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* ================================================================
          HEADER
          The supplied background owns the main brand/logo artwork.
          Only render a dynamic logo when there is no background artwork.
          ================================================================ */}
      {renderDynamicLogo && (
        <div
          style={{
            position: 'absolute',
            top: 28,
            left: 0,
            width: CANVAS_WIDTH,
            height: 72,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 5,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt="AutoLearn Spot logo"
            style={{
              width: 64,
              height: 64,
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>
      )}

      {/* ================================================================
          TITLE PANEL
          Positioned inside the large upper gold frame of the background.
          ================================================================ */}
      <div
        style={{
          position: 'absolute',
          top: 165,
          left: 255,
          width: 690,
          height: 76,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          zIndex: 5,
          padding: '0 30px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            maxWidth: '100%',
            color: '#ffffff',
            fontSize: titleSize,
            lineHeight: 1.1,
            fontWeight: 700,
            letterSpacing: '1.6px',
            textTransform: 'uppercase',
            textShadow: '0 2px 8px rgba(0,0,0,0.75)',
            overflowWrap: 'anywhere',
          }}
        >
          {certificateTitle}
        </div>

        <div
          style={{
            marginTop: 7,
            maxWidth: '90%',
            color: '#ffffff',
            fontSize: subtitleSize,
            lineHeight: 1.2,
            fontWeight: 400,
            letterSpacing: '1.4px',
            textTransform: 'none',
            textShadow: '0 1px 5px rgba(0,0,0,0.75)',
            overflowWrap: 'anywhere',
          }}
        >
          {certificateSubtitle}
        </div>
      </div>

      {/* ================================================================
          RECIPIENT
          Student name gets the strongest typographic emphasis.
          ================================================================ */}
      <div
        style={{
          position: 'absolute',
          top: 245,
          left: 150,
          width: 900,
          height: 82,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          zIndex: 5,
          padding: '0 25px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            maxWidth: '100%',
            color: '#ffffff',
            fontFamily: '"GreatVibes", "Brush Script MT", "Segoe Script", cursive',
            fontSize: nameSize,
            lineHeight: 1.0,
            fontWeight: 400,
            textShadow: '0 3px 12px rgba(0,0,0,0.88)',
            overflowWrap: 'anywhere',
          }}
        >
          {certificateName}
        </div>
      </div>

      {/* ================================================================
          COMPLETION STATEMENT
          Body text sits between the recipient and course panels.
          ================================================================ */}
      <div
        style={{
          position: 'absolute',
          top: 325,
          left: 190,
          width: 820,
          minHeight: 32,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          zIndex: 5,
          padding: '0 20px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            maxWidth: '100%',
            color: '#ffffff',
            fontSize: bodySize,
            lineHeight: 1.2,
            fontWeight: 400,
            letterSpacing: '0.25px',
            textShadow: '0 1px 5px rgba(0,0,0,0.78)',
            overflowWrap: 'anywhere',
          }}
        >
          {certificateBody}
        </div>
      </div>

      {/* ================================================================
          COURSE / PROGRAM
          IMPORTANT: This is deliberately placed INSIDE the large gold
          credential frame beneath the completion statement.
          ================================================================ */}
      <div
        style={{
          position: 'absolute',
          top: 392,
          left: 300,
          width: 600,
          height: 76,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          zIndex: 5,
          padding: '0 28px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            maxWidth: '100%',
            color: accent,
            fontSize: courseSize,
            lineHeight: 1.12,
            fontWeight: 800,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            textShadow: '0 2px 9px rgba(0,0,0,0.9)',
            overflowWrap: 'anywhere',
          }}
        >
          {certificateCourse}
        </div>
      </div>

      {/* ================================================================
          LOWER CREDENTIALS
          The background already supplies the decorative labels/medallion.
          We render only the actual dynamic values.
          ================================================================ */}

      {/* Date value — no extra "DATE" label, because the artwork supplies it. */}
      <div
        style={{
          position: 'absolute',
          left: 145,
          bottom: 104,
          width: 300,
          height: 38,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          textAlign: 'center',
          zIndex: 5,
        }}
      >
        <div
          style={{
            color: '#ffffff',
            fontSize: 13,
            lineHeight: 1.15,
            fontWeight: 500,
            textShadow: '0 1px 5px rgba(0,0,0,0.8)',
            whiteSpace: 'nowrap',
          }}
        >
          {date}
        </div>
      </div>

      {/* Signature area — the background supplies the visual line/label. */}
      <div
        style={{
          position: 'absolute',
          right: 140,
          bottom: 94,
          width: 330,
          height: 70,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center',
          textAlign: 'center',
          zIndex: 5,
          padding: '0 10px',
          boxSizing: 'border-box',
        }}
      >
        {signatureUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={signatureUrl}
            alt="Founder signature"
            style={{
              width: 150,
              height: 34,
              objectFit: 'contain',
              display: 'block',
              marginBottom: 1,
            }}
          />
        )}

        {signatureText && (
          <div
            style={{
              color: 'rgba(255,255,255,0.88)',
              fontSize: 10,
              lineHeight: 1.15,
              letterSpacing: '0.55px',
              marginTop: 2,
              maxWidth: '100%',
              overflowWrap: 'anywhere',
            }}
          >
            {certificateSignatureText}
          </div>
        )}

        {certificateFounder && (
          <div
            style={{
              color: '#ffffff',
              fontSize: founderSize,
              lineHeight: 1.15,
              fontWeight: 600,
              marginTop: 2,
              maxWidth: '100%',
              overflowWrap: 'anywhere',
              textShadow: '0 1px 4px rgba(0,0,0,0.8)',
            }}
          >
            {certificateFounder}
          </div>
        )}
      </div>

      {/* ================================================================
          QR
          Small and visually subordinate. Never create a fake placeholder.
          ================================================================ */}
      {qrEnabled !== false && qrData && (
        <div
          style={{
            position: 'absolute',
            right: 54,
            bottom: 82,
            width: 52,
            height: 52,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            padding: 3,
            borderRadius: 2,
            opacity: 0.84,
            zIndex: 5,
            boxSizing: 'border-box',
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

      {/* Certificate ID remains subtle and close to the QR area. */}
      {certificateId && (
        <div
          style={{
            position: 'absolute',
            right: 48,
            bottom: 48,
            width: 180,
            color: 'rgba(255,255,255,0.48)',
            fontSize: 8,
            lineHeight: 1.2,
            letterSpacing: '0.35px',
            textAlign: 'right',
            zIndex: 5,
            overflowWrap: 'anywhere',
          }}
        >
          {certificateId}
        </div>
      )}

      {/* ================================================================
          FOOTER
          ================================================================ */}
      {footer && (
        <div
          style={{
            position: 'absolute',
            left: 170,
            bottom: 20,
            width: 860,
            minHeight: 18,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            zIndex: 5,
            padding: '0 20px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              maxWidth: '100%',
              color: 'rgba(255,255,255,0.78)',
              fontSize: footerSize,
              lineHeight: 1.15,
              fontWeight: 400,
              letterSpacing: '0.45px',
              textShadow: '0 1px 4px rgba(0,0,0,0.65)',
              overflowWrap: 'anywhere',
            }}
          >
            {footer}
          </div>
        </div>
      )}
    </div>
  )
}
