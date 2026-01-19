'use client';

import { useEffect } from 'react';
import { Icon } from '@/components/common';
import { MainLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';

// Hard navigation 함수 - Next.js 클라이언트 라우터 우회
// 이중화 서버 환경에서 RSC 상태 불일치 문제 방지
const navigateTo = (path: string) => {
  window.location.href = path;
};

// 동적 렌더링 강제 - RSC 캐시 불일치 방지
export const dynamic = 'force-dynamic';

const menuItems = [
  {
    name: '주간 보고서',
    href: '/weekly',
    icon: 'clipboard-list',
    description: '주간 실적 분석',
    color: 'bg-blue-500',
  },
  {
    name: '월간 보고서',
    href: '/monthly',
    icon: 'calendar-alt',
    description: '월간 종합 분석',
    color: 'bg-green-500',
  },
  {
    name: '분기 보고서',
    href: '/quarterly',
    icon: 'chart-bar',
    description: '분기별 심층 분석',
    color: 'bg-purple-500',
  },
];

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigateTo('/login');
    }
  }, [isAuthenticated, isLoading]);

  // 로딩 중이거나 미인증 상태면 빈 화면 (리다이렉트 전)
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <MainLayout showFooter={false}>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-60px)] p-6">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            <span className="text-3xl mr-2">🐷</span>
            인사이트 피그플랜
          </h1>
          <p className="text-gray-500">서비스를 선택하세요</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
          {menuItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                navigateTo(item.href);
              }}
              className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-[var(--primary)] transition-all group"
            >
              <div className={item.color + ' w-20 h-20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform'}>
                <Icon name={item.icon} className="text-white text-3xl" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">{item.name}</h2>
              <p className="text-sm text-gray-500">{item.description}</p>
            </a>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
