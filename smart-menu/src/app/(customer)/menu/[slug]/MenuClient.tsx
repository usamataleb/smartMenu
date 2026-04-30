"use client";

import { useMemo, useState } from "react";
import type { MenuItem } from "@/generated/prisma/client";
import CategoryTabs from "./CategoryTabs";
import MenuItemCard from "./MenuItemCard";

const CATEGORY_STYLES: Record<string, { emoji: string; from: string; to: string }> = {
  "Street Food": { emoji: "🥙", from: "#fb923c", to: "#f97316" },
  Seafood: { emoji: "🦐", from: "#22d3ee", to: "#0891b2" },
  "Rice Dishes": { emoji: "🍚", from: "#fbbf24", to: "#d97706" },
  Soups: { emoji: "🍲", from: "#f87171", to: "#dc2626" },
  Drinks: { emoji: "🥥", from: "#4ade80", to: "#16a34a" },
  Grills: { emoji: "🔥", from: "#f472b6", to: "#db2777" },
  Desserts: { emoji: "🍮", from: "#c084fc", to: "#9333ea" },
};

const DIETARY_TAGS = [
  { id: "vegan", label: "Vegan" },
  { id: "vegetarian", label: "Veg" },
  { id: "halal", label: "Halal" },
  { id: "spicy", label: "Spicy" },
  { id: "nuts", label: "Nuts" },
  { id: "gluten-free", label: "GF" },
];

function categoryStyle(name: string) {
  return CATEGORY_STYLES[name] ?? { emoji: "🍽️", from: "#fcd34d", to: "#f59e0b" };
}

function categoryId(category: string) {
  return `cat-${category.replace(/\s+/g, "-")}`;
}

function itemTags(item: MenuItem) {
  return item.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
}

function groupByCategory(items: MenuItem[]) {
  return items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
}

export default function MenuClient({
  items,
  hasAR,
}: {
  items: MenuItem[];
  hasAR: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const availableTags = useMemo(() => {
    const present = new Set(items.flatMap(itemTags));
    return DIETARY_TAGS.filter((tag) => present.has(tag.id));
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const tags = itemTags(item);
      const matchesSearch =
        normalizedQuery.length === 0 ||
        [item.name, item.description ?? "", item.category, tags.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesTags =
        selectedTags.length === 0 || selectedTags.every((tag) => tags.includes(tag));

      return matchesSearch && matchesTags;
    });
  }, [items, query, selectedTags]);

  const grouped = groupByCategory(filteredItems);
  const categories = Object.keys(grouped);

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]
    );
  }

  return (
    <>
      <div className="sticky top-0 z-20 bg-[#f5f5f0] border-b border-stone-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 pt-3">
          <label className="relative block">
            <span className="sr-only">Search menu</span>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden="true">
              🔎
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search dishes, drinks, tags..."
              className="w-full rounded-2xl border border-stone-200 bg-white py-3 pl-10 pr-4 text-sm text-stone-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
            />
          </label>

          {availableTags.length > 0 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pt-3 pb-2">
              {availableTags.map((tag) => {
                const active = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    aria-pressed={active}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-200 bg-white text-stone-600 hover:border-amber-300"
                    }`}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {categories.length > 0 && <CategoryTabs categories={categories} />}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-10">
        {categories.map((category) => {
          const categoryItems = grouped[category];
          const style = categoryStyle(category);

          return (
            <section key={category} id={categoryId(category)} className="scroll-mt-48">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${style.from}, ${style.to})` }}
                >
                  {style.emoji}
                </div>
                <h2 className="text-lg font-bold text-stone-800">{category}</h2>
                <span className="ml-auto text-xs text-stone-400 font-medium">
                  {categoryItems.length} item{categoryItems.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categoryItems.map((item) => (
                  <MenuItemCard key={item.id} item={item} style={style} hasAR={hasAR} />
                ))}
              </div>
            </section>
          );
        })}

        {items.length === 0 && (
          <div className="text-center py-20 text-stone-400">
            <div className="text-5xl mb-3">🍽️</div>
            <p className="font-medium">No items available yet</p>
          </div>
        )}

        {items.length > 0 && filteredItems.length === 0 && (
          <div className="text-center py-20 text-stone-400">
            <div className="text-5xl mb-3">🔎</div>
            <p className="font-medium text-stone-600">No matching items</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedTags([]);
              }}
              className="mt-4 text-sm font-semibold text-amber-600 hover:text-amber-700"
            >
              Clear filters
            </button>
          </div>
        )}

        <div className="h-8" />
      </div>
    </>
  );
}
