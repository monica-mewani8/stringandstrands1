import re

with open('src/app/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove QuickLinkStrip
content = re.sub(r'// ── Quick Link Strip ──.*?function QuickLinkStrip\(\) \{.*?\}\n', '', content, flags=re.DOTALL)
content = re.sub(r'\s*<QuickLinkStrip />', '', content)

# 2. Update CATEGORIES
old_categories_pattern = r'const CATEGORIES = \[.*?\];'
new_categories = '''const CATEGORIES = [
  { label: "Earrings", img: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&h=200&fit=crop&auto=format" },
  { label: "Necklace", img: "https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=200&h=200&fit=crop&auto=format" },
  { label: "Ring", img: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200&h=200&fit=crop&auto=format" },
  { label: "Bracelets", img: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=200&h=200&fit=crop&auto=format" },
  { label: "Bangles", img: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop&auto=format" },
  { label: "Sets", img: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=200&h=200&fit=crop&auto=format" },
  { label: "Pendants", img: "https://images.unsplash.com/photo-1524638431109-93d95c4f381c?w=200&h=200&fit=crop&auto=format" },
];'''
content = re.sub(old_categories_pattern, new_categories, content, flags=re.DOTALL)

# 3. Remove PickYourStyle
content = re.sub(r'// ── Pick Your Style ──.*?function PickYourStyle\(\) \{.*?\}\n', '', content, flags=re.DOTALL)
content = re.sub(r'\s*<PickYourStyle />', '', content)

# 4. Remove CuratedCollections
content = re.sub(r'// ── Curated Collections ──.*?function CuratedCollections\(\) \{.*?\}\n', '', content, flags=re.DOTALL)
content = re.sub(r'\s*<CuratedCollections />', '', content)

with open('src/app/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated App.tsx successfully.')
