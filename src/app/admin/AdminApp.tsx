import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router';
import AdminAuthGuard from './AdminAuthGuard';
import ProductsSection from './ProductsSection';
import UsersSection from './UsersSection';
import OrdersSection from './OrdersSection';
import { ToastProvider } from './Toast';
import { supabase } from '../../lib/supabase';
import './admin.css';

function AdminShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const active = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    navigate('/');
  }

  const nav = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const pageTitle = () => {
    if (active('/admin/users')) return 'Users';
    if (active('/admin/orders')) return 'Orders';
    return 'Products';
  };

  return (
    <div className="admin-root">
      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-logo flex items-center justify-between">
          <div>
            <h2>Strings & Strands</h2>
            <span>Admin Panel</span>
          </div>
          <button className="admin-sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav className="admin-nav">
          <button
            className={`admin-nav-item ${active('/admin/products') || location.pathname === '/admin' ? 'active' : ''}`}
            onClick={() => nav('/admin/products')}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="3" width="7" height="7"/><rect x="15" y="3" width="7" height="7"/><rect x="15" y="14" width="7" height="7"/><rect x="2" y="14" width="7" height="7"/></svg>
            Products
          </button>
          <button
            className={`admin-nav-item ${active('/admin/users') ? 'active' : ''}`}
            onClick={() => nav('/admin/users')}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Users
          </button>
          <button
            className={`admin-nav-item ${active('/admin/orders') ? 'active' : ''}`}
            onClick={() => nav('/admin/orders')}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            Orders
          </button>
        </nav>
        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-back-link">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            Back to site
          </Link>
          <button className="admin-logout-btn" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? 'Signing out…' : '⎋ Sign out'}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <main className="admin-main">
        <div className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="admin-menu-btn" onClick={() => setSidebarOpen(true)}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <h1>{pageTitle()}</h1>
          </div>
        </div>
        <div className="admin-content">
          <Routes>
            <Route index element={<ProductsSection />} />
            <Route path="products" element={<ProductsSection />} />
            <Route path="users" element={<UsersSection />} />
            <Route path="orders" element={<OrdersSection />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function AdminApp() {
  return (
    <AdminAuthGuard>
      <ToastProvider>
        <AdminShell />
      </ToastProvider>
    </AdminAuthGuard>
  );
}
