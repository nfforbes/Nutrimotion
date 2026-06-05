from PIL import Image

img_path = r"c:\Git\Nutrimotion\Nutrimotion\nutrimotion-web\public\nutrimotion-logo.png"
try:
    img = Image.open(img_path).convert("RGBA")
    data = img.getdata()
    
    bg_color = data[0]
    
    def is_bg(pixel, bg, tol=60):
        return abs(pixel[0] - bg[0]) < tol and abs(pixel[1] - bg[1]) < tol and abs(pixel[2] - bg[2]) < tol
        
    new_data = []
    for item in data:
        if item[3] == 0:
            new_data.append(item)
        elif is_bg(item, bg_color, 60):
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(img_path)
    print("Background removed successfully.")
except Exception as e:
    print(f"Error: {e}")
