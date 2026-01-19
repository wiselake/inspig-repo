'use client';

import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { MatingPopupData } from '@/types/weekly';
import { PopupContainer } from './PopupContainer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTable, faChartSimple } from '@fortawesome/free-solid-svg-icons';
import { useChartResponsive } from './useChartResponsive';
import { useTheme } from '@/contexts/ThemeContext';

interface MatingPopupProps {
    isOpen: boolean;
    onClose: () => void;
    data: MatingPopupData;
}

/**
 * 교배 실적 팝업 (탭 구조)
 * - 탭1: 유형별 교배복수 테이블
 * - 탭2: 재귀일별 교배복수 차트
 * @see popup.js tpl-mating
 */
export const MatingPopup: React.FC<MatingPopupProps> = ({ isOpen, onClose, data }) => {
    const [activeTab, setActiveTab] = useState<'table' | 'chart'>('table');
    const chartSizes = useChartResponsive();
    const { theme } = useTheme();

    // 다크모드 색상
    const isDark = theme === 'dark';
    const textColor = isDark ? '#e6edf3' : '#1d1d1f';
    const splitLineColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
    const dataLabelColor = isDark ? '#ffd700' : '#333';  // 다크모드: 골드 (확 뜨는 색상)

    // 달성률 계산 (소수점 1자리, 문자열 반환)
    const calcRate = (planned: number, actual: number): string => {
        if (planned === 0) return '-';
        return ((actual / planned) * 100).toFixed(1) + '%';
    };

    // 달성률 계산 (숫자 반환, 프로그레스바 width용)
    const calcRateNum = (planned: number, actual: number): number => {
        if (planned === 0) return 0;
        return (actual / planned) * 100;
    };

    // 차트 옵션 (재귀일별 교배복수)
    const chartOption = {
        tooltip: {
            trigger: 'axis' as const,
            axisPointer: { type: 'shadow' as const },
            textStyle: { fontSize: chartSizes.tooltipSize }
        },
        grid: {
            top: '15%',
            left: '3%',
            right: '6%',
            bottom: '5%',
            containLabel: true
        },
        xAxis: {
            type: 'category' as const,
            name: '재귀일',
            nameLocation: 'end' as const,
            nameGap: 10,
            data: data.chart.xAxis,
            axisLabel: {
                color: textColor,
                fontSize: chartSizes.axisLabelSize,
                interval: 0
            },
            nameTextStyle: {
                color: textColor,
                fontSize: chartSizes.axisNameSize,
                verticalAlign: 'top' as const,
                padding: [20, 0, 0, -40]
            }
        },
        yAxis: {
            type: 'value' as const,
            name: '복수',
            nameTextStyle: {
                color: textColor,
                fontSize: chartSizes.axisNameSize
            },
            axisLabel: {
                color: textColor,
                fontSize: chartSizes.axisLabelSize
            },
            splitLine: {
                lineStyle: {
                    type: 'dashed' as const,
                    width: 1,
                    color: splitLineColor
                }
            }
        },
        series: [{
            name: '교배복수',
            type: 'bar' as const,
            data: data.chart.data,
            itemStyle: {
                color: '#28a745',
                borderRadius: [4, 4, 0, 0]
            },
            barWidth: '60%',
            label: {
                show: true,
                position: 'top' as const,
                fontSize: chartSizes.dataLabelSize,
                fontWeight: 600,
                color: dataLabelColor
            }
        }]
    };

    return (
        <PopupContainer
            isOpen={isOpen}
            onClose={onClose}
            title="교배 실적"
            subtitle="지난주 유형별 교배복수 및 재귀일별 현황"
            id="pop-mating"
        >
            {/* 탭 헤더 */}
            <div className="popup-tabs">
                <button
                    className={`popup-tab ${activeTab === 'table' ? 'active' : ''}`}
                    onClick={() => setActiveTab('table')}
                >
                    <FontAwesomeIcon icon={faTable} className="fa-sm" /> 유형별 교배복수
                </button>
                <button
                    className={`popup-tab ${activeTab === 'chart' ? 'active' : ''}`}
                    onClick={() => setActiveTab('chart')}
                >
                    <FontAwesomeIcon icon={faChartSimple} className="fa-sm" /> 재귀일별 교배복수
                </button>
            </div>

            {/* 탭 컨텐츠: 테이블 */}
            {activeTab === 'table' && (
                <div className="popup-tab-content" id="tab-mating-table">
                    <div className="popup-section-desc">
                        <span>달성율 : 예정작업 대비</span>
                        <span>단위: 복</span>
                    </div>

                    {/* 요약 리스트 - 유형 2 스타일 */}
                    {data.summary && (
                        <div className="mating-summary-list" id="mating-summary">
                            {/* 합계 - 하이라이트 */}
                            <div className="summary-row highlight">
                                <div className="summary-row-left">
                                    <span className="summary-dot"></span>
                                    <span className="summary-label">합계</span>
                                    <div className="summary-sub" style={{ marginTop: 0, marginLeft: '8px' }}>
                                        예정 {data.summary.totalPlanned || data.total.planned} · <span className={`rate-badge ${(data.summary.totalActual / (data.summary.totalPlanned || data.total.planned || 1) * 100) >= 100 ? 'good' : (data.summary.totalActual / (data.summary.totalPlanned || data.total.planned || 1) * 100) >= 80 ? 'warn' : 'bad'}`}>{calcRate(data.summary.totalPlanned || data.total.planned, data.summary.totalActual)}</span>
                                    </div>
                                </div>
                                <div className="summary-row-right">
                                    <span className="summary-value">{data.summary.totalActual}복</span>
                                </div>
                            </div>

                            {/* 교배 구성 - 프로그레스 바 + 예정/실적 */}
                            <div className="section-title">교배 구성</div>

                            {/* 정상교배복수 - 예정/달성률 표시 */}
                            <div className="summary-row with-bar">
                                <div className="summary-row-header">
                                    <span className="summary-label">정상교배복수(초교배포함 )<span className="summary-plan">예정 {data.summary.jsGbPlanned || 0}복 ({calcRate(data.summary.jsGbPlanned || 0, data.summary.jsGbCnt || 0)})</span></span>
                                    <span className="summary-value">{data.summary.jsGbCnt || 0}복</span>
                                </div>
                            </div>

                            {/* 초교배복수 - 예정/달성률 표시 */}
                            <div className="summary-row with-bar">
                                <div className="summary-row-header">
                                    <span className="summary-label">초교배복수 <span className="summary-plan">예정 {data.summary.firstGbPlanned || 0}복 ({calcRate(data.summary.firstGbPlanned || 0, data.summary.firstGbCnt || 0)})</span></span>
                                    <span className="summary-value">{data.summary.firstGbCnt || 0}복</span>
                                </div>
                            </div>

                            {/* 재발교배복수 - 예정 없음 */}
                            <div className="summary-row with-bar">
                                <div className="summary-row-header">
                                    <span className="summary-label">재발교배복수</span>
                                    <span className="summary-value">{data.summary.sagoGbCnt || 0}복</span>
                                </div>
                            </div>

                            {/* 기타 정보 - 기존 2열 그리드 */}
                            <div className="summary-row-group">
                                <div className="summary-row compact">
                                    <span className="summary-label">교배돈중 사고복수</span>
                                    <span className="summary-value">{data.summary.accidentCnt}</span>
                                </div>
                                <div className="summary-row compact">
                                    <span className="summary-label">교배돈중 분만복수</span>
                                    <span className="summary-value">{data.summary.farrowingCnt}</span>
                                </div>
                                <div className="summary-row compact">
                                    <span className="summary-label">평균 재귀발정일</span>
                                    <span className="summary-value">{data.summary.avgReturnDay > 0 ? data.summary.avgReturnDay.toFixed(1) : '-'}일</span>
                                </div>
                                <div className="summary-row compact">
                                    <span className="summary-label">평균 초교배일</span>
                                    <span className="summary-value">{data.summary.avgFirstGbDay > 0 ? data.summary.avgFirstGbDay.toFixed(1) : '-'}일</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 탭 컨텐츠: 차트 */}
            {activeTab === 'chart' && (
                <div className="popup-tab-content" id="tab-mating-chart">
                    <div id="cht-mating-recur">
                        <ReactECharts
                            option={chartOption}
                            style={{ width: '100%', height: '300px' }}
                            opts={{ renderer: 'svg' }}
                        />
                    </div>
                </div>
            )}
        </PopupContainer>
    );
};
