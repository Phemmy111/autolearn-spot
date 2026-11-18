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
  const accent = accentColor || '#00f0ff'
  const displayCourse = course || 'n8n Automation'
  const displayName = name || 'Student'
  const displayCertId = certificateId || 'ALS-2026-CERT'
  const bg = backgroundSrc || '/certificate-template.png'
  const displayFooter = footer || `© ${new Date().getFullYear()} AutoLearn Spot - All Rights Reserved`

  return (
    <div
      style={{
        position: 'relative',
        width: `${CANVAS_WIDTH}px`,
        height: `${CANVAS_HEIGHT}px`,
        overflow: 'hidden',
        fontFamily: '"Roboto", Arial, sans-serif',
        backgroundColor: '#030a16',
        display: 'flex',
      }}
    >
      {/* Background Image - Clean 2026 AutoLearn Spot Artwork */}
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

      {/* Luxury Gold & Emerald Ornate Border SVG Layer */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${CANVAS_WIDTH}px`,
          height: `${CANVAS_HEIGHT}px`,
          pointerEvents: 'none',
          zIndex: 1,
        }}
        viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
      >
        <defs>
          <linearGradient id="cert-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="25%" stopColor="#FDE68A" />
            <stop offset="50%" stopColor="#D97706" />
            <stop offset="75%" stopColor="#FCD34D" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <linearGradient id="cert-emerald" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>

        {/* Outer Gold Border */}
        <rect x="20" y="20" width="1160" height="760" rx="8" fill="none" stroke="url(#cert-gold)" strokeWidth="2.5" opacity="0.9" />
        
        {/* Inner Emerald Border */}
        <rect x="30" y="30" width="1140" height="740" rx="6" fill="none" stroke="url(#cert-emerald)" strokeWidth="1.5" strokeDasharray="6,3" opacity="0.75" />

        {/* Hairline Border */}
        <rect x="36" y="36" width="1128" height="728" rx="4" fill="none" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.25" />

        {/* Ornate Corner Brackets */}
        <path d="M 20 54 L 54 54 L 54 20" fill="none" stroke="url(#cert-gold)" strokeWidth="2.5" />
        <path d="M 1180 54 L 1146 54 L 1146 20" fill="none" stroke="url(#cert-gold)" strokeWidth="2.5" />
        <path d="M 20 746 L 54 746 L 54 780" fill="none" stroke="url(#cert-gold)" strokeWidth="2.5" />
        <path d="M 1180 746 L 1146 746 L 1146 780" fill="none" stroke="url(#cert-gold)" strokeWidth="2.5" />

        {/* Official Verification Seal (Bottom Center) */}
        <g transform="translate(600, 680)">
          <circle cx="0" cy="0" r="36" fill="url(#cert-gold)" />
          <circle cx="0" cy="0" r="30" fill="#06201b" stroke="url(#cert-gold)" strokeWidth="1.5" />
          <polygon points="0,-12 3,-3 12,-3 5,2 7,11 0,6 -7,11 -5,2 -12,-3 -3,-3" fill="#FDE68A" />
        </g>
      </svg>

      {/* Dynamic Overlay Layer */}
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
            top: '32px',
            right: '48px',
            display: 'flex',
            alignItems: 'center',
            padding: '4px 12px',
            borderRadius: '4px',
            backgroundColor: 'rgba(3, 16, 32, 0.75)',
            border: `1px solid ${accent}`,
            color: '#a0aec0',
            fontSize: '11px',
            fontFamily: '"Roboto", monospace',
            letterSpacing: '1px',
          }}
        >
          <span>ID: {displayCertId}</span>
        </div>

        {/* Student Name Overlay - Perfectly centered in the focal name zone */}
        <div
          style={{
            position: 'absolute',
            top: '345px',
            left: 0,
            width: `${CANVAS_WIDTH}px`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontFamily: '"Playfair Display", "GreatVibes", Georgia, serif',
              fontSize: displayName.length > 28 ? '58px' : displayName.length > 20 ? '70px' : '82px',
              color: '#ffffff',
              fontWeight: 600,
              letterSpacing: '0.5px',
              lineHeight: 1,
              textAlign: 'center',
              textShadow: '0 0 20px rgba(0, 240, 255, 0.45), 0 2px 8px rgba(0, 0, 0, 0.9)',
            }}
          >
            {displayName}
          </span>
        </div>

        {/* Dynamic Course Title Overlay */}
        <div
          style={{
            position: 'absolute',
            top: '516px',
            left: '150px',
            width: '900px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#040b17',
              padding: '6px 28px',
              borderRadius: '8px',
              border: `1px solid rgba(0, 240, 255, 0.35)`,
              boxShadow: '0 0 15px rgba(0, 240, 255, 0.2)',
            }}
          >
            <span
              style={{
                fontFamily: '"Roboto", Arial, sans-serif',
                fontSize: displayCourse.length > 35 ? '26px' : '32px',
                fontWeight: 700,
                color: accent,
                letterSpacing: '0.8px',
                textAlign: 'center',
                textShadow: '0 0 12px rgba(0, 240, 255, 0.5)',
              }}
            >
              {displayCourse}
            </span>
          </div>
        </div>

        {/* Adjusted Date Overlay - Positioned accurately over the Date blank line */}
        <div
          style={{
            position: 'absolute',
            top: '654px',
            left: '235px',
            width: '230px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontFamily: '"Roboto", sans-serif',
              fontSize: '15px',
              color: '#ffffff',
              fontWeight: 500,
              letterSpacing: '0.3px',
              textShadow: '0 1px 4px rgba(0,0,0,0.8)',
            }}
          >
            {date}
          </span>
        </div>

        {/* Optional Custom Signature Overlay (Bottom Right) */}
        {signatureUrl && (
          <div
            style={{
              position: 'absolute',
              top: '625px',
              right: '180px',
              width: '180px',
              height: '45px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signatureUrl}
              alt="Signature"
              style={{
                maxWidth: '180px',
                maxHeight: '45px',
                objectFit: 'contain',
              }}
            />
          </div>
        )}

        {/* QR Code - Credential Verification Badge */}
        {qrData && (
          <div
            style={{
              position: 'absolute',
              bottom: '125px',
              right: '72px',
              display: 'flex',
              width: '76px',
              height: '76px',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
              padding: '4px',
              borderRadius: '6px',
              border: `2px solid ${accent}`,
              boxShadow: `0 0 12px rgba(0, 240, 255, 0.4)`,
            }}
          >
            <svg
              width="68"
              height="68"
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
          </div>
        )}

        {/* Dynamic Footer Overlay (Centered at Bottom) */}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            left: 0,
            width: `${CANVAS_WIDTH}px`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontFamily: '"Roboto", Arial, sans-serif',
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.85)',
              letterSpacing: '0.8px',
              textAlign: 'center',
              textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)',
            }}
          >
            {displayFooter}
          </span>
        </div>
      </div>
    </div>
  )
}
