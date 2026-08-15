import os
import json
import random

RAW_DIR = "public/assets/products/raw"
PRODUCTS_DIR = "public/assets/products"
JSON_PATH = "src/data/products.json"

if not os.path.exists(JSON_PATH):
    products = []
else:
    with open(JSON_PATH, "r") as f:
        products = json.load(f)

# Map raw folder names to actual frontend categories
CATEGORY_MAP = {
    "neckpiece": "Necklace",
    "rings": "Ring",
    "earrings": "Earrings",
    "bracelets": "Bracelets"
}

total_added = 0

for folder_name in os.listdir(RAW_DIR):
    folder_path = os.path.join(RAW_DIR, folder_name)
    if not os.path.isdir(folder_path):
        continue
        
    clean_name = folder_name.strip().lower()
    category = CATEGORY_MAP.get(clean_name, clean_name.capitalize())
    
    files = [f for f in os.listdir(folder_path) if f.endswith(('.jpg', '.png', '.PNG', '.jpeg'))]
    files.sort()
    
    if not files:
        continue
        
    start_idx = len([p for p in products if p['category'] == category])
    
    for i, file in enumerate(files):
        ext = os.path.splitext(file)[1].lower()
        new_name = f"{category.lower()}-{start_idx + i + 1}{ext}"
        
        old_path = os.path.join(folder_path, file)
        new_path = os.path.join(PRODUCTS_DIR, new_name)
        os.rename(old_path, new_path)
        
        price = random.choice([499, 599, 699, 899, 1299])
        originalPrice = price + random.choice([300, 500, 700])
        title = f"Elegant {category} Style {start_idx + i + 1}"
        
        products.append({
            "id": f"{category.lower()}-{start_idx + i + 1}",
            "title": title,
            "category": category,
            "price": price,
            "originalPrice": originalPrice,
            "images": [f"/assets/products/{new_name}"],
            "reviews": []
        })
        total_added += 1

with open(JSON_PATH, "w") as f:
    json.dump(products, f, indent=2)

print(f"Appended {total_added} products to {JSON_PATH}")
