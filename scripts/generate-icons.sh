#!/bin/bash

# Icon Generation Script for Z.AI Chat
# This script generates app icons from an SVG source
# Requires: ImageMagick or iconutil (Mac) / imagemagick (Linux/Windows)

set -e

echo "🎨 Generating app icons for Z.AI Chat..."

# Check if we have the required tools
if command -v convert &> /dev/null; then
    # Using ImageMagick
    echo "Using ImageMagick..."

    # Create icons directory
    mkdir -p src-tauri/icons

    # Generate PNG icons
    convert public/vite.svg -resize 32x32 src-tauri/icons/32x32.png
    convert public/vite.svg -resize 128x128 src-tauri/icons/128x128.png
    convert public/vite.svg -resize 256x256 src-tauri/icons/128x128@2x.png
    convert public/vite.svg -resize 512x512 src-tauri/icons/icon.png

    # For Mac .icns (using iconutil on macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Generating Mac .icns..."

        # Create iconset
        mkdir -p src-tauri/icons/icon.iconset
        convert public/vite.svg -resize 16x16 src-tauri/icons/icon.iconset/icon_16x16.png
        convert public/vite.svg -resize 32x32 src-tauri/icons/icon.iconset/icon_16x16@2x.png
        convert public/vite.svg -resize 32x32 src-tauri/icons/icon.iconset/icon_32x32.png
        convert public/vite.svg -resize 64x64 src-tauri/icons/icon.iconset/icon_32x32@2x.png
        convert public/vite.svg -resize 128x128 src-tauri/icons/icon.iconset/icon_128x128.png
        convert public/vite.svg -resize 256x256 src-tauri/icons/icon.iconset/icon_128x128@2x.png
        convert public/vite.svg -resize 256x256 src-tauri/icons/icon.iconset/icon_256x256.png
        convert public/vite.svg -resize 512x512 src-tauri/icons/icon.iconset/icon_256x256@2x.png
        convert public/vite.svg -resize 512x512 src-tauri/icons/icon.iconset/icon_512x512.png
        convert public/vite.svg -resize 1024x1024 src-tauri/icons/icon.iconset/icon_512x512@2x.png

        # Convert to .icns
        iconutil -c icns src-tauri/icons/icon.iconset -o src-tauri/icons/icon.icns
        rm -rf src-tauri/icons/icon.iconset
    fi

    # For Windows .ico
    if command -v icoutils &> /dev/null; then
        echo "Generating Windows .ico..."
        convert public/vite.svg -resize 256x256 src-tauri/icons/icon.ico
    else
        echo "⚠️  Warning: icoutils not found. Using ImageMagick for .ico (may not work perfectly)"
        convert public/vite.svg -define icon:auto-resize=256,128,96,64,48,32,16 src-tauri/icons/icon.ico
    fi

    echo "✅ Icons generated successfully!"
    echo "📁 Icons location: src-tauri/icons/"

elif command -v magick &> /dev/null; then
    # Using ImageMagick (magick command on Windows)
    echo "Using ImageMagick (magick command)..."

    mkdir -p src-tauri/icons

    magick public/vite.svg -resize 32x32 src-tauri/icons/32x32.png
    magick public/vite.svg -resize 128x128 src-tauri/icons/128x128.png
    magick public/vite.svg -resize 256x256 src-tauri/icons/128x128@2x.png
    magick public/vite.svg -define icon:auto-resize=256,128,96,64,48,32,16 src-tauri/icons/icon.ico

    echo "✅ Basic icons generated!"
    echo "⚠️  For full icon support (including Mac .icns), install ImageMagick with full tools"
else
    echo "❌ Error: Neither ImageMagick nor GraphicsMagick found"
    echo ""
    echo "Please install ImageMagick:"
    echo "  Mac:   brew install imagemagick"
    echo "  Ubuntu: sudo apt-get install imagemagick"
    echo "  Windows: choco install imagemagick"
    echo ""
    echo "Or use online SVG to icon converters:"
    echo "  - https://favicon.io/"
    echo "  - https://realfavicongenerator.net/"
    exit 1
fi
