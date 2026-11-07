"use client";

import React from "react";
import {
  Type,
  Volume2,
  Pause,
  Bookmark,
  BookmarkCheck,
  List,
  Minus,
  Plus,
  Sun,
  Sunset,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ReaderSettings {
  fontSizeStep: 1 | 2 | 3 | 4 | 5;
  fontFamily: "serif" | "sans" | "dyslexic";
  theme: "day" | "sepia" | "night";
  lineSpacing: "normal" | "relaxed" | "loose";
}

export interface ReaderToolbarProps {
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
  isTtsPlaying: boolean;
  isTtsSupported: boolean;
  ttsSpeed: 0.8 | 1.0 | 1.2;
  onToggleTts: () => void;
  onChangeTtsSpeed: (speed: 0.8 | 1.0 | 1.2) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onOpenToc: () => void;
  visible?: boolean;
}

export const ReaderToolbar: React.FC<ReaderToolbarProps> = ({
  settings,
  onUpdateSettings,
  isTtsPlaying,
  isTtsSupported,
  ttsSpeed,
  onToggleTts,
  onChangeTtsSpeed,
  isBookmarked,
  onToggleBookmark,
  onOpenToc,
  visible = true,
}) => {
  const stepFontDown = () => {
    if (settings.fontSizeStep > 1) {
      onUpdateSettings({
        fontSizeStep: (settings.fontSizeStep - 1) as ReaderSettings["fontSizeStep"],
      });
    }
  };

  const stepFontUp = () => {
    if (settings.fontSizeStep < 5) {
      onUpdateSettings({
        fontSizeStep: (settings.fontSizeStep + 1) as ReaderSettings["fontSizeStep"],
      });
    }
  };

  const themes: Array<{
    id: ReaderSettings["theme"];
    label: string;
    bgHex: string;
    textHex: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "day",
      label: "Siang",
      bgHex: "#FAF8F5",
      textHex: "#1E293B",
      icon: <Sun className="h-3.5 w-3.5" />,
    },
    {
      id: "sepia",
      label: "Senja",
      bgHex: "#F4ECD8",
      textHex: "#3E2723",
      icon: <Sunset className="h-3.5 w-3.5" />,
    },
    {
      id: "night",
      label: "Malam",
      bgHex: "#12161F",
      textHex: "#CBD5E1",
      icon: <Moon className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-16 opacity-0 pointer-events-none"
      )}
    >
      <div
        role="toolbar"
        aria-label="Kontrol Kenyamanan Baca"
        className="flex items-center gap-1.5 sm:gap-2 rounded-full shadow-xl border border-border/80 bg-background/95 backdrop-blur-md px-3 py-2 text-foreground"
      >
        {/* 1. Tombol Daftar Isi Bab */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onOpenToc}
          className="h-12 w-12 rounded-full"
          aria-label="Daftar Isi Bab"
          title="Daftar Isi Bab"
        >
          <List className="h-5 w-5" />
        </Button>

        {/* 2. Popover Pengaturan Teks (Aa) */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-12 px-3.5 rounded-full font-serif font-bold text-base gap-1"
              aria-label="Pengaturan Huruf dan Tema Kertas"
            >
              <Type className="h-4 w-4" />
              <span>Aa</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="center" side="top" className="w-80 p-4 space-y-4">
            {/* Ukuran Huruf (5 Langkah) */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2">
                <span>Ukuran Huruf</span>
                <span>Langkah {settings.fontSizeStep}/5</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={settings.fontSizeStep <= 1}
                  onClick={stepFontDown}
                  className="flex-1 h-11"
                  aria-label="Perkecil ukuran huruf"
                >
                  <Minus className="h-4 w-4 mr-1" /> Kecil
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={settings.fontSizeStep >= 5}
                  onClick={stepFontUp}
                  className="flex-1 h-11"
                  aria-label="Perbesar ukuran huruf"
                >
                  <Plus className="h-4 w-4 mr-1" /> Besar
                </Button>
              </div>
            </div>

            {/* Jenis Huruf (Serif Literata, Sans Jakarta, Ramah Disleksia Lexend) */}
            <div>
              <span className="block text-xs font-semibold text-muted-foreground mb-2">
                Jenis Huruf Bacaan
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "serif", label: "Serif", sub: "Literata", cls: "font-serif" },
                  { id: "sans", label: "Sans", sub: "Jakarta", cls: "font-sans" },
                  { id: "dyslexic", label: "Lexend", sub: "Disleksia", cls: "font-dyslexic" },
                ].map((f) => {
                  const active = settings.fontFamily === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() =>
                        onUpdateSettings({
                          fontFamily: f.id as ReaderSettings["fontFamily"],
                        })
                      }
                      className={cn(
                        "rounded-xl border p-2 text-center transition-all min-h-[48px]",
                        f.cls,
                        active
                          ? "border-primary bg-primary/10 text-primary font-bold"
                          : "border-border bg-card text-foreground hover:bg-secondary"
                      )}
                    >
                      <div className="text-xs">{f.label}</div>
                      <div className="text-[10px] opacity-75">{f.sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Spasi Baris */}
            <div>
              <span className="block text-xs font-semibold text-muted-foreground mb-2">
                Jarak Spasi Baris
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "normal", label: "Rapat (1.5)" },
                  { id: "relaxed", label: "Normal (1.8)" },
                  { id: "loose", label: "Longgar (2.1)" },
                ].map((sp) => (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        lineSpacing: sp.id as ReaderSettings["lineSpacing"],
                      })
                    }
                    className={cn(
                      "rounded-lg border py-2 px-2 text-xs font-medium transition-all min-h-[44px]",
                      settings.lineSpacing === sp.id
                        ? "border-primary bg-primary/10 text-primary font-bold"
                        : "border-border bg-card text-foreground hover:bg-secondary"
                    )}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pemilih Tema Kertas */}
            <div>
              <span className="block text-xs font-semibold text-muted-foreground mb-2">
                Warna Kertas Baca
              </span>
              <div className="grid grid-cols-3 gap-2">
                {themes.map((t) => {
                  const active = settings.theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onUpdateSettings({ theme: t.id })}
                      style={{ backgroundColor: t.bgHex, color: t.textHex }}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-xs font-bold border-2 transition-all min-h-[44px]",
                        active
                          ? "border-primary ring-2 ring-primary/30 scale-[1.02]"
                          : "border-slate-300 dark:border-slate-700"
                      )}
                    >
                      {t.icon}
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* 3. Pemilih Cepat Tema Kertas (Bulat) */}
        <div className="hidden sm:flex items-center gap-1.5 px-1 border-x border-border">
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onUpdateSettings({ theme: t.id })}
              style={{ backgroundColor: t.bgHex }}
              aria-label={`Tema kertas ${t.label}`}
              title={`Tema ${t.label}`}
              className={cn(
                "h-8 w-8 rounded-full border-2 transition-transform",
                settings.theme === t.id
                  ? "border-primary scale-110 ring-2 ring-primary/40"
                  : "border-slate-300 dark:border-slate-700 hover:scale-105"
              )}
            />
          ))}
        </div>

        {/* 4. Tombol Text-to-Speech (Suara Bacaan Bahasa Indonesia) */}
        {isTtsSupported && (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant={isTtsPlaying ? "accent" : "secondary"}
              onClick={onToggleTts}
              aria-pressed={isTtsPlaying}
              aria-label={isTtsPlaying ? "Jeda Suara Bacaan" : "Dengarkan Buku"}
              className={cn(
                "h-12 rounded-full px-4 gap-2 font-semibold text-xs sm:text-sm",
                isTtsPlaying && "animate-pulse"
              )}
            >
              {isTtsPlaying ? (
                <>
                  <Pause className="h-4 w-4 shrink-0" />
                  <span>Jeda Suara</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 shrink-0" />
                  <span>Dengarkan</span>
                </>
              )}
            </Button>

            {isTtsPlaying && (
              <button
                type="button"
                onClick={() => {
                  const nextSpeed =
                    ttsSpeed === 0.8 ? 1.0 : ttsSpeed === 1.0 ? 1.2 : 0.8;
                  onChangeTtsSpeed(nextSpeed);
                }}
                className="h-10 px-2.5 rounded-full bg-secondary text-xs font-bold text-foreground border border-border min-w-[44px]"
                title="Ubah Kecepatan Suara"
              >
                {ttsSpeed}x
              </button>
            )}
          </div>
        )}

        {/* 5. Tombol Tandai Halaman (Bookmark) */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggleBookmark}
          aria-label={
            isBookmarked ? "Hapus penanda halaman" : "Tandai halaman ini"
          }
          className={cn(
            "h-12 w-12 rounded-full",
            isBookmarked && "text-amber-500 bg-amber-500/10"
          )}
        >
          {isBookmarked ? (
            <BookmarkCheck className="h-5 w-5 fill-amber-500" />
          ) : (
            <Bookmark className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
};

