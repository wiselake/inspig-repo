"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartPie, faCalendarAlt, faChartBar, faInfoCircle, faSignOutAlt, faTimes, faLock } from '@fortawesome/free-solid-svg-icons';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';

// Hard navigation 함수 - Next.js 클라이언트 라우터 우회
// 이중화 서버 환경에서 RSC 상태 불일치 문제 방지
const navigateTo = (path: string) => {
  window.location.href = path;
};

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

// 서비스 오픈 일정
const SERVICE_OPEN_DATES: Record<string, Date> = {
    '/monthly': new Date('2026-02-01'),
    '/quarterly': new Date('2026-04-01'),
};

// 서비스 오픈 여부 확인
const isServiceOpen = (path: string): boolean => {
    const openDate = SERVICE_OPEN_DATES[path];
    if (!openDate) return true;
    return new Date() >= openDate;
};

// 서비스 오픈 예정일 포맷
const getOpenDateText = (path: string): string => {
    const openDate = SERVICE_OPEN_DATES[path];
    if (!openDate) return '';
    const year = openDate.getFullYear();
    const month = String(openDate.getMonth() + 1).padStart(2, '0');
    const day = String(openDate.getDate()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일`;
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const pathname = usePathname();
    const { logout } = useAuth();

    const menuItems = [
        { name: '주간 보고서', path: '/weekly', icon: faCalendarAlt },
        { name: '월간 보고서', path: '/monthly', icon: faChartPie },
        { name: '분기 보고서', path: '/quarterly', icon: faChartBar },
        { name: '환경설정', path: '/settings', icon: faInfoCircle },
    ];

    const handleMenuClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
        e.preventDefault();
        if (!isServiceOpen(path)) {
            const openDate = getOpenDateText(path);
            alert(`서비스 준비 중입니다.\n\n오픈 예정일: ${openDate}`);
        } else {
            // Close sidebar on mobile when navigating
            if (window.innerWidth < 1024) onClose();
            // Hard navigation 사용
            navigateTo(path);
        }
    };

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Insight Pigplan</h2>
                    <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <nav className="p-4 space-y-2">
                    {menuItems.map((item) => {
                        const isActive = pathname.startsWith(item.path);
                        const isLocked = !isServiceOpen(item.path);
                        return (
                            <a
                                key={item.path}
                                href={isLocked ? '#' : item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                    isLocked
                                        ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                        : isActive
                                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                                onClick={(e) => handleMenuClick(e, item.path)}
                            >
                                <FontAwesomeIcon icon={isLocked ? faLock : item.icon} className="w-5 h-5" />
                                {item.name}
                                {isLocked && <span className="ml-auto text-xs text-gray-400">(준비중)</span>}
                            </a>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 left-0 w-full p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
                    <div className="flex items-center justify-between px-4 py-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">테마</span>
                        <ThemeToggle variant="button" className="sidebar-theme-btn" />
                    </div>
                    <button
                        type="button"
                        onClick={() => logout()}
                        className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5" />
                        로그아웃
                    </button>
                </div>
            </div>
        </>
    );
};
