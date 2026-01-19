"use client";

import React from 'react';
import { WeeklyHeader as WeeklyHeaderType } from '@/types/weekly';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

interface WeeklyHeaderProps {
    data: WeeklyHeaderType;
}

export const WeeklyHeader: React.FC<WeeklyHeaderProps> = ({ data }) => {
    // 기간 문자열에서 연도, 월, 주차 추출
    // period가 객체({ from, to })이거나 문자열("2023.09.25 ~ 2023.10.01")일 수 있음
    let startDate = '';
    let endDate = '';

    if (typeof data.period === 'object' && data.period !== null) {
        // 객체 형태: { from: "2023-09-25", to: "2023-10-01" }
        const periodObj = data.period as { from: string; to: string };
        startDate = periodObj.from?.replace(/-/g, '.') || '';
        endDate = periodObj.to?.replace(/-/g, '.') || '';
    } else if (typeof data.period === 'string') {
        // 문자열 형태: "2023.09.25 ~ 2023.10.01"
        const periodParts = data.period.split(' ~ ');
        startDate = periodParts[0] || '';
        endDate = periodParts[1] || '';
    }

    // 연도와 월 추출
    const [year, month] = startDate.split('.').slice(0, 2);

    return (
        <div className="report-header">
            <div className="report-header-top">
                <h1>주간 보고서</h1>
                <ThemeToggle variant="button" />
            </div>
            <div className="report-header-info">
                <div className="report-farm-info">{data.farmName}</div>
                <div className="report-period">
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    <span>{year}년 {month}월 {data.weekNum}주차 ({startDate} ~ {endDate})</span>
                </div>
            </div>
        </div>
    );
};
