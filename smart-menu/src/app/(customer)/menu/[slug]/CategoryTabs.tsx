"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  categories: string[];
}

export default function CategoryTabs({ categories }: Props) {
  const [active, setActive] = useState(categories[0] ?? "");
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive(categories[0] ?? "");
  }, [categories]);

  useEffect(() => {
    const sectionIds = categories.map((c) => `cat-${c.replace(/\s+/g, "-")}`);
    const observers = new Map<string, IntersectionObserver>();

    sectionIds.forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(categories[i]);
        },
        { rootMargin: "-30% 0px -60% 0px" }
      );
      observer.observe(el);
      observers.set(id, observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [categories]);

  // Scroll the active tab into view inside the tab bar
  useEffect(() => {
    const bar = tabsRef.current;
    if (!bar) return;
    const activeBtn = bar.querySelector<HTMLElement>("[data-active=true]");
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [active]);

  function scrollToSection(category: string) {
    const id = `cat-${category.replace(/\s+/g, "-")}`;
    const el = document.getElementById(id);
    if (el) {
      const offset = 112; // header + tabs height
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
    setActive(category);
  }

  return (
    <div
      ref={tabsRef}
      className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-3"
    >
      {categories.map((cat) => (
        <button
          key={cat}
          data-active={active === cat}
          onClick={() => scrollToSection(cat)}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            active === cat
              ? "bg-amber-500 text-white shadow-sm"
              : "bg-white text-gray-600 border border-gray-200 hover:border-amber-300"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
