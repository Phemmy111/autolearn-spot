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
  qrData,
  backgroundSrc,
  signatureUrl,
  footer,
  accentColor,
}: CertificateTemplateProps) {
  const displayCourse = course || 'AI Automation with n8n'
  const displayName = name || 'Student'
  const displayCertId = certificateId || 'CERT-07D13D81'
  const bg = backgroundSrc || '/certificate-template-parchment-clean.png'
  const displayFooter = footer || 'AutoLearn Spot • Learn • Automate • Succeed'

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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bg}
        alt="Certificate Background"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${CANVAS_WIDTH}px`,
          height: `${CANVAS_HEIGHT}px`,
          objectFit: 'cover',
          zIndex: 0,
        }}
      />

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
            top: '68px',
            left: 0,
            width: `${CANVAS_WIDTH}px`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Real AutoLearn Brandmark Logo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/autolearn-brandmark.png"
              alt="AutoLearn Spot Logo"
              style={{ width: '56px', height: '56px', objectFit: 'contain' }}
            />

            <div style={{ width: '1.5px', height: '42px', backgroundColor: '#cbd5e1' }} />

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: '25px',
                  fontWeight: 800,
                  color: '#047857',
                  letterSpacing: '1.5px',
                  lineHeight: 1.1,
                }}
              >
                AUTOLEARN <span style={{ color: '#0f172a' }}>SPOT</span>
              </span>
              <span
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: '#475569',
                  letterSpacing: '2.4px',
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/certificate-gold-seal.png"
              alt="Official AutoLearn Gold Foil Seal"
              style={{ width: '146px', height: '168px', objectFit: 'contain' }}
            />
          </div>

          {/* 8C. Real Founder Signature */}
          <div style={{ display: 'flex', flexDirection: 'column', width: '240px', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signatureUrl || "/signature-femi-real.png"}
              alt="A. Femi Adeleke Signature"
              style={{ maxHeight: '56px', width: 'auto', objectFit: 'contain' }}
            />
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
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src="/certificate-qr-sample.png"
                  alt="QR Verification"
                  style={{ width: '72px', height: '72px', objectFit: 'contain' }}
                />
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
