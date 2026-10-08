# SokoHub — Kenya's Marketplace

A production-ready marketplace for the Kenyan market, similar to Jiji. Businesses list products and services; buyers browse and order without an account. Sellers pay monthly for verification tiers via Paystack.

**Built by Asstensha Limited**  
**Lead developer: chris34star**

---

## Stack Choices

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Vite + React + TypeScript | Fast dev experience, lightweight bundle for slow mobile data |
| Styling | Tailwind CSS | Utility-first, small output, easy dark mode |
| Icons | Lucide React | Tree-shakeable, consistent icon set |
| Routing | React Router | Standard SPA routing |
| Database | PostgreSQL (Supabase) | Managed Postgres with RLS, auth, and edge functions |
| Auth | Supabase + Google OAuth | Secure server-side token verification |
| Payments | Paystack (server-side) | Card + M-Pesa support for Kenya |
| Images | Cloudinary (or S3) | Upload, compression, WebP/AVIF conversion |
| Hosting | Vercel (frontend) / Render (API) | Easy deployment |

### Design

- Flat solid colors, no gradients, no heavy shadows
- Off-white background, white cards, strong green accent
- Light and dark mode
- Mobile-first, large touch-friendly buttons
- Skeleton loaders, subtle transitions, accessible

---

## Features

### Buyer (no account needed)
- Browse products and services with search, filters, sorting
- Category tabs, price range, location, verified-only filter
- Listing detail page with image gallery, lightbox, zoom
- Order via WhatsApp (pre-filled message) or on-platform form
- Public seller profiles with listings and verification badge
- Report suspicious listings
- Saved items (requires sign-in)
- Safety tips for unverified sellers

### Seller (Google sign-in required)
- Business profile with logo, description, WhatsApp number, location
- Dashboard: manage listings (add, edit, delete, pause, mark sold)
- Upload up to 6 images per product
- Orders inbox with confirm/cancel actions
- Analytics: views, WhatsApp clicks, order count
- Subscription page with plan comparison

### Verification Tiers
| Tier | Price | Product Limit | Perks |
|------|-------|--------------|-------|
| Unverified | Free | 5 | Basic listing |
| Verified | KSh 350/mo | 50 | Blue tick, higher ranking |
| Silver | KSh 1,000/mo | 200 | Silver badge, card highlight |
| Gold | KSh 2,500/mo | Unlimited | Gold badge, top placement, featured slot |

### Admin / Super Admin
- Manage sellers (ban/unban, change tier)
- Manage listings (delete, moderate)
- Reports moderation queue
- Revenue dashboard with tier breakdown
- Payments log
- Audit log of all admin actions
- Roles & permissions manager (Super Admin only)

---

## Project Structure

```
project/
├── src/
│   ├── components/        # Reusable UI components
│   ├── lib/               # Supabase client, auth, theme, utils
│   ├── pages/             # Route-level pages
│   ├── types/             # TypeScript types
│   ├── config.ts          # Site config (name, currency, tiers, cities)
│   ├── App.tsx            # Router + providers
│   ├── main.tsx           # Entry point
│   └── index.css          # Tailwind + custom styles
├── supabase/
│   └── migrations/        # SQL migrations
├── index.html             # SEO meta tags
├── tailwind.config.js     # Theme (colors, fonts, animations)
└── package.json
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- A Supabase project (or use the provisioned one)

### 1. Install dependencies
```bash
npm install
```

### 2. Environment variables
Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

Required variables:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key
- `VITE_SUPER_ADMIN_EMAIL` — Google email for Super Admin access

### 3. Run the dev server
```bash
npm run dev
```

### 4. Build for production
```bash
npm run build
```

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select existing)
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Set application type to **Web application**
6. Add your Supabase callback URL: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
7. Copy the Client ID and Client Secret
8. In Supabase Dashboard → **Authentication** → **Providers** → **Google**:
   - Enable Google
   - Paste Client ID and Secret
   - Save

---

## Paystack Setup

1. Create a [Paystack](https://paystack.com/) account
2. Get your **Secret Key** and **Public Key** from Settings → API Keys & Webhooks
3. Set up a webhook URL: `https://<your-api-domain>/api/payments/webhook`
4. In Paystack dashboard, add the webhook URL and copy the **Webhook Secret**
5. Store keys in server environment variables (never in the frontend):
   - `PAYSTACK_SECRET_KEY`
   - `PAYSTACK_PUBLIC_KEY`
   - `PAYSTACK_WEBHOOK_SECRET`

### Testing Paystack
- Use Paystack test keys for development
- Test card: `4084 0840 8408 4081`, any expiry, any CVV
- Test M-Pesa: Paystack provides test M-Pesa numbers in their docs

---

## Cloudinary Setup

1. Create a [Cloudinary](https://cloudinary.com/) account
2. Get your **Cloud Name**, **API Key**, and **API Secret** from the dashboard
3. Store in server environment variables:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
4. Uploads are handled server-side with multer → Cloudinary
5. Images are compressed, resized, and converted to WebP/AVIF

---

## Deployment

### Frontend (Vercel)
1. Push to GitHub
2. Import the repo in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy — Vercel auto-detects Vite

### API / Edge Functions (Render or Railway)
1. Deploy the Express API (or Supabase Edge Functions) 
2. Set all server-side environment variables
3. Configure the Paystack webhook URL to point to your deployed API

---

## What Works Now vs. What Needs API Keys

### Works Now (with seed data)
- Browse listings with real product photos
- Search, filter, sort by category, price, location
- Listing detail page with image gallery and lightbox
- Order via WhatsApp (pre-filled message)
- Order on platform (form submission to database)
- Seller profile pages
- Seller dashboard (add, edit, delete, pause listings)
- Orders inbox and management
- Admin panel (sellers, listings, reports, audit log)
- Dark/light mode toggle
- Fully responsive design
- SEO meta tags

### Needs API Keys to Go Live
- **Google OAuth**: Requires Google Client ID/Secret in Supabase Auth settings
- **Paystack payments**: Requires Paystack secret key for subscription upgrades
- **Cloudinary uploads**: Requires Cloudinary credentials for real image uploads
- **Email notifications**: Requires an email service (e.g., Resend, SendGrid) for order alerts to sellers
- **Custom domain**: For production CORS and Paystack webhook

---

## License

© 2026 Asstensha Limited. All rights reserved.
