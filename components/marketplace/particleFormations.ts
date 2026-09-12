export type Point = { x: number; y: number };

// Helper to generate points for a circle
function generateCirclePoints(count: number, width: number, height: number): Point[] {
  const radius = Math.min(width, height) / 3;
  const cx = width / 2;
  const cy = height / 2;
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    points.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
  }
  return points;
}

// Helper to generate points for a 5‑point star
function generateStarPoints(count: number, width: number, height: number): Point[] {
  const outerRadius = Math.min(width, height) / 3;
  const innerRadius = outerRadius / 2.5;
  const cx = width / 2;
  const cy = height / 2;
  const points: Point[] = [];
  const total = 10; // 5 outer + 5 inner
  for (let i = 0; i < total; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i / total) * Math.PI * 2 - Math.PI / 2; // start upright
    points.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
  }
  // If we need more points than the star vertices, duplicate them evenly
  if (count > points.length) {
    const extra = [];
    for (let i = 0; i < count; i++) {
      extra.push(points[i % points.length]);
    }
    return extra;
  }
  return points.slice(0, count);
}

// Helper to generate points for a sinusoidal wave across the canvas
function generateWavePoints(count: number, width: number, height: number): Point[] {
  const points: Point[] = [];
  const amplitude = height / 6;
  const frequency = 2 * Math.PI / width; // one full wave across width
  for (let i = 0; i < count; i++) {
    const x = (i / (count - 1)) * width;
    const y = height / 2 + Math.sin(x * frequency) * amplitude;
    points.push({ x, y });
  }
  return points;
}

/**
 * Returns an array of target points for the requested formation.
 * Supported formations: "circle", "star", "wave".
 * If an unknown name is supplied, it falls back to a circle.
 */
export function getFormation(name: string, width: number, height: number, count: number): Point[] {
  switch (name) {
    case 'star':
      return generateStarPoints(count, width, height);
    case 'wave':
      return generateWavePoints(count, width, height);
    case 'circle':
    default:
      return generateCirclePoints(count, width, height);
  }
}
