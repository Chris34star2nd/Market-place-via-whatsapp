import { Link } from 'react-router-dom';
import { Store, Github, Mail } from 'lucide-react';
import { SITE_CONFIG } from '@/config';

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 mt-12">
      <div className="container-app py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">{SITE_CONFIG.name}</span>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Kenya's marketplace for products and services. Buy and sell with confidence.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Marketplace</h4>
            <ul className="space-y-2 text-sm text-neutral-500 dark:text-neutral-400">
              <li><Link to="/search" className="hover:text-primary-600 dark:hover:text-primary-400">Browse All</Link></li>
              <li><Link to="/search?type=product" className="hover:text-primary-600 dark:hover:text-primary-400">Products</Link></li>
              <li><Link to="/search?type=service" className="hover:text-primary-600 dark:hover:text-primary-400">Services</Link></li>
              <li><Link to="/sell" className="hover:text-primary-600 dark:hover:text-primary-400">Start Selling</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Support</h4>
            <ul className="space-y-2 text-sm text-neutral-500 dark:text-neutral-400">
              <li><Link to="/safety" className="hover:text-primary-600 dark:hover:text-primary-400">Safety Tips</Link></li>
              <li><Link to="/pricing" className="hover:text-primary-600 dark:hover:text-primary-400">Verification Plans</Link></li>
              <li><a href={`mailto:${SITE_CONFIG.supportEmail}`} className="hover:text-primary-600 dark:hover:text-primary-400">Contact Us</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">About</h4>
            <ul className="space-y-2 text-sm text-neutral-500 dark:text-neutral-400">
              <li><Link to="/about" className="hover:text-primary-600 dark:hover:text-primary-400">About {SITE_CONFIG.name}</Link></li>
              <li><Link to="/terms" className="hover:text-primary-600 dark:hover:text-primary-400">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-primary-600 dark:hover:text-primary-400">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            &copy; {new Date().getFullYear()} {SITE_CONFIG.name}. Built by{' '}
            <span className="font-medium text-neutral-700 dark:text-neutral-300">{SITE_CONFIG.developer}</span>
            {' · '}Lead developer: <span className="font-medium text-neutral-700 dark:text-neutral-300">{SITE_CONFIG.leadDeveloper}</span>
          </p>
          <div className="flex items-center gap-3 text-neutral-400">
            <a href={`mailto:${SITE_CONFIG.supportEmail}`} className="hover:text-primary-600 dark:hover:text-primary-400">
              <Mail className="w-5 h-5" />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 dark:hover:text-primary-400">
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
