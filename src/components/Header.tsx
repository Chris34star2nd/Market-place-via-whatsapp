import { Link, useNavigate } from 'react-router-dom';
import { Search, Sun, Moon, Menu, X, Store, LayoutDashboard, Shield, Bookmark } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/lib/theme';
import { SITE_CONFIG } from '@/config';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
      <div className="container-app">
        <div className="flex items-center gap-4 h-16">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-neutral-900 dark:text-white hidden sm:block">
              {SITE_CONFIG.name}
            </span>
          </Link>

          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products and services..."
                className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </form>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={toggleTheme}
              className="btn-ghost p-2"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {user ? (
              <div className="hidden md:flex items-center gap-2">
                {profile?.is_seller && (
                  <Link to="/dashboard" className="btn-secondary">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                )}
                {(profile?.is_admin || profile?.is_seller) && null}
                {profile?.is_admin && (
                  <Link to="/admin" className="btn-secondary">
                    <Shield className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                <button onClick={handleSignOut} className="btn-outline">
                  Sign Out
                </button>
              </div>
            ) : (
              <Link to="/sell" className="btn-primary hidden md:flex">
                <Store className="w-4 h-4" />
                Start Selling
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn-ghost p-2 md:hidden"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-200 dark:border-neutral-800 space-y-3 animate-slide-up">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products and services..."
                  className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </form>
            <div className="flex flex-col gap-2">
              <Link to="/search" className="btn-outline w-full" onClick={() => setMobileMenuOpen(false)}>
                Browse All
              </Link>
              <Link to="/saved" className="btn-outline w-full" onClick={() => setMobileMenuOpen(false)}>
                <Bookmark className="w-4 h-4" />
                Saved Items
              </Link>
              {user ? (
                <>
                  {profile?.is_seller && (
                    <Link to="/dashboard" className="btn-secondary w-full" onClick={() => setMobileMenuOpen(false)}>
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                  )}
                  {profile?.is_admin && (
                    <Link to="/admin" className="btn-secondary w-full" onClick={() => setMobileMenuOpen(false)}>
                      <Shield className="w-4 h-4" />
                      Admin Panel
                    </Link>
                  )}
                  <button onClick={handleSignOut} className="btn-outline w-full">
                    Sign Out
                  </button>
                </>
              ) : (
                <Link to="/sell" className="btn-primary w-full" onClick={() => setMobileMenuOpen(false)}>
                  <Store className="w-4 h-4" />
                  Start Selling
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
