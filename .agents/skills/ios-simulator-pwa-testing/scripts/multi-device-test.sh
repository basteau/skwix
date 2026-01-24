#!/bin/bash
# Multi-device PWA testing script
# Usage: ./multi-device-test.sh "http://localhost:3000"

URL="${1:-http://localhost:3000}"
SCREENSHOT_DIR="${2:-$HOME/Desktop/pwa-screenshots}"

# Device list covering various screen sizes
DEVICES=(
    "iPhone SE (3rd generation)"
    "iPhone 15"
    "iPhone 15 Pro Max"
    "iPad (10th generation)"
)

mkdir -p "$SCREENSHOT_DIR"

echo "🚀 Testing PWA across ${#DEVICES[@]} devices"
echo "URL: $URL"
echo "Screenshots: $SCREENSHOT_DIR"
echo ""

for DEVICE in "${DEVICES[@]}"; do
    echo "📱 Testing on: $DEVICE"
    
    # Boot the simulator
    xcrun simctl boot "$DEVICE" 2>/dev/null
    
    # Wait for boot
    sleep 3
    
    # Open the URL
    xcrun simctl openurl "$DEVICE" "$URL"
    
    # Wait for page to load
    sleep 5
    
    # Take screenshot
    SAFE_NAME=$(echo "$DEVICE" | tr ' ()' '_' | tr -d "'")
    xcrun simctl io "$DEVICE" screenshot "$SCREENSHOT_DIR/${SAFE_NAME}.png"
    echo "   ✅ Screenshot saved: ${SAFE_NAME}.png"
    
done

# Open Simulator to show all booted devices
open -a Simulator

echo ""
echo "✨ Done! Screenshots saved to: $SCREENSHOT_DIR"
echo "💡 Open Safari → Develop → Simulator to inspect each device"
