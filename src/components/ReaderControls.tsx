import { useState, useEffect } from "react";
import { SlidersHorizontal, Type, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type FontSizeOption = "sm" | "md" | "lg" | "xl";
export type LineWidthOption = "compact" | "standard" | "wide" | "full";
export type FontFamilyOption = "sans" | "serif" | "mono";

export interface ReaderSettings {
  fontSize: FontSizeOption;
  lineWidth: LineWidthOption;
  fontFamily: FontFamilyOption;
}

const STORAGE_KEY = "smartmd_reader_settings";

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: "md",
  lineWidth: "standard",
  fontFamily: "sans",
};

export function getSavedReaderSettings(): ReaderSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
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
  const updateSetting = (key: keyof ReaderSettings, value: string) => {
    const updated = { ...settings, [key]: value };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save reader settings:", e);
    }
    onChange(updated);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" title="Reader Display Controls">
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Display
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-4 bg-popover border-border z-50">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              Reader Appearance
            </h4>
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
                  { id: "sm", label: "Small" },
                  { id: "md", label: "Medium" },
                  { id: "lg", label: "Large" },
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

          {/* Font Family */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5" />
              Font Style
            </label>
            <div className="grid grid-cols-3 gap-1 bg-muted p-1 rounded-md">
              {(
                [
                  { id: "sans", label: "Sans (Inter)" },
                  { id: "serif", label: "Serif (Georgia)" },
                  { id: "mono", label: "Mono (Code)" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => updateSetting("fontFamily", opt.id)}
                  className={`py-1 text-xs font-medium rounded transition-colors ${
                    (settings.fontFamily || "sans") === opt.id
                      ? "bg-background text-primary shadow-sm font-semibold"
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
        </div>
      </PopoverContent>
    </Popover>
  );
}
