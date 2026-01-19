import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { CullingPopupData } from '@/types/weekly';
import { PopupContainer } from './PopupContainer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTable, faChartBar } from '@fortawesome/free-solid-svg-icons';
import { useChartResponsive } from './useChartResponsive';
import { useTheme } from '@/contexts/ThemeContext';
import { formatNumber } from '@/utils/format';

interface CullingPopupProps {
    isOpen: boolean;
    onClose: () => void;
    data: CullingPopupData;
}

/**
 * 도태폐사 팝업 (2탭 구조)
 * - 공통: 유형별 스탯 바 (cullingStatsBar)
 * - 탭1: 원인별 도폐사 테이블 (tbl-culling-cause)
 * - 탭2: 상태별 차트 (DOPE_CHART)
 * @see popup.js tpl-culling
 */
export const CullingPopup: React.FC<CullingPopupProps> = ({ isOpen, onClose, data }) => {
    const [activeTab, setActiveTab] = useState<'cause' | 'status'>('cause');
    const chartSizes = useChartResponsive();
    const { theme } = useTheme();

    // 다크모드 색상
    const isDark = theme === 'dark';
    const textColor = isDark ? '#e6edf3' : '#1d1d1f';

    // 합계 계산
    const lastWeekTotal = data.table.reduce((sum, row) => sum + row.lastWeek, 0);
    const lastMonthTotal = data.table.reduce((sum, row) => sum + row.lastMonth, 0);

    // 스탯바 데이터 (원본: danger/warning 클래스)
    const statItems = [
        { label: '도태', value: data.stats.dotae, type: 'danger' as const },
        { label: '폐사', value: data.stats.dead, type: 'danger' as const },
        { label: '전출', value: data.stats.transfer, type: 'warning' as const },
        { label: '판매', value: data.stats.sale, type: 'warning' as const }
    ];

    // 차트 데이터 (items가 있으면 사용, 없으면 기존 구조)
    // 백엔드에서 TC_CODE_SYS PCODE='01' 캐시로 상태코드→코드명 변환됨
    const chartItems = data.chart.items || data.chart.xAxis.map((label, i) => ({
        status: label,
        statusCd: '',
        count: data.chart.data[i] || 0
    }));

    // 차트 합계
    const chartTotal = chartItems.reduce((sum, item) => sum + item.count, 0);

    // 상태별 차트 옵션 (가로 막대)
    const statusChartOption = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            textStyle: { fontSize: chartSizes.tooltipSize },
            formatter: (params: { name: string; value: number }[]) => {
                const d = params[0];
                const pct = chartTotal > 0 ? ((d.value / chartTotal) * 100).toFixed(1) : '0';
                return `${d.name}: ${d.value}두 (${pct}%)`;
            }
        },
        grid: {
            left: 10,
            right: 80,
            top: 10,
            bottom: 10,
            containLabel: true
        },
        xAxis: {
            type: 'value',
            show: false
        },
        yAxis: {
            type: 'category',
            data: chartItems.map(d => d.status).reverse(),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
                color: textColor,
                fontSize: chartSizes.axisLabelSize,
                fontWeight: 600
            }
        },
        series: [{
            type: 'bar',
            barWidth: 20,
            data: chartItems.map(d => {
                const pct = chartTotal > 0 ? ((d.count / chartTotal) * 100).toFixed(1) : '0';
                return {
                    value: d.count,
                    itemStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 1, y2: 0,
                            colorStops: [
                                { offset: 0, color: '#ef4444' },
                                { offset: 1, color: '#f97316' }
                            ]
                        },
                        borderRadius: [0, 4, 4, 0]
                    },
                    label: {
                        show: true,
                        position: 'right',
                        formatter: `${d.count}두 (${pct}%)`,
                        fontSize: chartSizes.dataLabelSize,
                        color: isDark ? '#66d9ef' : '#666'
                    }
                };
            }).reverse()
        }]
    };

    return (
        <PopupContainer
            isOpen={isOpen}
            onClose={onClose}
            title="모돈 도폐사/전출/출하"
            subtitle="지난주 유형별 및 원인별 도폐사현황"
            id="pop-culling"
        >
            {/* 유형별 스탯 바 (공통 - 탭 위에 배치) */}
            <div className="popup-section-label">
                <span>유형별 현황</span>
                <span className="popup-section-desc">단위: 복</span>
            </div>
            <div className="stats-bar-modern" id="cullingStatsBar">
                {statItems.map((item, index) => (
                    <div key={index} className="stats-bar-modern-item">
                        <div className="stats-bar-modern-label">{item.label}</div>
                        <div className={`stats-bar-modern-value ${item.type}`}>
                            {formatNumber(item.value)}
                        </div>
                    </div>
                ))}
            </div>

            {/* 탭 헤더 */}
            <div className="popup-tabs" style={{ marginTop: '16px' }}>
                <button
                    className={`popup-tab ${activeTab === 'cause' ? 'active' : ''}`}
                    onClick={() => setActiveTab('cause')}
                >
                    <FontAwesomeIcon icon={faTable} className="fa-sm" /> 도폐사 원인별
                </button>
                <button
                    className={`popup-tab ${activeTab === 'status' ? 'active' : ''}`}
                    onClick={() => setActiveTab('status')}
                >
                    <FontAwesomeIcon icon={faChartBar} className="fa-sm" /> 도폐사시 상태별
                </button>
            </div>

            {/* 탭1: 원인별 도폐사 테이블 */}
            {activeTab === 'cause' && (
                <div className="popup-tab-content" id="tab-culling-cause">
                    <div className="popup-section-label">
                        <span>원인별 도폐사</span>
                        <span className="popup-section-desc">단위: 두</span>
                    </div>
                    <div className="popup-table-wrap">
                        <table className="popup-table-02" id="tbl-culling-cause">
                            <thead>
                                <tr>
                                    <th>원인</th>
                                    <th>지난주</th>
                                    <th>최근1개월</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.table.map((row, index) => {
                                    // 비율: 합계 기준 (100% = 합계)
                                    const lastWeekPercent = lastWeekTotal > 0 ? (row.lastWeek / lastWeekTotal * 100).toFixed(1) : '0';
                                    const lastMonthPercent = lastMonthTotal > 0 ? (row.lastMonth / lastMonthTotal * 100).toFixed(1) : '0';
                                    // 바 너비: 합계 대비 비율
                                    const lastWeekBarWidth = lastWeekTotal > 0 ? (row.lastWeek / lastWeekTotal * 100) : 0;
                                    const lastMonthBarWidth = lastMonthTotal > 0 ? (row.lastMonth / lastMonthTotal * 100) : 0;

                                    return (
                                        <tr key={index}>
                                            <td className="label">{row.reason}</td>
                                            <td>
                                                <div className="cell-with-bar">
                                                    <div className="bar-bg">
                                                        <div
                                                            className="bar-fill red"
                                                            style={{ width: `${lastWeekBarWidth}%` }}
                                                        />
                                                    </div>
                                                    <span className="percent">{lastWeekPercent}%</span>
                                                    <span className="value">{formatNumber(row.lastWeek)}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-with-bar">
                                                    <div className="bar-bg">
                                                        <div
                                                            className="bar-fill gray"
                                                            style={{ width: `${lastMonthBarWidth}%` }}
                                                        />
                                                    </div>
                                                    <span className="percent">{lastMonthPercent}%</span>
                                                    <span className="value">{formatNumber(row.lastMonth)}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
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

            {/* 탭2: 상태별 차트 */}
            {activeTab === 'status' && (
                <div className="popup-tab-content" id="tab-culling-status">
                    <div className="popup-section-label">
                        <span>도폐사시 상태별현황</span>
                        <span className="popup-section-desc">지난주 기준</span>
                    </div>
                    <div id="cht-culling-status">
                        <ReactECharts
                            option={statusChartOption}
                            style={{ width: '100%', height: '280px' }}
                            opts={{ renderer: 'svg' }}
                        />
                    </div>
                </div>
            )}
        </PopupContainer>
    );
};
