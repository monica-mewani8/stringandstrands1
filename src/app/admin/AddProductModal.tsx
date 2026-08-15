import React, { useState, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from './Toast';

const CATEGORIES = ['Earrings', 'Necklace', 'Ring', 'Bracelets', 'Bangles', 'Sets', 'Hair Accessories'];
const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

async function getAdminToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || '';
}

interface Props { onClose: () => void; onSaved: () => void; editProduct?: any; }

export default function AddProductModal({ onClose, onSaved, editProduct }: Props) {
  const { showToast } = useToast();
  const isEdit = !!editProduct;

  const [form, setForm] = useState({
    name: editProduct?.name || '',
    category: editProduct?.category || 'Earrings',
    price: editProduct?.price || '',
    discounted_price: editProduct?.discounted_price || '',
    description: editProduct?.description || '',
    metal: editProduct?.metal || '',
    color: editProduct?.color || '',
    occasion: editProduct?.occasion || '',
    type: editProduct?.type || '',
    stock: editProduct?.stock ?? 50,
    rating: editProduct?.rating ?? 5.0,
    is_bestseller: editProduct?.is_bestseller || false,
    is_new: editProduct?.is_new ?? true,
  });

  const [existingImages, setExistingImages] = useState<string[]>(editProduct?.images || []);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const addFiles = useCallback((files: File[]) => {
    const valid = files.filter(f => f.type.startsWith('image/'));
    setNewImageFiles(prev => [...prev, ...valid]);
    valid.forEach(f => {
      const reader = new FileReader();
      reader.onload = e => setNewImagePreviews(prev => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removeNewImage = (i: number) => {
    setNewImageFiles(prev => prev.filter((_, idx) => idx !== i));
    setNewImagePreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const removeExistingImage = (i: number) => {
    setExistingImages(prev => prev.filter((_, idx) => idx !== i));
  };

  async function uploadImages(): Promise<string[]> {
    const token = await getAdminToken();
    const urls: string[] = [];
    for (const file of newImageFiles) {
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = e => res((e.target!.result as string).split(',')[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const resp = await fetch(`${API}/api/admin/products/upload-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ base64, fileName: file.name, mimeType: file.type }),
      });
      const data = await resp.json();
      if (data.url) urls.push(data.url);
      else throw new Error(data.error || 'Upload failed');
    }
    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price) { showToast('Name and price are required', 'error'); return; }
    setSaving(true);
    try {
      const token = await getAdminToken();
      const uploadedUrls = await uploadImages();
      const images = [...existingImages, ...uploadedUrls];
      const payload = {
        ...form,
        price: Number(form.price),
        discounted_price: Number(form.discounted_price) || Number(form.price),
        stock: Number(form.stock),
        rating: Number(form.rating) || 5.0,
        images,
      };

      const url = isEdit
        ? `${API}/api/admin/products/${editProduct.id}`
        : `${API}/api/admin/products`;
      const method = isEdit ? 'PATCH' : 'POST';

      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Save failed');

      showToast(isEdit ? 'Product updated!' : 'Product created!', 'success');
      onSaved();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Error saving product', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="admin-modal" style={{ maxWidth: 680 }}>
        <button className="admin-modal-close" onClick={onClose}>✕</button>
        <h2>{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div className="admin-field full">
              <label className="admin-label">Product Name *</label>
              <input className="admin-input" name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Rose Gold Drop Earring" />
            </div>

            <div className="admin-field">
              <label className="admin-label">Category</label>
              <select className="admin-input" name="category" value={form.category} onChange={handleChange}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="admin-field">
              <label className="admin-label">Stock Quantity</label>
              <input className="admin-input" type="number" name="stock" value={form.stock} onChange={handleChange} min="0" />
            </div>

            <div className="admin-field">
              <label className="admin-label">Price (₹) *</label>
              <input className="admin-input" type="number" name="price" value={form.price} onChange={handleChange} required min="0" placeholder="699" />
            </div>

            <div className="admin-field">
              <label className="admin-label">Product Rating (0-5)</label>
              <input className="admin-input" type="number" name="rating" value={form.rating} onChange={handleChange} min="0" max="5" step="0.1" />
            </div>

            <div className="admin-field">
              <label className="admin-label">Discounted Price (₹)</label>
              <input className="admin-input" type="number" name="discounted_price" value={form.discounted_price} onChange={handleChange} min="0" placeholder="Same as price if no discount" />
            </div>

            <div className="admin-field">
              <label className="admin-label">Metal</label>
              <input className="admin-input" name="metal" value={form.metal} onChange={handleChange} placeholder="e.g. Sterling Silver" />
            </div>

            <div className="admin-field">
              <label className="admin-label">Color</label>
              <input className="admin-input" name="color" value={form.color} onChange={handleChange} placeholder="e.g. Gold" />
            </div>

            <div className="admin-field">
              <label className="admin-label">Occasion</label>
              <input className="admin-input" name="occasion" value={form.occasion} onChange={handleChange} placeholder="e.g. Wedding, Casual" />
            </div>

            <div className="admin-field">
              <label className="admin-label">Type</label>
              <input className="admin-input" name="type" value={form.type} onChange={handleChange} placeholder="e.g. Stud, Hoop" />
            </div>

            <div className="admin-field full">
              <label className="admin-label">Description</label>
              <textarea className="admin-input" name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Describe the product…" />
            </div>

            <div className="admin-field full" style={{ flexDirection: 'row', gap: 20 }}>
              <label className="admin-toggle">
                <input type="checkbox" name="is_bestseller" checked={form.is_bestseller} onChange={handleChange} />
                Mark as Bestseller
              </label>
              <label className="admin-toggle">
                <input type="checkbox" name="is_new" checked={form.is_new} onChange={handleChange} />
                Mark as New Arrival
              </label>
            </div>

            <div className="admin-field full">
              <label className="admin-label">Product Images</label>
              {existingImages.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Existing images:</p>
                  <div className="upload-previews">
                    {existingImages.map((url, i) => (
                      <div key={i} className="upload-preview">
                        <img src={url} alt="" />
                        <button className="upload-preview-del" onClick={() => removeExistingImage(i)} type="button">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div
                className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
              >
                <svg width="28" height="28" fill="none" stroke="#ffa0c0" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <p>Drag & drop images here, or click to browse</p>
              </div>
              <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: 'none' }}
                onChange={e => addFiles(Array.from(e.target.files || []))} />
              {newImagePreviews.length > 0 && (
                <div className="upload-previews" style={{ marginTop: 10 }}>
                  {newImagePreviews.map((src, i) => (
                    <div key={i} className="upload-preview">
                      <img src={src} alt="" />
                      <button className="upload-preview-del" onClick={() => removeNewImage(i)} type="button">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
              {saving ? 'Saving…' : (isEdit ? 'Save Changes' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
