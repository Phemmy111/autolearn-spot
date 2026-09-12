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

// Cache for text points to avoid expensive canvas operations on every frame
const textCache: Record<string, Point[]> = {};

function generateTextPoints(text: string, count: number, width: number, height: number): Point[] {
  const cacheKey = `${text}-${width}x${height}`;
  if (textCache[cacheKey] && textCache[cacheKey].length > 0) {
    return stretchToCount(textCache[cacheKey], count);
  }

  const canvas = document.createElement('canvas');
  // Use a smaller canvas for sampling to keep performance good
  const w = Math.min(width, 800);
  const h = Math.min(height, 600);
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return generateCirclePoints(count, width, height); // fallback

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = 'black';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Adjust font size based on text length and canvas width
  const fontSize = Math.min(w / (text.length * 0.6), h / 2);
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillText(text, w / 2, h / 2);

  const imgData = ctx.getImageData(0, 0, w, h).data;
  const points: Point[] = [];
  
  // Sample pixels (step by 2 or 3 to reduce points)
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const alpha = imgData[(y * w + x) * 4 + 3];
      if (alpha > 128) {
        // Map back to actual canvas dimensions
        points.push({
          x: x * (width / w),
          y: y * (height / h)
        });
      }
    }
  }

  if (points.length === 0) return generateCirclePoints(count, width, height); // fallback

  // Shuffle points to make them distribute more randomly
  for (let i = points.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [points[i], points[j]] = [points[j], points[i]];
  }

  textCache[cacheKey] = points;
  return stretchToCount(points, count);
}

function stretchToCount(points: Point[], count: number): Point[] {
  const result: Point[] = [];
  for (let i = 0; i < count; i++) {
    result.push(points[i % points.length]);
  }
  return result;
}

/**
 * Returns an array of target points for the requested formation.
 * Supported formations: text strings or legacy "circle", "star", "wave".
 */
export function getFormation(name: string, width: number, height: number, count: number): Point[] {
  switch (name) {
    case 'star':
      return generateStarPoints(count, width, height);
    case 'wave':
      return generateWavePoints(count, width, height);
    case 'circle':
      return generateCirclePoints(count, width, height);
    default:
      return generateTextPoints(name, count, width, height);
  }
}
