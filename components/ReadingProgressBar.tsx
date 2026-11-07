"use client";

import React from "react";
import { Trophy, BookOpen } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface ReadingProgressBarProps {
  currentPage: number;
  totalPages: number;
  chapters?: { title: string; startPage: number }[];
  variant?: "reader-top" | "milestone-card" | "inline-minimal";
  showPageNumbers?: boolean;
  className?: string;
}

export const ReadingProgressBar: React.FC<ReadingProgressBarProps> = ({
  currentPage,
  totalPages,
  chapters = [],
  variant = "reader-top",
  showPageNumbers = true,
  className,
}) => {
  const percentage = Math.min(
    100,
    Math.max(0, Math.round((currentPage / Math.max(1, totalPages)) * 100))
  );

  if (variant === "reader-top") {
    return (
      <div
        className={cn("fixed top-0 inset-x-0 z-50", className)}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`Halaman ${currentPage} dari ${totalPages} (${percentage}%)`}
      >
        <div className="h-1.5 w-full bg-secondary/70 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showPageNumbers && (
          <div className="absolute right-4 top-2.5 rounded-full bg-card/90 backdrop-blur-md border border-border px-2.5 py-0.5 text-xs font-semibold text-foreground shadow-xs">
            Hal {currentPage} dari {totalPages} ({percentage}%)
          </div>
        )}
      </div>
    );
  }

  if (variant === "milestone-card") {
    return (
      <div
        className={cn("space-y-2", className)}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`Halaman ${currentPage} dari ${totalPages}`}
      >
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-foreground">
            <BookOpen className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Halaman {currentPage} dari {totalPages}
          </span>
          <span className="text-accent flex items-center gap-1">
            {percentage}% Selesai
            <Trophy
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-300",
                percentage >= 100 ? "text-amber-500 scale-110" : "text-muted-foreground"
              )}
              aria-hidden="true"
            />
          </span>
        </div>

        <div className="relative flex items-center">
          <Progress
            value={percentage}
            className="h-3 rounded-full bg-secondary [&>div]:bg-accent"
          />
          {/* Chapter milestone dots */}
          {chapters.map((ch, idx) => {
            const pos = Math.min(
              96,
              Math.max(4, Math.round((ch.startPage / totalPages) * 100))
            );
            const passed = currentPage >= ch.startPage;
            return (
              <div
                key={idx}
                title={ch.title}
                style={{ left: `${pos}%` }}
                className={cn(
                  "absolute h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 transition-colors",
                  passed
                    ? "bg-card border-amber-600"
                    : "bg-muted-foreground/30 border-card"
                )}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("flex items-center gap-2", className)}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`Halaman ${currentPage} dari ${totalPages}`}
    >
      <Progress value={percentage} className="h-2 flex-1" />
      {showPageNumbers && (
        <span className="text-xs font-semibold text-muted-foreground shrink-0">
          {percentage}%
        </span>
      )}
    </div>
  );
};

