import { Shield, Info, FileText, Lock } from 'lucide-react';
import { SITE_CONFIG } from '@/config';
import { NotFoundPage } from './NotFoundPage';

const PAGES: Record<string, { title: string; icon: typeof Shield; content: { heading: string; body: string }[] }> = {
  safety: {
    title: 'Safety Tips',
    icon: Shield,
    content: [
      {
        heading: 'Meet in Public Places',
        body: 'Always arrange to meet sellers in well-lit, public locations such as shopping malls, police stations, or busy streets. Never meet in private homes or isolated areas.',
      },
      {
        heading: 'Inspect Before You Pay',
        body: 'Thoroughly inspect any product before making payment. Check for defects, test electronics, and verify the condition matches the listing description.',
      },
      {
        heading: 'Look for Verified Sellers',
        body: 'Sellers with blue verified, silver, or gold badges have been vetted by our platform. These badges indicate a higher level of trustworthiness.',
      },
      {
        heading: 'Never Pay in Advance',
        body: 'Do not send money before receiving and inspecting the product. Be cautious of sellers who demand upfront payment or ask you to use unusual payment methods.',
      },
      {
        heading: 'Use WhatsApp for Initial Contact',
        body: 'WhatsApp provides a record of your conversation. Keep messages as evidence in case of disputes.',
      },
      {
        heading: 'Report Suspicious Listings',
        body: 'If you encounter a listing that seems fraudulent or misleading, use the "Report this listing" button to alert our moderation team.',
      },
    ],
  },
  about: {
    title: `About ${SITE_CONFIG.name}`,
    icon: Info,
    content: [
      {
        heading: 'Our Mission',
        body: `${SITE_CONFIG.name} is Kenya's trusted marketplace where businesses list products and services, and buyers browse and order with confidence. We connect sellers across Nairobi and beyond with buyers looking for quality items.`,
      },
      {
        heading: 'Verification System',
        body: 'We offer a tiered verification system to help buyers identify trustworthy sellers. From the free Unverified tier to our premium Gold tier, sellers can choose the level of visibility and trust that suits their business.',
      },
      {
        heading: 'No Account Needed for Buyers',
        body: 'Buyers can browse and order without creating an account. Order directly via WhatsApp or fill a quick form on the platform — it is that simple.',
      },
      {
        heading: 'Built for Kenya',
        body: `All prices are in Kenyan Shillings (KSh). We focus on Nairobi-area locations and categories that matter to Kenyan consumers. ${SITE_CONFIG.name} is built to be fast and lightweight, even on slow mobile data connections.`,
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    icon: FileText,
    content: [
      {
        heading: 'Acceptance of Terms',
        body: `By using ${SITE_CONFIG.name}, you agree to these terms. If you do not agree, please do not use the platform.`,
      },
      {
        heading: 'Seller Responsibilities',
        body: 'Sellers must provide accurate listings, fulfil orders, and maintain professional conduct. Sellers are responsible for the quality and legality of their products and services.',
      },
      {
        heading: 'Buyer Responsibilities',
        body: 'Buyers should exercise due diligence when purchasing. The platform facilitates connections but does not guarantee transactions.',
      },
      {
        heading: 'Prohibited Items',
        body: 'Illegal items, weapons, counterfeit goods, and any items prohibited under Kenyan law are not allowed on the platform.',
      },
      {
        heading: 'Account Suspension',
        body: 'We reserve the right to suspend or ban accounts that violate these terms or engage in fraudulent activity.',
      },
      {
        heading: 'Liability',
        body: `${SITE_CONFIG.name} is a marketplace platform. We are not responsible for the quality, safety, or legality of items listed by sellers. Transactions are between buyers and sellers.`,
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    icon: Lock,
    content: [
      {
        heading: 'Information We Collect',
        body: 'We collect your Google account email when you sign in as a seller. For orders, we collect your name, phone number, and optional email and delivery notes.',
      },
      {
        heading: 'How We Use Your Information',
        body: 'Seller information is used to display business profiles and manage listings. Buyer order information is shared with the relevant seller to fulfil orders.',
      },
      {
        heading: 'Data Security',
        body: 'We use secure authentication via Google OAuth and encrypted database storage. Payment information is processed securely through Paystack and is never stored on our servers.',
      },
      {
        heading: 'Cookies',
        body: 'We use essential cookies for authentication and session management. We do not sell your data to third parties.',
      },
      {
        heading: 'Your Rights',
        body: 'You can request deletion of your data at any time by contacting our support team.',
      },
    ],
  },
};

export function StaticPage({ page }: { page: string }) {
  const config = PAGES[page];
  if (!config) return <NotFoundPage />;

  const Icon = config.icon;

  return (
    <div className="container-app py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold">{config.title}</h1>
        </div>

        <div className="space-y-6">
          {config.content.map((section, i) => (
            <div key={i} className="card p-6">
              <h2 className="font-semibold text-lg mb-2">{section.heading}</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {section.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
