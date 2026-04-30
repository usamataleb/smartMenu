"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  src: string;
  poster?: string;
  height?: number;
}

export default function ModelPreview({ src, poster, height = 200 }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Dynamically import @google/model-viewer web component
    import("@google/model-viewer").catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-stone-100 rounded-xl text-stone-400 text-xs"
        style={{ height }}
      >
        3D preview unavailable
      </div>
    );
  }

  return (
    <div style={{ height }} className="relative rounded-xl overflow-hidden bg-stone-100">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {/* @ts-expect-error model-viewer is a custom element */}
      <model-viewer
        ref={ref}
        src={src}
        poster={poster}
        auto-rotate
        camera-controls
        style={{ width: "100%", height: "100%" }}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}
