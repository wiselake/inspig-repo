"use client";

import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

// Hard navigation 함수 - Next.js 클라이언트 라우터 우회
// 이중화 서버 환경에서 RSC 상태 불일치 문제 방지
const navigateTo = (path: string) => {
  window.location.href = path;
};

// 동적 렌더링 강제 - RSC 캐시 불일치 방지
export const dynamic = 'force-dynamic';

// 서비스 오픈일: 2026-02-01
const SERVICE_OPEN_DATE = new Date('2026-02-01');

export default function MonthlyListPage() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(new Date() >= SERVICE_OPEN_DATE);
  }, []);

  const formatOpenDate = () => {
    const year = SERVICE_OPEN_DATE.getFullYear();
    const month = String(SERVICE_OPEN_DATE.getMonth() + 1).padStart(2, '0');
    const day = String(SERVICE_OPEN_DATE.getDate()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일`;
  };

  if (!isOpen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <FontAwesomeIcon icon={faLock} className="text-2xl text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            서비스 준비 중입니다
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            월간 보고서 서비스는 현재 준비 중입니다.
          </p>
          <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
            <FontAwesomeIcon icon={faCalendarAlt} />
            <span>오픈 예정일: {formatOpenDate()}</span>
          </div>
          <button
            onClick={() => navigateTo('/weekly')}
            className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            주간 보고서로 이동
          </button>
        </div>
      </div>
    );
  }

  // 오픈 후 실제 컨텐츠 (추후 구현)
  return (
    <div className="p-2 sm:p-3 lg:p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">월간 보고서 목록</h2>
      </div>
      <p className="text-gray-500">월간 보고서 기능이 곧 제공됩니다.</p>
    </div>
  );
}
