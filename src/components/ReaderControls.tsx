import { useState, useEffect } from "react";
import { SlidersHorizontal, Type, Maximize, Sun, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type FontSizeOption = "sm" | "md" | "lg" | "xl";
export type LineWidthOption = "compact" | "standard" | "wide" | "full";
export type FontFamilyOption = "sans" | "serif" | "mono";
export type ThemeToneOption = "default" | "sepia";

export interface ReaderSettings {
  fontSize: FontSizeOption;
  lineWidth: LineWidthOption;
  fontFamily: FontFamilyOption;
  themeTone: ThemeToneOption;
  showFrontmatter: boolean;
}

const STORAGE_KEY = "smartmd_reader_settings";

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: "md",
  lineWidth: "standard",
  fontFamily: "sans",
  themeTone: "default",
  showFrontmatter: false,
};

export function getSavedReaderSettings(): ReaderSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults to handle missing keys from older saves
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error("Failed to parse reader settings:", e);
  }
  return DEFAULT_SETTINGS;
}

interface ReaderControlsProps {
  settings: ReaderSettings;
  onChange: (newSettings: ReaderSettings) => void;
}

export function ReaderControls({ settings, onChange }: ReaderControlsProps) {
  const updateSetting = <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => {
    const updated = { ...settings, [key]: value };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save reader settings:", e);
    }
    onChange(updated);
  };

  const fontFamilyOptions: { id: FontFamilyOption; label: string; preview: string }[] = [
    { id: "sans", label: "Sans", preview: "Inter" },
    { id: "serif", label: "Serif", preview: "Fraunces" },
    { id: "mono", label: "Mono", preview: "Code" },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" title="Reader Display Controls" className="gap-1.5">
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Display</span>
          {settings.themeTone === "sepia" && (
            <span className="hidden sm:inline text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium leading-none">
              Sepia
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-76 p-4 bg-popover border-border z-50">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              Reader Appearance
            </h4>
          </div>

          {/* Reading Tone */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5" />
              Reading Tone
            </label>
            <div className="grid grid-cols-2 gap-1 bg-muted p-1 rounded-md">
              {(
                [
                  { id: "default" as ThemeToneOption, label: "Default", desc: "Clean white" },
                  { id: "sepia" as ThemeToneOption, label: "Sepia", desc: "Warm paper" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => updateSetting("themeTone", opt.id)}
                  className={`py-1.5 px-2 text-xs font-medium rounded transition-colors flex flex-col items-center gap-0.5 ${
                    (settings.themeTone || "default") === opt.id
                      ? "bg-background text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className="text-[10px] opacity-60">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Family */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5" />
              Font Style
            </label>
            <div className="grid grid-cols-3 gap-1 bg-muted p-1 rounded-md">
              {fontFamilyOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => updateSetting("fontFamily", opt.id)}
                  className={`py-1.5 text-xs font-medium rounded transition-colors ${
                    (settings.fontFamily || "sans") === opt.id
                      ? "bg-background text-primary shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                  <span className="block text-[10px] opacity-60">{opt.preview}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5" />
              Font Size
            </label>
            <div className="grid grid-cols-4 gap-1 bg-muted p-1 rounded-md">
              {(
                [
                  { id: "sm", label: "S" },
                  { id: "md", label: "M" },
                  { id: "lg", label: "L" },
                  { id: "xl", label: "XL" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => updateSetting("fontSize", opt.id)}
                  className={`py-1 text-xs font-medium rounded transition-colors ${
                    settings.fontSize === opt.id
                      ? "bg-background text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Column Width */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Maximize className="w-3.5 h-3.5" />
              Content Width
            </label>
            <div className="grid grid-cols-4 gap-1 bg-muted p-1 rounded-md">
              {(
                [
                  { id: "compact", label: "60ch" },
                  { id: "standard", label: "72ch" },
                  { id: "wide", label: "90ch" },
                  { id: "full", label: "100%" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => updateSetting("lineWidth", opt.id)}
                  className={`py-1 text-xs font-medium rounded transition-colors ${
                    settings.lineWidth === opt.id
                      ? "bg-background text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Frontmatter Toggle */}
          <div className="flex items-center justify-between pt-1 border-t border-border">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Show YAML Frontmatter
            </label>
            <button
              role="switch"
              aria-checked={settings.showFrontmatter}
              onClick={() => updateSetting("showFrontmatter", !settings.showFrontmatter)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                settings.showFrontmatter ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                  settings.showFrontmatter ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
