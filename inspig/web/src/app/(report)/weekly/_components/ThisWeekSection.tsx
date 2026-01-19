import React, { useState, useRef, useEffect } from 'react';
import { ThisWeekData } from '@/types/weekly';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarWeek,
    faArrowUpRightFromSquare,
    faHeart,
    faMagnifyingGlass,
    faBaby,
    faPersonBreastfeeding,
    faSyringe,
    faTruck,
    faLightbulb,
    faXmark,
    faGear
} from '@fortawesome/free-solid-svg-icons';
import WeeklyScheduleSettings from '@/components/settings/WeeklyScheduleSettings';

interface ThisWeekSectionProps {
    data: ThisWeekData;
    farmNo?: number;
    onPopupOpen: (type: string) => void;
}

export const ThisWeekSection: React.FC<ThisWeekSectionProps> = ({ data, farmNo, onPopupOpen }) => {
    const weekDays = ['월', '화', '수', '목', '금', '토', '일'];
    const [showHelpTooltip, setShowHelpTooltip] = useState(false);
    const [showSettingsPopup, setShowSettingsPopup] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const settingsPopupRef = useRef<HTMLDivElement>(null);

    // calendarGrid 데이터 사용 (프로토타입 _cal 구조)
    const grid = data.calendarGrid;

    // 툴팁 외부 클릭 감지
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
                setShowHelpTooltip(false);
            }
        };

        if (showHelpTooltip) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showHelpTooltip]);

    // 설정 팝업 ESC 키 닫기
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowSettingsPopup(false);
            }
        };

        if (showSettingsPopup) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [showSettingsPopup]);

    // 요약 카드 데이터
    const summaryData = {
        mating: grid?.gbSum ?? 0,
        checking: grid?.imsinSum ?? 0,
        farrowing: grid?.bmSum ?? 0,
        weaning: grid?.euSum ?? 0,
        vaccine: grid?.vaccineSum ?? 0,
        shipment: grid?.shipSum ?? 0,
    };

    return (
        <div className="report-card" id="sec-thisweek">
            <div className="card-header">
                <div className="card-header-top">
                    <div className="card-title">
                        <FontAwesomeIcon icon={faCalendarWeek} /> 금주 작업예정
                    </div>
                    <div className="card-date-wrap right horizontal">
                        <div className="card-badge">Week {grid?.weekNum ?? data?.summary?.matingGoal ?? ''}</div>
                        <div className="card-date">{grid?.periodFrom ?? ''} ~ {grid?.periodTo ?? ''}</div>
                    </div>
                </div>
                <div className="legend">
                    <div className="info-note-wrap" ref={tooltipRef} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: 'auto', position: 'relative' }}>
                        <div id="btn-schedule-help" className="info-note clickable lightbulb" onClick={() => setShowHelpTooltip(!showHelpTooltip)}>
                            금주 산출기준 <span className="icon-circle"><FontAwesomeIcon icon={faLightbulb} /></span>
                        </div>
                        {farmNo && (
                            <div
                                id="btn-schedule-settings"
                                className="info-note clickable"
                                onClick={() => setShowSettingsPopup(true)}
                                style={{ color: '#6b7280' }}
                                title="작업예정 설정 상세 보기"
                            >
                                산정방식 보기 <span className="icon-circle" style={{ background: '#f3f4f6', color: '#6b7280' }}>
                                    <FontAwesomeIcon icon={faGear} />
                                </span>
                            </div>
                        )}
                        {/* 산출기준 툴팁 */}
                        {showHelpTooltip && (
                            <div className="help-tooltip" style={{ position: 'absolute', top: '100%', left: '0', zIndex: 100, marginTop: '4px' }}>
                        <div className="help-tooltip-header">
                            <span>작업별 산출기준(pigplan.io)</span>
                            <button className="close-btn" onClick={() => setShowHelpTooltip(false)}>
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>
                        <div className="help-tooltip-note">
                            [농장 기본값]&nbsp;:&nbsp;피그플랜 &gt; 농장 정보관리 &gt; 농장 기본값 설정
                            <br />
                            [모돈 작업설정]&nbsp;:&nbsp;피그플랜 &gt; 농장 정보관리 &gt; 모돈 작업설정
                             <br />
                            ※ 출하는 농장 기본설정값 기준으로 산출
                        </div>
                        <div className="help-tooltip-body">
                            <div className="help-item">
                                <span className="help-label">교배</span>
                                <span className="help-desc">{grid?.help?.mating || '설정된 예정작업정보 없음'}</span>
                            </div>
                            <div className="help-item">
                                <span className="help-label">분만</span>
                                <span className="help-desc">{grid?.help?.farrowing || '설정된 예정작업정보 없음'}</span>
                            </div>
                            {grid?.isModonPregnancy ? (
                                /* 모돈작업설정: 임신 감정 하나로 표시 */
                                <div className="help-item">
                                    <span className="help-label">임신 감정</span>
                                    <span className="help-desc">{grid?.help?.pregnancy || '설정된 예정작업정보 없음'}</span>
                                </div>
                            ) : (
                                /* 농장기본값: 재발확인, 임신진단 별도 표시 */
                                <>
                                    <div className="help-item">
                                        <span className="help-label">재발확인</span>
                                        <span className="help-desc">{grid?.help?.pregnancy3w || '(농장기본값) 교배 후 3주'}</span>
                                    </div>
                                    <div className="help-item">
                                        <span className="help-label">임신진단</span>
                                        <span className="help-desc">{grid?.help?.pregnancy4w || '(농장기본값) 교배 후 4주'}</span>
                                    </div>
                                </>
                            )}
                            <div className="help-item">
                                <span className="help-label">이유</span>
                                <span className="help-desc">{grid?.help?.weaning || '설정된 예정작업정보 없음'}</span>
                            </div>
                            <div className="help-item">
                                <span className="help-label">모돈백신</span>
                                <span className="help-desc">{grid?.help?.vaccine || '설정된 예정작업정보 없음'}</span>
                            </div>
                            <div className="help-item">
                                <span className="help-label">출하</span>
                                <span className="help-desc" style={{ whiteSpace: 'pre-line' }}>{grid?.help?.shipment || '-'}</span>
                            </div>
                        </div>
                        <div className="help-tooltip-footer">
                            ※ 작업정보 및 설정값 변경은 pigplan.io에 접속하셔서 변경하십시요.
                        </div>
                            </div>
                        )}
                    </div>
                    <div className="legend-item legend-clickable-hint"><FontAwesomeIcon icon={faArrowUpRightFromSquare} />=상세보기</div>
                    <span className="section-desc">단위: 복</span>
                </div>
            </div>
            <div className="card-body">
                {/* 주간 요약 카드 - 모돈작업설정인 경우에만 클릭 가능 */}
                <div className="summary-section">
                    <div
                        className={`summary-card${!grid?.help?.isFarmMating ? ' clickable' : ''}`}
                        onClick={() => !grid?.help?.isFarmMating && onPopupOpen('scheduleGb')}
                    >
                        {!grid?.help?.isFarmMating && <span className="detail-btn"><FontAwesomeIcon icon={faArrowUpRightFromSquare} /></span>}
                        <div className="icon"><FontAwesomeIcon icon={faHeart} /></div>
                        <div className="title">교배</div>
                        <div className="count">{summaryData.mating}</div>
                    </div>
                    <div className="summary-card">
                        <div className="icon"><FontAwesomeIcon icon={faMagnifyingGlass} /></div>
                        <div className="title">{grid?.isModonPregnancy ? '임신감정' : '재발확인'}</div>
                        <div className="count">{summaryData.checking}</div>
                    </div>
                    <div
                        className={`summary-card${!grid?.help?.isFarmFarrowing ? ' clickable' : ''}`}
                        onClick={() => !grid?.help?.isFarmFarrowing && onPopupOpen('scheduleBm')}
                    >
                        {!grid?.help?.isFarmFarrowing && <span className="detail-btn"><FontAwesomeIcon icon={faArrowUpRightFromSquare} /></span>}
                        <div className="icon"><FontAwesomeIcon icon={faBaby} /></div>
                        <div className="title">분만</div>
                        <div className="count">{summaryData.farrowing}</div>
                    </div>
                    <div
                        className={`summary-card${!grid?.help?.isFarmWeaning ? ' clickable' : ''}`}
                        onClick={() => !grid?.help?.isFarmWeaning && onPopupOpen('scheduleEu')}
                    >
                        {!grid?.help?.isFarmWeaning && <span className="detail-btn"><FontAwesomeIcon icon={faArrowUpRightFromSquare} /></span>}
                        <div className="icon"><FontAwesomeIcon icon={faPersonBreastfeeding} /></div>
                        <div className="title">이유</div>
                        <div className="count">{summaryData.weaning}</div>
                    </div>
                    <div
                        className={`summary-card${!grid?.help?.isFarmVaccine ? ' clickable' : ''}`}
                        onClick={() => !grid?.help?.isFarmVaccine && onPopupOpen('scheduleVaccine')}
                    >
                        {!grid?.help?.isFarmVaccine && <span className="detail-btn"><FontAwesomeIcon icon={faArrowUpRightFromSquare} /></span>}
                        <div className="icon"><FontAwesomeIcon icon={faSyringe} /></div>
                        <div className="title">모돈백신</div>
                        <div className="count">{summaryData.vaccine}</div>
                    </div>
                    <div className="summary-card">
                        <div className="icon"><FontAwesomeIcon icon={faTruck} /></div>
                        <div className="title">출하</div>
                        <div className="count">{summaryData.shipment}</div>
                    </div>
                </div>

                {/* 캘린더 그리드 */}
                <div className="schedule-card">
                    <div className="calendar-grid">
                        {/* 헤더 */}
                        <div className="calendar-header corner">작업</div>
                        {weekDays.map((day, i) => (
                            <div key={i} className="calendar-header">
                                <span className="day-name">{day}</span>
                                <div className="day-num">{grid?.dates?.[i] ?? ''}</div>
                            </div>
                        ))}

                        {/* 교배 - 모돈작업설정인 경우에만 클릭 가능 */}
                        <div className="calendar-section">
                            <span className="section-label">교배</span>
                        </div>
                        {weekDays.map((_, i) => {
                            const count = grid?.gb?.[i];
                            const canClick = count && !grid?.help?.isFarmMating;
                            return (
                                <div key={i} className={`calendar-cell${canClick ? ' clickable' : ''}${i === 6 ? ' last-col' : ''}`} onClick={() => canClick && onPopupOpen('scheduleGb')}>
                                    {count && <span className="count">{count}</span>}
                                </div>
                            );
                        })}

                        {/* 분만 (강조색) - 모돈작업설정인 경우에만 클릭 가능 */}
                        <div className="calendar-section">
                            <span className="section-label">분만</span>
                        </div>
                        {weekDays.map((_, i) => {
                            const count = grid?.bm?.[i];
                            const canClick = count && !grid?.help?.isFarmFarrowing;
                            return (
                                <div key={i} className={`calendar-cell highlight${canClick ? ' clickable' : ''}${i === 6 ? ' last-col' : ''}`} onClick={() => canClick && onPopupOpen('scheduleBm')}>
                                    {count && <span className="count">{count}</span>}
                                </div>
                            );
                        })}

                        {grid?.isModonPregnancy ? (
                            /* 모돈작업설정: 임신 감정돈(진단) 하나로 표시 */
                            <>
                                <div className="calendar-section">
                                    <span className="section-label">임신<br />감정</span>
                                </div>
                                {weekDays.map((_, i) => {
                                    const count = grid?.imsin?.[i];
                                    return (
                                        <div key={`imsin-${i}`} className={`calendar-cell${i === 6 ? ' last-col' : ''}`}>
                                            {count && <span className="count">{count}</span>}
                                        </div>
                                    );
                                })}
                            </>
                        ) : (
                            /* 농장기본값: 재발확인(3주), 임신진단(4주) 별도 표시 */
                            <>
                                {/* 재발확인(3주) */}
                                <div className="calendar-section">
                                    <span className="section-label">재발<br />확인<br /><span className="section-sub">(3주)</span></span>
                                </div>
                                {weekDays.map((_, i) => {
                                    const count = grid?.imsin3w?.[i];
                                    return (
                                        <div key={`3w-${i}`} className={`calendar-cell${i === 6 ? ' last-col' : ''}`}>
                                            {count && <span className="count">{count}</span>}
                                        </div>
                                    );
                                })}

                                {/* 임신진단(4주) */}
                                <div className="calendar-section">
                                    <span className="section-label">임신<br />진단<br /><span className="section-sub">(4주)</span></span>
                                </div>
                                {weekDays.map((_, i) => {
                                    const count = grid?.imsin4w?.[i];
                                    return (
                                        <div key={`4w-${i}`} className={`calendar-cell${i === 6 ? ' last-col' : ''}`}>
                                            {count && <span className="count">{count}</span>}
                                        </div>
                                    );
                                })}
                            </>
                        )}

                        {/* 이유 - 모돈작업설정인 경우에만 클릭 가능 */}
                        <div className="calendar-section">
                            <span className="section-label">이유</span>
                        </div>
                        {weekDays.map((_, i) => {
                            const count = grid?.eu?.[i];
                            const canClick = count && !grid?.help?.isFarmWeaning;
                            return (
                                <div key={i} className={`calendar-cell${canClick ? ' clickable' : ''}${i === 6 ? ' last-col' : ''}`} onClick={() => canClick && onPopupOpen('scheduleEu')}>
                                    {count && <span className="count">{count}</span>}
                                </div>
                            );
                        })}

                        {/* 모돈백신 - 모돈작업설정인 경우에만 클릭 가능 */}
                        <div className="calendar-section">
                            <span className="section-label">모돈<br />백신</span>
                        </div>
                        {weekDays.map((_, i) => {
                            const count = grid?.vaccine?.[i];
                            const canClick = count && !grid?.help?.isFarmVaccine;
                            return (
                                <div key={i} className={`calendar-cell${canClick ? ' clickable' : ''}${i === 6 ? ' last-col' : ''}`} onClick={() => canClick && onPopupOpen('scheduleVaccine')}>
                                    {count && <span className="count">{count}</span>}
                                </div>
                            );
                        })}

                        {/* 출하 (병합) */}
                        <div className="calendar-section last-row">
                            <span className="section-label">출하</span>
                        </div>
                        <div className="calendar-cell merged last-row">
                            {(grid?.ship ?? 0) > 0 && <><span className="count">{grid?.ship}</span><span className="unit">두</span></>}
                        </div>
                    </div>
                </div>
            </div>

            {/* 작업예정 산정 방식 설정 팝업 */}
            {showSettingsPopup && farmNo && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowSettingsPopup(false);
                        }
                    }}
                >
                    <div
                        ref={settingsPopupRef}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 팝업 헤더 */}
                        <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 z-10">
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold text-gray-900 dark:text-white text-lg">
                                    보고서 산출 설정
                                </h2>
                                <button
                                    onClick={() => setShowSettingsPopup(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                                >
                                    <FontAwesomeIcon icon={faXmark} className="text-xl" />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                작업예정 산출 기준 (변경 시 차주 반영)
                            </p>
                        </div>
                        {/* 팝업 바디 */}
                        <WeeklyScheduleSettings
                            farmNo={farmNo}
                            showSaveButton={false}
                            readOnly={true}
                            onClose={() => setShowSettingsPopup(false)}
                        />
                        {/* 팝업 푸터 */}
                        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700/50 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                설정 변경은 <a href="/settings?tab=weekly" className="text-blue-600 dark:text-blue-400 hover:underline">환경설정 &gt; 주간보고서</a>에서 가능합니다.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
