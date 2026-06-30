import React, { useState, useEffect, useRef } from "react";
import { Copy, Check, ChevronDown } from "lucide-react";

// --- Color Conversion Utilities ---

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace(/^#/, "");
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return { r, g, b };
  }
  if (cleaned.length === 6) {
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    return { r, g, b };
  }
  return { r: 0, g: 0, b: 0 };
}

function rgbToHsv({ r, g, b }: { r: number; g: number; b: number }): {
  h: number;
  s: number;
  v: number;
} {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  return rgbToHsv(hexToRgb(hex));
}

function hsvToHex(h: number, s: number, v: number): string {
  const sDec = s / 100;
  const vDec = v / 100;
  const c = vDec * sDec;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = vDec - c;
  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h <= 360) {
    r = c; g = 0; b = x;
  }

  const rHex = Math.round((r + m) * 255).toString(16).padStart(2, "0");
  const gHex = Math.round((g + m) * 255).toString(16).padStart(2, "0");
  const bHex = Math.round((b + m) * 255).toString(16).padStart(2, "0");

  return `#${rHex}${gHex}${bHex}`;
}

// Check if hex is a valid hex color string
function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex) || /^#[0-9A-Fa-f]{3}$/.test(hex);
}

// Curated premium preset colors
const SWATCHES = [
  "#FFFFFF", // Alabaster White
  "#000000", // Obsidian Black
  "#EF4444", // Coral Red
  "#F97316", // Amber Orange
  "#F59E0B", // Golden Sun
  "#10B981", // Emerald Green
  "#06B6D4", // Turquoise Cyan
  "#3B82F6", // Sapphire Blue
  "#6366F1", // Royal Indigo
  "#8B5CF6", // Velvet Purple
  "#EC4899", // Neon Pink
  "#F43F5E", // Rose Red
];

// --- ColorPicker Component ---

interface ColorPickerProps {
  id: string;
  value: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ id, value, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  // Parse current value to HSV state
  const { h: initialH, s: initialS, v: initialV } = hexToHsv(value);
  const [hsv, setHsv] = useState({ h: initialH, s: initialS, v: initialV });

  const containerRef = useRef<HTMLDivElement>(null);
  const svCanvasRef = useRef<HTMLDivElement>(null);
  const hueSliderRef = useRef<HTMLDivElement>(null);

  // Sync external value changes to local state
  useEffect(() => {
    setInputValue(value);
    const { h, s, v } = hexToHsv(value);
    setHsv({ h, s, v });
  }, [value]);

  // Click outside to close popover
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen]);

  // Copy to clipboard helper
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value.toUpperCase());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy color: ", err);
    }
  };

  // Drag handlers for Saturation-Value box using Pointer Events (support mouse & touch)
  const handleSVPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    updateSVCoordinates(e);
  };

  const handleSVPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      updateSVCoordinates(e);
    }
  };

  const handleSVPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const updateSVCoordinates = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!svCanvasRef.current) return;
    const rect = svCanvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    const s = Math.round((x / rect.width) * 100);
    const v = Math.round((1 - y / rect.height) * 100);

    const newHex = hsvToHex(hsv.h, s, v);
    setHsv((prev) => ({ ...prev, s, v }));
    setInputValue(newHex);
    onChange(newHex);
  };

  // Drag handlers for Hue rainbow slider
  const handleHuePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    updateHueCoordinates(e);
  };

  const handleHuePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      updateHueCoordinates(e);
    }
  };

  const handleHuePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const updateHueCoordinates = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!hueSliderRef.current) return;
    const rect = hueSliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const h = Math.round((x / rect.width) * 360);

    const newHex = hsvToHex(h, hsv.s, hsv.v);
    setHsv((prev) => ({ ...prev, h }));
    setInputValue(newHex);
    onChange(newHex);
  };

  // Direct manual HEX text input change
  const handleTextInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    // Standardize input prefix
    const formatted = val.startsWith("#") ? val : `#${val}`;
    if (isValidHex(formatted)) {
      onChange(formatted.toLowerCase());
    }
  };

  // Preset swatch click handler
  const handleSwatchClick = (hex: string) => {
    onChange(hex);
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button */}
      <div
        id={`${id}-trigger`}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700/80 rounded-xl px-3 py-1.5 cursor-pointer select-none transition-all duration-200 shadow-sm"
      >
        <div
          className="w-5 h-5 rounded-full border border-white/10 shadow-[0_0_6px_rgba(0,0,0,0.4)]"
          style={{ backgroundColor: value }}
        />
        <span className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wide">
          {value}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-neutral-500 transition-transform duration-200" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)" }} />
      </div>

      {/* Popover Color Picker Panel */}
      {isOpen && (
        <div
          id={`${id}-popover`}
          className="absolute left-0 lg:left-auto lg:right-0 top-full z-50 mt-2 p-3.5 rounded-2xl border border-neutral-800 bg-[#0a0a0c]/98 backdrop-blur-xl shadow-2xl flex flex-col gap-3.5 w-60 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {/* 1. Saturation-Value Canvas */}
          <div
            ref={svCanvasRef}
            onPointerDown={handleSVPointerDown}
            onPointerMove={handleSVPointerMove}
            onPointerUp={handleSVPointerUp}
            className="relative h-32 w-full rounded-lg overflow-hidden cursor-crosshair select-none touch-none"
            style={{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }}
          >
            {/* White overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
            {/* Black overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
            {/* Drag Thumb */}
            <div
              className="absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow-[0_0_4px_rgba(0,0,0,0.6)] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }}
            />
          </div>

          {/* 2. Hue Slider */}
          <div
            ref={hueSliderRef}
            onPointerDown={handleHuePointerDown}
            onPointerMove={handleHuePointerMove}
            onPointerUp={handleHuePointerUp}
            className="relative h-3 w-full rounded-full cursor-pointer select-none touch-none border border-neutral-900"
            style={{
              background:
                "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
            }}
          >
            {/* Drag Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-[0_0_4px_rgba(0,0,0,0.6)] -translate-x-1/2 pointer-events-none bg-neutral-950"
              style={{
                left: `${(hsv.h / 360) * 100}%`,
                backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
              }}
            />
          </div>

          {/* 3. Preset Swatches */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider">
              Swatches
            </span>
            <div className="grid grid-cols-6 gap-2">
              {SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => handleSwatchClick(swatch)}
                  className={`w-6 h-6 rounded-full border border-white/5 hover:scale-110 active:scale-95 transition-all duration-150 cursor-pointer shadow-[inset_0_0_2px_rgba(255,255,255,0.1)] relative ${
                    value.toUpperCase() === swatch.toUpperCase()
                      ? "ring-2 ring-pink-500 ring-offset-2 ring-offset-[#0a0a0c]"
                      : ""
                  }`}
                  style={{ backgroundColor: swatch }}
                  title={swatch}
                />
              ))}
            </div>
          </div>

          <div className="border-t border-neutral-900 my-0.5" />

          {/* 4. HEX Input & Copy to Clipboard */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                id={`${id}-hex-input`}
                value={inputValue}
                onChange={handleTextInput}
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-pink-600/80 rounded-lg py-1 px-2.5 text-xs text-neutral-200 focus:outline-none uppercase font-mono text-center transition-colors"
                placeholder="#000000"
                maxLength={7}
              />
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg p-1.5 text-neutral-400 hover:text-neutral-200 transition-all active:scale-95 cursor-pointer flex items-center justify-center"
              title="Copy hex code"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
