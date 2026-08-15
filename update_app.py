import re

with open('src/app/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Colors
# Replace constants
content = content.replace('const CHARCOAL = "#1A1A1A";', 'const CHARCOAL = "#B3184F";')
content = content.replace('const OFFWHITE = "#FDF8F6";', 'const OFFWHITE = "#FFEAF2";')
content = content.replace('const BLUSH = "#FBEEEE";', 'const BLUSH = "#FFD1E3";')
content = content.replace('const WARM_GREY = "#6B6260";', 'const WARM_GREY = "#B3184F";')

# Replace inline hex codes
content = re.sub(r'(?i)#ffffff|white(?!space)', '#FFEAF2', content)
content = re.sub(r'(?i)#1A1A1A', '#B3184F', content)
content = re.sub(r'(?i)#FDF8F6', '#FFEAF2', content)
content = re.sub(r'(?i)#FBEEEE', '#FFD1E3', content)
content = re.sub(r'(?i)#EFE0E0', '#FFD1E3', content)
content = re.sub(r'(?i)#6B6260', '#B3184F', content)
content = re.sub(r'\bblack\b', '#B3184F', content)

# Tailwind classes
content = re.sub(r'bg-white\b', 'bg-[#FFEAF2]', content)
content = re.sub(r'text-white\b', 'text-[#FFEAF2]', content)
content = re.sub(r'border-white\b', 'border-[#FFEAF2]', content)
content = re.sub(r'ring-white\b', 'ring-[#FFEAF2]', content)
content = re.sub(r'bg-black\b', 'bg-[#B3184F]', content)
content = re.sub(r'text-black\b', 'text-[#B3184F]', content)

# 2. Logo - Remove SVG and keep text
logo_pattern = r'<svg.*?<\/svg>'
content = re.sub(logo_pattern, '', content, flags=re.DOTALL)

# 3. Mobile Header - Add Account icon next to search/wishlist/cart
# Look for the exact block in Header:
header_icons_orig = '''<button className="md:hidden" onClick={() => setSearchOpen(v => !v)} aria-label="Search">
            <Search size={20} color={CHARCOAL} />
          </button>
          <button className="hidden md:block" aria-label="Account">
            <User size={20} color={CHARCOAL} />
          </button>'''
header_icons_new = '''<button className="md:hidden" onClick={() => setSearchOpen(v => !v)} aria-label="Search">
            <Search size={20} color={CHARCOAL} />
          </button>
          <button aria-label="Account">
            <User size={20} color={CHARCOAL} />
          </button>'''
content = content.replace(header_icons_orig, header_icons_new)

# 4. Remove MobileBottomNav completely
nav_def_pattern = r'// ── Mobile Bottom Nav ──.*?(?=// ── App ──)'
content = re.sub(nav_def_pattern, '', content, flags=re.DOTALL)

app_render_pattern = r'<Footer />\s*<MobileBottomNav />'
content = re.sub(app_render_pattern, '<Footer />', content)

# 5. Remove Bridal/Wedding Content
# Hero Carousel slide 2
content = re.sub(r'\{\s*img: "https://images\.unsplash\.com/photo-1573408301185-9519f94816b5.*?",\s*headline: "The Bridal\\nEdit 2026",\s*sub: "Exquisite pieces for your most precious moments",\s*cta: "Explore Collection",\s*\},', '', content, flags=re.DOTALL)

# Quick Links
content = re.sub(r'\{\s*label: "Wedding Edit",\s*emoji: "💍"\s*\},', '{ label: "Party Glam", emoji: "✨" },', content)

# Style Moods
content = re.sub(r'\{\s*label: "Bridal Edit",\s*img: "https://images\.unsplash\.com/photo-1522413452208-996ff3f3e740.*?"\s*\},', '', content)

# Testimonials
content = content.replace("Ordered the bridal set for my sister's wedding.", "Ordered the party set for my sister's birthday.")

# Fix Shadows to pink-tinted
content = content.replace('shadow-md group-hover:shadow-lg', 'shadow-[0_4px_14px_rgba(179,24,79,0.15)] group-hover:shadow-[0_8px_24px_rgba(179,24,79,0.25)]')
content = content.replace('shadow-sm', 'shadow-[0_2px_8px_rgba(179,24,79,0.1)]')

# Update black texts inside gradient components (like bg-gradient-to-r from-black/65)
# We already replaced \bblack\b with #B3184F, so from-[#B3184F]/65 etc.

with open('src/app/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
