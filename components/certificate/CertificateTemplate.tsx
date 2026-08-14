import React from 'react'

import { CertificateLayout, CertificateElement, validateLayout, DEFAULT_CERTIFICATE_LAYOUT, getElementText, getElementSrc } from '@/lib/certificate-layout'

interface QRCodeData {
  modules: {
    size: number
    data: boolean[]
  }
}

interface CertificateTemplateProps {
  layout?: CertificateLayout
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
  qrEnabled,
  qrDestination: _qrDestination,
  footer,
  accentColor,
}: CertificateTemplateProps) {
  const accent = accentColor || '#00e5ff'

  // Use provided layout or fall back to default
  const activeLayout = layout || DEFAULT_CERTIFICATE_LAYOUT
  
  // Validate layout
  const validation = validateLayout(activeLayout)
  if (!validation.valid) {
    console.error('Invalid certificate layout:', validation.errors)
  }

  // Prepare data for binding resolution
  const data = {
    student_name: name,
    course: course || 'n8n Automation',
    issue_date: date,
    certificate_id: certificateId || 'ALS-2026-DEMO-001'
  }

  const settings = {
    title: title || 'Certificate of Completion',
    subtitle: subtitle || 'This certifies that',
    bodyText: bodyText || 'has successfully completed the',
    founderName: founderName || 'AutoLearn Spot',
    signatureText: signatureText || 'Founder',
    footer: footer || 'AutoLearn Spot - AI Automation Training',
    logoUrl: logoSrc || '',
    signatureUrl: signatureUrl || '',
  }

  return (
    <div
      style={{
        position: 'relative',
        width: `${CANVAS_WIDTH}px`,
        height: `${CANVAS_HEIGHT}px`,
        overflow: 'hidden',
        fontFamily: '"Roboto", Arial, sans-serif',
        background: '#06101f',
        display: 'flex',
      }}
    >
      {/* Background */}
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
            display: 'flex',
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

      {/* Readability overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.06), rgba(0,0,0,0.015) 48%, rgba(0,0,0,0.10))',
          zIndex: 1,
          pointerEvents: 'none',
          display: 'flex',
        }}
      />

      {/* Render elements from layout */}
      {activeLayout.elements.map((element) => {
        const displayText = getElementText(element, data, settings)
        const displaySrc = getElementSrc(element, settings)
        
        // Skip hidden elements
        if (element.visible === false) return null

        // Skip QR if disabled
        if (element.type === 'qrCode' && (qrEnabled === false || !qrData)) return null

        // Determine if this is a text/image element
        const isTextElement = ['title', 'subtitle', 'studentName', 'bodyText', 'course', 'date', 'signatureText', 'founderName', 'certificateId', 'footer', 'text'].includes(element.type)
        const isImageElement = ['logo', 'signature', 'image'].includes(element.type)
        const isQrElement = element.type === 'qrCode'

        return (
          <div
            key={element.id}
            style={{
              position: 'absolute',
              left: element.x,
              top: element.y,
              width: element.width,
              height: element.height,
              zIndex: element.zIndex || 10,
              opacity: element.style?.opacity || 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: element.style?.textAlign === 'left' ? 'flex-start' : 
                           element.style?.textAlign === 'right' ? 'flex-end' : 'center',
              flexDirection: 'column',
              ...(element.style?.background && { background: element.style.background }),
              ...(element.style?.border && { border: element.style.border }),
              ...(element.style?.borderRadius && { borderRadius: element.style.borderRadius }),
            }}
          >
            {isTextElement && (
              <div
                style={{
                  fontFamily: element.style?.fontFamily || 'Roboto',
                  fontSize: element.style?.fontSize || 12,
                  fontWeight: element.style?.fontWeight || 400,
                  fontStyle: element.style?.fontStyle || 'normal',
                  color: element.style?.color || '#ffffff',
                  textAlign: element.style?.textAlign || 'left',
                  lineHeight: element.style?.lineHeight || 1,
                  letterSpacing: element.style?.letterSpacing || 0,
                  textShadow: element.style?.textShadow || '0 2px 8px rgba(0,0,0,0.78)',
                  whiteSpace: element.style?.whiteSpace || 'normal',
                  overflow: 'visible',
                  maxWidth: element.style?.maxWidth || '100%',
                  textTransform: element.style?.textTransform || 'none',
                  ...(element.style?.outlineWidth && element.style?.outlineWidth > 0 ? {
                    WebkitTextStroke: `${element.style.outlineWidth}px ${element.style.outlineColor || '#ffffff'}`,
                    paintOrder: 'stroke',
                  } : {}),
                }}
              >
                {displayText}
              </div>
            )}
            {isImageElement && displaySrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displaySrc}
                alt={element.id}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: element.style?.objectFit || 'contain',
                  display: 'block',
                }}
              />
            )}
            {isQrElement && qrData && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: element.style?.background || '#ffffff',
                  padding: 3,
                  borderRadius: element.style?.borderRadius || 2,
                  opacity: element.style?.opacity || 0.84,
                }}
              >
                <svg
                  width={element.width - 6}
                  height={element.height - 6}
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
          </div>
        )
      })}
    </div>
  )
}
