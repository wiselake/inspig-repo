import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

// Hard navigation 함수 - Next.js 클라이언트 라우터 우회
// 이중화 서버 환경에서 RSC 상태 불일치 문제 방지
const navigateTo = (path: string) => {
  window.location.href = path;
};

interface ReportItem {
    id: string;
    title: string;
    period: string;
    date: string;
    [key: string]: any;
}

interface ReportListProps {
    items: ReportItem[];
    basePath?: string;
    onItemClick?: (item: ReportItem) => void;
}

export const ReportList: React.FC<ReportListProps> = ({ items, basePath, onItemClick }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item) => {
                    const content = (
                        <div className="p-4 sm:px-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-full text-blue-600 dark:text-blue-400">
                                    <FontAwesomeIcon icon={faCalendarAlt} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                        {item.title}
                                    </h3>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                        <span>{item.period}</span>
                                        <span>•</span>
                                        <span>작성일: {item.date}</span>
                                    </div>
                                </div>
                            </div>
                            <FontAwesomeIcon icon={faChevronRight} className="text-gray-400 w-4 h-4" />
                        </div>
                    );

                    if (onItemClick) {
                        return (
                            <div
                                key={item.id}
                                onClick={() => onItemClick(item)}
                                className="block hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                            >
                                {content}
                            </div>
                        );
                    }

                    return (
                        <a
                            key={item.id}
                            href={`${basePath}/${item.id}`}
                            onClick={(e) => {
                                e.preventDefault();
                                navigateTo(`${basePath}/${item.id}`);
                            }}
                            className="block hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            {content}
                        </a>
                    );
                })}
            </div>
        </div>
    );
};
