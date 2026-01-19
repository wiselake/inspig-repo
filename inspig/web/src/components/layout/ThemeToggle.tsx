"use client";

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
    variant?: 'icon' | 'button';
    className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'icon', className = '' }) => {
    const { theme, toggleTheme } = useTheme();

    if (variant === 'button') {
        // 버튼 스타일 (report-header 용)
        return (
            <button
                onClick={toggleTheme}
                className={`theme-toggle-btn ${className}`}
            >
                <FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} />
                <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>
        );
    }

    // 아이콘 스타일 (사이드바 용)
    return (
        <button
            onClick={toggleTheme}
            className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
            aria-label="Toggle Theme"
        >
            <FontAwesomeIcon
                icon={theme === 'light' ? faMoon : faSun}
                className="w-5 h-5 text-gray-600 dark:text-gray-400"
            />
        </button>
    );
};
