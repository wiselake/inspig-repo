'use client';

import { useEffect, useState } from 'react';

// 서비스 오픈일: 2026-02-01
const SERVICE_OPEN_DATE = new Date('2026-02-01');

export default function MonthlyNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(new Date() >= SERVICE_OPEN_DATE);
  }, []);

  // 서비스 오픈 전에는 헤더 숨김
  if (!isOpen) {
    return null;
  }

  return (
    <div className="mb-6">
      {/* 헤더 */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-blue-600">
          🐷 피그플랜 월간 보고서
        </h1>
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
          <span className="font-semibold">행복농장</span>
          <span>📅 2024년 11월</span>
        </div>
      </div>

      {/* TODO: 월간 보고서 탭 추가 예정 */}
    </div>
  );
}
