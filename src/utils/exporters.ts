// File download utilities

export function downloadFile(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Convert SVG to canvas
export function svgToCanvas(svgString: string, size: number): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get 2D context from canvas'));
      return;
    }

    const img = new Image();
    // Convert SVG to Blob
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, size, size);
      // Draw to canvas
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG into image: ' + String(err)));
    };

    img.src = url;
  });
}

// Export SVG
export function exportSVG(svgString: string, filename: string = 'qr-code.svg') {
  const base64 = btoa(unescape(encodeURIComponent(svgString)));
  const url = `data:image/svg+xml;base64,${base64}`;
  downloadFile(url, filename);
}

// Export raster formats (PNG, JPEG, WEBP, GIF)
export async function exportRaster(
  svgString: string,
  size: number,
  format: 'png' | 'jpeg' | 'webp' | 'gif',
  filename: string
) {
  const canvas = await svgToCanvas(svgString, size);
  
  // Map MIME types
  let mimeType = 'image/png';
  if (format === 'jpeg') mimeType = 'image/jpeg';
  else if (format === 'webp') mimeType = 'image/webp';
  else if (format === 'gif') mimeType = 'image/gif';

  const dataUrl = canvas.toDataURL(mimeType, format === 'jpeg' ? 0.95 : undefined);
  downloadFile(dataUrl, filename);
}
