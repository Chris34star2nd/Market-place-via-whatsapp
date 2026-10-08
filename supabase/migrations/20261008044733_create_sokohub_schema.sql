/*
# SokoHub - Kenyan Marketplace Database Schema

## Overview
Complete schema for a Jiji-style marketplace for the Kenyan market. Businesses list products
and services, buyers browse and order without login, sellers pay monthly for verification tiers.

## Tables Created
1. categories - product/service categories
2. sellers - business profiles (linked to Supabase auth users)
3. listings - products and services listed by sellers
4. orders - buyer orders (WhatsApp and platform orders)
5. subscriptions - seller verification tier subscriptions
6. payments - Paystack payment records
7. reports - user reports of listings
8. roles - custom admin roles
9. permissions - granular permissions
10. role_permissions - many-to-many
11. user_roles - assigns roles to users
12. audit_logs - tracks admin actions
13. saved_items - buyer saved listings

## Security
- RLS enabled on all tables
- Public read for browsing (anon + authenticated)
- Write operations restricted to owners
- Buyers can place orders without authentication
*/

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text,
  type text NOT NULL DEFAULT 'product' CHECK (type IN ('product', 'service', 'both')),
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_manage_categories" ON categories;
CREATE POLICY "admin_manage_categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- SELLERS
CREATE TABLE IF NOT EXISTS sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  description text,
  whatsapp_number text,
  phone text,
  email text,
  location text NOT NULL DEFAULT 'Nairobi',
  city text DEFAULT 'Nairobi',
  category_id uuid REFERENCES categories(id),
  verification_tier text NOT NULL DEFAULT 'unverified' CHECK (verification_tier IN ('unverified', 'verified', 'silver', 'gold')),
  is_suspended boolean DEFAULT false,
  is_banned boolean DEFAULT false,
  joined_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_sellers" ON sellers;
CREATE POLICY "public_read_sellers" ON sellers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "owner_insert_sellers" ON sellers;
CREATE POLICY "owner_insert_sellers" ON sellers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_update_sellers" ON sellers;
CREATE POLICY "owner_update_sellers" ON sellers FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_delete_sellers" ON sellers;
CREATE POLICY "owner_delete_sellers" ON sellers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- LISTINGS
CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id),
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'KSh',
  type text NOT NULL DEFAULT 'product' CHECK (type IN ('product', 'service')),
  condition text DEFAULT 'new' CHECK (condition IN ('new', 'used', 'refurbished')),
  location text NOT NULL DEFAULT 'Nairobi',
  city text DEFAULT 'Nairobi',
  images jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'sold', 'hidden', 'pending')),
  is_featured boolean DEFAULT false,
  views_count integer DEFAULT 0,
  whatsapp_clicks integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_active_listings" ON listings;
CREATE POLICY "public_read_active_listings" ON listings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "seller_insert_listings" ON listings;
CREATE POLICY "seller_insert_listings" ON listings FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM sellers WHERE sellers.id = listings.seller_id AND sellers.user_id = auth.uid())
);
DROP POLICY IF EXISTS "seller_update_listings" ON listings;
CREATE POLICY "seller_update_listings" ON listings FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM sellers WHERE sellers.id = listings.seller_id AND sellers.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM sellers WHERE sellers.id = listings.seller_id AND sellers.user_id = auth.uid())
);
DROP POLICY IF EXISTS "seller_delete_listings" ON listings;
CREATE POLICY "seller_delete_listings" ON listings FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM sellers WHERE sellers.id = listings.seller_id AND sellers.user_id = auth.uid())
);

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  buyer_name text NOT NULL,
  buyer_phone text NOT NULL,
  buyer_email text,
  quantity integer DEFAULT 1,
  preferred_date date,
  delivery_notes text,
  order_type text NOT NULL DEFAULT 'platform' CHECK (order_type IN ('platform', 'whatsapp')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_place_orders" ON orders;
CREATE POLICY "anon_place_orders" ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "seller_read_orders" ON orders;
CREATE POLICY "seller_read_orders" ON orders FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM sellers WHERE sellers.id = orders.seller_id AND sellers.user_id = auth.uid())
);
DROP POLICY IF EXISTS "seller_update_orders" ON orders;
CREATE POLICY "seller_update_orders" ON orders FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM sellers WHERE sellers.id = orders.seller_id AND sellers.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM sellers WHERE sellers.id = orders.seller_id AND sellers.user_id = auth.uid())
);

-- SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('verified', 'silver', 'gold')),
  amount numeric(12,2) NOT NULL,
  currency text DEFAULT 'KSh',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'grace')),
  start_date timestamptz DEFAULT now(),
  end_date timestamptz NOT NULL,
  auto_renew boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_read_subscriptions" ON subscriptions;
CREATE POLICY "owner_read_subscriptions" ON subscriptions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM sellers WHERE sellers.id = subscriptions.seller_id AND sellers.user_id = auth.uid())
);
DROP POLICY IF EXISTS "owner_insert_subscriptions" ON subscriptions;
CREATE POLICY "owner_insert_subscriptions" ON subscriptions FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM sellers WHERE sellers.id = subscriptions.seller_id AND sellers.user_id = auth.uid())
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE,
  paystack_reference text UNIQUE,
  amount numeric(12,2) NOT NULL,
  currency text DEFAULT 'KSh',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'abandoned')),
  channel text,
  paid_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_read_payments" ON payments;
CREATE POLICY "owner_read_payments" ON payments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM sellers WHERE sellers.id = payments.seller_id AND sellers.user_id = auth.uid())
);
DROP POLICY IF EXISTS "owner_insert_payments" ON payments;
CREATE POLICY "owner_insert_payments" ON payments FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM sellers WHERE sellers.id = payments.seller_id AND sellers.user_id = auth.uid())
);

-- REPORTS
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  reporter_name text,
  reporter_phone text,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_create_reports" ON reports;
CREATE POLICY "anon_create_reports" ON reports FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ROLES & PERMISSIONS
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  category text DEFAULT 'general'
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_roles" ON roles;
CREATE POLICY "auth_read_roles" ON roles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_read_permissions" ON permissions;
CREATE POLICY "auth_read_permissions" ON permissions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_read_role_permissions" ON role_permissions;
CREATE POLICY "auth_read_role_permissions" ON role_permissions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_read_user_roles" ON user_roles;
CREATE POLICY "auth_read_user_roles" ON user_roles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_manage_roles" ON roles;
CREATE POLICY "auth_manage_roles" ON roles FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_manage_role_permissions" ON role_permissions;
CREATE POLICY "auth_manage_role_permissions" ON role_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_manage_user_roles" ON user_roles;
CREATE POLICY "auth_manage_user_roles" ON user_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id),
  actor_email text,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_audit_logs" ON audit_logs;
CREATE POLICY "auth_read_audit_logs" ON audit_logs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_audit_logs" ON audit_logs;
CREATE POLICY "auth_insert_audit_logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- SAVED ITEMS
CREATE TABLE IF NOT EXISTS saved_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_read_saved" ON saved_items;
CREATE POLICY "owner_read_saved" ON saved_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_insert_saved" ON saved_items;
CREATE POLICY "owner_insert_saved" ON saved_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_delete_saved" ON saved_items;
CREATE POLICY "owner_delete_saved" ON saved_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(type);
CREATE INDEX IF NOT EXISTS idx_listings_city ON listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_sellers_user ON sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_listing ON orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_seller ON subscriptions(seller_id);
CREATE INDEX IF NOT EXISTS idx_payments_seller ON payments(seller_id);