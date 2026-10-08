/*
# SokoHub - Admin features: support tickets, discounts, default roles & permissions

## Overview
Adds support ticket system, discount codes, and seeds default roles with permissions for RBAC.

## New Tables
1. support_tickets - buyer/seller support requests
2. ticket_replies - replies on support tickets
3. discount_codes - promo codes admin can create for sellers

## Seeded Data
- Default roles: super_admin, moderator, support, finance
- Default permissions: manage_users, manage_listings, manage_payments, manage_roles, view_audit, respond_tickets, manage_discounts, change_tiers, ban_sellers, approve_listings
- Role-permission mappings for each default role
*/

-- SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  message text NOT NULL,
  requester_email text,
  requester_name text,
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_tickets" ON support_tickets;
CREATE POLICY "auth_read_tickets" ON support_tickets FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_create_tickets" ON support_tickets;
CREATE POLICY "anon_create_tickets" ON support_tickets FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_tickets" ON support_tickets;
CREATE POLICY "auth_update_tickets" ON support_tickets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- TICKET REPLIES
CREATE TABLE IF NOT EXISTS ticket_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  replier_email text,
  message text NOT NULL,
  is_staff boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_replies" ON ticket_replies;
CREATE POLICY "auth_read_replies" ON ticket_replies FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_replies" ON ticket_replies;
CREATE POLICY "auth_insert_replies" ON ticket_replies FOR INSERT TO anon, authenticated WITH CHECK (true);

-- DISCOUNT CODES
CREATE TABLE IF NOT EXISTS discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text,
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric(12,2) NOT NULL,
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
  max_uses integer,
  uses_count integer DEFAULT 0,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_discounts" ON discount_codes;
CREATE POLICY "auth_read_discounts" ON discount_codes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_manage_discounts" ON discount_codes;
CREATE POLICY "auth_manage_discounts" ON discount_codes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- SEED DEFAULT PERMISSIONS
INSERT INTO permissions (name, display_name, category) VALUES
('manage_users', 'Manage Users', 'users'),
('manage_listings', 'Manage Listings', 'listings'),
('approve_listings', 'Approve Listings', 'listings'),
('manage_payments', 'Manage Payments', 'payments'),
('manage_roles', 'Manage Roles', 'admin'),
('view_audit', 'View Audit Logs', 'admin'),
('respond_tickets', 'Respond to Support Tickets', 'support'),
('manage_discounts', 'Manage Discount Codes', 'marketing'),
('change_tiers', 'Change Seller Tiers', 'sellers'),
('ban_sellers', 'Ban/Unban Sellers', 'sellers'),
('send_emails', 'Send Emails to Sellers', 'communication'),
('view_revenue', 'View Revenue Dashboard', 'finance')
ON CONFLICT (name) DO NOTHING;

-- SEED DEFAULT ROLES
INSERT INTO roles (name, display_name, description, is_system) VALUES
('super_admin', 'Super Admin', 'Full access to everything. Cannot be deleted or demoted.', true),
('moderator', 'Moderator', 'Manage listings, reports, and approve content.', false),
('support', 'Support Agent', 'Respond to support tickets and help users.', false),
('finance', 'Finance', 'View payments, revenue, and manage discounts.', false)
ON CONFLICT (name) DO NOTHING;

-- SEED ROLE-PERMISSION MAPPINGS
-- Super Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- Moderator: manage_listings, approve_listings, ban_sellers, respond_tickets
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'moderator' AND p.name IN ('manage_listings', 'approve_listings', 'ban_sellers', 'respond_tickets')
ON CONFLICT DO NOTHING;

-- Support: respond_tickets, view_audit
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'support' AND p.name IN ('respond_tickets', 'view_audit')
ON CONFLICT DO NOTHING;

-- Finance: manage_payments, view_revenue, manage_discounts
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'finance' AND p.name IN ('manage_payments', 'view_revenue', 'manage_discounts')
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_discounts_code ON discount_codes(code);