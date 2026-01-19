"use client";

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faUser } from '@fortawesome/free-solid-svg-icons';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
    onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const { user, logout } = useAuth();

    return (
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                {/* 왼쪽: 메뉴 버튼 + 타이틀 */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <FontAwesomeIcon icon={faBars} className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white hidden sm:block">
                     Insight Pigplan
                    </h1>
                </div>

                {/* 오른쪽: 사용자 정보 + 로그아웃 */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* 사용자 정보 */}
                    <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-gray-400 dark:text-gray-500 hidden sm:block" />
                        <div className="text-xs sm:text-sm">
                            {/* 모바일: 세로 배치, PC: 가로 배치 */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {user?.name || '-'}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400 text-[11px] sm:text-sm">
                                    {user?.farmNm || user?.farmNo || '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 구분선 */}
                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

                    {/* 테마 토글 */}
                    <div className="hidden sm:block">
                        <ThemeToggle />
                    </div>

                    {/* 로그아웃 버튼 */}
                    <button
                        type="button"
                        onClick={() => logout()}
                        className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors whitespace-nowrap"
                    >
                        로그아웃
                    </button>
                </div>
            </div>
        </header>
    );
};
