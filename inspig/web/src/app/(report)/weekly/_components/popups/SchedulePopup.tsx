import React from 'react';
import { SchedulePopupData } from '@/types/weekly';
import { PopupContainer } from './PopupContainer';

interface SchedulePopupProps {
    isOpen: boolean;
    onClose: () => void;
    data: SchedulePopupData;
    title: string;
    id?: string;
}

export const SchedulePopup: React.FC<SchedulePopupProps> = ({ isOpen, onClose, data, title, id }) => {
    // 합계 계산 (count가 undefined일 수 있음)
    const totalCount = data.events.reduce((sum, event) => sum + (event.count || 0), 0);

    return (
        <PopupContainer isOpen={isOpen} onClose={onClose} title={title} subtitle={`${data.date} 기준`} id={id}>
            <>
                {/* 단위 표시 */}
                <div className="popup-section-desc justify-end">
                    <span>단위: 복</span>
                </div>

                {/* 테이블 */}
                <div className="popup-table-wrap">
                    <table className="popup-table-02">
                        <thead>
                            <tr>
                                <th>작업명</th>
                                <th>대상복수</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.events.length > 0 ? (
                                <>
                                    {data.events.map((event, index) => (
                                        <tr key={index}>
                                            <td className="label">{event.title}</td>
                                            <td className="total">{event.count}</td>
                                        </tr>
                                    ))}
                                    {/* 합계 행 */}
                                    <tr className="sum-row">
                                        <td className="label">합계</td>
                                        <td className="total">{totalCount}</td>
                                    </tr>
                                </>
                            ) : (
                                <tr>
                                    <td colSpan={2} className="text-center py-8" style={{ color: 'var(--rp-text-tertiary)' }}>
                                        예정된 작업이 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </>
        </PopupContainer>
    );
};
