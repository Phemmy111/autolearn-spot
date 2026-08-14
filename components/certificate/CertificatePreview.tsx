"use client";

import { CertificateTemplate } from './CertificateTemplate';
import { useEffect, useState, useRef } from 'react';
import { CertificateLayout, validateLayout, DEFAULT_CERTIFICATE_LAYOUT } from '@/lib/certificate-layout';

interface CertificatePreviewProps {
  title: string;
  subtitle: string;
  bodyText: string;
  founderName: string;
  signatureText: string;
  accentColor: string;
  backgroundUrl: string;
  logoUrl: string;
  signatureUrl: string;
  qrEnabled: boolean;
  qrDestination: string;
  footer: string;
  course?: string;
  layout?: CertificateLayout;
}

export function CertificatePreview({
  title,
  subtitle,
  bodyText,
  founderName,
  signatureText,
  accentColor,
  backgroundUrl,
  logoUrl,
  signatureUrl,
  qrEnabled,
  qrDestination,
  footer,
  course,
  layout,
}: CertificatePreviewProps) {
  const [qrData, setQrData] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (qrEnabled && qrDestination) {
      // Generate simple QR code placeholder
      // In production, use a proper QR code library
      const size = 25;
      const data = new Array(size * size).fill(false);
      
      // Simple pattern for demo
      for (let i = 0; i < size * size; i++) {
        const x = i % size;
        const y = Math.floor(i / size);
        // Create a pattern that looks like a QR code
        data[i] = (x + y) % 3 === 0 || (x * y) % 7 === 0;
      }
      
      setQrData({ modules: { size, data } });
    } else {
      setQrData(null);
    }
  }, [qrEnabled, qrDestination]);

  // Use the new professional certificate background
  const cleanBackgroundUrl = backgroundUrl || '/certificate-template.png'

  // Use provided layout or fall back to default
  const activeLayout = layout || DEFAULT_CERTIFICATE_LAYOUT
  
  // Validate layout
  useEffect(() => {
    if (layout) {
      const validation = validateLayout(layout);
      if (!validation.valid) {
        console.error('Invalid certificate layout in preview:', validation.errors);
      }
    }
  }, [layout]);

  // Force re-render when settings change
  useEffect(() => {
    // This effect ensures the preview updates when any setting prop changes
  }, [title, subtitle, bodyText, founderName, signatureText, accentColor, backgroundUrl, logoUrl, signatureUrl, qrEnabled, qrDestination, footer, course]);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        // Certificate is 1200x800, calculate scale to fit
        const scaleX = containerWidth / 1200;
        const scaleY = containerHeight / 800;
        const newScale = Math.min(scaleX, scaleY, 1);
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <div className="bg-[#0c0e12] border border-[#1f2229] rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-[#00f0ff] rounded-full animate-pulse" />
        <h3 className="text-sm font-semibold text-[#b9cacb]">Live Preview</h3>
      </div>
      
      <div ref={containerRef} className="relative w-full aspect-[3/2] bg-[#0a0c10] rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <div className="w-full h-full flex items-center justify-center">
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
              <CertificateTemplate
                layout={activeLayout}
                name="John Doe"
                date="August 2026"
                course={course || "n8n Automation"}
                certificateId="ALS-2026-DEMO-001"
                logoSrc={logoUrl}
                qrData={qrData}
                backgroundSrc={cleanBackgroundUrl}
                title={title}
                subtitle={subtitle}
                bodyText={bodyText}
                founderName={founderName}
                signatureUrl={signatureUrl}
                signatureText={signatureText}
                qrEnabled={qrEnabled}
                qrDestination={qrDestination}
                footer={footer}
                accentColor={accentColor}
              />
            </div>
          </div>
        </div>
        
        {/* Preview watermark */}
        <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 backdrop-blur-sm rounded text-xs text-[#b9cacb] border border-[#1f2229]">
          PREVIEW
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-[#070B12] border border-[#1f2229] rounded-lg">
        <p className="text-xs text-[#b9cacb]">
          <span className="text-[#00f0ff]">Student:</span> John Doe • 
          <span className="text-[#00f0ff]">Course:</span> {course || "n8n Automation"} • 
          <span className="text-[#00f0ff]"> Certificate ID:</span> ALS-2026-DEMO-001
        </p>
      </div>
    </div>
  );
}