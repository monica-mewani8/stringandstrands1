-- ============================================================
-- Strings & Strands — Admin Panel Migration
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Add is_admin flag to user_profiles
alter table public.user_profiles
  add column if not exists is_admin boolean not null default false;

-- 2. Preserve order history: drop the strict FK on order_items.product_id
--    and re-add it with ON DELETE SET NULL, plus add snapshot columns
alter table public.order_items
  drop constraint if exists order_items_product_id_fkey;

alter table public.order_items
  add column if not exists product_name_snapshot text,
  add column if not exists price_inr_snapshot integer;

alter table public.order_items
  add constraint order_items_product_id_fkey
  foreign key (product_id)
  references public.products(id)
  on delete set null;

-- 3. Admin activity log
create table if not exists public.admin_activity_log (
  id           uuid primary key default uuid_generate_v4(),
  admin_id     uuid not null references auth.users(id),
  action       text not null,
  target_type  text not null,
  target_id    text,
  notes        text,
  created_at   timestamptz not null default now()
);

alter table public.admin_activity_log enable row level security;
create policy "admin_log_admin_only" on public.admin_activity_log
  for all using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- 4. Helper function for admin check
create or replace function public.is_admin_user()
returns boolean language sql security definer as $$
  select coalesce(
    (select is_admin from public.user_profiles where id = auth.uid()),
    false
  );
$$;

-- Allow admins to read all orders
create policy "orders_read_admin" on public.orders
  for select using (public.is_admin_user());

-- Allow admins to update order status
create policy "orders_update_admin" on public.orders
  for update using (public.is_admin_user());

-- Allow admins to read ALL user profiles
create policy "profiles_read_admin" on public.user_profiles
  for select using (public.is_admin_user());

-- Allow admins to read ALL addresses
create policy "addresses_read_admin" on public.addresses
  for select using (public.is_admin_user());

-- Allow admins to read ALL order items
create policy "order_items_read_admin" on public.order_items
  for select using (public.is_admin_user());

-- Allow admins to read ALL cart items
create policy "cart_read_admin" on public.cart_items
  for select using (public.is_admin_user());

-- Allow admins to read ALL wishlist items
create policy "wishlist_read_admin" on public.wishlist_items
  for select using (public.is_admin_user());

-- Allow admins to write products
create policy "products_write_admin" on public.products
  for all using (public.is_admin_user());

-- 5. Product images storage bucket
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_read" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "product_images_admin_write" on storage.objects
  for insert with check (
    bucket_id = 'product-images' and public.is_admin_user()
  );

create policy "product_images_admin_delete" on storage.objects
  for delete using (
    bucket_id = 'product-images' and public.is_admin_user()
  );

-- ============================================================
-- After running this migration:
-- 1. Go to Supabase Table Editor > user_profiles
-- 2. Find YOUR row and set is_admin = true
-- 3. Restart your backend server
-- ============================================================


-- Add soft delete to addresses
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add rating to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rating numeric(2,1) DEFAULT 5.0;
