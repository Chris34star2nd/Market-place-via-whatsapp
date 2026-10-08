import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/lib/theme';
import { AuthProvider } from '@/lib/auth';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { HomePage } from '@/pages/HomePage';
import { SearchPage } from '@/pages/SearchPage';
import { ListingDetailPage } from '@/pages/ListingDetailPage';
import { SellerProfilePage } from '@/pages/SellerProfilePage';
import { SellPage } from '@/pages/SellPage';
import { LoginPage } from '@/pages/LoginPage';
import { SellerDashboardPage } from '@/pages/SellerDashboardPage';
import { AdminPage } from '@/pages/AdminPage';
import { StaticPage } from '@/pages/StaticPage';
import { SavedItemsPage } from '@/pages/SavedItemsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/listing/:slug" element={<ListingDetailPage />} />
                <Route path="/seller/:slug" element={<SellerProfilePage />} />
                <Route path="/sell" element={<SellPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<SellerDashboardPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/saved" element={<SavedItemsPage />} />
                <Route path="/safety" element={<StaticPage page="safety" />} />
                <Route path="/about" element={<StaticPage page="about" />} />
                <Route path="/terms" element={<StaticPage page="terms" />} />
                <Route path="/privacy" element={<StaticPage page="privacy" />} />
                <Route path="/pricing" element={<SellPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
