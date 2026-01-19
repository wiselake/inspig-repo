import React from 'react';
import '@/css/style.css';
import '@/css/common.css';
import '@/css/popup.css';

export default function WeeklyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="weekly-report-container">
            {children}
        </div>
    );
}
