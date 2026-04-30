"use client";

import React, { useEffect } from "react";
import ARViewer from "./ARViewer";
import type { MenuItem } from "@/generated/prisma/client";
import { XMarkIcon, CubeTransparentIcon } from "@heroicons/react/24/outline";

interface MenuItemModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  formatPrice: (price: number) => string;
  hasAR?: boolean;
}

export default function MenuItemModal({ item, isOpen, onClose, formatPrice, hasAR = false }: MenuItemModalProps) {
  // Prevent body scroll when open and track view
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (item?.id) {
        fetch("/api/analytics/item-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: item.id }),
        }).catch(() => {});
      }
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal / Bottom Sheet */}
      <div className="relative w-full max-w-lg overflow-hidden bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl transform transition-all flex flex-col max-h-[90vh]">
        {/* Close Button / Handle */}
        <div className="absolute top-4 right-4 z-10">
          <button 
            onClick={onClose}
            className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Drag handle for mobile */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/40 rounded-full sm:hidden z-10" />

        {/* AR Viewer or Image */}
        <div className="w-full relative shrink-0">
          {hasAR && item.glbUrl ? (
            <ARViewer 
              glbUrl={item.glbUrl} 
              posterUrl={item.imageUrl} 
              altText={item.name} 
            />
          ) : item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt={item.name} className="w-full h-64 object-cover" />
          ) : (
            <div className="w-full h-48 bg-stone-100 flex items-center justify-center">
              <span className="text-4xl text-stone-300">🍽️</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="flex justify-between items-start mb-3 gap-4">
            <h2 className="text-2xl font-bold text-stone-900 leading-tight">{item.name}</h2>
            <span className="text-lg font-bold text-amber-600 shrink-0 mt-0.5">
              {formatPrice(item.price)}
            </span>
          </div>

          {item.description ? (
            <p className="text-stone-600 leading-relaxed mb-6">
              {item.description}
            </p>
          ) : (
            <div className="mb-6" /> // spacer
          )}

          {/* AR Action Button (Mobile Only context hint) */}
          {hasAR && item.glbUrl && (
            <div className="mt-auto pt-4 border-t border-stone-100">
              <button 
                className="w-full py-3.5 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-md lg:hidden"
                onClick={() => {
                  const viewer = document.querySelector('model-viewer') as any;
                  if (viewer && viewer.activateAR) {
                    viewer.activateAR();
                  }
                }}
              >
                <CubeTransparentIcon className="w-5 h-5" />
                View in your space (AR)
              </button>
              
              <div className="hidden lg:flex items-center justify-center p-4 bg-amber-50 rounded-xl text-amber-800 text-sm gap-2 mt-2">
                <CubeTransparentIcon className="w-4 h-4" />
                <span>Drag to rotate the 3D model. View on mobile for AR!</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
