/**
 * Color generator for publisher-based ERD color coding
 */

/**
 * Publisher color scheme for class diagrams
 */
export interface PublisherColors {
  fill: string;      // Background fill color
  stroke: string;    // Border/stroke color (darker shade)
  text: string;      // Text color (#fff or #000 for contrast)
}

/**
 * Predefined colors for common publishers
 */
const PREDEFINED_COLORS: Record<string, PublisherColors> = {
  // Microsoft system entities (no prefix or 'msft' prefix) - Microsoft Blue
  '': { fill: '#0078D4', stroke: '#004578', text: '#fff' },
  'msft': { fill: '#0078D4', stroke: '#004578', text: '#fff' },
  'microsoft': { fill: '#0078D4', stroke: '#004578', text: '#fff' },
  'mscrm': { fill: '#0078D4', stroke: '#004578', text: '#fff' },

  // Common third-party prefixes
  'contoso': { fill: '#107C10', stroke: '#0B5A08', text: '#fff' },    // Green
  'fabrikam': { fill: '#D83B01', stroke: '#8B2500', text: '#fff' },   // Orange
  'adventure': { fill: '#5C2D91', stroke: '#3B1D5F', text: '#fff' },  // Purple
  'northwind': { fill: '#E81123', stroke: '#A4000C', text: '#fff' },  // Red
  'powerapps': { fill: '#742774', stroke: '#4A1A4A', text: '#fff' },  // Purple
  'dynamics': { fill: '#002050', stroke: '#001030', text: '#fff' },   // Dark Blue
};

/**
 * Generate a consistent color for a publisher prefix using hash-based generation
 * @param prefix Publisher customization prefix
 * @returns Hex color code (for backward compatibility)
 */
export function generatePublisherColor(prefix: string): string {
  const colors = getPublisherColors(prefix);
  return colors.fill;
}

/**
 * Get complete publisher color scheme for class diagrams
 * @param prefix Publisher customization prefix
 * @returns PublisherColors object with fill, stroke, and text colors
 */
export function getPublisherColors(prefix: string): PublisherColors {
  const normalizedPrefix = prefix.toLowerCase().trim();

  // Check for predefined colors first
  if (PREDEFINED_COLORS[normalizedPrefix]) {
    return PREDEFINED_COLORS[normalizedPrefix];
  }

  // Generate hash-based color for custom publishers
  const fillColor = hashStringToColor(normalizedPrefix);
  const strokeColor = darkenColor(fillColor, 30);
  const textColor = getContrastTextColor(fillColor);

  return {
    fill: fillColor,
    stroke: strokeColor,
    text: textColor,
  };
}

/**
 * Hash a string to a consistent, visually distinct color
 * Uses HSL color space for better visual distribution
 */
function hashStringToColor(str: string): string {
  // Generate hash from string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use hash to generate HSL values
  // Hue: Full range (0-360) for maximum variety
  const hue = Math.abs(hash % 360);

  // Saturation: 60-80% for vibrant but not overwhelming colors
  const saturation = 60 + (Math.abs(hash >> 8) % 20);

  // Lightness: 40-60% for good contrast on both light/dark backgrounds
  const lightness = 40 + (Math.abs(hash >> 16) % 20);

  return hslToHex(hue, saturation, lightness);
}

/**
 * Convert HSL to Hex color
 */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  // Convert to 0-255 range
  const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

/**
 * Darken a hex color by a percentage
 * @param color Hex color code
 * @param percent Percentage to darken (0-100)
 * @returns Darkened hex color
 */
function darkenColor(color: string, percent: number): string {
  // Remove # if present
  const hex = color.replace('#', '');

  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Darken by percentage
  const factor = 1 - (percent / 100);
  const newR = Math.round(r * factor);
  const newG = Math.round(g * factor);
  const newB = Math.round(b * factor);

  // Convert back to hex
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * Get appropriate text color (white or black) based on background color brightness
 * Ensures WCAG AA contrast compliance
 * @param backgroundColor Hex background color
 * @returns '#fff' or '#000'
 */
function getContrastTextColor(backgroundColor: string): string {
  // Remove # if present
  const hex = backgroundColor.replace('#', '');

  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance (WCAG formula)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? '#000' : '#fff';
}
