import os

with open('src/app/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def get_lines(start, end):
    return ''.join(lines[start-1:end])

imports = get_lines(1, 14)

logo = get_lines(16, 33)
announcement = get_lines(35, 71)
header = get_lines(73, 194)
hero_carousel = get_lines(196, 351)
shop_category = get_lines(355, 423)
product_mock = get_lines(426, 454)
product_card = get_lines(456, 528)
product_carousel = get_lines(530, 574)
shop_occasion = get_lines(576, 697)
testimonials = get_lines(703, 769)
footer = get_lines(773, 874)

shared_content = f"""import React, {{ useState, useEffect }} from 'react';
import {{
  Search, ShoppingBag, Heart, Menu, X, ChevronLeft, ChevronRight,
  ChevronDown, Instagram, Facebook, User
}} from 'lucide-react';
import {{ Link, useNavigate }} from 'react-router';

export const MAGENTA = '#FF2D74';
export const MAGENTA_DARK = '#D41E5C';
export const CHARCOAL = '#B3184F';
export const OFFWHITE = '#FFEAF2';
export const BLUSH = '#FFD1E3';
export const WARM_GREY = '#B3184F';

{logo.replace('function Logo', 'export function Logo')}
{announcement.replace('function AnnouncementBar', 'export function AnnouncementBar')}
{header.replace('function Header', 'export function Header')}
{product_mock.replace('interface Product', 'export interface Product').replace('const NEW_ARRIVALS', 'export const NEW_ARRIVALS').replace('const BESTSELLERS', 'export const BESTSELLERS')}
{product_card.replace('function ProductCard', 'export function ProductCard')}
{footer.replace('function Footer', 'export function Footer')}
"""

shared_content = shared_content.replace(
    '<button\\n              key={item}\\n              className="text-[11px] font-semibold uppercase tracking-widest text-[#B3184F] hover:text-[#FF2D74] transition-colors"\\n            >\\n              {item}\\n            </button>',
    '<Link\\n              key={item}\\n              to={`/category/${item.toLowerCase()}`}\\n              className="text-[11px] font-semibold uppercase tracking-widest text-[#B3184F] hover:text-[#FF2D74] transition-colors"\\n            >\\n              {item}\\n            </Link>'
)
shared_content = shared_content.replace(
    '<button\\n                key={item}\\n                className="block w-full text-left py-4 text-[11px] font-bold uppercase tracking-widest text-[#B3184F] border-b border-[#FFD1E3] last:border-0 hover:text-[#FF2D74] transition-colors"\\n              >\\n                {item}\\n              </button>',
    '<Link\\n                key={item}\\n                to={`/category/${item.toLowerCase()}`}\\n                onClick={() => setMobileMenuOpen(false)}\\n                className="block w-full text-left py-4 text-[11px] font-bold uppercase tracking-widest text-[#B3184F] border-b border-[#FFD1E3] last:border-0 hover:text-[#FF2D74] transition-colors"\\n              >\\n                {item}\\n              </Link>'
)
shared_content = shared_content.replace(
    '<div className="flex items-center gap-2.5 select-none cursor-pointer">',
    '<Link to="/" className="flex items-center gap-2.5 select-none cursor-pointer">'
).replace(
    '</span>\\n    </div>',
    '</span>\\n    </Link>'
)


with open('src/app/Shared.tsx', 'w', encoding='utf-8') as f:
    f.write(shared_content)


home_content = f"""import React, {{ useRef, useState, useEffect }} from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import {{ ChevronLeft, ChevronRight, Star, ArrowRight }} from 'lucide-react';
import {{ Link, useNavigate }} from 'react-router';
import {{ MAGENTA, CHARCOAL, OFFWHITE, ProductCard, NEW_ARRIVALS, BESTSELLERS, Product }} from './Shared';

{hero_carousel}
{shop_category.replace('href="/products?occasion=', 'href="/occasion/').replace('<a ', '<Link to=').replace('</a>', '</Link>')}
{product_carousel}
{shop_occasion.replace('href="/products?occasion=', 'to="/occasion/').replace('<a ', '<Link ').replace('</a>', '</Link>')}
{testimonials}

export default function HomePage({{ wishlist, toggleWishlist }}: {{ wishlist: Set<number>, toggleWishlist: (id: number) => void }}) {{
  const navigate = useNavigate();
  return (
    <main>
      <HeroCarousel />
      <ShopByCategory />
      <ProductCarousel
        title="New Arrivals"
        products={{NEW_ARRIVALS}}
        wishlist={{wishlist}}
        onWishlistToggle={{toggleWishlist}}
      />
      <ProductCarousel
        title="Bestsellers"
        subtitle="Loved by our customers"
        products={{BESTSELLERS}}
        bg="bg-[#FFEAF2]"
        wishlist={{wishlist}}
        onWishlistToggle={{toggleWishlist}}
      />
      <ShopByOccasion />
      <Testimonials />
    </main>
  );
}}
"""

home_content = home_content.replace(
    'href="/occasion/${tile.id}"',
    'to={`/occasion/${tile.id}`}'
)

home_content = home_content.replace(
    '<button className="text-[11px] font-bold uppercase tracking-widest text-[#FF2D74] hover:text-[#D41E5C] transition-colors p-2 -mr-2">\\n            View All\\n          </button>',
    '<button onClick={() => navigate(title === "New Arrivals" ? "/new-arrivals" : "/bestsellers")} className="text-[11px] font-bold uppercase tracking-widest text-[#FF2D74] hover:text-[#D41E5C] transition-colors p-2 -mr-2">\\n            View All\\n          </button>'
)

with open('src/app/HomePage.tsx', 'w', encoding='utf-8') as f:
    f.write(home_content)


app_content = f"""import React, {{ useState }} from 'react';
import {{ BrowserRouter, Routes, Route, useLocation }} from 'react-router';
import {{ AnnouncementBar, Header, Footer }} from './Shared';
import HomePage from './HomePage';
import CategoryPage from './CategoryPage';

function ScrollToTop() {{
  const {{ pathname }} = useLocation();
  React.useEffect(() => {{
    window.scrollTo(0, 0);
  }}, [pathname]);
  return null;
}}

function AppContent() {{
  const [wishlist, setWishlist] = useState<Set<number>>(new Set());
  const toggleWishlist = (id: number) => {{
    setWishlist(prev => {{
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    }});
  }};

  return (
    <div className="min-h-screen bg-[#FFEAF2] pb-14 md:pb-0 flex flex-col">
      <ScrollToTop />
      <AnnouncementBar />
      <Header cartCount={{wishlist.size}} />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={{<HomePage wishlist={{wishlist}} toggleWishlist={{toggleWishlist}} />}} />
          <Route path="/category/:categoryId" element={{<CategoryPage wishlist={{wishlist}} toggleWishlist={{toggleWishlist}} type="category" />}} />
          <Route path="/bestsellers" element={{<CategoryPage wishlist={{wishlist}} toggleWishlist={{toggleWishlist}} type="bestsellers" />}} />
          <Route path="/new-arrivals" element={{<CategoryPage wishlist={{wishlist}} toggleWishlist={{toggleWishlist}} type="new-arrivals" />}} />
          <Route path="/occasion/:occasionId" element={{<CategoryPage wishlist={{wishlist}} toggleWishlist={{toggleWishlist}} type="occasion" />}} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}}

export default function App() {{
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}}
"""

with open('src/app/App.tsx', 'w', encoding='utf-8') as f:
    f.write(app_content)
