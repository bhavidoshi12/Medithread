/**
 * MediThread - Secure Doctor Sharing & Time-Sensitive Access Token Manager
 */

export class SecureSharingManager {
  static generateShareLink(token) {
    const origin = window.location.origin + window.location.pathname;
    return `${origin}?mode=doctor&token=${token.token}&pin=${token.pin}`;
  }

  static generateQRCodeSVG(text, size = 180) {
    // Generate high-contrast, beautiful SVG QR-like matrix visual
    const cells = 21;
    const cellSize = size / cells;
    let rects = '';

    // Deterministic pseudo-random seed based on token text
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }

    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        // Standard QR Finder patterns (corners)
        const isCorner = 
          (r < 7 && c < 7) || 
          (r < 7 && c >= cells - 7) || 
          (r >= cells - 7 && c < 7);

        let isBlack = false;
        if (isCorner) {
          // Outer box, inner box, or center dot
          const inBox1 = (r === 0 || r === 6 || c === 0 || c === 6) && (r < 7 && c < 7);
          const inBox2 = (r === 0 || r === 6 || c === cells - 7 || c === cells - 1) && (r < 7 && c >= cells - 7);
          const inBox3 = (r === cells - 7 || r === cells - 1 || c === 0 || c === 6) && (r >= cells - 7 && c < 7);
          const isCenter = 
            (r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
            (r >= 2 && r <= 4 && c >= cells - 5 && c <= cells - 3) ||
            (r >= cells - 5 && r <= cells - 3 && c >= 2 && c <= 4);
          
          isBlack = inBox1 || inBox2 || inBox3 || isCenter;
        } else {
          // Data matrix pattern derived from hash
          const bit = (Math.abs(Math.sin((r * 31 + c * 17 + hash)) * 10000) % 1) > 0.45;
          isBlack = bit;
        }

        if (isBlack) {
          rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize - 0.2}" height="${cellSize - 0.2}" fill="#0F172A" rx="1.5"/>`;
        }
      }
    }

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" class="bg-white p-2 rounded-xl shadow-lg border border-slate-200">
        ${rects}
      </svg>
    `;
  }

  static getRemainingTimeFormatted(expiresAtISO) {
    const diff = new Date(expiresAtISO).getTime() - Date.now();
    if (diff <= 0) return { expired: true, text: "Expired" };
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return {
      expired: false,
      text: `${hours}h ${mins}m remaining`,
      hours,
      mins
    };
  }
}
