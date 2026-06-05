from PIL import Image

img_path = r"c:\Git\Nutrimotion\Nutrimotion\nutrimotion-web\public\nutrimotion-logo.png"
out_path = r"c:\Git\Nutrimotion\Nutrimotion\nutrimotion-web\public\nutrimotion-logo-transparent.png"

try:
    img = Image.open(img_path).convert("RGBA")
    data = img.getdata()
    
    bg_color = data[0]
    
    new_data = []
    for item in data:
        # Distance in RGB space
        dist = sum((a - b) ** 2 for a, b in zip(item[:3], bg_color[:3])) ** 0.5
        if dist < 150: # Large tolerance to catch all anti-aliased orange background pixels
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(out_path)
    print("Transparent logo saved successfully.")
except Exception as e:
    print(f"Error: {e}")
