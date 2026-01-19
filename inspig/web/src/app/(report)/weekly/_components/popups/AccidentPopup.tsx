'use client';

import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { AccidentPopupData } from '@/types/weekly';
import { PopupContainer } from './PopupContainer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTable, faChartSimple } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useChartResponsive } from './useChartResponsive';
import { formatNumber } from '@/utils/format';

interface AccidentPopupProps {
    isOpen: boolean;
    onClose: () => void;
    data: AccidentPopupData;
}

/**
 * 임신사고 팝업 (탭 구조)
 * - 탭1: 원인별 사고복수 테이블
 * - 탭2: 임신일별 사고복수 차트
 * @see popup.js tpl-accident
 * @see com.js _initAccidentChart()
 */
export const AccidentPopup: React.FC<AccidentPopupProps> = ({ isOpen, onClose, data }) => {
    const [activeTab, setActiveTab] = useState<'table' | 'chart'>('table');
    const { theme } = useTheme();
    const chartSizes = useChartResponsive();

    // 다크모드 색상
    const isDark = theme === 'dark';
    const textColor = isDark ? '#e6edf3' : '#1d1d1f';
    const splitLineColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
    const dataLabelColor = isDark ? '#ffd700' : '#333';  // 다크모드: 골드 (확 뜨는 색상)

    // 합계 계산
    const lastWeekTotal = data.table.reduce((sum, row) => sum + row.lastWeek, 0);
    const lastMonthTotal = data.table.reduce((sum, row) => sum + row.lastMonth, 0);

    // 차트 옵션 (임신일별 사고복수) - com.js _initAccidentChart() 기준
    const chartOption = {
        tooltip: {
            trigger: 'axis' as const,
            axisPointer: { type: 'shadow' as const },
            textStyle: { fontSize: chartSizes.tooltipSize },
            formatter: (params: { name: string; value: number }[]) => {
                return params[0].name + '일: ' + params[0].value + '복';
            }
        },
        grid: {
            top: '15%',
            left: '3%',
            right: '5%',
            bottom: '18%',
            containLabel: true
        },
        xAxis: {
            type: 'category' as const,
            data: data.chart.xAxis,
            axisLabel: {
                color: textColor,
                fontSize: chartSizes.axisLabelSize,
                fontWeight: 500,
                interval: 0,
                rotate: 45
            }
        },
        yAxis: {
            type: 'value' as const,
            name: '(복)',
            nameLocation: 'end' as const,
            nameGap: 20,
            minInterval: 1,
            axisLabel: {
                color: textColor,
                fontSize: chartSizes.axisLabelSize
            },
            nameTextStyle: {
                color: textColor,
                fontSize: chartSizes.axisNameSize,
                align: 'right' as const
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
            name: '사고복수',
            type: 'bar' as const,
            data: data.chart.data,
            itemStyle: {
                color: '#dc3545',
                borderRadius: [4, 4, 0, 0]
            },
            barWidth: '60%',
            label: {
                show: true,
                position: 'top' as const,
                fontSize: chartSizes.dataLabelSize,
                fontWeight: 600,
                color: dataLabelColor,
                formatter: '{c}'
            }
        }],
        graphic: [{
            type: 'text' as const,
            right: '5%',
            top: '83%',
            style: {
                text: '(경과일)',
                fill: textColor,
                fontSize: chartSizes.axisLabelSize,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontWeight: 500
            }
        }]
    };

    return (
        <PopupContainer
            isOpen={isOpen}
            onClose={onClose}
            title="임신사고"
            subtitle="지난주 원인별 및 임신 경과일별 사고현황"
            id="pop-accident"
        >
            {/* 탭 헤더 */}
            <div className="popup-tabs">
                <button
                    className={`popup-tab ${activeTab === 'table' ? 'active' : ''}`}
                    onClick={() => setActiveTab('table')}
                >
                    <FontAwesomeIcon icon={faTable} className="fa-sm" /> 원인별 사고복수
                </button>
                <button
                    className={`popup-tab ${activeTab === 'chart' ? 'active' : ''}`}
                    onClick={() => setActiveTab('chart')}
                >
                    <FontAwesomeIcon icon={faChartSimple} className="fa-sm" /> 경과일별 사고복수
                </button>
            </div>

            {/* 탭 컨텐츠: 테이블 */}
            {activeTab === 'table' && (
                <div className="popup-tab-content" id="tab-accident-table">
                    <div className="popup-section-desc justify-end">
                        <span>단위: 복</span>
                    </div>
                    <div className="popup-table-wrap">
                        <table className="popup-table-02" id="tbl-accident-cause">
                            <thead>
                                <tr>
                                    <th>구분</th>
                                    <th>지난주</th>
                                    <th>최근1개월</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.table.map((row, index) => (
                                    <tr key={index}>
                                        <td className="label">{row.type}</td>
                                        <td>
                                            <div className="cell-with-bar">
                                                <div className="bar-bg">
                                                    <div
                                                        className="bar-fill red"
                                                        style={{ width: `${row.lastWeekPct || 0}%` }}
                                                    />
                                                </div>
                                                <span className="percent">{(row.lastWeekPct || 0).toFixed(1)}%</span>
                                                <span className="value">{formatNumber(row.lastWeek)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="cell-with-bar">
                                                <div className="bar-bg">
                                                    <div
                                                        className="bar-fill gray"
                                                        style={{ width: `${row.lastMonthPct || 0}%` }}
                                                    />
                                                </div>
                                                <span className="percent">{(row.lastMonthPct || 0).toFixed(1)}%</span>
                                                <span className="value">{formatNumber(row.lastMonth)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                <tr className="sum-row">
                                    <td className="label">합계</td>
                                    <td className="total">{formatNumber(lastWeekTotal)}</td>
                                    <td className="total">{formatNumber(lastMonthTotal)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 탭 컨텐츠: 차트 */}
            {activeTab === 'chart' && (
                <div className="popup-tab-content" id="tab-accident-chart">
                    <div className="popup-section-desc justify-end">
                        <span>(경과일)교배~사고기간, 임돈전출/판매 제외</span>
                    </div>
                    <div id="cht-accident-preg">
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
