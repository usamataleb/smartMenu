"use client";

import React, { useState } from "react";
import type { MenuItem } from "@/generated/prisma/client";
import MenuItemModal from "@/components/MenuItemModal";

export function formatTZS(amount: number) {
  return `TZS ${amount.toLocaleString()}`;
}

export default function MenuItemCard({
  item,
  style,
  hasAR = false,
}: {
  item: MenuItem;
  style: { emoji: string; from: string; to: string };
  hasAR?: boolean;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div 
        className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col cursor-pointer"
        onClick={() => setIsModalOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsModalOpen(true);
          }
        }}
      >
        {/* Image / Placeholder */}
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-36 object-cover"
          />
        ) : (
          <div
            className="w-full h-36 flex items-center justify-center relative overflow-hidden shrink-0"
            style={{ background: `linear-gradient(135deg, ${style.from}22, ${style.to}44)` }}
          >
            {/* Decorative circles */}
            <div
              className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20"
              style={{ background: style.to }}
            />
            <div
              className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-15"
              style={{ background: style.from }}
            />
            <span className="text-5xl relative z-10 drop-shadow-sm">{style.emoji}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-stone-900 text-[15px] leading-snug">{item.name}</h3>
          {item.description && (
            <p className="text-stone-500 text-xs mt-1.5 leading-relaxed line-clamp-2 flex-1">
              {item.description}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between">
            <span
              className="text-sm font-bold px-3 py-1 rounded-full shrink-0"
              style={{
                background: `linear-gradient(135deg, ${style.from}1a, ${style.to}2a)`,
                color: style.to,
              }}
            >
              {formatTZS(item.price)}
            </span>
            {hasAR && item.glbUrl && (
              <span className="text-[10px] font-semibold text-violet-500 bg-violet-50 px-2 py-1 rounded-full shrink-0">
                3D / AR
              </span>
            )}
          </div>
        </div>
      </div>

      <MenuItemModal 
        item={item} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        formatPrice={formatTZS} 
        hasAR={hasAR}
      />
    </>
  );
}
