import { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles,
  Download,
  Upload,
  Trash2,
  Sliders,
  Palette,
  Image as ImageIcon,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import PresetForms from "./components/PresetForms";
import type { PresetType } from "./components/PresetForms";
import DesignManager from "./components/DesignManager";
import { generateSVGString, getQRMatrixSize } from "./utils/qrRenderer";
import type { QRConfig, GradientConfig } from "./utils/qrRenderer";
import { exportSVG, exportRaster } from "./utils/exporters";
import { checkContrastWarning, getGradientCss } from "./utils/colorUtils";
import { parseQRCodeText } from "./utils/qrParser";

const DEFAULT_CONFIG: QRConfig = {
  text: "https://wa.me/491701234567?text=hello%20world",
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
  logo: "",
  logoSize: 20,
  logoMargin: 1,
};
const MODULE_STYLE_LABELS: Record<string, string> = {
  square: "Square",
  dot: "Dot",
  rounded: "Rounded",
  heart: "Heart",
  star: "Star",
  diamond: "Diamond",
  cross: "Cross",
  sparkle: "Sparkle",
  classy: "Classy",
  "classy-h": "Classy H",
  "classy-v": "Classy V",
  triangle: "Triangle",
};

const OUTER_EYE_STYLE_LABELS: Record<string, string> = {
  square: "Square",
  rounded: "Rounded",
  circle: "Circle",
  leaf: "Leaf",
  "leaf-rotated": "Leaf Rot",
  octagon: "Octagon",
  dotted: "Dotted",
  shield: "Shield",
};

const INNER_EYE_STYLE_LABELS: Record<string, string> = {
  square: "Square",
  rounded: "Rounded",
  circle: "Circle",
  octagon: "Octagon",
  cross: "Cross",
  diamond: "Diamond",
  shield: "Shield",
};

const applyLogoConstraints = (next: QRConfig): QRConfig => {
  if (!next.logo || next.logoSize === 0) return next;

  const count = getQRMatrixSize(next.text);
  const maxCleared = Math.floor(count * 0.3);
  const minLogoCells = count % 2 === 1 ? 1 : 2;

  let logoCells = Math.ceil((count * next.logoSize) / 100);
  if (logoCells % 2 !== count % 2) {
    logoCells++;
  }

  const totalCleared = logoCells + 2 * next.logoMargin;
  if (totalCleared > maxCleared) {
    const nextConfig = { ...next };
    let targetCleared = maxCleared;
    if (targetCleared % 2 !== count % 2) {
      targetCleared--;
    }

    if (targetCleared < minLogoCells) {
      nextConfig.logoSize = Math.max(
        0,
        Math.floor((minLogoCells / count) * 100),
      );
      nextConfig.logoMargin = 0;
    } else {
      const possibleLogoCells = targetCleared - 2 * next.logoMargin;
      if (possibleLogoCells >= minLogoCells) {
        logoCells = possibleLogoCells;
      } else {
        logoCells = minLogoCells;
        nextConfig.logoMargin = Math.floor((targetCleared - logoCells) / 2);
      }
      nextConfig.logoSize = Math.max(0, Math.floor((logoCells / count) * 100));
    }
    return nextConfig;
  }
  return next;
};

export default function App() {
  // Parses URL code param
  const getInitialCodeParam = () => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get("code");
    if (!codeParam) return null;
    try {
      const cleanBase64 = codeParam.replace(/\s/g, "+");
      const decoded = atob(cleanBase64);
      const hasControl = Array.from(decoded).some((char) => {
        const code = char.charCodeAt(0);
        return (
          (code >= 0 && code <= 8) ||
          (code >= 14 && code <= 31) ||
          (code >= 127 && code <= 255)
        );
      });
      if (hasControl) {
        throw new Error("Non-printable chars, falling back to URL decode");
      }
      return decoded;
    } catch {
      try {
        return decodeURIComponent(codeParam);
      } catch {
        return codeParam;
      }
    }
  };

  const initialCode = getInitialCodeParam();

  // Main states
  const [config, setConfigState] = useState<QRConfig>(() => {
    const initialText = initialCode || DEFAULT_CONFIG.text;
    return applyLogoConstraints({ ...DEFAULT_CONFIG, text: initialText });
  });

  const setConfig = (updater: QRConfig | ((prev: QRConfig) => QRConfig)) => {
    setConfigState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return applyLogoConstraints(next);
    });
  };

  const [activePreset, setActivePreset] = useState<PresetType>(() => {
    if (initialCode) {
      const parsed = parseQRCodeText(initialCode);
      return parsed.type;
    }
    return "url";
  });
  const [initialValue] = useState<string>(initialCode || "");
  const [immediateText, setImmediateText] = useState(
    initialCode || DEFAULT_CONFIG.text,
  );
  const [isPendingUpdate, setIsPendingUpdate] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Accordion UI
  const [activeAccordion, setActiveAccordion] = useState<
    "shapes" | "colors" | "logo" | null
  >("shapes");

  // Export state
  const [exportSize, setExportSize] = useState<number>(1000);
  const [copiedText, setCopiedText] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = useCallback((newText: string) => {
    setImmediateText(newText);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (newText.length <= 100) {
      setIsPendingUpdate(false);
      setConfig((prev) => ({ ...prev, text: newText }));
    } else {
      setIsPendingUpdate(true);
      debounceTimerRef.current = setTimeout(() => {
        setConfig((prev) => ({ ...prev, text: newText }));
        setIsPendingUpdate(false);
      }, 1000);
    }
  }, []);

  const updateConfig = <K extends keyof QRConfig>(
    key: K,
    value: QRConfig[K],
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const updateColorConfig = (
    part: "bgColor" | "moduleColor" | "outerEyeColor" | "innerEyeColor",
    fields: Partial<GradientConfig>,
  ) => {
    setConfig((prev) => ({
      ...prev,
      [part]: { ...prev[part], ...fields },
    }));
  };

  // Evaluate contrast warnings
  const warnings: string[] = [];
  const bg = config.bgColor;

  const moduleWarning = checkContrastWarning(
    config.moduleColor,
    bg,
    "Foreground Modules",
  );
  if (moduleWarning) warnings.push(moduleWarning.warning);

  const outerEyeWarning = checkContrastWarning(
    config.outerEyeColor,
    bg,
    "Outer Finder Eyes",
  );
  if (outerEyeWarning) warnings.push(outerEyeWarning.warning);

  const innerEyeWarning = checkContrastWarning(
    config.innerEyeColor,
    bg,
    "Inner Finder Eyes",
  );
  if (innerEyeWarning) warnings.push(innerEyeWarning.warning);

  // Handles logo upload
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limit to 1.5MB
      if (file.size > 1500000) {
        alert(
          "Please choose an image under 1.5MB to ensure snappy performance.",
        );
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          updateConfig("logo", event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    updateConfig("logo", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Generates SVG
  const svgString = generateSVGString(config, 800);

  const showOpenLink =
    immediateText &&
    immediateText !== "No Payload" &&
    (["url", "email", "whatsapp", "sms", "phone", "geo", "crypto"].includes(
      activePreset,
    ) ||
      /^(https?|mailto|tel|sms|geo|bitcoin|ethereum|solana|doge|litecoin):/i.test(
        immediateText,
      ) ||
      (immediateText.includes(".") &&
        !immediateText.includes(" ") &&
        !immediateText.includes("\n")));

  // Loads design styles
  const handleLoadStyle = (loadedFields: Partial<QRConfig>) => {
    setConfig((prev) => ({
      ...prev,
      ...loadedFields,
    }));
  };

  // Copies text payload
  const handleCopyRawText = () => {
    navigator.clipboard.writeText(immediateText).then(() => {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    });
  };

  // Downloads export
  const handleExport = (format: "png" | "jpeg" | "webp" | "svg" | "gif") => {
    const filename = `qr-code-${Date.now()}.${format}`;
    if (format === "svg") {
      exportSVG(svgString, filename);
    } else {
      exportRaster(svgString, exportSize, format, filename);
    }
  };

  const handleOpenLink = () => {
    if (!immediateText || immediateText === "No Payload") return;
    const text = immediateText.trim();
    if (/^(https?|mailto|tel|sms|geo):/i.test(text)) {
      window.open(text, "_blank");
    } else if (text.includes(".") && !text.includes(" ")) {
      window.open(`https://${text}`, "_blank");
    } else {
      window.open(
        `https://google.com/search?q=${encodeURIComponent(text)}`,
        "_blank",
      );
    }
  };

  const toggleAccordion = (section: "shapes" | "colors" | "logo") => {
    setActiveAccordion(activeAccordion === section ? null : section);
  };

  return (
    <div className="min-h-screen dot-bg py-12 px-4 sm:px-6 lg:px-8">
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Panel */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          {/* Header block */}
          <div className="text-left mb-2">
            <h1 className="font-display font-black text-4xl sm:text-5xl text-white tracking-tight leading-tight">
              Create QR codes{" "}
              <span className="font-handwritten text-[#ff9ebb] not-italic px-1 glow-text-pink">
                locally
              </span>
              .
            </h1>
            <p className="text-neutral-400 text-sm mt-3 max-w-xl font-sans leading-relaxed">
              QRLoop compiles highly custom, stylish vector codes completely in
              your browser. Upload logos, apply color gradients, choose custom
              eye shapes, and verify readability without sending a single byte
              to the cloud.
            </p>
          </div>

          {/* Preset inputs */}
          <PresetForms
            activePreset={activePreset}
            setActivePreset={setActivePreset}
            onTextChange={handleTextChange}
            initialValue={initialValue}
          />

          {/* Style options */}
          <div className="flex flex-col gap-3">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-400 text-left pl-1">
              Customization Options
            </h2>

            {/* Shapes accordion */}
            <div className="glass-panel border-neutral-800 rounded-xl overflow-hidden glow-pink">
              <button
                id="accordion-shapes-toggle"
                onClick={() => toggleAccordion("shapes")}
                className="w-full px-5 py-4 flex items-center justify-between font-display font-bold text-left text-white hover:bg-neutral-900/30 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-pink-500" />
                  1. Customize QR Shapes
                </span>
                <span className="text-xs text-neutral-500">
                  {activeAccordion === "shapes" ? "Collapse" : "Expand"}
                </span>
              </button>

              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${activeAccordion === "shapes" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
              >
                <div className="overflow-hidden min-h-0">
                  <div className="p-5 border-t border-neutral-800 bg-neutral-950/40 space-y-5 text-left">
                    {/* Module styles */}
                    <div className="space-y-2">
                      <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                        Module Dot Shapes
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {(
                          [
                            "square",
                            "dot",
                            "rounded",
                            "heart",
                            "star",
                            "diamond",
                            "cross",
                            "sparkle",
                            "classy",
                            "classy-h",
                            "classy-v",
                            "triangle",
                          ] as const
                        ).map((style) => (
                          <button
                            key={style}
                            id={`module-style-btn-${style}`}
                            onClick={() => updateConfig("moduleStyle", style)}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                              config.moduleStyle === style
                                ? "bg-pink-950/50 border-pink-500 text-pink-300"
                                : "bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                            }`}
                          >
                            {MODULE_STYLE_LABELS[style] || style}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Outer Eye Styles */}
                    <div className="space-y-2">
                      <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                        Finder Eyes (Outer Border)
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {(
                          [
                            "square",
                            "rounded",
                            "circle",
                            "leaf",
                            "leaf-rotated",
                            "octagon",
                            "dotted",
                            "shield",
                          ] as const
                        ).map((style) => (
                          <button
                            key={style}
                            id={`outer-eye-style-btn-${style}`}
                            onClick={() => updateConfig("outerEyeStyle", style)}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                              config.outerEyeStyle === style
                                ? "bg-pink-950/50 border-pink-500 text-pink-300"
                                : "bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                            }`}
                          >
                            {OUTER_EYE_STYLE_LABELS[style] || style}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Inner Eye Styles */}
                    <div className="space-y-2">
                      <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                        Finder Eyes (Inner Dot)
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {(
                          [
                            "square",
                            "rounded",
                            "circle",
                            "octagon",
                            "cross",
                            "diamond",
                            "shield",
                          ] as const
                        ).map((style) => (
                          <button
                            key={style}
                            id={`inner-eye-style-btn-${style}`}
                            onClick={() => updateConfig("innerEyeStyle", style)}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                              config.innerEyeStyle === style
                                ? "bg-pink-950/50 border-pink-500 text-pink-300"
                                : "bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                            }`}
                          >
                            {INNER_EYE_STYLE_LABELS[style] || style}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Colors Accordion */}
            <div className="glass-panel border-neutral-800 rounded-xl overflow-hidden glow-pink">
              <button
                id="accordion-colors-toggle"
                onClick={() => toggleAccordion("colors")}
                className="w-full px-5 py-4 flex items-center justify-between font-display font-bold text-left text-white hover:bg-neutral-900/30 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-pink-500" />
                  2. Colors & Gradients
                </span>
                <span className="text-xs text-neutral-500">
                  {activeAccordion === "colors" ? "Collapse" : "Expand"}
                </span>
              </button>

              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${activeAccordion === "colors" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
              >
                <div className="overflow-hidden min-h-0">
                  <div className="p-5 border-t border-neutral-800 bg-neutral-950/40 space-y-6 text-left">
                    {/* Background, Module, Outer, Inner color selectors */}
                    {(
                      [
                        "bgColor",
                        "moduleColor",
                        "outerEyeColor",
                        "innerEyeColor",
                      ] as const
                    ).map((part) => {
                      const grad = config[part];
                      const labelMap = {
                        bgColor: "Background",
                        moduleColor: "Foreground Modules",
                        outerEyeColor: "Finder Eye (Outer)",
                        innerEyeColor: "Finder Eye (Inner)",
                      };

                      return (
                        <div
                          key={part}
                          className="space-y-2 border-b border-neutral-800/40 pb-4 last:border-b-0 last:pb-0"
                        >
                          <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider block">
                            {labelMap[part]} Color
                          </label>

                          <div className="flex flex-wrap gap-2.5 items-center">
                            {/* Gradient style */}
                            <select
                              id={`${part}-type-select`}
                              value={grad.type}
                              onChange={(e) =>
                                updateColorConfig(part, {
                                  type: e.target
                                    .value as GradientConfig["type"],
                                })
                              }
                              className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            >
                              <option value="solid">Solid Color</option>
                              <option value="linear">Linear Gradient</option>
                              <option value="radial">Radial Gradient</option>
                            </select>

                            {/* Color 1 */}
                            <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1">
                              <input
                                type="color"
                                id={`${part}-color1-input`}
                                value={grad.color1}
                                onChange={(e) =>
                                  updateColorConfig(part, {
                                    color1: e.target.value,
                                  })
                                }
                                className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                              />
                              <input
                                type="text"
                                id={`${part}-color1-text-input`}
                                value={grad.color1}
                                onChange={(e) =>
                                  updateColorConfig(part, {
                                    color1: e.target.value,
                                  })
                                }
                                className="w-16 bg-transparent text-xs text-neutral-200 focus:outline-none uppercase font-mono"
                                maxLength={7}
                              />
                            </div>

                            {/* Color 2 (for Gradients) */}
                            {grad.type !== "solid" && (
                              <>
                                <span className="text-xs text-neutral-500">
                                  to
                                </span>
                                <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1">
                                  <input
                                    type="color"
                                    id={`${part}-color2-input`}
                                    value={grad.color2}
                                    onChange={(e) =>
                                      updateColorConfig(part, {
                                        color2: e.target.value,
                                      })
                                    }
                                    className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                                  />
                                  <input
                                    type="text"
                                    id={`${part}-color2-text-input`}
                                    value={grad.color2}
                                    onChange={(e) =>
                                      updateColorConfig(part, {
                                        color2: e.target.value,
                                      })
                                    }
                                    className="w-16 bg-transparent text-xs text-neutral-200 focus:outline-none uppercase font-mono"
                                    maxLength={7}
                                  />
                                </div>
                              </>
                            )}

                            {/* Gradient angle (for Linear) */}
                            {grad.type === "linear" && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-neutral-500">
                                  Angle:
                                </span>
                                <input
                                  type="range"
                                  id={`${part}-angle-slider`}
                                  min="0"
                                  max="360"
                                  value={grad.angle}
                                  onChange={(e) =>
                                    updateColorConfig(part, {
                                      angle: parseInt(e.target.value, 10),
                                    })
                                  }
                                  className="w-20 accent-pink-500 cursor-pointer"
                                />
                                <span className="text-xs text-neutral-300 font-mono">
                                  {grad.angle}°
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Logo accordion */}
            <div className="glass-panel border-neutral-800 rounded-xl overflow-hidden glow-pink">
              <button
                id="accordion-logo-toggle"
                onClick={() => toggleAccordion("logo")}
                className="w-full px-5 py-4 flex items-center justify-between font-display font-bold text-left text-white hover:bg-neutral-900/30 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-pink-500" />
                  3. Logo
                </span>
                <span className="text-xs text-neutral-500">
                  {activeAccordion === "logo" ? "Collapse" : "Expand"}
                </span>
              </button>

              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${activeAccordion === "logo" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
              >
                <div className="overflow-hidden min-h-0">
                  <div className="p-5 border-t border-neutral-800 bg-neutral-950/40 space-y-4 text-left">
                    <div className="flex items-center gap-4">
                      {/* Logo upload */}
                      {!config.logo && (
                        <button
                          id="logo-select-btn"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-4 py-2.5 rounded-lg text-xs font-semibold text-neutral-200 transition-colors flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4 text-pink-500" />
                          Select Logo Image
                        </button>
                      )}
                      <input
                        type="file"
                        id="logo-file-input"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />

                      {config.logo && (
                        <div className="flex items-center gap-2.5 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg text-xs text-neutral-200">
                          <img
                            src={config.logo}
                            className="w-6 h-6 object-contain rounded"
                            alt="logo preview"
                          />
                          <button
                            id="logo-remove-btn"
                            onClick={removeLogo}
                            className="p-1 hover:bg-neutral-950 text-neutral-500 hover:text-rose-400 rounded transition-colors"
                            title="Remove logo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {config.logo && (
                      <div className="flex flex-col gap-1.5 pt-2">
                        <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                          Logo Scale (Size)
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            id="logo-scale-slider"
                            min="0"
                            max="30"
                            value={config.logoSize}
                            onChange={(e) =>
                              updateConfig(
                                "logoSize",
                                parseInt(e.target.value, 10),
                              )
                            }
                            className="flex-1 accent-pink-500 cursor-pointer"
                          />
                          <span className="text-xs text-neutral-200 font-mono">
                            {config.logoSize}%
                          </span>
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-neutral-500 leading-normal">
                      Note: Center logos are covered by built-in error
                      correction, which allows logo sizes up to 30% depending on
                      the QR code size.
                      <br />
                      Tip: Keep sizes reasonable to avoid scan errors.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Panel */}
        <section className="lg:col-span-5 lg:sticky lg:top-8 self-start flex flex-col gap-6">
          {/* Live preview */}
          <div className="glass-panel border-neutral-800 rounded-2xl overflow-hidden p-6 glow-pink flex flex-col gap-5 text-center">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-bold tracking-wider text-pink-400 uppercase text-left flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                Live Design Preview
              </h2>
              {isPendingUpdate && (
                <span className="text-xs font-mono text-neutral-500">
                  Loading...
                </span>
              )}
            </div>

            {/* SVG container */}
            <div
              className="relative mx-auto aspect-square p-4 rounded-xl border border-neutral-900 w-full max-w-[340px] flex items-center justify-center"
              style={{ background: getGradientCss(config.bgColor) }}
            >
              {/* Output raw SVG */}
              <div
                className={`w-full h-full [&_svg]:w-full [&_svg]:h-full flex items-center justify-center transition-all duration-300 ${
                  isPendingUpdate
                    ? "opacity-70 blur-[1px]"
                    : "opacity-100 blur-0"
                }`}
                dangerouslySetInnerHTML={{ __html: svgString }}
              />

              {/* Contrast warning overlay */}
              {warnings.length > 0 && (
                <div className="absolute inset-x-3 bottom-3 bg-pink-950/85 backdrop-blur border border-pink-500/35 rounded-lg p-2 flex items-start gap-2 text-left shadow-lg">
                  <AlertTriangle className="w-4 h-4 text-pink-400 flex-shrink-0 mt-0.5" />
                  <div className="text-[10px] text-pink-200 leading-normal">
                    <span className="font-bold block text-pink-300">
                      Readability Alert
                    </span>
                    Some colors have a low contrast ratio. Increase contrast for
                    older devices.
                  </div>
                </div>
              )}
            </div>

            {/* Code payload info */}
            <div className="bg-neutral-950/80 border border-neutral-900 rounded-lg p-3 text-left font-mono text-[11px] space-y-1">
              <div className="text-neutral-500 flex justify-between">
                <span>Payload Preset:</span>
                <span className="text-pink-500 uppercase font-bold">
                  {activePreset}
                </span>
              </div>
              <div className="text-neutral-400 truncate flex justify-between gap-4">
                <span>Raw Text:</span>
                <span
                  className="truncate text-neutral-300 font-semibold select-all"
                  title={immediateText}
                >
                  {immediateText || "No Payload"}
                </span>
              </div>
            </div>

            {/* Resolution selection */}
            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                  Download Resolution
                </label>
                <span className="text-xs text-neutral-200 font-mono font-bold">
                  {exportSize} x {exportSize} px
                </span>
              </div>
              <input
                type="range"
                id="export-size-slider"
                min="200"
                max="2500"
                step="100"
                value={exportSize}
                onChange={(e) => setExportSize(parseInt(e.target.value, 10))}
                className="w-full accent-pink-500 cursor-pointer"
              />
            </div>

            {/* Export buttons */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="export-jpeg-btn"
                  onClick={() => handleExport("jpeg")}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 border border-neutral-800 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-pink-500" />
                  Export JPEG
                </button>
                <button
                  type="button"
                  id="export-webp-btn"
                  onClick={() => handleExport("webp")}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 border border-neutral-800 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-pink-500" />
                  Export WebP
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="export-svg-btn"
                  onClick={() => handleExport("svg")}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 border border-neutral-800 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-pink-500" />
                  Export SVG
                </button>
                <button
                  type="button"
                  id="export-gif-btn"
                  onClick={() => handleExport("gif")}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 border border-neutral-800 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-pink-500" />
                  Export GIF
                </button>
              </div>
            </div>

            {/* Export and action buttons */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                id="export-png-btn"
                onClick={() => handleExport("png")}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(236,72,153,0.2)] border border-pink-500/30"
              >
                <Download className="w-4 h-4" />
                Export PNG
              </button>

              <div className="border-t border-neutral-900 pt-4 flex gap-2">
                <button
                  type="button"
                  id="copy-raw-text-btn"
                  onClick={handleCopyRawText}
                  className="flex-1 bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 text-neutral-300 py-1.5 px-2.5 rounded text-[11px] flex items-center justify-center gap-1 transition-colors"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Raw Text
                    </>
                  )}
                </button>

                {showOpenLink && (
                  <button
                    type="button"
                    id="open-link-btn"
                    onClick={handleOpenLink}
                    disabled={!immediateText || immediateText === "No Payload"}
                    className="flex-1 bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 text-neutral-300 py-1.5 px-2.5 rounded text-[11px] flex items-center justify-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Link
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-12 space-y-8 pb-16 border-t border-neutral-900 pt-8">
        <DesignManager
          currentConfig={config}
          onLoadConfig={handleLoadStyle}
        />

        <div className="text-center text-xs text-neutral-600 font-mono mt-8">
          <p>© {new Date().getFullYear()} QRLoop</p>
        </div>
      </footer>
    </div>
  );
}
