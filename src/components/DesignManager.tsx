import React, { useState } from "react";
import { Save, Trash2, FolderOpen, AlertCircle } from "lucide-react";
import type { QRConfig, GradientConfig } from "../utils/qrRenderer";
import { getGradientCss } from "../utils/colorUtils";

interface SavedDesign {
  id: string;
  name: string;
  moduleStyle: QRConfig["moduleStyle"];
  outerEyeStyle: QRConfig["outerEyeStyle"];
  innerEyeStyle: QRConfig["innerEyeStyle"];
  bgColor: GradientConfig;
  moduleColor: GradientConfig;
  outerEyeColor: GradientConfig;
  innerEyeColor: GradientConfig;
  logoSize: number;
  logoMargin: number;
}

interface DesignManagerProps {
  currentConfig: QRConfig;
  onLoadConfig: (config: Partial<QRConfig>) => void;
}

const LOCAL_STORAGE_KEY = "qrloop-saved-designs";

// Preloaded styles
const PRESET_DESIGNS: SavedDesign[] = [
  {
    id: "preset-classic",
    name: "Default Classic",
    moduleStyle: "square",
    outerEyeStyle: "square",
    innerEyeStyle: "square",
    bgColor: { type: "solid", color1: "#ffffff", color2: "#ffffff", angle: 0 },
    moduleColor: {
      type: "solid",
      color1: "#000000",
      color2: "#000000",
      angle: 0,
    },
    outerEyeColor: {
      type: "solid",
      color1: "#000000",
      color2: "#000000",
      angle: 0,
    },
    innerEyeColor: {
      type: "solid",
      color1: "#000000",
      color2: "#000000",
      angle: 0,
    },
    logoSize: 20,
    logoMargin: 1,
  },
  {
    id: "preset-sunset",
    name: "Sunset Horizon",
    moduleStyle: "classy",
    outerEyeStyle: "rounded",
    innerEyeStyle: "circle",
    bgColor: { type: "solid", color1: "#09090b", color2: "#09090b", angle: 0 },
    moduleColor: {
      type: "linear",
      color1: "#f43f5e",
      color2: "#f97316",
      angle: 45,
    },
    outerEyeColor: {
      type: "linear",
      color1: "#f43f5e",
      color2: "#f97316",
      angle: 45,
    },
    innerEyeColor: {
      type: "solid",
      color1: "#eab308",
      color2: "#eab308",
      angle: 0,
    },
    logoSize: 20,
    logoMargin: 1,
  },
  {
    id: "preset-ocean",
    name: "Ocean Breeze",
    moduleStyle: "dot",
    outerEyeStyle: "circle",
    innerEyeStyle: "circle",
    bgColor: { type: "solid", color1: "#020617", color2: "#020617", angle: 0 },
    moduleColor: {
      type: "linear",
      color1: "#3b82f6",
      color2: "#06b6d4",
      angle: 135,
    },
    outerEyeColor: {
      type: "linear",
      color1: "#3b82f6",
      color2: "#06b6d4",
      angle: 135,
    },
    innerEyeColor: {
      type: "solid",
      color1: "#10b981",
      color2: "#10b981",
      angle: 0,
    },
    logoSize: 20,
    logoMargin: 1,
  },
  {
    id: "preset-lavender",
    name: "Midnight Lavender",
    moduleStyle: "rounded",
    outerEyeStyle: "leaf",
    innerEyeStyle: "octagon",
    bgColor: { type: "solid", color1: "#0b0914", color2: "#0b0914", angle: 0 },
    moduleColor: {
      type: "linear",
      color1: "#a855f7",
      color2: "#ec4899",
      angle: 90,
    },
    outerEyeColor: {
      type: "linear",
      color1: "#a855f7",
      color2: "#ec4899",
      angle: 90,
    },
    innerEyeColor: {
      type: "solid",
      color1: "#f472b6",
      color2: "#f472b6",
      angle: 0,
    },
    logoSize: 20,
    logoMargin: 1,
  },
];

export default function DesignManager({
  currentConfig,
  onLoadConfig,
}: DesignManagerProps) {
  const [designs, setDesigns] = useState<SavedDesign[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        console.error("Failed to parse saved designs from localStorage");
      }
    }
    return [];
  });
  const [newDesignName, setNewDesignName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const saveDesignsToLocalStorage = (list: SavedDesign[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    setDesigns(list);
  };

  const handleSaveDesign = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newDesignName.trim();
    if (!name) return;

    if (designs.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
      setError(
        "A design with this name already exists. Choose a different name.",
      );
      return;
    }

    setError(null);
    const newDesign: SavedDesign = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      moduleStyle: currentConfig.moduleStyle,
      outerEyeStyle: currentConfig.outerEyeStyle,
      innerEyeStyle: currentConfig.innerEyeStyle,
      bgColor: { ...currentConfig.bgColor },
      moduleColor: { ...currentConfig.moduleColor },
      outerEyeColor: { ...currentConfig.outerEyeColor },
      innerEyeColor: { ...currentConfig.innerEyeColor },
      logoSize: currentConfig.logoSize,
      logoMargin: currentConfig.logoMargin,
    };

    const updated = [newDesign, ...designs];
    saveDesignsToLocalStorage(updated);
    setNewDesignName("");
  };

  const handleDeleteDesign = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop load click
    const filtered = designs.filter((d) => d.id !== id);
    saveDesignsToLocalStorage(filtered);
  };

  const handleLoadDesign = (design: SavedDesign) => {
    onLoadConfig({
      moduleStyle: design.moduleStyle,
      outerEyeStyle: design.outerEyeStyle,
      innerEyeStyle: design.innerEyeStyle,
      bgColor: design.bgColor,
      moduleColor: design.moduleColor,
      outerEyeColor: design.outerEyeColor,
      innerEyeColor: design.innerEyeColor,
      logoSize: design.logoSize,
      logoMargin: design.logoMargin,
    });
  };

  return (
    <div className="flex flex-col gap-5 text-left">
      <div className="pb-3">
        <h2 className="font-display font-extrabold text-xl text-white flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-pink-500" />
          Style Library
        </h2>
        <p className="text-sm text-neutral-400 mt-1">
          Save your styles (colors, gradients, shapes, logo layouts) locally in
          your browser to reuse them later.
        </p>
      </div>

      {/* Prebuilt Styles Grid */}
      <div>
        <h3 className="text-xs font-mono font-bold tracking-wider text-neutral-400 uppercase mb-3">
          Style Presets
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PRESET_DESIGNS.map((preset) => (
            <button
              key={preset.id}
              id={`preset-design-${preset.id}`}
              onClick={() => handleLoadDesign(preset)}
              className="group relative overflow-hidden text-left border border-neutral-800/80 p-3 rounded-lg text-sm transition-all font-semibold hover:shadow-lg hover:border-neutral-700 hover:scale-[1.02] focus:outline-none"
            >
              {/* Gradient background layer */}
              <div
                className="absolute inset-0 opacity-20 group-hover:opacity-30 pointer-events-none transition-opacity duration-300"
                style={{ background: getGradientCss(preset.moduleColor) }}
              />

              {/* Content */}
              <div className="relative z-10">
                <div className="truncate text-white font-bold">{preset.name}</div>
                <div className="text-[10px] text-neutral-400 mt-1 font-mono uppercase tracking-wide">
                  {preset.moduleStyle} / {preset.outerEyeStyle}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Save form */}
      <form onSubmit={handleSaveDesign} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            type="text"
            id="save-style-name-input"
            placeholder="Name your current style (e.g. Neon Cyber)..."
            value={newDesignName}
            onChange={(e) => {
              setNewDesignName(e.target.value);
              if (error) setError(null);
            }}
            className="flex-1 bg-neutral-900 border border-neutral-800 text-sm rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pink-500 font-sans"
            maxLength={40}
          />
          <button
            type="submit"
            id="save-style-submit-btn"
            disabled={!newDesignName.trim()}
            className="bg-pink-600 hover:bg-pink-700 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:border-neutral-900 disabled:cursor-not-allowed text-white font-semibold text-sm px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors border border-pink-500/30"
          >
            <Save className="w-4 h-4" />
            Save Style
          </button>
        </div>
        {error && (
          <div className="text-rose-400 text-xs flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </div>
        )}
      </form>

      {/* Saved styles */}
      <div>
        <h3 className="text-xs font-mono font-bold tracking-wider text-neutral-400 uppercase mb-3">
          My Saved Styles
        </h3>
        {designs.length === 0 ? (
          <div className="text-sm text-neutral-500 italic py-3 text-center border border-dashed border-neutral-800/80 rounded-lg">
            No saved styles yet. Name and save your current configuration to see
            it here!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {designs.map((design) => (
              <div
                key={design.id}
                id={`saved-design-${design.id}`}
                onClick={() => handleLoadDesign(design)}
                className="group flex items-center justify-between bg-neutral-900 border border-neutral-800 p-3 rounded-lg text-sm cursor-pointer hover:border-neutral-700 transition-all hover:scale-[1.01]"
              >
                <div className="truncate pr-2">
                  <div className="font-semibold text-neutral-200 truncate">
                    {design.name}
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5 font-mono uppercase">
                    {design.moduleStyle} / {design.outerEyeStyle}
                  </div>
                </div>
                <button
                  type="button"
                  id={`delete-style-btn-${design.id}`}
                  onClick={(e) => handleDeleteDesign(design.id, e)}
                  className="p-1.5 text-neutral-500 hover:text-rose-400 rounded-md hover:bg-neutral-950 transition-colors"
                  title="Delete design"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
