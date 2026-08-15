import os
import json
import shutil

PRODUCTS_DIR = "public/assets/products"
JSON_PATH = "src/data/products.json"

if not os.path.exists(JSON_PATH):
    print("No products.json found")
    exit(1)

with open(JSON_PATH, "r") as f:
    products = json.load(f)

# Keep track of file indexing per category to rename cleanly
category_counts = {}

for p in products:
    cat = p['category']
    cat_dir = os.path.join(PRODUCTS_DIR, cat)
    
    # Create the category folder if it doesn't exist
    if not os.path.exists(cat_dir):
        os.makedirs(cat_dir)
        
    old_img_url = p['images'][0]
    # old_img_url looks like "/assets/products/bracelets-1.png" or "/assets/products/bracelets -1.png"
    old_img_filename = old_img_url.split("/")[-1]
    
    # Sometimes the actual file has a URL-encoded space or literal space
    # Let's find the actual file that matches
    possible_files = [old_img_filename, old_img_filename.replace('%20', ' ')]
    # Also handle the weird space character (U+2420 or just space)
    for file in os.listdir(PRODUCTS_DIR):
        if file == old_img_filename or file.replace(' ', '') == old_img_filename.replace('%20', ''):
            old_img_filename = file
            break
            
    old_img_path = os.path.join(PRODUCTS_DIR, old_img_filename)
    
    # Check if the file exists at the root, or if it was already moved
    if os.path.exists(old_img_path) and not os.path.isdir(old_img_path):
        ext = os.path.splitext(old_img_filename)[1].lower()
        
        # New clean name
        if cat not in category_counts:
            category_counts[cat] = 1
        else:
            category_counts[cat] += 1
            
        new_filename = f"{cat.lower()}-{category_counts[cat]}{ext}"
        new_img_path = os.path.join(cat_dir, new_filename)
        
        # Move the file
        shutil.move(old_img_path, new_img_path)
        
        # Update JSON
        p['images'] = [f"/assets/products/{cat}/{new_filename}"]
        p['id'] = f"{cat.lower()}-{category_counts[cat]}"

# Save updated JSON
with open(JSON_PATH, "w") as f:
    json.dump(products, f, indent=2)

print("Successfully categorized all images into folders and updated products.json")
