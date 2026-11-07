"use client";

import React from "react";
import {
  Library,
  Sparkles,
  Atom,
  Compass,
  Smile,
  Check,
  BookOpen,
  Tag,
  Layers,
  Palette,
  Heart,
  Landmark,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface CategoryItem {
  id: string;
  label: string;
  iconName: string;
  count: number;
  colorClass: string;
}

export interface CategoryFilterProps {
  categories: CategoryItem[];
  selectedCategory: string;
  selectedGrade: "ALL" | "SD" | "SMP" | "SMA";
  onSelectCategory: (categoryId: string) => void;
  onSelectGrade: (grade: "ALL" | "SD" | "SMP" | "SMA") => void;
}

const renderCategoryIcon = (iconName: string, isSelected: boolean) => {
  if (isSelected) {
    return <Check className="h-4 w-4 shrink-0" aria-hidden="true" />;
  }
  switch (iconName) {
    case "Sparkles":
      return <Sparkles className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden="true" />;
    case "Atom":
      return <Atom className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden="true" />;
    case "Compass":
      return <Compass className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />;
    case "Smile":
      return <Smile className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden="true" />;
    case "Layers":
      return <Layers className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />;
    case "Palette":
      return <Palette className="h-4 w-4 shrink-0 text-pink-600 dark:text-pink-400" aria-hidden="true" />;
    case "Heart":
      return <Heart className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />;
    case "Landmark":
      return <Landmark className="h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden="true" />;
    case "Globe":
      return <Globe className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />;
    case "BookOpen":
      return <BookOpen className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" aria-hidden="true" />;
    default:
      return <Library className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />;
  }
};

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  selectedGrade,
  onSelectCategory,
  onSelectGrade,
}) => {
  const grades: Array<{ id: "ALL" | "SD" | "SMP" | "SMA"; label: string; shapeClass: string }> = [
    { id: "ALL", label: "Semua Jenjang", shapeClass: "rounded-lg" },
    { id: "SD", label: "SD", shapeClass: "rounded-full" },
    { id: "SMP", label: "SMP", shapeClass: "rounded-md" },
    { id: "SMA", label: "SMA", shapeClass: "rounded-sm" },
  ];

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    items: string[],
    current: string,
    onSelect: (val: string) => void
  ) => {
    const idx = items.indexOf(current);
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = items[(idx + 1) % items.length];
      onSelect(next);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = items[(idx - 1 + items.length) % items.length];
      onSelect(prev);
    }
  };

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      {/* Baris Chip Kategori Buku */}
      <div
        role="radiogroup"
        aria-label="Filter Kategori Buku"
        onKeyDown={(e) =>
          handleKeyDown(
            e,
            categories.map((c) => c.id),
            selectedCategory,
            onSelectCategory
          )
        }
        className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0 md:flex-wrap"
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectCategory(cat.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all duration-150 shrink-0 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isSelected
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium border border-transparent"
              )}
            >
              {renderCategoryIcon(cat.iconName, isSelected)}
              <span>{cat.label}</span>
              <span
                className={cn(
                  "ml-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold",
                  isSelected
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-background/80 text-muted-foreground"
                )}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Jenjang Sekolah (SD / SMP / SMA) */}
      <div
        role="radiogroup"
        aria-label="Filter Jenjang Sekolah"
        className="flex items-center gap-1.5 self-start md:self-auto bg-secondary/70 p-1 rounded-xl border border-border/60"
      >
        {grades.map((g) => {
          const active = selectedGrade === g.id;
          return (
            <button
              key={g.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelectGrade(g.id)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold transition-all min-h-[38px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                g.shapeClass,
                active
                  ? "bg-card text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {g.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

