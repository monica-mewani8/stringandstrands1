import json

mapping = {
    'earring-11': 'White Crystal Pearl Drop Earring',
    'earring-12': 'Gold Pearl Bow Earring',
    'earring-13': 'Blue Crystal Tear Drop Earring',
    'earring-14': 'Green Emerald Square Stud Earring',
    'earring-15': 'Mint Green Floral Chandelier Earring',
    'earring-16': 'Pink Square Gemstone Drop Earring',
    'earring-17': 'Green Quartz Oval Drop Earring',
    'earring-18': 'Blue Enamel Floral Drop Earring',
    'earring-19': 'Purple Amethyst Rectangle Earring',
    'earring-20': 'Green Enamel Heart Drop Earring',
    'earring-21': 'Crystal Star Cluster Drop Earring',
    'earring-22': 'Green Jade Disc Drop Earring',
    'earring-23': 'Simple Pearl Stud Earring',
    'bracelets-1': 'Delicate Gold Chain Bracelet',
    'bracelets-2': 'Silver Minimalist Chain Bracelet',
    'bracelets-3': 'Black Enamel Clover Bracelet',
    'bracelets-4': 'Gold Heart Charm Bracelet',
    'bracelets-5': 'White Clover Charm Bracelet',
    'bracelets-6': 'Simple Gold Bar Bracelet',
    'bracelets-7': 'Delicate Gold Bead Bracelet',
    'bracelets-8': 'Thick Gold Cuff Bracelet',
    'bracelets-9': 'Gold Linked Chain Bracelet',
    'bracelets-10': 'Chunky Gold Heart Pearl Bracelet',
    'bracelets-11': 'White Clover Chain Bracelet',
    'bracelets-12': 'Black Enamel Clover Chain Bracelet',
    'bracelets-13': 'Gold Butterfly Charm Bracelet',
    'bracelets-14': 'Smooth Gold Bangle',
    'bracelets-15': 'Crystal Beaded Bracelet',
    'bracelets-16': 'Thin Gold Chain Bracelet',
    'bracelets-17': 'Thick Gold Tube Bangle',
    'bracelets-18': 'Black Clover Gold Bracelet',
    'bracelets-19': 'Delicate Silver Charm Bracelet',
    'bracelets-20': 'Gold Textured Hoop Bangle',
    'necklace-1': 'Thick Gold Chain Link Necklace',
    'necklace-2': 'Gold Medallion Pendant Necklace',
    'necklace-3': 'Star Charm Necklace',
    'necklace-4': 'Bohemian Multi-Charm Necklace',
    'necklace-5': 'Gold Heart Pendant Necklace',
    'necklace-6': 'Green Enamel Floral Necklace',
    'necklace-7': 'Floral Gold Chain Necklace',
    'necklace-8': 'Gold Padlock Pendant Necklace',
    'necklace-9': 'Delicate Heart Charm Necklace',
    'necklace-10': 'Gold Butterfly Pendant Necklace',
    'necklace-11': 'Multi-colored Gemstone Necklace',
    'necklace-12': 'Green Enamel Charm Necklace',
    'necklace-13': 'Minimalist Gold Chain Necklace',
    'necklace-14': 'Red and Green Gemstone Necklace',
    'necklace-15': 'Pink and Green Floral Necklace',
    'necklace-16': 'Simple Pearl Pendant Necklace',
    'necklace-17': 'Delicate Gold Charm Necklace',
    'ring-1': 'Gold Butterfly Open Ring',
    'ring-2': 'Pearl and Diamond Ring',
    'ring-3': 'Thick Gold Textured Ring',
    'ring-4': 'Gold Rose Flower Ring',
    'ring-5': 'Minimalist Gold Band Ring',
    'ring-6': 'Silver Twisted Band Ring',
    'ring-7': 'Gold Sunburst Ring',
    'ring-8': 'Pearl Center Gold Ring',
    'ring-9': 'Gold Braided Dome Ring'
}

with open('src/data/products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

updated_count = 0
for p in products:
    base = p['images'][0].split('/')[-1].split('.')[0]
    if base in mapping:
        p['title'] = mapping[base]
        updated_count += 1

with open('src/data/products.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2)

print(f"Updated {updated_count} product titles based on vision analysis.")
