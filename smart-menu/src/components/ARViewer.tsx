"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

interface ARViewerProps {
  glbUrl: string | null;
  posterUrl?: string | null;
  altText?: string;
}

function ARViewerInner({ glbUrl, posterUrl, altText }: ARViewerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-stone-100 rounded-xl relative">
        {posterUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={posterUrl} alt="Loading..." className="absolute inset-0 w-full h-full object-cover blur-sm opacity-50" />
        )}
        <div className="flex flex-col items-center z-10">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <span className="text-sm font-medium text-stone-500">Loading 3D Model...</span>
        </div>
      </div>
    );
  }

  if (!glbUrl) {
    return (
      <div className="w-full h-full min-h-[300px] bg-stone-100 rounded-xl flex items-center justify-center relative overflow-hidden">
        {posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterUrl}
            alt={altText || "Menu item"}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="text-stone-400 text-center">
            <div className="text-5xl mb-2">🍽️</div>
            <p className="text-sm">Image unvailable</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[300px] bg-[#f5f5f0] rounded-xl overflow-hidden relative group">
      {/* @ts-ignore */}
      <model-viewer
        src={glbUrl}
        poster={posterUrl || undefined}
        alt={altText || "3D model of food item"}
        loading="lazy"
        camera-controls
        auto-rotate
        ar
        ar-modes="webxr scene-viewer"
        shadow-intensity="1"
        style={{ width: "100%", height: "100%", minHeight: "300px" }}
      >
        <div 
          slot="poster"
          className="absolute inset-0 flex items-center justify-center bg-stone-100"
        >
          {posterUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={posterUrl} alt="Loading..." className="absolute inset-0 w-full h-full object-cover" />
          )}
           <div className="absolute inset-0 bg-white/40 flex items-center justify-center backdrop-blur-sm z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        </div>
      {/* @ts-ignore */}
      </model-viewer>
    </div>
  );
}

// Disable SSR for model-viewer since it's a web component that requires DOM
const ARViewer = dynamic(() => Promise.resolve(ARViewerInner), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-stone-100 rounded-xl animate-pulse">
      <div className="w-8 h-8 border-4 border-stone-300 border-t-amber-500 rounded-full animate-spin"></div>
    </div>
  ),
});

export default ARViewer;
