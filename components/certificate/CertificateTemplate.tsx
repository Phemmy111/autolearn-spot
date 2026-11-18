import React from 'react'

interface QRCodeData {
  modules: {
    size: number
    data: boolean[]
  }
}

interface CertificateTemplateProps {
  layout?: any
  name: string
  date: string
  course?: string
  certificateId?: string
  logoSrc?: string | ArrayBuffer
  qrData?: QRCodeData
  backgroundSrc?: string | ArrayBuffer
  title?: string
  subtitle?: string
  bodyText?: string
  founderName?: string
  signatureUrl?: string | ArrayBuffer
  signatureText?: string
  qrEnabled?: boolean
  qrDestination?: string
  footer?: string
  accentColor?: string
  sealSrc?: string | ArrayBuffer
  qrSrc?: string | ArrayBuffer
}

const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 800

const isValidImage = (src?: any): boolean => {
  if (!src) return false
  if (typeof src !== 'string') return true // ArrayBuffer or Buffer is valid in Satori
  return src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('/')
}

export function CertificateTemplate({
  layout,
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
  qrEnabled = true,
  qrDestination,
  footer,
  accentColor,
  sealSrc,
  qrSrc,
}: CertificateTemplateProps) {
  const displayCourse = course || 'AI Automation with n8n'
  const displayName = name || 'Student'
  const displayCertId = certificateId || 'CERT-07D13D81'
  const displayFooter = footer || 'AutoLearn Spot • Learn • Automate • Succeed'
  const displayDate = date || 'November 18, 2026'
  const displayFounder = founderName || 'A. Femi Adeleke'
  const displayFounderTitle = signatureText || 'Founder & Lead Instructor'

  const safeBg = isValidImage(backgroundSrc) ? (backgroundSrc as any) : undefined
  const safeLogo = isValidImage(logoSrc) ? (logoSrc as any) : undefined
  const safeSeal = isValidImage(sealSrc) ? (sealSrc as any) : undefined
  const safeSignature = isValidImage(signatureUrl) ? (signatureUrl as any) : undefined
  const safeQr = isValidImage(qrSrc) ? (qrSrc as any) : undefined

  // Check if a custom layout with elements is provided
  const hasCustomElements = layout && Array.isArray(layout.elements) && layout.elements.length > 0

  return (
    <div
      style={{
        position: 'relative',
        width: `${CANVAS_WIDTH}px`,
        height: `${CANVAS_HEIGHT}px`,
        overflow: 'hidden',
        backgroundColor: layout?.canvas?.backgroundColor || '#fbf6ec',
        display: 'flex',
      }}
    >
      {/* 1. Parchment Background */}
      {safeBg ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={safeBg}
          alt="Certificate Background"
          width={1200}
          height={800}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '1200px',
            height: '800px',
            zIndex: 0,
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
            backgroundColor: '#fbf6ec',
            zIndex: 0,
          }}
        />
      )}

      {/* Dynamic Overlay Layer (Scaled to 1200x800) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${CANVAS_WIDTH}px`,
          height: `${CANVAS_HEIGHT}px`,
          display: 'flex',
          zIndex: 10,
        }}
      >
        {hasCustomElements ? (
          // =========================================================================
          // Dynamic Layout Rendering (Controlled by Admin Visual Designer)
          // =========================================================================
          layout.elements
            .filter((el: any) => el.visible !== false)
            .map((el: any) => {
              const style = el.style || {}
              const isCenter = style.textAlign === 'center'
              const isRight = style.textAlign === 'right'
              const justify = isCenter ? 'center' : isRight ? 'flex-end' : 'flex-start'

              // 1. Logo
              if (el.id === 'logo' || el.type === 'logo') {
                return (
                  <div
                    key={el.id}
                    style={{
                      position: 'absolute',
                      left: `${el.x}px`,
                      top: `${el.y}px`,
                      width: `${el.width}px`,
                      height: `${el.height}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: el.zIndex || 10,
                    }}
                  >
                    {safeLogo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={safeLogo}
                        alt="Logo"
                        width={el.width}
                        height={el.height}
                        style={{ width: `${el.width}px`, height: `${el.height}px` }}
                      />
                    ) : (
                      <svg width={el.width} height={el.height} viewBox="0 0 40 40" fill="none">
                        <circle cx="20" cy="20" r="18" fill="none" stroke="#047857" strokeWidth="3" />
                        <path d="M 12 28 L 20 10 L 28 28 Z" fill="none" stroke="#10b981" strokeWidth="3.2" strokeLinejoin="round" />
                        <line x1="15" y1="22" x2="25" y2="22" stroke="#10b981" strokeWidth="2.8" />
                        <circle cx="20" cy="10" r="3.5" fill="#047857" />
                        <circle cx="12" cy="28" r="3.5" fill="#047857" />
                        <circle cx="28" cy="28" r="3.5" fill="#047857" />
                      </svg>
                    )}
                  </div>
                )
              }

              // 2. Brand Title ("AUTOLEARN SPOT")
              if (el.id === 'brandTitle') {
                const textVal = el.text || 'AUTOLEARN SPOT'
                return (
                  <div
                    key={el.id}
                    style={{
                      position: 'absolute',
                      left: `${el.x}px`,
                      top: `${el.y}px`,
                      width: `${el.width}px`,
                      height: `${el.height}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: justify,
                      zIndex: el.zIndex || 10,
                    }}
                  >
                    {textVal === 'AUTOLEARN SPOT' ? (
                      <div style={{ display: 'flex', alignItems: 'baseline' }}>
                        <span
                          style={{
                            fontFamily: style.fontFamily || 'system-ui, sans-serif',
                            fontSize: `${style.fontSize || 30}px`,
                            fontWeight: style.fontWeight || 900,
                            color: '#0f172a',
                            letterSpacing: style.letterSpacing || '2px',
                            lineHeight: 1.1,
                          }}
                        >
                          AUTOLEARN
                        </span>
                        <span
                          style={{
                            fontFamily: style.fontFamily || 'system-ui, sans-serif',
                            fontSize: `${style.fontSize || 30}px`,
                            fontWeight: style.fontWeight || 900,
                            color: '#047857',
                            letterSpacing: style.letterSpacing || '2px',
                            lineHeight: 1.1,
                            marginLeft: '10px',
                          }}
                        >
                          SPOT
                        </span>
                      </div>
                    ) : (
                      <span
                        style={{
                          fontFamily: style.fontFamily || 'system-ui, sans-serif',
                          fontSize: `${style.fontSize || 30}px`,
                          fontWeight: style.fontWeight || 900,
                          color: style.color || '#0f172a',
                          letterSpacing: style.letterSpacing || '2px',
                          lineHeight: 1.1,
                        }}
                      >
                        {textVal}
                      </span>
                    )}
                  </div>
                )
              }

              // 3. Certificate ID Badge
              if (el.id === 'certificateId' || el.type === 'certificateId') {
                return (
                  <div
                    key={el.id}
                    style={{
                      position: 'absolute',
                      left: `${el.x}px`,
                      top: `${el.y}px`,
                      width: `${el.width}px`,
                      height: `${el.height}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '3px 14px',
                      borderRadius: '4px',
                      backgroundColor: style.background || '#ffffff',
                      border: style.border || '1px solid #cbd5e1',
                      color: style.color || '#475569',
                      fontSize: `${style.fontSize || 11}px`,
                      fontFamily: style.fontFamily || 'monospace',
                      fontWeight: 700,
                      letterSpacing: '1px',
                      zIndex: el.zIndex || 10,
                    }}
                  >
                    <span>ID: {displayCertId}</span>
                  </div>
                )
              }

              // 4. Gold Seal Ribbon Medal
              if (el.id === 'seal') {
                return (
                  <div
                    key={el.id}
                    style={{
                      position: 'absolute',
                      left: `${el.x}px`,
                      top: `${el.y}px`,
                      width: `${el.width}px`,
                      height: `${el.height}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: el.zIndex || 10,
                    }}
                  >
                    {safeSeal ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={safeSeal}
                        alt="Gold Foil Seal"
                        width={el.width}
                        height={el.height}
                        style={{ width: `${el.width}px`, height: `${el.height}px` }}
                      />
                    ) : (
                      <svg width={el.width} height={el.height} viewBox="0 0 80 80" fill="none">
                        <circle cx="40" cy="40" r="38" fill="#d97706" />
                        <circle cx="40" cy="40" r="32" fill="#047857" />
                      </svg>
                    )}
                  </div>
                )
              }

              // 5. Signature Image
              if (el.id === 'signature' || el.type === 'signature') {
                return (
                  <div
                    key={el.id}
                    style={{
                      position: 'absolute',
                      left: `${el.x}px`,
                      top: `${el.y}px`,
                      width: `${el.width}px`,
                      height: `${el.height}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: el.zIndex || 10,
                    }}
                  >
                    {safeSignature ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={safeSignature}
                        alt="Signature"
                        width={el.width}
                        height={el.height}
                        style={{ width: `${el.width}px`, height: `${el.height}px` }}
                      />
                    ) : (
                      <svg width={el.width} height={el.height} viewBox="0 0 180 38" fill="none">
                        <path d="M 10 28 C 30 10, 50 35, 70 15 C 90 -5, 110 32, 130 18 C 150 5, 160 25, 175 12" stroke="#0f172a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>
                )
              }

              // 6. QR Code Verification Card (Transparent Background without harsh white box)
              if (el.id === 'qrCode' || el.type === 'qrCode') {
                const qrImgSize = Math.min(el.width, el.height) - 10
                return (
                  <div
                    key={el.id}
                    style={{
                      position: 'absolute',
                      left: `${el.x}px`,
                      top: `${el.y}px`,
                      width: `${el.width}px`,
                      height: `${el.height}px`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: style.background || 'transparent',
                      zIndex: el.zIndex || 10,
                    }}
                  >
                    {safeQr ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={safeQr}
                        alt="QR Verification"
                        width={qrImgSize}
                        height={qrImgSize}
                        style={{ width: `${qrImgSize}px`, height: `${qrImgSize}px` }}
                      />
                    ) : (
                      <svg width={qrImgSize} height={qrImgSize} viewBox="0 0 48 48" fill="#0f172a">
                        <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#0f172a" strokeWidth="4" />
                        <rect x="8" y="8" width="8" height="8" fill="#0f172a" />
                        <rect x="28" y="4" width="16" height="16" rx="2" fill="none" stroke="#0f172a" strokeWidth="4" />
                        <rect x="32" y="8" width="8" height="8" fill="#0f172a" />
                        <rect x="4" y="28" width="16" height="16" rx="2" fill="none" stroke="#0f172a" strokeWidth="4" />
                        <rect x="8" y="32" width="8" height="8" fill="#0f172a" />
                      </svg>
                    )}
                    <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '9.5px', fontWeight: 700, color: '#475569', marginTop: '3px' }}>
                      Verify Certificate
                    </span>
                  </div>
                )
              }

              // 7. Shapes / Lines / Dividers / Badges
              if (['shape', 'divider', 'line', 'badge'].includes(el.type) || el.id?.startsWith('shape_') || el.id?.startsWith('divider_') || el.id?.startsWith('line_')) {
                return (
                  <div
                    key={el.id}
                    style={{
                      position: 'absolute',
                      left: `${el.x}px`,
                      top: `${el.y}px`,
                      width: `${el.width}px`,
                      height: `${el.height}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: style.background || style.backgroundColor || '#047857',
                      border: style.border || (style.borderWidth ? `${style.borderWidth}px ${style.borderStyle || 'solid'} ${style.borderColor || '#047857'}` : 'none'),
                      borderRadius: style.borderRadius ? `${style.borderRadius}px` : undefined,
                      opacity: style.opacity ?? 1,
                      zIndex: el.zIndex || 10,
                    }}
                  />
                )
              }

              // 7. Date Block
              if (el.id === 'date' || el.type === 'date') {
                return (
                  <div
                    key={el.id}
                    style={{
                      position: 'absolute',
                      left: `${el.x}px`,
                      top: `${el.y}px`,
                      width: `${el.width}px`,
                      height: `${el.height}px`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isCenter ? 'center' : isRight ? 'flex-end' : 'flex-start',
                      zIndex: el.zIndex || 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '4px', width: '100%', borderBottom: '1.2px solid #cbd5e1' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span
                        style={{
                          fontFamily: style.fontFamily || '"Playfair Display", Georgia, serif',
                          fontSize: `${style.fontSize || 18}px`,
                          fontWeight: style.fontWeight || 700,
                          color: style.color || '#0f172a',
                        }}
                      >
                        {displayDate}
                      </span>
                    </div>
                    <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                      Date
                    </span>
                  </div>
                )
              }

              // Determine text content based on binding / id
              let textContent = el.text || ''
              if (el.id === 'studentName' || el.type === 'studentName') {
                textContent = displayName
              } else if (el.id === 'course' || el.type === 'course') {
                textContent = displayCourse
              } else if (el.id === 'title' || el.type === 'title') {
                textContent = el.text || title || 'CERTIFICATE OF COMPLETION'
              } else if (el.id === 'subtitle' || el.type === 'subtitle') {
                textContent = el.text || subtitle || 'This certificate is proudly presented to'
              } else if (el.id === 'bodyText' || el.type === 'bodyText') {
                textContent = el.text || bodyText || 'In Recognition of Completing the'
              } else if (el.id === 'founderName' || el.type === 'founderName') {
                textContent = el.text || displayFounder
              } else if (el.id === 'signatureText' || el.type === 'signatureText') {
                textContent = el.text || displayFounderTitle
              } else if (el.id === 'footer' || el.type === 'footer') {
                textContent = el.text || displayFooter
              }

              return (
                <div
                  key={el.id}
                  style={{
                    position: 'absolute',
                    left: `${el.x}px`,
                    top: `${el.y}px`,
                    width: `${el.width}px`,
                    height: `${el.height}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: justify,
                    zIndex: el.zIndex || 10,
                    ...(style.background && { backgroundColor: style.background }),
                    ...(style.border && { border: style.border }),
                    ...(style.borderRadius && { borderRadius: `${style.borderRadius}px` }),
                  }}
                >
                  <span
                    style={{
                      fontFamily: style.fontFamily || '"Playfair Display", Georgia, serif',
                      fontSize: `${style.fontSize || 16}px`,
                      fontWeight: style.fontWeight || 700,
                      fontStyle: style.fontStyle || 'normal',
                      color: style.color || '#0f172a',
                      letterSpacing: style.letterSpacing || 'normal',
                      lineHeight: style.lineHeight || 1.15,
                      textAlign: style.textAlign || 'left',
                    }}
                  >
                    {textContent}
                  </span>
                </div>
              )
            })
        ) : (
          // =========================================================================
          // Default Luxury Parchment Layout (Calibrated Coordinates & Geometry)
          // =========================================================================
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${CANVAS_WIDTH}px`,
              height: `${CANVAS_HEIGHT}px`,
              display: 'flex',
              flexDirection: 'column',
              zIndex: 10,
            }}
          >
            {/* Certificate ID Pill (Top Right) */}
            <div
              style={{
                position: 'absolute',
                top: '45px',
                right: '65px',
                display: 'flex',
                alignItems: 'center',
                padding: '3px 14px',
                borderRadius: '4px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#475569',
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '1px',
              }}
            >
              <span>ID: {displayCertId}</span>
            </div>

            {/* 2. Top Header: Official AutoLearn Spot Brandmark & Motto */}
            <div
              style={{
                position: 'absolute',
                top: '50px',
                left: 0,
                width: `${CANVAS_WIDTH}px`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                {safeLogo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={safeLogo}
                    alt="AutoLearn Spot Logo"
                    width={78}
                    height={78}
                    style={{ width: '78px', height: '78px' }}
                  />
                ) : (
                  <svg width="78" height="78" viewBox="0 0 40 40" fill="none">
                    <circle cx="20" cy="20" r="18" fill="none" stroke="#047857" strokeWidth="3" />
                    <path d="M 12 28 L 20 10 L 28 28 Z" fill="none" stroke="#10b981" strokeWidth="3.2" strokeLinejoin="round" />
                    <line x1="15" y1="22" x2="25" y2="22" stroke="#10b981" strokeWidth="2.8" />
                    <circle cx="20" cy="10" r="3.5" fill="#047857" />
                    <circle cx="12" cy="28" r="3.5" fill="#047857" />
                    <circle cx="28" cy="28" r="3.5" fill="#047857" />
                  </svg>
                )}

                <div style={{ width: '2px', height: '54px', backgroundColor: '#94a3b8' }} />

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline' }}>
                    <span
                      style={{
                        fontFamily: 'system-ui, sans-serif',
                        fontSize: '32px',
                        fontWeight: 900,
                        color: '#0f172a',
                        letterSpacing: '2px',
                        lineHeight: 1.1,
                      }}
                    >
                      AUTOLEARN
                    </span>
                    <span
                      style={{
                        fontFamily: 'system-ui, sans-serif',
                        fontSize: '32px',
                        fontWeight: 900,
                        color: '#047857',
                        letterSpacing: '2px',
                        lineHeight: 1.1,
                        marginLeft: '10px',
                      }}
                    >
                      SPOT
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: 'system-ui, sans-serif',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      color: '#475569',
                      letterSpacing: '3px',
                      marginTop: '3px',
                    }}
                  >
                    LEARN • AUTOMATE • SUCCEED
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Certificate Title: "CERTIFICATE OF COMPLETION" */}
            <div
              style={{
                position: 'absolute',
                top: '136px',
                left: 0,
                width: `${CANVAS_WIDTH}px`,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: '42px',
                  fontWeight: 900,
                  color: '#0f172a',
                  letterSpacing: '3.5px',
                }}
              >
                CERTIFICATE OF COMPLETION
              </span>
            </div>

            {/* 4. Presentation Lead: "This certificate is proudly presented to" */}
            <div
              style={{
                position: 'absolute',
                top: '218px',
                left: 0,
                width: `${CANVAS_WIDTH}px`,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: '19px',
                  color: '#334155',
                  letterSpacing: '0.5px',
                }}
              >
                This certificate is proudly presented to
              </span>
            </div>

            {/* 5. Student Name */}
            <div
              style={{
                position: 'absolute',
                top: '264px',
                left: 0,
                width: `${CANVAS_WIDTH}px`,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: displayName.length > 25 ? '46px' : displayName.length > 18 ? '54px' : '62px',
                  color: '#045a38',
                  fontWeight: 800,
                  fontStyle: 'italic',
                  letterSpacing: '0.8px',
                }}
              >
                {displayName}
              </span>
            </div>

            {/* 6. In Recognition of Completing the */}
            <div
              style={{
                position: 'absolute',
                top: '416px',
                left: 0,
                width: `${CANVAS_WIDTH}px`,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: '19px',
                  color: '#334155',
                  letterSpacing: '0.4px',
                }}
              >
                In Recognition of Completing the
              </span>
            </div>

            {/* 7. Course Title */}
            <div
              style={{
                position: 'absolute',
                top: '462px',
                left: 0,
                width: `${CANVAS_WIDTH}px`,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: displayCourse.length > 35 ? '28px' : displayCourse.length > 24 ? '34px' : '38px',
                  fontWeight: 900,
                  color: '#0f172a',
                  letterSpacing: '0.6px',
                }}
              >
                {displayCourse}
              </span>
            </div>

            {/* 8. Credentials Zone: Date, Gold Medal, Signature, QR */}
            <div
              style={{
                position: 'absolute',
                top: '540px',
                left: '80px',
                width: `${CANVAS_WIDTH - 160}px`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              {/* Date */}
              <div style={{ display: 'flex', flexDirection: 'column', width: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '4px', borderBottom: '1.2px solid #cbd5e1' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span
                    style={{
                      fontFamily: '"Playfair Display", Georgia, serif',
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#0f172a',
                    }}
                  >
                    {displayDate}
                  </span>
                </div>
                <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                  Date
                </span>
              </div>

              {/* Gold Seal Ribbon Medal */}
              <div style={{ position: 'relative', width: '130px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {safeSeal ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={safeSeal}
                    alt="Official AutoLearn Gold Foil Seal"
                    width={130}
                    height={150}
                    style={{ width: '130px', height: '150px' }}
                  />
                ) : (
                  <svg width="90" height="90" viewBox="0 0 80 80" fill="none">
                    <circle cx="40" cy="40" r="38" fill="#d97706" />
                    <circle cx="40" cy="40" r="32" fill="#047857" />
                  </svg>
                )}
              </div>

              {/* Founder Signature */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '220px' }}>
                {safeSignature ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={safeSignature}
                    alt="A. Femi Adeleke Signature"
                    width={175}
                    height={52}
                    style={{ width: '175px', height: '52px' }}
                  />
                ) : (
                  <svg width="180" height="38" viewBox="0 0 180 38" fill="none">
                    <path
                      d="M 10 28 C 30 10, 50 35, 70 15 C 90 -5, 110 32, 130 18 C 150 5, 160 25, 175 12"
                      stroke="#0f172a"
                      strokeWidth="2.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                <div style={{ width: '100%', height: '1.2px', backgroundColor: '#cbd5e1', marginTop: '3px' }} />
                <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  {displayFounder}
                </span>
                <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '13px', color: '#64748b' }}>
                  {displayFounderTitle}
                </span>
              </div>

              {/* QR Verification */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                  style={{
                    width: '76px',
                    height: '76px',
                    backgroundColor: '#ffffff',
                    border: '1.2px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  }}
                >
                  {safeQr ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={safeQr}
                      alt="QR Verification"
                      width={70}
                      height={70}
                      style={{ width: '70px', height: '70px' }}
                    />
                  ) : (
                    <svg width="56" height="56" viewBox="0 0 48 48" fill="#0f172a">
                      <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#0f172a" strokeWidth="4" />
                      <rect x="8" y="8" width="8" height="8" fill="#0f172a" />
                      <rect x="28" y="4" width="16" height="16" rx="2" fill="none" stroke="#0f172a" strokeWidth="4" />
                      <rect x="32" y="8" width="8" height="8" fill="#0f172a" />
                      <rect x="4" y="28" width="16" height="16" rx="2" fill="none" stroke="#0f172a" strokeWidth="4" />
                      <rect x="8" y="32" width="8" height="8" fill="#0f172a" />
                    </svg>
                  )}
                </div>
                <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '10px', fontWeight: 700, color: '#475569', marginTop: '4px' }}>
                  Verify Certificate
                </span>
              </div>
            </div>

            {/* 9. Bottom Motto */}
            <div
              style={{
                position: 'absolute',
                top: '752px',
                left: 0,
                width: `${CANVAS_WIDTH}px`,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#475569',
                  letterSpacing: '1.5px',
                }}
              >
                {displayFooter}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
