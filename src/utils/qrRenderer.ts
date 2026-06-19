import qrcode from 'qrcode-generator';

export interface GradientConfig {
  type: 'solid' | 'linear' | 'radial';
  color1: string;
  color2: string;
  angle: number;
}

export interface QRConfig {
  text: string;
  moduleStyle: 'square' | 'dot' | 'rounded' | 'heart' | 'star' | 'diamond' | 'cross' | 'sparkle' | 'classy' | 'classy-h' | 'classy-v' | 'triangle';
  outerEyeStyle: 'square' | 'rounded' | 'circle' | 'leaf' | 'leaf-rotated' | 'octagon' | 'dotted' | 'shield';
  innerEyeStyle: 'square' | 'rounded' | 'circle' | 'octagon' | 'cross' | 'diamond' | 'shield';
  bgColor: GradientConfig;
  moduleColor: GradientConfig;
  outerEyeColor: GradientConfig;
  innerEyeColor: GradientConfig;
  logo: string; // Base64 data URL
  logoSize: number; // percentage (10 to 30)
  logoMargin: number; // padding in cells
}

export function getQRMatrixSize(text: string): number {
  const qr = qrcode(0, 'H');
  try {
    qr.addData(text || 'QRLoop');
    qr.make();
  } catch {
    const fallbackQr = qrcode(40, 'M');
    fallbackQr.addData(text || 'QRLoop');
    fallbackQr.make();
  }
  return qr.getModuleCount();
}

// Resolves eye parts
export function getEyeType(row: number, col: number, count: number): 'outer' | 'inner' | 'none' {
  // Top-Left Finder
  if (row < 7 && col < 7) {
    if (row === 0 || row === 6 || col === 0 || col === 6) return 'outer';
    if (row >= 2 && row <= 4 && col >= 2 && col <= 4) return 'inner';
  }
  // Top-Right Finder
  if (row < 7 && col >= count - 7) {
    const c = col - (count - 7);
    if (row === 0 || row === 6 || c === 0 || c === 6) return 'outer';
    if (row >= 2 && row <= 4 && c >= 2 && c <= 4) return 'inner';
  }
  // Bottom-Left Finder
  if (row >= count - 7 && col < 7) {
    const r = row - (count - 7);
    if (r === 0 || r === 6 || col === 0 || col === 6) return 'outer';
    if (r >= 2 && r <= 4 && col >= 2 && col <= 4) return 'inner';
  }
  return 'none';
}

// Check quiet zone around finder patterns
export function isEyeQuietZone(row: number, col: number, count: number): boolean {
  // Top-Left
  if (row < 8 && col < 8) {
    return getEyeType(row, col, count) === 'none';
  }
  // Top-Right
  if (row < 8 && col >= count - 8) {
    return getEyeType(row, col, count) === 'none';
  }
  // Bottom-Left
  if (row >= count - 8 && col < 8) {
    return getEyeType(row, col, count) === 'none';
  }
  return false;
}

// Generate raw SVG string
export function generateSVGString(config: QRConfig, size: number = 800): string {
  // Generate QR matrix (H mode is used to allow logo embedding)
  const qr = qrcode(0, 'H');
  try {
    qr.addData(config.text || 'QRLoop');
    qr.make();
  } catch {
    // Fallback for large data
    const fallbackQr = qrcode(40, 'M');
    fallbackQr.addData(config.text || 'QRLoop');
    fallbackQr.make();
  }
  
  const count = qr.getModuleCount();
  const cell = size / count;

  // Calculate logo bounds
  let logoStart = -1;
  let logoEnd = -1;
  let renderedLogoCells = 0;

  if (config.logo && config.logoSize > 0) {
    let logoCells = Math.ceil((count * config.logoSize) / 100);
    // Center alignment check
    if (logoCells % 2 !== count % 2) {
      logoCells++;
    }
    let logoMargin = config.logoMargin;
    
    // Cap area at 30%
    const maxCleared = Math.floor(count * 0.30);
    const minLogoCells = (count % 2 === 1) ? 1 : 2;
    const totalCleared = logoCells + 2 * logoMargin;

    if (totalCleared > maxCleared) {
      let targetCleared = maxCleared;
      if (targetCleared % 2 !== count % 2) {
        targetCleared--;
      }

      if (targetCleared < minLogoCells) {
        logoCells = minLogoCells;
        logoMargin = 0;
      } else {
        const possibleLogoCells = targetCleared - 2 * logoMargin;
        if (possibleLogoCells >= minLogoCells) {
          logoCells = possibleLogoCells;
        } else {
          logoCells = minLogoCells;
          logoMargin = Math.floor((targetCleared - logoCells) / 2);
        }
      }
    }

    renderedLogoCells = logoCells;
    const renderedLogoMargin = logoMargin;
    
    const center = Math.floor(count / 2);
    const half = Math.floor(renderedLogoCells / 2);
    
    logoStart = center - half - renderedLogoMargin;
    logoEnd = center - half + renderedLogoCells + renderedLogoMargin;
  }

  // Render gradient helper
  const renderGradientDef = (id: string, grad: GradientConfig) => {
    if (grad.type === 'solid') return '';
    if (grad.type === 'linear') {
      const angleRad = (grad.angle * Math.PI) / 180;
      const x1 = Math.round(50 - Math.cos(angleRad) * 50);
      const y1 = Math.round(50 + Math.sin(angleRad) * 50);
      const x2 = Math.round(50 + Math.cos(angleRad) * 50);
      const y2 = Math.round(50 - Math.sin(angleRad) * 50);
      return `
    <linearGradient id="${id}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
      <stop offset="0%" stop-color="${grad.color1}" />
      <stop offset="100%" stop-color="${grad.color2}" />
    </linearGradient>`;
    }
    if (grad.type === 'radial') {
      return `
    <radialGradient id="${id}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${grad.color1}" />
      <stop offset="100%" stop-color="${grad.color2}" />
    </radialGradient>`;
    }
    return '';
  };

  const fillAttr = (grad: GradientConfig, id: string) => {
    return grad.type === 'solid' ? grad.color1 : `url(#${id})`;
  };

  // Build gradient defs
  let defs = '';
  defs += renderGradientDef('bg-grad', config.bgColor);
  defs += renderGradientDef('mod-grad', config.moduleColor);
  defs += renderGradientDef('outer-eye-grad', config.outerEyeColor);
  defs += renderGradientDef('inner-eye-grad', config.innerEyeColor);

  // SVG Header
  let svg = `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>${defs}
  </defs>
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="${fillAttr(config.bgColor, 'bg-grad')}" />
  `;

  // Group paths for performance
  let modulePaths = '';
  let outerEyePaths = '';
  let innerEyePaths = '';

  // Draw shape helpers
  const drawHeart = (x: number, y: number, w: number) => {
    return `M ${x + 0.5 * w} ${y + 0.85 * w} ` +
      `C ${x + 0.05 * w} ${y + 0.5 * w} ${x + 0.05 * w} ${y + 0.1 * w} ${x + 0.275 * w} ${y + 0.1 * w} ` +
      `C ${x + 0.38 * w} ${y + 0.1 * w} ${x + 0.48 * w} ${y + 0.25 * w} ${x + 0.5 * w} ${y + 0.28 * w} ` +
      `C ${x + 0.52 * w} ${y + 0.25 * w} ${x + 0.62 * w} ${y + 0.1 * w} ${x + 0.725 * w} ${y + 0.1 * w} ` +
      `C ${x + 0.95 * w} ${y + 0.1 * w} ${x + 0.95 * w} ${y + 0.5 * w} ${x + 0.5 * w} ${y + 0.85 * w} Z`;
  };

  const drawStar = (x: number, y: number, w: number) => {
    const cx = x + w / 2;
    const cy = y + w / 2;
    const spikes = 5;
    const outer = w * 0.5;
    const inner = w * 0.22;
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    let path = `M ${cx} ${cy - outer} `;
    for (let i = 0; i < spikes; i++) {
      let px = cx + Math.cos(rot) * outer;
      let py = cy + Math.sin(rot) * outer;
      path += `L ${px} ${py} `;
      rot += step;
      px = cx + Math.cos(rot) * inner;
      py = cy + Math.sin(rot) * inner;
      path += `L ${px} ${py} `;
      rot += step;
    }
    path += 'Z';
    return path;
  };

  const drawSparkle = (x: number, y: number, w: number) => {
    const cx = x + w / 2;
    const cy = y + w / 2;
    return `M ${cx} ${y} Q ${cx} ${cy} ${x + w} ${cy} Q ${cx} ${cy} ${cx} ${y + w} Q ${cx} ${cy} ${x} ${cy} Q ${cx} ${cy} ${cx} ${y} Z`;
  };

  const drawClassy = (x: number, y: number, w: number, r: number, tl: boolean, tr: boolean, bl: boolean, br: boolean) => {
    let path = `M ${x + (tl ? r : 0)} ${y}`;
    path += ` L ${x + w - (tr ? r : 0)} ${y}`;
    if (tr) path += ` A ${r} ${r} 0 0 1 ${x + w} ${y + r}`;
    path += ` L ${x + w} ${y + w - (br ? r : 0)}`;
    if (br) path += ` A ${r} ${r} 0 0 1 ${x + w - r} ${y + w}`;
    path += ` L ${x + (bl ? r : 0)} ${y + w}`;
    if (bl) path += ` A ${r} ${r} 0 0 1 ${x} ${y + w - r}`;
    path += ` L ${x} ${y + (tl ? r : 0)}`;
    if (tl) path += ` A ${r} ${r} 0 0 1 ${x + r} ${y}`;
    path += ' Z';
    return path;
  };

  // Draw data modules
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      // Skip logo area
      if (
        config.logo &&
        r >= logoStart &&
        r < logoEnd &&
        c >= logoStart &&
        c < logoEnd
      ) {
        continue;
      }

      // Skip eye patterns
      const eyeType = getEyeType(r, c, count);
      const isQuiet = isEyeQuietZone(r, c, count);
      if (eyeType !== 'none' || isQuiet) {
        continue;
      }

      // Draw dark cells
      if (qr.isDark(r, c)) {
        const x = c * cell;
        const y = r * cell;

        if (config.moduleStyle === 'square') {
          modulePaths += `M ${x} ${y} h ${cell} v ${cell} h ${-cell} Z `;
        } else if (config.moduleStyle === 'dot') {
          const cx = x + cell / 2;
          const cy = y + cell / 2;
          const rad = cell * 0.45;
          modulePaths += `M ${cx} ${cy} m ${-rad} 0 a ${rad} ${rad} 0 1 0 ${rad * 2} 0 a ${rad} ${rad} 0 1 0 ${-rad * 2} 0 Z `;
        } else if (config.moduleStyle === 'rounded') {
          const rad = cell * 0.25;
          modulePaths += drawClassy(x, y, cell, rad, true, true, true, true) + ' ';
        } else if (config.moduleStyle === 'heart') {
          modulePaths += drawHeart(x, y, cell) + ' ';
        } else if (config.moduleStyle === 'star') {
          modulePaths += drawStar(x, y, cell) + ' ';
        } else if (config.moduleStyle === 'diamond') {
          const cx = x + cell / 2;
          const cy = y + cell / 2;
          modulePaths += `M ${cx} ${y} L ${x + cell} ${cy} L ${cx} ${y + cell} L ${x} ${cy} Z `;
        } else if (config.moduleStyle === 'cross') {
          const t = cell * 0.3; // cross thickness
          const o = (cell - t) / 2;
          modulePaths += `M ${x + o} ${y} h ${t} v ${o} h ${o} v ${t} h ${-o} v ${o} h ${-t} v ${-o} h ${-o} v ${-t} h ${o} Z `;
        } else if (config.moduleStyle === 'sparkle') {
          modulePaths += drawSparkle(x, y, cell) + ' ';
        } else if (config.moduleStyle === 'classy' || config.moduleStyle === 'classy-h' || config.moduleStyle === 'classy-v') {
          // Evaluate neighbors
          const isL = config.moduleStyle !== 'classy-v' && c > 0 && qr.isDark(r, c - 1) && !isEyeQuietZone(r, c - 1, count);
          const isR = config.moduleStyle !== 'classy-v' && c < count - 1 && qr.isDark(r, c + 1) && !isEyeQuietZone(r, c + 1, count);
          const isU = config.moduleStyle !== 'classy-h' && r > 0 && qr.isDark(r - 1, c) && !isEyeQuietZone(r - 1, c, count);
          const isD = config.moduleStyle !== 'classy-h' && r < count - 1 && qr.isDark(r + 1, c) && !isEyeQuietZone(r + 1, c, count);

          const tl = !isU && !isL;
          const tr = !isU && !isR;
          const bl = !isD && !isL;
          const br = !isD && !isR;

          const rad = cell * 0.45;
          modulePaths += drawClassy(x, y, cell, rad, tl, tr, bl, br) + ' ';
        } else if (config.moduleStyle === 'triangle') {
          modulePaths += `M ${x + cell / 2} ${y} L ${x + cell} ${y + cell} L ${x} ${y + cell} Z `;
        }
      }
    }
  }

  // Draw 3 finder eyes
  const finders = [
    { r: 0, c: 0 },
    { r: 0, c: count - 7 },
    { r: count - 7, c: 0 },
  ];

  finders.forEach(({ r, c }) => {
    const x = c * cell;
    const y = r * cell;
    const eyeSize = 7 * cell;
    const border = cell;

    // Outer eye
    if (config.outerEyeStyle === 'square') {
      outerEyePaths += `M ${x} ${y} h ${eyeSize} v ${eyeSize} h ${-eyeSize} Z M ${x + border} ${y + border} v ${eyeSize - border * 2} h ${eyeSize - border * 2} v ${-(eyeSize - border * 2)} Z `;
    } else if (config.outerEyeStyle === 'rounded') {
      const radOuter = cell * 1.5;
      const radInner = cell * 0.5;
      outerEyePaths += drawClassy(x, y, eyeSize, radOuter, true, true, true, true) + ' ';
      outerEyePaths += `M ${x + border} ${y + border} ` + drawClassy(x + border, y + border, eyeSize - border * 2, radInner, true, true, true, true) + ' ';
    } else if (config.outerEyeStyle === 'circle') {
      const cx = x + eyeSize / 2;
      const cy = y + eyeSize / 2;
      const rOuter = eyeSize / 2;
      const rInner = rOuter - border;
      outerEyePaths += `M ${cx} ${cy} m ${-rOuter} 0 a ${rOuter} ${rOuter} 0 1 0 ${rOuter * 2} 0 a ${rOuter} ${rOuter} 0 1 0 ${-rOuter * 2} 0 Z M ${cx} ${cy} m ${-rInner} 0 a ${rInner} ${rInner} 0 1 1 ${rInner * 2} 0 a ${rInner} ${rInner} 0 1 1 ${-rInner * 2} 0 Z `;
    } else if (config.outerEyeStyle === 'leaf') {
      const rad = eyeSize / 2;
      const innerSize = eyeSize - border * 2;
      const radInner = innerSize / 2;
      outerEyePaths += drawClassy(x, y, eyeSize, rad, true, false, false, true) + ' ';
      outerEyePaths += `M ${x + border} ${y + border} ` + drawClassy(x + border, y + border, innerSize, radInner, true, false, false, true) + ' ';
    } else if (config.outerEyeStyle === 'leaf-rotated') {
      const rad = eyeSize / 2;
      const innerSize = eyeSize - border * 2;
      const radInner = innerSize / 2;
      outerEyePaths += drawClassy(x, y, eyeSize, rad, false, true, true, false) + ' ';
      outerEyePaths += `M ${x + border} ${y + border} ` + drawClassy(x + border, y + border, innerSize, radInner, false, true, true, false) + ' ';
    } else if (config.outerEyeStyle === 'shield') {
      const radOuter = eyeSize / 2;
      const innerSize = eyeSize - border * 2;
      const radInner = innerSize / 2;
      outerEyePaths += drawClassy(x, y, eyeSize, radOuter, false, false, true, true) + ' ';
      outerEyePaths += `M ${x + border} ${y + border} ` + drawClassy(x + border, y + border, innerSize, radInner, false, false, true, true) + ' ';
    } else if (config.outerEyeStyle === 'octagon') {
      const offset = cell * 1.5;
      const outerPoly = `M ${x + offset} ${y} L ${x + eyeSize - offset} ${y} L ${x + eyeSize} ${y + offset} L ${x + eyeSize} ${y + eyeSize - offset} L ${x + eyeSize - offset} ${y + eyeSize} L ${x + offset} ${y + eyeSize} L ${x} ${y + eyeSize - offset} L ${x} ${y + offset} Z`;
      
      const inX = x + border;
      const inY = y + border;
      const inSize = eyeSize - border * 2;
      const inOffset = offset - border * 0.4;
      const innerPoly = `M ${inX + inOffset} ${inY} L ${inX + inSize - inOffset} ${inY} L ${inX + inSize} ${inY + inOffset} L ${inX + inSize} ${inY + inSize - inOffset} L ${inX + inSize - inOffset} ${inY + inSize} L ${inX + inOffset} ${inY + inSize} L ${inX} ${inY + inSize - inOffset} L ${inX} ${inY + inOffset} Z`;
      
      outerEyePaths += `${outerPoly} M ${inX} ${inY} ${innerPoly} `;
    } else if (config.outerEyeStyle === 'dotted') {
      // Dotted outer eye
      const dotRad = cell * 0.4;
      for (let i = 0; i < 7; i++) {
        // Top row
        outerEyePaths += `M ${x + i * cell + cell/2} ${y + cell/2} m ${-dotRad} 0 a ${dotRad} ${dotRad} 0 1 0 ${dotRad*2} 0 a ${dotRad} ${dotRad} 0 1 0 ${-dotRad*2} 0 Z `;
        // Bottom row
        outerEyePaths += `M ${x + i * cell + cell/2} ${y + 6 * cell + cell/2} m ${-dotRad} 0 a ${dotRad} ${dotRad} 0 1 0 ${dotRad*2} 0 a ${dotRad} ${dotRad} 0 1 0 ${-dotRad*2} 0 Z `;
      }
      for (let i = 1; i < 6; i++) {
        // Left column
        outerEyePaths += `M ${x + cell/2} ${y + i * cell + cell/2} m ${-dotRad} 0 a ${dotRad} ${dotRad} 0 1 0 ${dotRad*2} 0 a ${dotRad} ${dotRad} 0 1 0 ${-dotRad*2} 0 Z `;
        // Right column
        outerEyePaths += `M ${x + 6 * cell + cell/2} ${y + i * cell + cell/2} m ${-dotRad} 0 a ${dotRad} ${dotRad} 0 1 0 ${dotRad*2} 0 a ${dotRad} ${dotRad} 0 1 0 ${-dotRad*2} 0 Z `;
      }
    }

    // Inner eye
    const ix = x + border * 2;
    const iy = y + border * 2;
    const isz = 3 * cell;
    const icx = ix + isz / 2;
    const icy = iy + isz / 2;

    if (config.innerEyeStyle === 'square') {
      innerEyePaths += `M ${ix} ${iy} h ${isz} v ${isz} h ${-isz} Z `;
    } else if (config.innerEyeStyle === 'rounded') {
      const rad = cell * 0.6;
      innerEyePaths += drawClassy(ix, iy, isz, rad, true, true, true, true) + ' ';
    } else if (config.innerEyeStyle === 'circle') {
      const rad = isz / 2;
      innerEyePaths += `M ${icx} ${icy} m ${-rad} 0 a ${rad} ${rad} 0 1 0 ${rad * 2} 0 a ${rad} ${rad} 0 1 0 ${-rad * 2} 0 Z `;
    } else if (config.innerEyeStyle === 'octagon') {
      const offset = cell * 0.8;
      innerEyePaths += `M ${ix + offset} ${iy} L ${ix + isz - offset} ${iy} L ${ix + isz} ${iy + offset} L ${ix + isz} ${iy + isz - offset} L ${ix + isz - offset} ${iy + isz} L ${ix + offset} ${iy + isz} L ${ix} ${iy + isz - offset} L ${ix} ${iy + offset} Z `;
    } else if (config.innerEyeStyle === 'cross') {
      const t = cell * 0.8;
      const o = (isz - t) / 2;
      innerEyePaths += `M ${ix + o} ${iy} h ${t} v ${o} h ${o} v ${t} h ${-o} v ${o} h ${-t} v ${-o} h ${-o} v ${-t} h ${o} Z `;
    } else if (config.innerEyeStyle === 'diamond') {
      innerEyePaths += `M ${icx} ${iy} L ${ix + isz} ${icy} L ${icx} ${iy + isz} L ${ix} ${icy} Z `;
    } else if (config.innerEyeStyle === 'shield') {
      const rad = isz / 2;
      innerEyePaths += drawClassy(ix, iy, isz, rad, false, false, true, true) + ' ';
    }
  });

  // Fill SVG paths
  if (modulePaths) {
    svg += `  <path d="${modulePaths.trim()}" fill="${fillAttr(config.moduleColor, 'mod-grad')}" />\n`;
  }
  if (outerEyePaths) {
    // Use EvenOdd for cutouts
    const fillRule = (config.outerEyeStyle === 'square' || config.outerEyeStyle === 'rounded' || config.outerEyeStyle === 'circle' || config.outerEyeStyle === 'leaf' || config.outerEyeStyle === 'leaf-rotated' || config.outerEyeStyle === 'octagon' || config.outerEyeStyle === 'shield') ? ' fill-rule="evenodd"' : '';
    svg += `  <path d="${outerEyePaths.trim()}" fill="${fillAttr(config.outerEyeColor, 'outer-eye-grad')}"${fillRule} />\n`;
  }
  if (innerEyePaths) {
    svg += `  <path d="${innerEyePaths.trim()}" fill="${fillAttr(config.innerEyeColor, 'inner-eye-grad')}" />\n`;
  }

  // Draw center logo
  if (config.logo && renderedLogoCells > 0) {
    const center = Math.floor(count / 2);
    const half = Math.floor(renderedLogoCells / 2);
    
    const logoX = (center - half) * cell;
    const logoY = (center - half) * cell;
    const logoW = renderedLogoCells * cell;

    // Logo backing card
    svg += `  <!-- Logo Background Card -->\n`;
    svg += `  <rect x="${logoX}" y="${logoY}" width="${logoW}" height="${logoW}" rx="${cell * 0.5}" fill="${config.bgColor.color1}" />\n`;

    // Logo image
    svg += `  <!-- Logo Image -->\n`;
    svg += `  <image href="${config.logo}" x="${logoX + cell * 0.2}" y="${logoY + cell * 0.2}" width="${logoW - cell * 0.4}" height="${logoW - cell * 0.4}" clip-path="inset(0% round ${cell * 0.3}px)" />\n`;
  }

  svg += `</svg>`;
  return svg;
}
