import React, { useState, useEffect } from 'react';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { useWishlist } from '../lib/WishlistContext';
import { useCart } from '../lib/CartContext';
import { supabase } from '../lib/supabase';

export default function WishlistPage() {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      if (wishlist.size === 0) {
        setWishlistProducts([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const ids = Array.from(wishlist);
      const { data } = await supabase.from('products').select('*').in('id', ids);
      if (!cancelled) {
        const sorted = (data || []).sort((a: any, b: any) => {
          const aInStock = a.stock > 0 ? 1 : 0;
          const bInStock = b.stock > 0 ? 1 : 0;
          return bInStock - aInStock;
        });
        setWishlistProducts(sorted);
        setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, [wishlist]);

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart size={24} className="text-[#FF2D74]" fill="#FF2D74" />
          <h1 className="text-3xl md:text-4xl font-bold text-[#FF2D74]" style={{ fontFamily: "'Playfair Display', serif" }}>
            My Wishlist
          </h1>
          {wishlistProducts.length > 0 && !loading && (
            <span className="text-[#D41E5C]/70 text-sm font-medium">({wishlistProducts.length} items)</span>
          )}
        </div>

        {wishlistProducts.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-[#FFD1E3]/40 rounded-full flex items-center justify-center mb-6">
              <Heart size={40} className="text-[#FFD1E3]" />
            </div>
            <h3 className="text-xl font-bold text-[#B3184F] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              Your wishlist is empty
            </h3>
            <p className="text-sm text-[#D41E5C]/70 mb-6">Save pieces you love and come back to them anytime.</p>
            <Link to="/">
              <button className="px-8 py-3.5 bg-[#FF2D74] text-white text-sm font-bold rounded-full shadow-[0_4px_14px_rgba(255,45,116,0.3)] hover:bg-[#D41E5C] transition-all">
                Explore Collections
              </button>
            </Link>
          </div>
        ) : loading ? (
          <div className="py-24 text-center text-[#D41E5C]/70">Loading wishlist…</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {wishlistProducts.map(p => (
              <div key={p.id} className="bg-white rounded-2xl overflow-hidden border border-[#FFD1E3] shadow-sm group">
                <Link to={`/product/${p.id}`} className="block relative aspect-[4/5] overflow-hidden">
                  <img
                    src={p.images?.[0] || ''}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x500/FFD1E3/FF2D74?text=✦'; }}
                  />
                  {p.stock === 0 && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-white px-3 py-1.5 rounded-full border border-gray-200">Out of Stock</span>
                    </div>
                  )}
                </Link>
                <div className="p-3">
                  <p className="text-sm font-semibold text-[#B3184F] mb-1 line-clamp-2 leading-snug">{p.name}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-bold text-[#FF2D74] text-sm">₹{p.discounted_price ?? p.price}</span>
                    {p.price && <span className="text-xs line-through text-[#E88BAA]">₹{p.price}</span>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={p.stock === 0}
                      onClick={() => addToCart({ id: String(p.id), name: p.name, price: p.discounted_price ?? p.price, image: p.images[0] })}
                      className={`flex-1 py-2 text-white text-xs font-bold rounded-full transition-colors flex items-center justify-center gap-1.5 ${
                        p.stock === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#FF2D74] hover:bg-[#D41E5C]'
                      }`}
                    >
                      <ShoppingBag size={13} /> {p.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                    <button
                      onClick={() => toggleWishlist(String(p.id))}
                      className="p-2 border border-[#FFD1E3] rounded-full text-[#FFD1E3] hover:text-[#FF2D74] hover:border-[#FF2D74] transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

