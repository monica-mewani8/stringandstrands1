import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from './Toast';

const API = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001');
const STATUSES = ['', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'];

async function getAdminToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || '';
}

const statusBadge: Record<string, string> = {
  paid: 'badge-green', shipped: 'badge-blue', delivered: 'badge-purple',
  pending: 'badge-yellow', cancelled: 'badge-red',
};

function OrderDetailModal({ orderId, onClose, onStatusChanged }: { orderId: string; onClose: () => void; onStatusChanged: () => void }) {
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getAdminToken();
      const resp = await fetch(`${API}/api/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await resp.json();
      setData(json.order);
      setNewStatus(json.order?.status || '');
      setLoading(false);
    })();
  }, [orderId]);

  async function handleStatusUpdate() {
    if (!newStatus || newStatus === data?.status) return;
    setSaving(true);
    try {
      const token = await getAdminToken();
      const resp = await fetch(`${API}/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error);
      showToast('Order status updated!', 'success');
      setData((prev: any) => ({ ...prev, status: newStatus }));
      onStatusChanged();
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  const o = data;
  const addr = o?.addresses;
  const customer = o?.user_profiles;

  return (
    <div className="admin-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="admin-modal" style={{ maxWidth: 720 }}>
        <button className="admin-modal-close" onClick={onClose}>✕</button>
        {loading ? (
          <div className="admin-spinner"><div className="spinner" /></div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <h2 style={{ margin: 0 }}>Order #{o?.id?.slice(0, 8).toUpperCase()}</h2>
              <span className={`badge ${statusBadge[o?.status] || 'badge-gray'}`}>{o?.status}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div className="detail-section" style={{ marginBottom: 0 }}>
                <div className="detail-section-title">Customer</div>
                <div className="detail-row"><span className="key">Name</span>{customer?.name || '—'}</div>
                <div className="detail-row"><span className="key">Email</span>{customer?.email || '—'}</div>
                <div className="detail-row"><span className="key">Phone</span>{customer?.phone || '—'}</div>
              </div>
              <div className="detail-section" style={{ marginBottom: 0 }}>
                <div className="detail-section-title">Payment</div>
                <div className="detail-row"><span className="key">Date</span>{o?.created_at ? new Date(o.created_at).toLocaleString('en-IN') : '—'}</div>
                <div className="detail-row"><span className="key">Total</span>₹{o?.total_amount ? (o.total_amount / 100).toLocaleString('en-IN') : '—'}</div>
                <div className="detail-row"><span className="key">Razorpay ID</span>{o?.razorpay_payment_id || '—'}</div>
              </div>
            </div>

            {addr && (
              <div className="detail-section">
                <div className="detail-section-title">Shipping Address</div>
                <div style={{ fontSize: 13, padding: '10px 12px', background: '#fff0f5', borderRadius: 8, lineHeight: 1.6 }}>
                  {addr.full_name} · {addr.phone}<br />
                  {addr.address_line1}{addr.address_line2 ? ', ' + addr.address_line2 : ''}<br />
                  {addr.city}, {addr.state} – {addr.pincode}
                </div>
              </div>
            )}

            {o?.shiprocket_order_id && (
              <div className="detail-section">
                <div className="detail-section-title">Shipping</div>
                <div className="detail-row"><span className="key">Shiprocket ID</span>{o.shiprocket_order_id}</div>
                <div className="detail-row"><span className="key">AWB</span>{o.awb_number || '—'}</div>
                <div className="detail-row"><span className="key">Tracking Status</span>{o.tracking_status || '—'}</div>
              </div>
            )}

            <div className="detail-section">
              <div className="detail-section-title">Items Ordered</div>
              <table className="admin-table">
                <thead>
                  <tr><th>Product</th><th>Qty</th><th>Price at Purchase</th></tr>
                </thead>
                <tbody>
                  {o?.order_items?.map((item: any) => {
                    const name = item.products?.name || item.product_name_snapshot || 'Deleted Product';
                    const priceInr = item.price_inr_snapshot ?? (item.price_at_purchase / 100);
                    const img = item.products?.images?.[0];
                    return (
                      <tr key={item.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {img && <img src={img} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />}
                            <span style={{ fontWeight: 500, fontSize: 13 }}>{name}</span>
                            {!item.products && <span className="badge badge-gray" style={{ fontSize: 10 }}>Removed</span>}
                          </div>
                        </td>
                        <td>{item.quantity}</td>
                        <td>₹{(priceInr * item.quantity).toLocaleString('en-IN')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Manual Status Override</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <select className="admin-input" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  {['pending', 'paid', 'shipped', 'delivered', 'cancelled'].map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
                <button
                  className="admin-btn admin-btn-primary"
                  onClick={handleStatusUpdate}
                  disabled={saving || newStatus === o?.status}
                >
                  {saving ? 'Saving…' : 'Update Status'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function OrdersSection() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const limit = 30;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAdminToken();
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (status) params.set('status', status);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const resp = await fetch(`${API}/api/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      showToast(err.message || 'Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, status, dateFrom, dateTo, showToast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ color: '#888', fontSize: 13, margin: 0 }}>{total} orders total</p>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-filters">
            <select className="admin-input" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All Statuses</option>
              {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <input type="date" className="admin-input" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} title="From date" />
            <input type="date" className="admin-input" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} title="To date" />
            {(status || dateFrom || dateTo) && (
              <button className="admin-btn admin-btn-ghost" onClick={() => { setStatus(''); setDateFrom(''); setDateTo(''); setPage(1); }}>
                Clear
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="admin-spinner"><div className="spinner" /></div>
        ) : orders.length === 0 ? (
          <div className="admin-empty">No orders found.</div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Shipping</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedOrderId(o.id)}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{o.id.slice(0, 8).toUpperCase()}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{o.customer_name}</div>
                        <div style={{ fontSize: 11, color: '#aaa' }}>{o.customer_email}</div>
                      </td>
                      <td>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                      <td><span className="badge badge-gray">{o.item_count} item{o.item_count !== 1 ? 's' : ''}</span></td>
                      <td style={{ fontWeight: 700, color: '#b3184f' }}>₹{(o.total_amount / 100).toLocaleString('en-IN')}</td>
                      <td><span className={`badge ${statusBadge[o.status] || 'badge-gray'}`}>{o.status}</span></td>
                      <td>{o.tracking_status ? <span className="badge badge-blue">{o.tracking_status}</span> : <span style={{ color: '#ccc', fontSize: 12 }}>—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="admin-pagination">
                <button className="admin-btn admin-btn-ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span>Page {page} of {totalPages}</span>
                <button className="admin-btn admin-btn-ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onStatusChanged={fetchOrders}
        />
      )}
    </>
  );
}
