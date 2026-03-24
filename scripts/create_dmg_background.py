#!/usr/bin/env python3
"""Generate a DMG background image with app logo and drag-to-Applications arrow."""

import sys
import os
from PIL import Image, ImageDraw, ImageFont

# DMG window size (will be set via AppleScript)
WIDTH = 660
HEIGHT = 400

# Positions: app icon on the left, Applications folder on the right
APP_ICON_X = 180
APPS_ICON_X = 480
ICON_Y = 190

def create_background(logo_path, output_path):
    # Create background with a gradient-like appearance
    bg = Image.new("RGBA", (WIDTH, HEIGHT))
    draw = ImageDraw.Draw(bg)
    
    # Draw a subtle gradient background (light to slightly darker)
    for y in range(HEIGHT):
        r = int(240 - (y / HEIGHT) * 25)
        g = int(243 - (y / HEIGHT) * 25)
        b = int(248 - (y / HEIGHT) * 20)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b, 255))
    
    # Load and place the app logo (centered above left icon position)
    if os.path.exists(logo_path):
        logo = Image.open(logo_path).convert("RGBA")
        logo_size = 128
        logo = logo.resize((logo_size, logo_size), Image.LANCZOS)
        logo_x = (WIDTH // 2) - (logo_size // 2)
        logo_y = 20
        bg.paste(logo, (logo_x, logo_y), logo)
    
    # Draw the arrow from app icon area to Applications area
    arrow_y = ICON_Y + 10
    arrow_start_x = APP_ICON_X + 60
    arrow_end_x = APPS_ICON_X - 60
    
    # Arrow shaft
    shaft_thickness = 4
    for t in range(-shaft_thickness // 2, shaft_thickness // 2 + 1):
        draw.line(
            [(arrow_start_x, arrow_y + t), (arrow_end_x - 15, arrow_y + t)],
            fill=(100, 100, 110, 200),
            width=1,
        )
    
    # Arrow head (triangle)
    head_size = 18
    draw.polygon(
        [
            (arrow_end_x, arrow_y),
            (arrow_end_x - head_size, arrow_y - head_size),
            (arrow_end_x - head_size, arrow_y + head_size),
        ],
        fill=(100, 100, 110, 200),
    )
    
    # Try to find a system font for labels
    font = None
    font_small = None
    for font_path in [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFNSText.ttf",
        "/System/Library/Fonts/SFNS.ttf",
        "/Library/Fonts/Arial.ttf",
    ]:
        if os.path.exists(font_path):
            try:
                font = ImageFont.truetype(font_path, 15)
                font_small = ImageFont.truetype(font_path, 12)
                break
            except Exception:
                continue
    
    if font is None:
        font = ImageFont.load_default()
        font_small = font
    
    # "Drag to install" text above arrow
    drag_text = "Drag to install"
    bbox = draw.textbbox((0, 0), drag_text, font=font)
    text_w = bbox[2] - bbox[0]
    text_x = (APP_ICON_X + APPS_ICON_X) // 2 - text_w // 2
    text_y = arrow_y - 35
    
    # Text shadow
    draw.text((text_x + 1, text_y + 1), drag_text, fill=(200, 200, 200, 150), font=font)
    draw.text((text_x, text_y), drag_text, fill=(80, 80, 90, 230), font=font)
    
    # Convert to RGB for PNG output
    bg_rgb = Image.new("RGB", (WIDTH, HEIGHT), (255, 255, 255))
    bg_rgb.paste(bg, mask=bg.split()[3])
    bg_rgb.save(output_path, "PNG")
    print(f"Background saved: {output_path}")


if __name__ == "__main__":
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    logo_path = os.path.join(project_root, "resources", "icons", "app.png")
    output_path = os.path.join(project_root, "resources", "dmg_background.png")
    create_background(logo_path, output_path)
