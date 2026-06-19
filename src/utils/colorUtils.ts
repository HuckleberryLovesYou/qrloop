import type { GradientConfig } from './qrRenderer';

// Hex to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove leading #
  const cleaned = hex.replace(/^#/, '');
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
  return null;
}

// Parse CSS color
export function parseColorToRgb(colorStr: string): { r: number; g: number; b: number } {
  const hex = hexToRgb(colorStr);
  if (hex) return hex;

  // Parse RGB(A)
  const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  // Fallback to black
  return { r: 0, g: 0, b: 0 };
}

// Calculate luminance (WCAG formula)
export function getLuminance(colorStr: string): number {
  const { r, g, b } = parseColorToRgb(colorStr);
  
  const a = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });

  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Contrast ratio (WCAG formula)
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

// Check contrast warning (returns null if safe)
export function checkContrastWarning(
  fgGrad: GradientConfig,
  bgGrad: GradientConfig,
  partName: string = 'QR Code'
): { ratio: number; warning: string } | null {
  const fgColors = fgGrad.type === 'solid' ? [fgGrad.color1] : [fgGrad.color1, fgGrad.color2];
  const bgColors = bgGrad.type === 'solid' ? [bgGrad.color1] : [bgGrad.color1, bgGrad.color2];

  let minRatio = 21.0;

  // Check all color pairs
  fgColors.forEach((fg) => {
    bgColors.forEach((bg) => {
      const ratio = getContrastRatio(fg, bg);
      if (ratio < minRatio) {
        minRatio = ratio;
      }
    });
  });

  // QR contrast threshold
  if (minRatio < 3.0) {
    return {
      ratio: minRatio,
      warning: `Low contrast between ${partName} and background (Ratio: ${minRatio.toFixed(1)}:1). Scanners might have difficulty reading it. Consider increasing contrast.`,
    };
  }

  return null;
}

export function getGradientCss(grad: GradientConfig): string {
  if (grad.type === 'solid') {
    return grad.color1;
  }
  if (grad.type === 'linear') {
    return `linear-gradient(${grad.angle}deg, ${grad.color1}, ${grad.color2})`;
  }
  if (grad.type === 'radial') {
    return `radial-gradient(circle, ${grad.color1}, ${grad.color2})`;
  }
  return '#ffffff';
}
