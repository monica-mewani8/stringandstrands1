import os
import json
import random

RAW_DIR = "public/assets/products/raw/Earrings"
PRODUCTS_DIR = "public/assets/products"
JSON_PATH = "src/data/products.json"

if not os.path.exists("src/data"):
    os.makedirs("src/data")

products = []
if os.path.exists(RAW_DIR):
    files = [f for f in os.listdir(RAW_DIR) if f.endswith(('.jpg', '.png', '.PNG', '.jpeg'))]
    
    # Sort files to be deterministic
    files.sort()
    
    for i, file in enumerate(files):
        ext = os.path.splitext(file)[1].lower()
        new_name = f"earrings-{i+1}{ext}"
        
        # Move and rename file
        old_path = os.path.join(RAW_DIR, file)
        new_path = os.path.join(PRODUCTS_DIR, new_name)
        os.rename(old_path, new_path)
        
        # Determine some mock data
        price = random.choice([499, 599, 699, 899, 1299])
        originalPrice = price + random.choice([300, 500, 700])
        title = f"Elegant Earring Style {i+1}"
        
        products.append({
            "id": f"earrings-{i+1}",
            "title": title,
            "category": "Earrings",
            "price": price,
            "originalPrice": originalPrice,
            "images": [f"/assets/products/{new_name}"],
            "reviews": []
        })

# Write to JSON
with open(JSON_PATH, "w") as f:
    json.dump(products, f, indent=2)

print(f"Generated {len(products)} products in {JSON_PATH}")
