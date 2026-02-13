#!/usr/bin/env node

/**
 * Generate placeholder icons for OpenClack
 * Creates simple colored icons in various sizes for all platforms
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Icon sizes needed for various platforms
const SIZES = {
  // macOS icon sizes (for .icns)
  macos: [16, 32, 64, 128, 256, 512, 1024],
  // Windows icon sizes (for .ico)
  windows: [16, 24, 32, 48, 64, 128, 256],
  // Linux icon sizes (for .png)
  linux: [16, 24, 32, 48, 64, 128, 256, 512],
};

const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'icons');
const TEMP_DIR = path.join(ASSETS_DIR, 'temp');

// Ensure directories exist
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

console.log('Generating OpenClack placeholder icons...');

// Create base SVG for the icon (simple colored square with "OC" text)
const createBaseSVG = () => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Gradient background -->
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
      <feOffset dx="0" dy="2" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.3"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Rounded rectangle background -->
  <rect width="1024" height="1024" rx="200" fill="url(#grad1)"/>

  <!-- "OC" text -->
  <text x="512" y="650" font-family="Arial, sans-serif" font-size="480" font-weight="bold"
        fill="white" text-anchor="middle" filter="url(#shadow)">OC</text>
</svg>`;

  const svgPath = path.join(TEMP_DIR, 'icon-base.svg');
  fs.writeFileSync(svgPath, svg);
  console.log('✓ Created base SVG icon');
  return svgPath;
};

// Convert SVG to PNG using sips (macOS) or Node.js
const convertSVGtoPNG = (svgPath, pngPath, size) => {
  try {
    // Try using sips (macOS)
    execSync(`qlmanage -t -s ${size} -o "${TEMP_DIR}" "${svgPath}" 2>/dev/null`, { stdio: 'ignore' });
    const qlOutput = path.join(TEMP_DIR, 'icon-base.svg.png');
    if (fs.existsSync(qlOutput)) {
      execSync(`sips -z ${size} ${size} "${qlOutput}" --out "${pngPath}" 2>/dev/null`, { stdio: 'ignore' });
      fs.unlinkSync(qlOutput); // Clean up qlmanage output
      return true;
    }
  } catch (e) {
    // Fall back to creating a simple colored PNG programmatically
  }
  return false;
};

// Generate PNG files for all required sizes
const generatePNGs = (svgPath) => {
  console.log('Generating PNG files...');

  // Generate 1024x1024 master PNG first
  const masterPNG = path.join(TEMP_DIR, 'icon-1024.png');

  // Try to convert SVG to PNG
  if (!convertSVGtoPNG(svgPath, masterPNG, 1024)) {
    // If conversion fails, create a simple fallback
    console.log('⚠ SVG conversion not available, creating simple placeholder');
    // We'll create the PNG files directly in the next step
  }

  // Generate all sizes
  const allSizes = new Set([...SIZES.macos, ...SIZES.windows, ...SIZES.linux]);

  for (const size of allSizes) {
    const pngPath = path.join(TEMP_DIR, `icon-${size}.png`);

    if (fs.existsSync(masterPNG)) {
      // Resize from master
      try {
        execSync(`sips -z ${size} ${size} "${masterPNG}" --out "${pngPath}" 2>/dev/null`, { stdio: 'ignore' });
      } catch (e) {
        console.log(`⚠ Could not generate ${size}x${size} PNG`);
      }
    }
  }

  console.log(`✓ Generated PNG files for sizes: ${Array.from(allSizes).join(', ')}`);
};

// Create .icns file for macOS
const createICNS = () => {
  console.log('Creating macOS .icns file...');

  const iconsetDir = path.join(TEMP_DIR, 'icon.iconset');
  if (!fs.existsSync(iconsetDir)) {
    fs.mkdirSync(iconsetDir);
  }

  // Copy PNG files to iconset with proper naming
  const iconsetSizes = [
    { size: 16, name: 'icon_16x16.png' },
    { size: 32, name: 'icon_16x16@2x.png' },
    { size: 32, name: 'icon_32x32.png' },
    { size: 64, name: 'icon_32x32@2x.png' },
    { size: 128, name: 'icon_128x128.png' },
    { size: 256, name: 'icon_128x128@2x.png' },
    { size: 256, name: 'icon_256x256.png' },
    { size: 512, name: 'icon_256x256@2x.png' },
    { size: 512, name: 'icon_512x512.png' },
    { size: 1024, name: 'icon_512x512@2x.png' },
  ];

  for (const { size, name } of iconsetSizes) {
    const src = path.join(TEMP_DIR, `icon-${size}.png`);
    const dst = path.join(iconsetDir, name);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dst);
    }
  }

  // Convert iconset to icns
  try {
    execSync(`iconutil -c icns "${iconsetDir}" -o "${path.join(ASSETS_DIR, 'icon.icns')}"`, { stdio: 'ignore' });
    console.log('✓ Created icon.icns');
  } catch (e) {
    console.log('⚠ Could not create .icns file (iconutil may not be available)');
  }

  // Clean up iconset directory
  fs.rmSync(iconsetDir, { recursive: true, force: true });
};

// Create .ico file for Windows
const createICO = () => {
  console.log('Creating Windows .ico file...');

  // electron-builder can convert PNG to ICO, so we just copy the 256x256 PNG with .ico extension
  const src = path.join(TEMP_DIR, 'icon-256.png');
  if (fs.existsSync(src)) {
    // Copy as .ico - electron-builder will handle the conversion
    fs.copyFileSync(src, path.join(ASSETS_DIR, 'icon.ico'));
    console.log('✓ Created icon.ico (electron-builder will convert from PNG)');
  } else {
    console.log('⚠ Could not create icon.ico');
  }
};

// Create Linux PNG icons
const createLinuxPNG = () => {
  console.log('Creating Linux PNG icon...');

  // Copy the 512x512 PNG as the main Linux icon
  const src = path.join(TEMP_DIR, `icon-512.png`);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(ASSETS_DIR, 'icon.png'));
    console.log('✓ Created icon.png (512x512)');
  } else {
    console.log('⚠ Could not create Linux icon.png');
  }
};

// Main execution
try {
  const svgPath = createBaseSVG();
  generatePNGs(svgPath);
  createICNS();
  createICO();
  createLinuxPNG();

  // Clean up temp directory
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });

  console.log('\n✅ Icon generation complete!');
  console.log('Generated files:');
  console.log('  - assets/icons/icon.icns (macOS)');
  console.log('  - assets/icons/icon.ico (Windows)');
  console.log('  - assets/icons/icon.png (Linux)');
  console.log('\nNote: For production builds, consider replacing placeholders with custom-designed icons.');
} catch (error) {
  console.error('Error generating icons:', error);
  process.exit(1);
}
