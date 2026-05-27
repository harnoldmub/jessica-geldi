from PIL import Image
import sys
from collections import Counter

def get_dominant_colors(image_path, num_colors=10):
    img = Image.open(image_path)
    img = img.convert('RGB')
    img.thumbnail((150, 150))
    pixels = list(img.getdata())
    
    # Simple quantization to group similar colors
    quantized = [(r//16*16, g//16*16, b//16*16) for r, g, b in pixels]
    counts = Counter(quantized)
    
    for color, count in counts.most_common(num_colors):
        print(f"#{color[0]:02x}{color[1]:02x}{color[2]:02x} (Count: {count})")

if __name__ == "__main__":
    get_dominant_colors(sys.argv[1])
