import React, { useState, Fragment } from 'react';
import { ScheduleDetailItem } from '@/types/weekly';
import { PopupContainer } from './PopupContainer';

interface ScheduleDetailPopupProps {
    isOpen: boolean;
    onClose: () => void;
    data: ScheduleDetailItem[];
    title: string;
    subtitle?: string;
    id?: string;
    showVaccineName?: boolean;  // 백신 팝업에서 백신명 컬럼 표시
}

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

export const ScheduleDetailPopup: React.FC<ScheduleDetailPopupProps> = ({
    isOpen,
    onClose,
    data,
    title,
    subtitle,
    id,
    showVaccineName = false
}) => {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    // 합계 계산
    const totalCount = data.reduce((sum, item) => sum + item.count, 0);
    const colSpan = showVaccineName ? 6 : 5;  // 전체 컬럼 수

    const handleRowClick = (index: number) => {
        setSelectedIndex(selectedIndex === index ? null : index);
    };

    const handleClose = () => {
        setSelectedIndex(null);
        onClose();
    };

    return (
        <PopupContainer
            isOpen={isOpen}
            onClose={handleClose}
            title={title}
            subtitle={subtitle}
            maxWidth="max-w-xl"
            id={id}
        >
            <>
                {/* 안내 및 단위 표시 */}
                <div className="popup-section-desc justify-between">
                    <span style={{ color: 'var(--rp-text-tertiary)', fontSize: '11px' }}>작업리스트 클릭시 일별 현황확인</span>
                    <span>단위: 복</span>
                </div>

                {/* 테이블 */}
                <div className="popup-table-wrap">
                    <table className="popup-table-02" id={id ? `tbl-${id.replace('pop-', '')}` : undefined}>
                        <thead>
                            <tr>
                                <th>작업명</th>
                                <th>기준작업</th>
                                <th>대상돈군</th>
                                <th>경과일</th>
                                {showVaccineName && <th>백신명</th>}
                                <th>대상복수</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length > 0 ? (
                                <>
                                    {data.map((item, index) => (
                                        <Fragment key={index}>
                                            <tr
                                                onClick={() => handleRowClick(index)}
                                                style={{ cursor: 'pointer' }}
                                                className={selectedIndex === index ? 'bg-[var(--rp-bg-secondary)]' : ''}
                                            >
                                                <td className="label">{item.taskNm}</td>
                                                <td>{item.baseTask}</td>
                                                <td>{item.targetGroup}</td>
                                                <td>{item.elapsedDays}</td>
                                                {showVaccineName && <td>{item.vaccineName || '-'}</td>}
                                                <td className="total">{item.count}</td>
                                            </tr>
                                            {/* 요일별 분포 행 */}
                                            {selectedIndex === index && item.daily && (
                                                <tr className="daily-dist-row">
                                                    <td colSpan={colSpan} className="daily-dist-cell">
                                                        <div className="daily-dist-container">
                                                            {DAYS.map((day, idx) => {
                                                                const count = item.daily![idx] || 0;
                                                                const hasValue = count > 0;
                                                                const isWeekend = idx >= 5;
                                                                return (
                                                                    <div
                                                                        key={day}
                                                                        className={`daily-dist-item ${hasValue ? 'has-value' : ''} ${isWeekend ? 'weekend' : ''}`}
                                                                    >
                                                                        <span className="daily-dist-day">{day}</span>
                                                                        <span className="daily-dist-count">{count}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    ))}
                                    {/* 합계 행 */}
                                    <tr className="sum-row">
                                        <td className="label" colSpan={colSpan - 1}>합계</td>
                                        <td className="total">{totalCount}</td>
                                    </tr>
                                </>
                            ) : (
                                <tr>
                                    <td colSpan={colSpan} className="text-center py-8" style={{ color: 'var(--rp-text-tertiary)' }}>
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
