'use client';
import { useEffect, useState } from 'react';

export default function DesignStudioPreview() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/public/design-studio')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        setConfig(data.config ?? data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading design preview…</p>;
  if (error) return <p>Error: {error}</p>;
  if (!config) return <p>No design configuration found.</p>;

  const style = {
    backgroundColor: config.backgroundColor || 'white',
    borderRadius: config.buttonRadius ? `${config.buttonRadius}px` : undefined,
    fontFamily: config.typography?.fontFamily,
    color: config.textColor || 'inherit',
    padding: '1rem',
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Design Studio Preview</h1>
      <div style={style} className="p-6 border">
        <p>This box reflects the published design‑studio settings.</p>
        <pre className="mt-4 bg-[var(--card)] brightness-95 p-2 rounded">
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>
    </div>
  );
}
