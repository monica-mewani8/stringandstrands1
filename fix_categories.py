import os
import json
import shutil

PRODUCTS_DIR = "public/assets/products"
JSON_PATH = "src/data/products.json"

if not os.path.exists(JSON_PATH):
    print("products.json not found")
    exit(1)

with open(JSON_PATH, "r", encoding="utf-8") as f:
    products = json.load(f)

# The dirty names that somehow got in
DIRTY_MAP = {
    "Neckpiece\u2420": "Necklace",
    "Neckpiece ": "Necklace",
    "Rings\u2420": "Ring",
    "Rings ": "Ring",
    "Neckpiece\u00a0": "Necklace",
    "Rings\u00a0": "Ring",
    "Earrings\u2420": "Earrings",
    "Bracelets\u2420": "Bracelets",
}

# Fix products.json
for p in products:
    for dirty, clean in DIRTY_MAP.items():
        if p['category'] == dirty:
            p['category'] = clean
        # If title has dirty
        p['title'] = p['title'].replace(dirty, clean)

# Save products.json
with open(JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(products, f, indent=2)

# Fix folders
for folder in os.listdir(PRODUCTS_DIR):
    folder_path = os.path.join(PRODUCTS_DIR, folder)
    if os.path.isdir(folder_path):
        for dirty, clean in DIRTY_MAP.items():
            if folder == dirty:
                new_path = os.path.join(PRODUCTS_DIR, clean)
                if not os.path.exists(new_path):
                    os.makedirs(new_path)
                # Move files
                for item in os.listdir(folder_path):
                    shutil.move(os.path.join(folder_path, item), os.path.join(new_path, item))
                # Delete old dirty folder
                shutil.rmtree(folder_path)
                break

print("Fixed categories")
