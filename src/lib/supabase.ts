import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Missing environment variables. ' +
    'Copy .env.example to .env and fill in your Supabase URL and Anon Key.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          category: string;
          price: number;
          discounted_price: number;
          description: string | null;
          images: string[];
          stock: number;
          metal: string | null;
          color: string | null;
          occasion: string | null;
          type: string | null;
          is_bestseller: boolean;
          is_new: boolean;
          created_at: string;
        };
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          product_id: string;
          quantity: number;
          created_at: string;
        };
      };
      wishlist_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
          total_amount: number;
          shipping_address_id: string;
          shiprocket_order_id: string | null;
          awb_number: string | null;
          tracking_status: string | null;
          created_at: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          price_at_purchase: number;
        };
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id: string;
          reviewer_name: string;
          rating: number;
          title: string;
          review_text: string;
          image_urls: string[];
          is_verified_purchase: boolean;
          created_at: string;
        };
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          phone: string;
          address_line1: string;
          address_line2: string | null;
          city: string;
          state: string;
          pincode: string;
          is_default: boolean;
        };
      };
    };
  };
};
