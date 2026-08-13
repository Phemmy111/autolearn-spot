"use client";

import { CertificateTemplate } from './CertificateTemplate';
import { useEffect, useState } from 'react';

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
}: CertificatePreviewProps) {
  const [qrData, setQrData] = useState<any>(null);

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

  return (
    <div className="bg-[#0c0e12] border border-[#1f2229] rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-[#00f0ff] rounded-full animate-pulse" />
        <h3 className="text-sm font-semibold text-[#b9cacb]">Live Preview</h3>
      </div>
      
      <div className="relative w-full aspect-[3/2] bg-[#0a0c10] rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="relative w-full h-full max-w-2xl">
            <CertificateTemplate
              name="John Doe"
              date="August 2026"
              logoSrc={logoUrl}
              qrData={qrData}
              backgroundSrc={backgroundUrl}
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
        
        {/* Preview watermark */}
        <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 backdrop-blur-sm rounded text-xs text-[#b9cacb] border border-[#1f2229]">
          PREVIEW
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-[#070B12] border border-[#1f2229] rounded-lg">
        <p className="text-xs text-[#b9cacb]">
          <span className="text-[#00f0ff]">Student:</span> John Doe • 
          <span className="text-[#00f0ff]"> Course:</span> Master n8n & AI Automation • 
          <span className="text-[#00f0ff]"> Certificate ID:</span> ALS-2026-DEMO-001
        </p>
      </div>
    </div>
  );
}