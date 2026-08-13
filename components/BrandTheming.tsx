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
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R) : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G) : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}