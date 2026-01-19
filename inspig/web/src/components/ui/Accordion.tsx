'use client';

import { ReactNode } from 'react';
import { Icon } from '@/components/common';

interface AccordionProps {
  title: string;
  icon?: string;
  children: ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
  headerRight?: ReactNode;
  badge?: string | number;
}

export default function Accordion({
  title,
  icon,
  children,
  expanded = true,
  onToggle,
  headerRight,
  badge,
}: AccordionProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {/* 아이콘 */}
          {icon && (
            <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center">
              <Icon name={icon} className="text-sm" />
            </div>
          )}
          {/* 타이틀 */}
          <span className="font-semibold text-gray-800">{title}</span>
          {/* 배지 */}
          {badge && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-700">
              {badge}
            </span>
          )}
        </div>

        {/* 오른쪽 영역 (요약 배지들 + 토글) */}
        <div className="flex items-center gap-3">
          {/* 요약 정보 */}
          {headerRight && (
            <div className="hidden sm:flex" onClick={(e) => e.stopPropagation()}>
              {headerRight}
            </div>
          )}
          {/* 토글 아이콘 */}
          <Icon
            name={expanded ? 'chevron-up' : 'chevron-down'}
            className={`text-gray-400 transition-transform duration-200`}
          />
        </div>
      </div>

      {/* 바디 */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          expanded
            ? 'max-h-[5000px] opacity-100'
            : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
          {children}
        </div>
      </div>
    </div>
  );
}
