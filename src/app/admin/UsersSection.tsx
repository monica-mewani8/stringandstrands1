import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from './Toast';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

async function getAdminToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || '';
}

function UserDetailModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getAdminToken();
      const resp = await fetch(`${API}/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await resp.json();
      setData(json);
      setLoading(false);
    })();
  }, [userId]);

  const statusColor: Record<string, string> = {
    paid: 'badge-green', shipped: 'badge-blue', delivered: 'badge-purple',
    pending: 'badge-yellow', cancelled: 'badge-red',
  };

  return (
    <div className="admin-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="admin-modal" style={{ maxWidth: 680 }}>
        <button className="admin-modal-close" onClick={onClose}>✕</button>
        {loading ? (
          <div className="admin-spinner"><div className="spinner" /></div>
        ) : (
          <>
            <h2>{data?.profile?.name || data?.profile?.email}</h2>

            <div className="detail-section">
              <div className="detail-section-title">Profile</div>
              <div className="detail-row"><span className="key">Email</span>{data?.profile?.email}</div>
              <div className="detail-row"><span className="key">Phone</span>{data?.profile?.phone || '—'}</div>
              <div className="detail-row"><span className="key">Member since</span>{data?.profile?.created_at ? new Date(data.profile.created_at).toLocaleDateString('en-IN') : '—'}</div>
              <div className="detail-row"><span className="key">Admin</span>{data?.profile?.is_admin ? '✓ Yes' : 'No'}</div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Saved Addresses ({data?.addresses?.length || 0})</div>
              {data?.addresses?.length === 0 && <p style={{ color: '#aaa', fontSize: 13 }}>None saved.</p>}
              {data?.addresses?.map((a: any) => (
                <div key={a.id} style={{ fontSize: 13, marginBottom: 8, padding: '10px 12px', background: '#fff0f5', borderRadius: 8 }}>
                  {a.full_name} · {a.address_line1}{a.address_line2 ? ', ' + a.address_line2 : ''}, {a.city}, {a.state} – {a.pincode}
                </div>
              ))}
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Order History ({data?.orders?.length || 0})</div>
              {data?.orders?.length === 0 && <p style={{ color: '#aaa', fontSize: 13 }}>No orders yet.</p>}
              <table className="admin-table" style={{ fontSize: 13 }}>
                <thead>
                  <tr><th>Order ID</th><th>Date</th><th>Total</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {data?.orders?.map((o: any) => (
                    <tr key={o.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{o.id.slice(0, 8).toUpperCase()}</td>
                      <td>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                      <td>₹{(o.total_amount / 100).toLocaleString('en-IN')}</td>
                      <td><span className={`badge ${statusColor[o.status] || 'badge-gray'}`}>{o.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data?.wishlist?.length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">Wishlist ({data.wishlist.length})</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {data.wishlist.map((w: any) => (
                    <div key={w.product_id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#fff0f5', borderRadius: 8, fontSize: 12 }}>
                      {w.products?.images?.[0] && <img src={w.products.images[0]} style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }} alt="" />}
                      {w.products?.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function UsersSection() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const limit = 30;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAdminToken();
      const params = new URLSearchParams({ page: String(page), limit: String(limit), ...(search && { search }) });
      const resp = await fetch(`${API}/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      showToast(err.message || 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, showToast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ color: '#888', fontSize: 13, margin: 0 }}>{total} registered users</p>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <input
            className="admin-input"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ width: 280 }}
          />
        </div>

        {loading ? (
          <div className="admin-spinner"><div className="spinner" /></div>
        ) : users.length === 0 ? (
          <div className="admin-empty">No users found.</div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Joined</th>
                    <th>Orders</th>
                    <th>Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedUserId(u.id)}>
                      <td style={{ fontWeight: 600 }}>{u.name || '—'}</td>
                      <td style={{ color: '#555' }}>{u.email}</td>
                      <td>{u.phone || '—'}</td>
                      <td>{u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : '—'}</td>
                      <td><span className="badge badge-pink">{u.order_count}</span></td>
                      <td style={{ fontWeight: 600, color: '#b3184f' }}>
                        {u.total_spent_paise > 0 ? `₹${(u.total_spent_paise / 100).toLocaleString('en-IN')}` : '—'}
                      </td>
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

      {selectedUserId && <UserDetailModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />}
    </>
  );
}
