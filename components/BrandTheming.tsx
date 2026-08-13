"use client";

import { useEffect } from 'react';
import { getPublicSettings } from '@/lib/public-settings';

export function BrandTheming() {
  useEffect(() => {
    async function applyTheme() {
      try {
        const settings = await getPublicSettings(['primaryColor', 'secondaryColor', 'accentColor']);
        
        const root = document.documentElement;
        
        if (settings.primaryColor) {
          root.style.setProperty('--brand-primary', settings.primaryColor);
          root.style.setProperty('--brand-primary-hover', adjustBrightness(settings.primaryColor, 20));
          root.style.setProperty('--brand-primary-soft', adjustBrightness(settings.primaryColor, -30));
        }
        
        if (settings.secondaryColor) {
          root.style.setProperty('--brand-secondary', settings.secondaryColor);
        }
        
        if (settings.accentColor) {
          root.style.setProperty('--brand-accent', settings.accentColor);
        }
      } catch (error) {
        console.error('Failed to apply brand theme:', error);
      }
    }
    
    applyTheme();
  }, []);

  return null;
}

function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  const r = Math.min(255, Math.max(0, R));
  const g = Math.min(255, Math.max(0, G));
  const b = Math.min(255, Math.max(0, B));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}