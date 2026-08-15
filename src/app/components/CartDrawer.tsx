import React from 'react';
import { X, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { useCart } from '../../lib/CartContext';

export default function CartDrawer() {
  const { cartItems, cartCount, cartTotal, isDrawerOpen, closeDrawer, removeFromCart, updateQty } = useCart();

  return (
    <>
      {/* Backdrop */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-[#FF2D74]/20 backdrop-blur-sm z-40"
          onClick={closeDrawer}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-[420px] bg-white shadow-[-8px_0_40px_rgba(255,45,116,0.15)] z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#FFD1E3]">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-[#FF2D74]" />
            <h2 className="text-lg font-bold text-[#FF2D74]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Your Cart
            </h2>
            {cartCount > 0 && (
              <span className="bg-[#FF2D74] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          <button
            onClick={closeDrawer}
            className="text-[#FFD1E3] hover:text-[#FF2D74] transition-colors p-1"
          >
            <X size={22} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-16">
              <div className="w-20 h-20 bg-[#FFD1E3]/50 rounded-full flex items-center justify-center">
                <ShoppingBag size={32} className="text-[#FFD1E3]" />
              </div>
              <p className="text-[#D41E5C] font-medium">Your cart is empty</p>
              <p className="text-sm text-[#D41E5C]/60">Add some beautiful pieces!</p>
              <button
                onClick={closeDrawer}
                className="mt-2 px-6 py-2.5 border-2 border-[#FF2D74] text-[#FF2D74] rounded-full text-sm font-semibold hover:bg-[#FF2D74] hover:text-white transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cartItems.map(item => (
              <div
                key={item.id}
                className="flex gap-4 bg-white rounded-2xl p-3 border border-[#FFD1E3] shadow-sm"
              >
                {/* Thumbnail */}
                <div className="w-20 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-white">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/80x96/FFD1E3/FF2D74?text=✦'; }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm font-semibold text-[#B3184F] leading-tight line-clamp-2">{item.name}</p>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-[#FFD1E3] hover:text-[#FF2D74] transition-colors flex-shrink-0"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {/* Qty */}
                    <div className="flex items-center border border-[#FFD1E3] rounded-full bg-white">
                      <button
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        className="p-1.5 text-[#FF2D74] hover:bg-[#FFD1E3] rounded-l-full transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-bold text-[#B3184F] w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        className="p-1.5 text-[#FF2D74] hover:bg-[#FFD1E3] rounded-r-full transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <p className="text-sm font-bold text-[#FF2D74]">₹{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="px-6 py-5 border-t border-[#FFD1E3] bg-white space-y-4">
            {/* Subtotal */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#D41E5C]">Subtotal</span>
              <span className="font-bold text-[#FF2D74] text-lg">₹{cartTotal.toLocaleString()}</span>
            </div>
            {cartTotal < 499 && (
              <p className="text-xs text-[#D41E5C]/70 text-center">
                Add ₹{(499 - cartTotal).toLocaleString()} more for free shipping ✨
              </p>
            )}

            {/* Checkout */}
            <Link to="/checkout" onClick={closeDrawer}>
              <button className="w-full py-4 bg-[#FF2D74] text-white rounded-2xl font-bold text-sm tracking-wide hover:bg-[#D41E5C] transition-all shadow-[0_4px_14px_rgba(255,45,116,0.3)] hover:-translate-y-0.5 flex items-center justify-center gap-2">
                Proceed to Checkout
                <ArrowRight size={16} />
              </button>
            </Link>

            {/* Continue Shopping */}
            <button
              onClick={closeDrawer}
              className="w-full py-2 text-sm text-[#FF2D74] font-medium hover:underline"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
