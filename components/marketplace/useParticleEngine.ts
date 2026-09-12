// useParticleEngine.ts – custom hook that drives particles toward a formation and cycles shapes

import { useEffect, useState, useRef } from 'react';
import { getFormation } from './particleFormations';

export interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  baseOpacity: number;
}

// Configuration constants – tweak for performance / look
const COLORS = ['#111111', '#222222', '#333333', '#444444', '#555555'];
const FORMATIONS = ['Auto', 'Learn', 'Spot', 'AutoLearnSpot'] as const;
const FORMATION_DURATION_MS = 3000; // 3s per word phase
const EASE_FACTOR = 0.05; // how quickly particles move toward target
const MAX_PARTICLES_DENSITY = 700; // lower = more particles (uncountable)

export function useParticleEngine(width: number, height: number) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const lastTimeRef = useRef<number>(0);

  // Initialize particles when canvas size becomes known
  useEffect(() => {
    if (width === 0 || height === 0) return;
    const count = Math.max(30, Math.floor((width * height) / MAX_PARTICLES_DENSITY));
    const init: Particle[] = [];
    for (let i = 0; i < count; i++) {
      init.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5, // very small
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        opacity: 0,
        baseOpacity: Math.random() * 0.15 + 0.1, // low opacity for background feel
      });
    }
    setParticles(init);
  }, [width, height]);

  // Animation loop
  useEffect(() => {
    if (width === 0 || height === 0 || particles.length === 0) return;
    let animId: number;
    const loop = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = time - lastTimeRef.current;
      lastTimeRef.current = time;

      const totalDuration = FORMATIONS.length * FORMATION_DURATION_MS;
      const globalTime = time % totalDuration;
      const formationIdx = Math.floor(globalTime / FORMATION_DURATION_MS);
      const phaseTime = globalTime % FORMATION_DURATION_MS;
      const phaseProgress = phaseTime / FORMATION_DURATION_MS;

      // Smooth opacity fading: fades down briefly at the transition, fades up in the middle
      const fade = Math.sin(phaseProgress * Math.PI);

      const formationName = FORMATIONS[formationIdx];
      const targetPoints = getFormation(formationName, width, height, particles.length);

      const updated = particles.map((p, i) => {
        const target = targetPoints[i % targetPoints.length];
        const dx = target.x - p.x;
        const dy = target.y - p.y;
        
        // Easing movement
        const nx = p.x + dx * EASE_FACTOR * (dt / 16);
        const ny = p.y + dy * EASE_FACTOR * (dt / 16);
        
        // Update opacity to fade in and out per word
        const op = p.baseOpacity * (fade * 0.8 + 0.2);

        return { ...p, x: nx, y: ny, opacity: op };
      });

      setParticles(updated);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [particles.length, width, height]);

  return particles;
}
