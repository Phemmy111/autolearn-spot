// useParticleEngine.ts – custom hook that drives particles toward a formation and cycles shapes

import { useEffect, useState, useRef } from 'react';
import { getFormation } from './particleFormations';

export interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
}

// Configuration constants – tweak for performance / look
const COLORS = ['#059669', '#0d9488', '#0284c7', '#6366f1', '#475569', '#10b981'];
const FORMATIONS = ['circle', 'star', 'wave'] as const;
const FORMATION_DURATION_MS = 12000; // 12 s per shape
const EASE_FACTOR = 0.07; // how quickly particles move toward target
const MAX_PARTICLES_DENSITY = 6000; // area / divisor (higher = fewer particles)

export function useParticleEngine(width: number, height: number) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const formationIdx = useRef(0);
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
        size: Math.random() * 3 + 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        opacity: Math.random() * 0.5 + 0.5,
      });
    }
    setParticles(init);
  }, [width, height]);

  // Cycle through formations on a timer
  useEffect(() => {
    const interval = setInterval(() => {
      formationIdx.current = (formationIdx.current + 1) % FORMATIONS.length;
    }, FORMATION_DURATION_MS);
    return () => clearInterval(interval);
  }, []);

  // Animation loop – update particle positions toward current formation targets
  useEffect(() => {
    if (width === 0 || height === 0) return;
    let animId: number;
    const loop = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = time - lastTimeRef.current;
      lastTimeRef.current = time;

      // Determine target points for current formation
      const formationName = FORMATIONS[formationIdx.current];
      const targetPoints = getFormation(
        formationName,
        width,
        height,
        particles.length,
      );

      // Update each particle toward its assigned target point (index modulo length)
      const updated = particles.map((p, i) => {
        const target = targetPoints[i % targetPoints.length];
        const dx = target.x - p.x;
        const dy = target.y - p.y;
        // Simple easing movement – scaled by dt to keep speed consistent
        const nx = p.x + dx * EASE_FACTOR * (dt / 16);
        const ny = p.y + dy * EASE_FACTOR * (dt / 16);
        return { ...p, x: nx, y: ny };
      });

      setParticles(updated);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [particles, width, height]);

  return particles;
}
