import os
import json
import random

RAW_DIR = "public/assets/products/raw/Bracelets"
PRODUCTS_DIR = "public/assets/products"
JSON_PATH = "src/data/products.json"

if not os.path.exists(JSON_PATH):
    print("products.json not found")
    exit(1)

with open(JSON_PATH, "r") as f:
    products = json.load(f)

if os.path.exists(RAW_DIR):
    files = [f for f in os.listdir(RAW_DIR) if f.endswith(('.jpg', '.png', '.PNG', '.jpeg'))]
    files.sort()
    
    start_idx = len([p for p in products if p['category'] == 'Bracelets'])
    
    for i, file in enumerate(files):
        ext = os.path.splitext(file)[1].lower()
        new_name = f"bracelets-{start_idx + i + 1}{ext}"
        
        old_path = os.path.join(RAW_DIR, file)
        new_path = os.path.join(PRODUCTS_DIR, new_name)
        os.rename(old_path, new_path)
        
        price = random.choice([499, 599, 699, 899, 1299])
        originalPrice = price + random.choice([300, 500, 700])
        title = f"Elegant Bracelet Style {start_idx + i + 1}"
        
        products.append({
            "id": f"bracelets-{start_idx + i + 1}",
            "title": title,
            "category": "Bracelets",
            "price": price,
            "originalPrice": originalPrice,
            "images": [f"/assets/products/{new_name}"],
            "reviews": []
        })

with open(JSON_PATH, "w") as f:
    json.dump(products, f, indent=2)

print(f"Appended {len(files)} bracelets to {JSON_PATH}")
