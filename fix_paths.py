import os
import json
import shutil

PRODUCTS_DIR = "public/assets/products"
JSON_PATH = "src/data/products.json"

with open(JSON_PATH, "r", encoding="utf-8") as f:
    products = json.load(f)

for p in products:
    images = []
    for img in p['images']:
        # Fix image paths by removing ␠ and spaces from the filename and folder name
        # Old: /assets/products/Neckpiece␠/neckpiece␠-1.png
        # New: /assets/products/Necklace/necklace-1.png (or whatever clean category)
        
        # But wait, if the filename is neckpiece␠-1.png, we should rename the physical file
        filename = img.split("/")[-1]
        
        # We know p['category'] is clean now (e.g. 'Necklace', 'Ring')
        cat = p['category']
        
        clean_filename = filename.replace('\u2420', '').replace('\u00a0', '').replace(' ', '')
        # Also if it says 'neckpiece', change to 'necklace' in filename
        clean_filename = clean_filename.replace('neckpiece', 'necklace').replace('rings', 'ring')
        
        # The file is currently located at public/assets/products/{cat}/{filename}
        # Wait, the physical folders were renamed to {cat}, but the filenames were untouched.
        # Let's find the file
        current_path = os.path.join(PRODUCTS_DIR, cat, filename)
        if not os.path.exists(current_path):
            # maybe the filename was already clean?
            pass
            
        new_path = os.path.join(PRODUCTS_DIR, cat, clean_filename)
        
        if os.path.exists(current_path) and current_path != new_path:
            shutil.move(current_path, new_path)
            
        images.append(f"/assets/products/{cat}/{clean_filename}")
        
    p['images'] = images
    p['id'] = p['id'].replace('\u2420', '').replace('\u00a0', '').replace(' ', '').replace('neckpiece', 'necklace').replace('rings', 'ring')

with open(JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(products, f, indent=2)

print("Fixed image paths and filenames")
