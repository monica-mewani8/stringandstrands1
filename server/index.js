// ─────────────────────────────────────────────────────────────────────────────
// Strings & Strands — Express Backend
// Handles: Razorpay orders & payment verification, Shiprocket shipping,
//          Resend email notifications, Supabase service-role operations
// ─────────────────────────────────────────────────────────────────────────────

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ── Supabase (service-role — server only) ────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Razorpay ─────────────────────────────────────────────────────────────────
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// ─────────────────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


// ─────────────────────────────────────────────────────────────────────────────
// ADMIN MIDDLEWARE — verify JWT + is_admin flag
// ─────────────────────────────────────────────────────────────────────────────
async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }
    const token = authHeader.slice(7);

    // Verify JWT with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Check is_admin flag
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return res.status(403).json({ error: 'Access denied — not an admin' });
    }

    req.adminUser = user;
    next();
  } catch (err) {
    console.error('[Admin Auth]', err);
    res.status(500).json({ error: 'Auth check failed' });
  }
}

// Helper: log admin action
async function logAdminAction(adminId, action, targetType, targetId, notes = '') {
  try {
    await supabase.from('admin_activity_log').insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: String(targetId),
      notes,
    });
  } catch (e) { /* non-fatal */ }
}


// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/products  — list with search/filter/sort/pagination
app.get('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const { search, category, sortBy = 'created_at', sortDir = 'desc', page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: sortDir === 'asc' })
      .range(offset, offset + Number(limit) - 1);

    if (search) query = query.ilike('name', `%${search}%`);
    if (category) query = query.eq('category', category);

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ products: data, total: count });
  } catch (err) {
    console.error('[Admin] Products list error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/products — create product
app.post('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const product = req.body;
    if (!product.id) {
      product.id = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
    }
    const { data, error } = await supabase.from('products').insert(product).select().single();
    if (error) throw error;
    await logAdminAction(req.adminUser.id, 'create_product', 'product', data.id, `Created: ${data.name}`);
    res.json({ product: data });
  } catch (err) {
    console.error('[Admin] Create product error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/products/:id — update product fields
app.patch('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
    if (error) throw error;
    await logAdminAction(req.adminUser.id, 'edit_product', 'product', id, `Updated: ${JSON.stringify(Object.keys(updates))}`);
    res.json({ product: data });
  } catch (err) {
    console.error('[Admin] Update product error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/products/:id — delete product (order_items preserved via ON DELETE SET NULL)
app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // Snapshot product name/price into order_items before deletion
    const { data: product } = await supabase.from('products').select('name, price').eq('id', id).single();
    if (product) {
      await supabase.from('order_items')
        .update({ product_name_snapshot: product.name, price_inr_snapshot: Math.round(product.price) })
        .eq('product_id', id)
        .is('product_name_snapshot', null);
    }
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    await logAdminAction(req.adminUser.id, 'delete_product', 'product', id, `Deleted: ${product?.name}`);
    res.json({ success: true });
  } catch (err) {
    console.error('[Admin] Delete product error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/products/upload-image — upload to Supabase Storage
app.post('/api/admin/products/upload-image', requireAdmin, async (req, res) => {
  try {
    const { base64, fileName, mimeType } = req.body;
    if (!base64 || !fileName) return res.status(400).json({ error: 'Missing file data' });

    const buffer = Buffer.from(base64, 'base64');
    const path = `${Date.now()}-${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, buffer, { contentType: mimeType || 'image/jpeg', upsert: false });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
    res.json({ url: publicUrl });
  } catch (err) {
    console.error('[Admin] Image upload error:', err);
    res.status(500).json({ error: err.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — USERS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/users — list with order count & total spend
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const { search, page = 1, limit = 30 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: profiles, error, count } = await query;
    if (error) throw error;

    // Attach order stats
    const userIds = profiles.map(p => p.id);
    const { data: orderStats } = await supabase
      .from('orders')
      .select('user_id, total_amount, status')
      .in('user_id', userIds)
      .in('status', ['paid', 'shipped', 'delivered']);

    const statsMap = {};
    for (const o of (orderStats || [])) {
      if (!statsMap[o.user_id]) statsMap[o.user_id] = { count: 0, total: 0 };
      statsMap[o.user_id].count++;
      statsMap[o.user_id].total += o.total_amount;
    }

    const users = profiles.map(p => ({
      ...p,
      order_count: statsMap[p.id]?.count || 0,
      total_spent_paise: statsMap[p.id]?.total || 0,
    }));

    res.json({ users, total: count });
  } catch (err) {
    console.error('[Admin] Users list error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users/:id — single user detail
app.get('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [{ data: profile }, { data: addresses }, { data: orders }, { data: wishlist }] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('id', id).single(),
      supabase.from('addresses').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      supabase.from('orders').select('id, status, total_amount, created_at, razorpay_payment_id, tracking_status').eq('user_id', id).order('created_at', { ascending: false }),
      supabase.from('wishlist_items').select('product_id, products(name, images, price)').eq('user_id', id),
    ]);
    res.json({ profile, addresses, orders, wishlist });
  } catch (err) {
    console.error('[Admin] User detail error:', err);
    res.status(500).json({ error: err.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — ORDERS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/orders — list with filters
app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  try {
    const { status, dateFrom, dateTo, page = 1, limit = 30 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('orders')
      .select(`
        id, status, total_amount, created_at, razorpay_payment_id,
        razorpay_order_id, tracking_status, shiprocket_order_id,
        user_profiles!orders_user_id_fkey(name, email),
        order_items(id)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (status) query = query.eq('status', status);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59Z');

    const { data, error, count } = await query;
    if (error) throw error;

    const orders = (data || []).map(o => ({
      ...o,
      item_count: o.order_items?.length || 0,
      customer_name: o.user_profiles?.name || o.user_profiles?.email || 'Guest',
      customer_email: o.user_profiles?.email,
    }));

    res.json({ orders, total: count });
  } catch (err) {
    console.error('[Admin] Orders list error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/orders/:id — full order detail
app.get('/api/admin/orders/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        user_profiles!orders_user_id_fkey(name, email, phone),
        addresses(*),
        order_items(
          id, quantity, price_at_purchase, product_name_snapshot, price_inr_snapshot,
          products(id, name, images, price)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json({ order: data });
  } catch (err) {
    console.error('[Admin] Order detail error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/orders/:id/status — manually update order status
app.patch('/api/admin/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select().single();
    if (error) throw error;
    await logAdminAction(req.adminUser.id, 'update_order_status', 'order', id, `Status → ${status}`);
    res.json({ order: data });
  } catch (err) {
    console.error('[Admin] Update order status error:', err);
    res.status(500).json({ error: err.message });
  }
});



// ─────────────────────────────────────────────────────────────────────────────
// CHECK EMAIL EXISTS
// POST /api/auth/check-email
// Body: { email }
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/auth/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Use service role to check user_profiles
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (profile) {
      return res.json({ exists: true });
    } else {
      return res.json({ exists: false });
    }
  } catch (err) {
    console.error('[Check Email] Error:', err);
    // If multiple rows or no rows are found, .single() might throw.
    // In our case, if no rows are found, it will throw an error with code 'PGRST116'
    if (err.code === 'PGRST116') {
      return res.json({ exists: false });
    }
    res.status(500).json({ error: 'Failed to check email' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// RAZORPAY — Create Order
// POST /api/payment/create-order
// Body: { amount: number (in paise), currency?: string, userId, shippingAddressId, cartItems }
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/payment/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR' } = req.body;
    const amountInPaise = Math.round(amount * 100);

    if (!amount || amountInPaise < 100) {
      return res.status(400).json({ error: 'Amount must be at least ₹1 (100 paise)' });
    }

    // Only Create Razorpay order - Do not store in DB yet
    const rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: `temp_${Date.now()}`,
    });

    res.json({ 
      orderId: rzpOrder.id, 
      amount: rzpOrder.amount, 
      currency: rzpOrder.currency 
    });
  } catch (err) {
    console.error('[Razorpay] Create order error:', err);
    res.status(500).json({ error: 'Failed to create payment order', detail: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// RAZORPAY — Verify Payment & Fulfil Order
// POST /api/payment/verify
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, userId, guestEmail, shippingAddress, cartItems }
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/payment/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount, 
      userId, 
      guestEmail, 
      shippingAddress, 
      cartItems
    } = req.body;

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Now insert everything to DB (Payment is confirmed)
    let finalUserId = userId;

    if (!finalUserId) {
      if (!guestEmail) return res.status(400).json({ error: 'Email is required for guest checkout' });
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', guestEmail)
        .single();
        
      if (profile) {
        finalUserId = profile.id;
      } else {
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: guestEmail,
          password: crypto.randomBytes(16).toString('hex'),
          email_confirm: true,
          user_metadata: { name: shippingAddress.full_name }
        });
        if (createError) throw new Error(`Shadow user creation failed: ${createError.message}`);
        finalUserId = newUser.user.id;
      }
    }

    const { email: _excludedEmail, ...addressFields } = shippingAddress;
    const { data: addressData, error: addressError } = await supabase
      .from('addresses')
      .insert({
        user_id: finalUserId,
        ...addressFields
      })
      .select()
      .single();

    if (addressError) throw new Error(`Address creation failed: ${addressError.message}`);

    const amountInPaise = Math.round(amount * 100);

    const { data: sbOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: finalUserId,
        total_amount: amountInPaise,
        shipping_address_id: addressData.id,
        status: 'paid',
        razorpay_order_id,
        razorpay_payment_id,
      })
      .select()
      .single();

    if (orderError || !sbOrder) throw new Error(`Order creation failed: ${orderError?.message}`);

    const orderItemsData = cartItems.map(item => ({
      order_id: sbOrder.id,
      product_id: item.productId || item.id, // Handle if frontend sends .id or .productId
      quantity: item.quantity,
      price_at_purchase: Math.round(item.price * 100)
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData);
    if (itemsError) throw new Error(`Order items creation failed: ${itemsError.message}`);

    // Trigger Shiprocket order creation asynchronously
    fetch(`http://localhost:${PORT}/api/shipping/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: sbOrder.id })
    }).catch(err => console.error('[Shiprocket] Failed to trigger async creation:', err));

    res.json({ success: true, message: 'Payment verified and order confirmed' });
  } catch (err) {
    console.error('[Razorpay] Verify error:', err);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SHIPROCKET — Create Shipment
// POST /api/shipping/create
// Body: { orderId } — reads order + address from Supabase
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/shipping/create', async (req, res) => {
  try {
    const { orderId } = req.body;

    // Fetch order details from Supabase
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        addresses(*),
        order_items(quantity, price_at_purchase, products(name, weight_grams))
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Authenticate with Shiprocket
    const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }),
    });
    const authData = await authRes.json();
    if (!authData.token) throw new Error('Shiprocket auth failed');

    const srToken = authData.token;
    const addr = order.addresses;

    // Create Shiprocket order
    const srOrderRes = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${srToken}`,
      },
      body: JSON.stringify({
        order_id: orderId,
        order_date: new Date().toISOString().split('T')[0],
        pickup_location: 'Primary',
        billing_customer_name: addr.full_name,
        billing_address: addr.address_line1,
        billing_address_2: addr.address_line2 || '',
        billing_city: addr.city,
        billing_pincode: addr.pincode,
        billing_state: addr.state,
        billing_country: 'India',
        billing_email: '',
        billing_phone: addr.phone,
        shipping_is_billing: true,
        order_items: order.order_items.map((item) => ({
          name: item.products?.name || 'Jewellery Item',
          sku: item.product_id || 'SKU001',
          units: item.quantity,
          selling_price: item.price_at_purchase,
          weight: ((item.products?.weight_grams || 50) / 1000).toString(),
        })),
        payment_method: 'Prepaid',
        sub_total: order.total_amount,
        length: 10,
        breadth: 10,
        height: 5,
        weight: 0.5,
      }),
    });

    const srOrder = await srOrderRes.json();
    if (!srOrder.order_id) throw new Error(srOrder.message || 'Shiprocket order creation failed');

    // Save Shiprocket order ID back to Supabase
    await supabase
      .from('orders')
      .update({
        shiprocket_order_id: String(srOrder.order_id),
        status: 'shipped',
      })
      .eq('id', orderId);

    res.json({ success: true, shiprocketOrderId: srOrder.order_id });
  } catch (err) {
    console.error('[Shiprocket] Error:', err);
    res.status(500).json({ error: 'Shipping creation failed', detail: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SHIPROCKET — Track Shipment
// GET /api/shipping/track/:orderId
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/shipping/track/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const { data: order } = await supabase
      .from('orders')
      .select('shiprocket_order_id, awb_number')
      .eq('id', orderId)
      .single();

    if (!order?.shiprocket_order_id) {
      return res.status(404).json({ error: 'Shipment not found or not yet dispatched' });
    }

    // Re-authenticate
    const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }),
    });
    const { token } = await authRes.json();

    const trackRes = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/track/order/${order.shiprocket_order_id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const trackData = await trackRes.json();

    res.json({ tracking: trackData });
  } catch (err) {
    console.error('[Shiprocket] Track error:', err);
    res.status(500).json({ error: 'Tracking failed' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL — Send Order Confirmation via Resend
// POST /api/email/order-confirmation
// Body: { orderId, userEmail, userName }
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/email/order-confirmation', async (req, res) => {
  try {
    const { orderId, userEmail, userName } = req.body;

    // Dynamic import for Resend
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data: order } = await supabase
      .from('orders')
      .select('total_amount, created_at, order_items(quantity, price_at_purchase, products(name))')
      .eq('id', orderId)
      .single();

    const itemsList = order?.order_items
      ?.map((i) => `<li>${i.products?.name} × ${i.quantity} — ₹${(i.price_at_purchase * i.quantity).toLocaleString('en-IN')}</li>`)
      .join('') || '';

    await resend.emails.send({
      from: 'Strings & Strands <orders@stringsandstrands.com>',
      to: userEmail,
      subject: `Order Confirmed — #${orderId.slice(0, 8).toUpperCase()}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: auto; color: #B3184F;">
          <h1 style="color: #B3184F;">Thank you, ${userName}! 🎉</h1>
          <p>Your order has been confirmed and will be shipped soon.</p>
          <h3>Order Summary</h3>
          <ul>${itemsList}</ul>
          <p><strong>Total: ₹${order?.total_amount?.toLocaleString('en-IN')}</strong></p>
          <hr style="border-color: #FFD1E3;" />
          <p style="font-size: 12px; color: #888;">Strings & Strands — Timeless jewellery for every chapter.</p>
        </div>
      `,
    });

    // Also notify owner
    await resend.emails.send({
      from: 'Strings & Strands <orders@stringsandstrands.com>',
      to: process.env.OWNER_EMAIL,
      subject: `New Order #${orderId.slice(0, 8).toUpperCase()} — ₹${order?.total_amount?.toLocaleString('en-IN')}`,
      html: `<p>New order received from ${userEmail}. Order ID: ${orderId}.</p>`,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('[Resend] Email error:', err);
    res.status(500).json({ error: 'Email sending failed' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Strings & Strands API running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);
});
