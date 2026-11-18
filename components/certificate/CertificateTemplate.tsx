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
  name,
  date,
  course,
  certificateId,
  logoSrc,
  qrData,
  backgroundSrc,
  signatureUrl,
  sealSrc,
  qrSrc,
  footer,
  accentColor,
}: CertificateTemplateProps) {
  const displayCourse = course || 'AI Automation with n8n'
  const displayName = name || 'Student'
  const displayCertId = certificateId || 'CERT-07D13D81'
  const displayFooter = footer || 'AutoLearn Spot • Learn • Automate • Succeed'

  const safeBg = isValidImage(backgroundSrc) ? (backgroundSrc as any) : undefined
  const safeLogo = isValidImage(logoSrc) ? (logoSrc as any) : undefined
  const safeSeal = isValidImage(sealSrc) ? (sealSrc as any) : undefined
  const safeSignature = isValidImage(signatureUrl) ? (signatureUrl as any) : undefined
  const safeQr = isValidImage(qrSrc) ? (qrSrc as any) : undefined

  return (
    <div
      style={{
        position: 'relative',
        width: `${CANVAS_WIDTH}px`,
        height: `${CANVAS_HEIGHT}px`,
        overflow: 'hidden',
        backgroundColor: '#fbf6ec',
        display: 'flex',
      }}
    >
      {/* 1. 100% Clean Textured Parchment Background (Image 3) */}
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
            top: '64px',
            left: 0,
            width: `${CANVAS_WIDTH}px`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
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

            <div style={{ width: '2px', height: '56px', backgroundColor: '#94a3b8' }} />

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: '32px',
                  fontWeight: 900,
                  color: '#047857',
                  letterSpacing: '2px',
                  lineHeight: 1.1,
                }}
              >
                AUTOLEARN <span style={{ color: '#0f172a' }}>SPOT</span>
              </span>
              <span
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#334155',
                  letterSpacing: '3px',
                  marginTop: '4px',
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
            top: '152px',
            left: 0,
            width: `${CANVAS_WIDTH}px`,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: '46px',
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
            top: '238px',
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
              fontSize: '21px',
              color: '#334155',
              letterSpacing: '0.5px',
            }}
          >
            This certificate is proudly presented to
          </span>
        </div>

        {/* 5. Student Name (Dynamic) */}
        <div
          style={{
            position: 'absolute',
            top: '304px',
            left: 0,
            width: `${CANVAS_WIDTH}px`,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: displayName.length > 25 ? '50px' : displayName.length > 18 ? '60px' : '70px',
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
            top: '426px',
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
              fontSize: '20px',
              color: '#334155',
              letterSpacing: '0.4px',
            }}
          >
            In Recognition of Completing the
          </span>
        </div>

        {/* 7. Course Title (Dynamic) */}
        <div
          style={{
            position: 'absolute',
            top: '476px',
            left: 0,
            width: `${CANVAS_WIDTH}px`,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: displayCourse.length > 35 ? '30px' : displayCourse.length > 24 ? '36px' : '42px',
              fontWeight: 900,
              color: '#0f172a',
              letterSpacing: '0.6px',
            }}
          >
            {displayCourse}
          </span>
        </div>

        {/* 8. Credentials Zone: Date (Left), Gold Medal (Center), Signature (Right), QR (Far Right) */}
        <div
          style={{
            position: 'absolute',
            top: '596px',
            left: '80px',
            width: `${CANVAS_WIDTH - 160}px`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* 8A. Date Column */}
          <div style={{ display: 'flex', flexDirection: 'column', width: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '6px', borderBottom: '1.2px solid #cbd5e1' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '19px', fontWeight: 700, color: '#0f172a' }}>
                {date}
              </span>
            </div>
            <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '15px', color: '#64748b', marginTop: '5px' }}>
              Date
            </span>
          </div>

          {/* 8B. Authentic 3D Gold Seal Ribbon Medal with AutoLearn Logo */}
          <div style={{ position: 'relative', width: '150px', height: '170px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {safeSeal ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={safeSeal}
                alt="Official AutoLearn Gold Foil Seal"
                width={146}
                height={168}
                style={{ width: '146px', height: '168px' }}
              />
            ) : (
              <svg width="90" height="90" viewBox="0 0 80 80" fill="none">
                <defs>
                  <linearGradient id="pdf-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="30%" stopColor="#FDE68A" />
                    <stop offset="60%" stopColor="#D97706" />
                    <stop offset="85%" stopColor="#FCD34D" />
                    <stop offset="100%" stopColor="#B45309" />
                  </linearGradient>
                </defs>
                <path d="M 28 48 L 18 78 L 32 70 L 40 78 L 36 48 Z" fill="#b45309" />
                <path d="M 52 48 L 62 78 L 48 70 L 40 78 L 44 48 Z" fill="#d97706" />
                <circle cx="40" cy="40" r="34" fill="url(#pdf-gold-grad)" />
                <circle cx="40" cy="40" r="28" fill="#022c22" stroke="url(#pdf-gold-grad)" strokeWidth="1.5" />
                <g transform="translate(28, 28) scale(0.6)">
                  <circle cx="20" cy="20" r="18" fill="none" stroke="#10b981" strokeWidth="3" />
                  <path d="M 12 28 L 20 10 L 28 28 Z" fill="none" stroke="#34d399" strokeWidth="3" strokeLinejoin="round" />
                  <line x1="15" y1="22" x2="25" y2="22" stroke="#34d399" strokeWidth="2.5" />
                  <circle cx="20" cy="10" r="3.5" fill="#fde68a" />
                  <circle cx="12" cy="28" r="3.5" fill="#fde68a" />
                  <circle cx="28" cy="28" r="3.5" fill="#fde68a" />
                </g>
              </svg>
            )}
          </div>

          {/* 8C. Real Founder Signature */}
          <div style={{ display: 'flex', flexDirection: 'column', width: '240px', alignItems: 'center' }}>
            {safeSignature ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={safeSignature}
                alt="A. Femi Adeleke Signature"
                width={180}
                height={56}
                style={{ width: '180px', height: '56px' }}
              />
            ) : (
              <svg width="180" height="38" viewBox="0 0 180 38" fill="none">
                <path
                  d="M 20 22 C 45 4 65 34 85 12 C 105 -2 125 30 145 14 C 158 4 168 20 172 16"
                  stroke="#0f172a"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
            )}
            <div style={{ width: '100%', height: '1.2px', backgroundColor: '#cbd5e1', marginTop: '4px' }} />
            <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '17px', fontWeight: 800, color: '#0f172a', marginTop: '5px' }}>
              A. Femi Adeleke
            </span>
            <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '14px', color: '#64748b' }}>
              Founder & Lead Instructor
            </span>
          </div>

          {/* 8D. Real QR Verification */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#ffffff',
                border: '1.2px solid #cbd5e1',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              }}
            >
              {qrData ? (
                <svg width="72" height="72" viewBox={`0 0 ${qrData.modules.size} ${qrData.modules.size}`} fill="#000000">
                  {Array.from(qrData.modules.data).map((isDark, i) => {
                    if (!isDark) return null
                    const size = qrData.modules.size
                    const x = i % size
                    const y = Math.floor(i / size)
                    return <rect key={i} x={x} y={y} width="1.05" height="1.05" />
                  })}
                </svg>
              ) : safeQr ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={safeQr}
                  alt="QR Verification"
                  width={72}
                  height={72}
                  style={{ width: '72px', height: '72px' }}
                />
              ) : (
                <svg width="56" height="56" viewBox="0 0 48 48" fill="#0f172a">
                  <rect x="4" y="4" width="16" height="16" />
                  <rect x="7" y="7" width="10" height="10" fill="#ffffff" />
                  <rect x="10" y="10" width="4" height="4" fill="#0f172a" />
                  <rect x="28" y="4" width="16" height="16" />
                  <rect x="31" y="7" width="10" height="10" fill="#ffffff" />
                  <rect x="34" y="10" width="4" height="4" fill="#0f172a" />
                  <rect x="4" y="28" width="16" height="16" />
                  <rect x="7" y="31" width="10" height="10" fill="#ffffff" />
                  <rect x="10" y="34" width="4" height="4" fill="#0f172a" />
                  <rect x="24" y="24" width="6" height="6" />
                  <rect x="34" y="24" width="8" height="4" />
                  <rect x="24" y="34" width="4" height="10" />
                  <rect x="32" y="32" width="12" height="12" />
                </svg>
              )}
            </div>
            <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '10.5px', fontWeight: 700, color: '#475569', marginTop: '5px', letterSpacing: '0.4px' }}>
              Verify Certificate
            </span>
          </div>
        </div>

        {/* 9. Bottom Motto */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            left: 0,
            width: `${CANVAS_WIDTH}px`,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: '13px',
              fontWeight: 700,
              color: '#475569',
              letterSpacing: '1px',
            }}
          >
            {displayFooter}
          </span>
        </div>
      </div>
    </div>
  )
}
