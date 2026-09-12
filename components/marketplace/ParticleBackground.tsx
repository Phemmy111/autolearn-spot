"use client";

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let time = 0;

    // Bold brand colors — darker for visibility on light gray
    const colors = [
      '#059669', // emerald-600
      '#0d9488', // teal-500
      '#0284c7', // sky-600
      '#6366f1', // indigo-500
      '#475569', // slate-600
      '#10b981', // emerald-500
    ];

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
      }
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      // 3x more particles than before
      const numParticles = Math.floor((canvas.width * canvas.height) / 5000);

      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1, // 1px to 4px (was 0.5–2.5)
          speedX: (Math.random() - 0.5) * 0.4,
          speedY: (Math.random() - 0.5) * 0.4 - 0.15,
          color: colors[Math.floor(Math.random() * colors.length)],
          opacity: Math.random() * 0.6 + 0.4, // 0.4 to 1.0 (was 0.1–0.6)
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinkleOffset: Math.random() * Math.PI * 2,
        });
      }
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 1;

      particles.forEach((p) => {
        // Twinkling effect — oscillates opacity
        const twinkle = Math.sin(time * p.twinkleSpeed + p.twinkleOffset);
        const dynamicOpacity = p.opacity * (0.6 + 0.4 * twinkle);

        ctx.globalAlpha = Math.max(0.15, dynamicOpacity);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Update position
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });

      animationFrameId = requestAnimationFrame(drawParticles);
    };

    // Initialize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    drawParticles();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
