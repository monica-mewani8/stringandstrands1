import re

with open('src/app/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix constant name
content = content.replace('const OFF#FFEAF2 = "#FFEAF2";', 'const OFFWHITE = "#FFEAF2";')

# Fix Logo component props
content = content.replace('bgFill = OFF#FFEAF2', 'bgFill = OFFWHITE')
content = content.replace('variant?: "dark" | "#FFEAF2" | "magenta";', 'variant?: "dark" | "white" | "magenta";')
content = content.replace('variant === "#FFEAF2" ? "#FFEAF2"', 'variant === "white" ? "#FFEAF2"')
content = content.replace('bgFill="#FFEAF2"', 'bgFill={OFFWHITE}')

# Fix classes: anything that became `text-#FFEAF2` or `bg-#FFEAF2` or `border-#FFEAF2` etc without brackets.
def fix_color_class(match):
    prefix = match.group(1) # e.g. bg-, text-, border-
    color = match.group(2) # e.g. #FFEAF2 or #B3184F
    suffix = match.group(3) or '' # e.g. /72, /97, or empty
    return f"{prefix}[{color}]{suffix}"

content = re.sub(r'(bg-|text-|border-|ring-|from-|via-|to-)(#FFEAF2|#B3184F|#FFD1E3)(/[0-9]+)?', fix_color_class, content)

# Also fix `bg-[#FFEAF2]/97` to `bg-[#FFEAF2]/97` actually wait... wait, the replacement `re.sub(r'bg-white\b', 'bg-[#FFEAF2]', content)` didn't handle opacities correctly if they were just `bg-white/97` -> it would not match `\b`.
# Let's check if there's any `#FFEAF2Space`.
content = content.replace('#FFEAF2Space', 'whiteSpace')

with open('src/app/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
