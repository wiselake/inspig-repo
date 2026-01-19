"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/common/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/common/ScrollToTop';

export default function ReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 상세 페이지 여부 확인 (/weekly/xxx, /monthly/xxx 등)
  const isDetailPage = /^\/(weekly|monthly|quarterly)\/[^/]+$/.test(pathname);

  // 상세 페이지는 자체 레이아웃 사용 (Header/Footer/Sidebar 없음)
  if (isDetailPage) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {children}
      </div>
    );
  }

  // 리스트 페이지는 기존 레이아웃 사용
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header onMenuToggle={() => setIsSidebarOpen(true)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="pb-20">
        {children}
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
}
