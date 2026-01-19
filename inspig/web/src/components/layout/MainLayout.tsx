'use client';

import { useState } from 'react';
import Header from '@/components/common/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/common/ScrollToTop';

interface MainLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export default function MainLayout({ children, showFooter = false }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header onMenuToggle={() => setIsSidebarOpen(true)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="min-h-[calc(100vh-60px)]">
        {children}
      </main>

      {showFooter && <Footer />}
      <ScrollToTop />
    </div>
  );
}
