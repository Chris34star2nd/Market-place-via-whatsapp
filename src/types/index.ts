export type VerificationTier = 'unverified' | 'verified' | 'silver' | 'gold';

export type ListingType = 'product' | 'service';
export type ListingStatus = 'active' | 'paused' | 'sold' | 'hidden' | 'pending';
export type ListingCondition = 'new' | 'used' | 'refurbished';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  type: string;
  sort_order: number;
}

export interface Seller {
  id: string;
  user_id: string | null;
  business_name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  whatsapp_number: string | null;
  phone: string | null;
  email: string | null;
  location: string;
  city: string;
  category_id: string | null;
  verification_tier: VerificationTier;
  is_suspended: boolean;
  is_banned: boolean;
  joined_date: string;
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: string;
  seller_id: string;
  category_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  type: ListingType;
  condition: ListingCondition;
  location: string;
  city: string;
  images: string[];
  status: ListingStatus;
  is_featured: boolean;
  views_count: number;
  whatsapp_clicks: number;
  created_at: string;
  updated_at: string;
  seller?: Seller;
  category?: Category;
}

export interface Order {
  id: string;
  listing_id: string;
  seller_id: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string | null;
  quantity: number;
  preferred_date: string | null;
  delivery_notes: string | null;
  order_type: 'platform' | 'whatsapp';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  listing?: Listing;
}

export interface Subscription {
  id: string;
  seller_id: string;
  tier: 'verified' | 'silver' | 'gold';
  amount: number;
  currency: string;
  status: 'active' | 'expired' | 'cancelled' | 'grace';
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  seller_id: string;
  subscription_id: string | null;
  paystack_reference: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'abandoned';
  channel: string | null;
  paid_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Report {
  id: string;
  listing_id: string;
  reporter_name: string | null;
  reporter_phone: string | null;
  reason: string;
  details: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  listing?: Listing;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
}

export interface Permission {
  id: string;
  name: string;
  display_name: string;
  category: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface SavedItem {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  listing?: Listing;
}

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  requester_email: string | null;
  requester_name: string | null;
  seller_id: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketReply {
  id: string;
  ticket_id: string;
  replier_email: string | null;
  message: string;
  is_staff: boolean;
  created_at: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  seller_id: string | null;
  max_uses: number | null;
  uses_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
}

export interface UserRole {
  user_id: string | null;
  role_id: string;
  email: string | null;
  assigned_by: string | null;
  created_at: string;
}
