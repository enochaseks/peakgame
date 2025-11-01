from PIL import Image, ImageDraw, ImageFont
import os

# Create a high-resolution image for the logo (512x512)
size = 512
logo = Image.new('RGB', (size, size), color='white')
draw = ImageDraw.Draw(logo)

# Define colors for each card (P, E, A, K)
colors = [
    (255, 192, 203),  # P - Pink
    (176, 224, 230),  # E - Light blue/cyan
    (221, 160, 221),  # A - Purple
    (173, 216, 230)   # K - Light blue
]

letters = ['P', 'E', 'A', 'K']

# Calculate card dimensions
card_width = size // 4
card_height = size
card_padding = 2

# Draw cards
for i, (letter, color) in enumerate(zip(letters, colors)):
    x = i * card_width
    y = 0
    
    # Draw card background with gradient effect
    # Draw main card rectangle
    draw.rectangle(
        [x + card_padding, y + card_padding, 
         x + card_width - card_padding, y + card_height - card_padding],
        fill=color,
        outline='black',
        width=3
    )
    
    # Draw card border (rounded effect with multiple rectangles)
    draw.rectangle(
        [x + card_padding, y + card_padding, 
         x + card_width - card_padding, y + card_height - card_padding],
        outline='#333333',
        width=3
    )

# Add text to each card
try:
    # Try to use a nice font, fall back to default
    font = ImageFont.truetype("arial.ttf", size=120)
except:
    font = ImageFont.load_default()

for i, letter in enumerate(letters):
    x = i * card_width
    text_x = x + card_width // 2
    text_y = size // 2
    
    # Draw letter
    draw.text(
        (text_x, text_y),
        letter,
        font=font,
        fill='black',
        anchor='mm'
    )

# Save as PNG (high quality)
logo_path = 'public/peak-logo-512.png'
os.makedirs('public', exist_ok=True)
logo.save(logo_path, 'PNG', quality=95)
print(f'✅ Created {logo_path}')

# Create favicon (16x16, 32x32, 64x64)
favicon_sizes = [16, 32, 64]
for size in favicon_sizes:
    favicon = logo.resize((size, size), Image.Resampling.LANCZOS)
    favicon_path = f'public/favicon-{size}x{size}.png'
    favicon.save(favicon_path, 'PNG')
    print(f'✅ Created {favicon_path}')

# Create standard favicon.ico from 32x32
favicon_32 = logo.resize((32, 32), Image.Resampling.LANCZOS)
favicon_32.save('public/favicon.ico', 'ICO')
print(f'✅ Created public/favicon.ico')

# Create apple-touch-icon (180x180 for iOS)
apple_icon = logo.resize((180, 180), Image.Resampling.LANCZOS)
apple_icon.save('public/apple-touch-icon.png', 'PNG')
print(f'✅ Created public/apple-touch-icon.png')

# Create PWA icon (192x192 and 512x512)
for pwa_size in [192, 512]:
    pwa_icon = logo.resize((pwa_size, pwa_size), Image.Resampling.LANCZOS)
    pwa_path = f'public/pwa-icon-{pwa_size}x{pwa_size}.png'
    pwa_icon.save(pwa_path, 'PNG')
    print(f'✅ Created {pwa_path}')

print('\n🎉 All favicon and logo files created successfully!')
