import React, { useState, useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { ShipmentPopupData } from '@/types/weekly';
import { PopupContainer } from './PopupContainer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTable, faChartLine, faCircle, faCircleQuestion, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useChartResponsive } from './useChartResponsive';
import { useTheme } from '@/contexts/ThemeContext';
import { formatNumber } from '@/utils/format';

interface ShipmentPopupProps {
    isOpen: boolean;
    onClose: () => void;
    data: ShipmentPopupData;
}

/**
 * 출하 실적 팝업 (3탭 구조)
 * - 탭1: 출하현황 (메트릭스 + 등급차트 + 일별 테이블)
 * - 탭2: 출하분석 차트 (출하,체중,등지방)
 * - 탭3: 도체분포 차트 (산점도)
 * @see popup.js tpl-shipment, com.js shipment()
 */
export const ShipmentPopup: React.FC<ShipmentPopupProps> = ({ isOpen, onClose, data }) => {
    const [activeTab, setActiveTab] = useState<'summary' | 'analysis' | 'carcass'>('summary');
    const [showTooltip, setShowTooltip] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const chartSizes = useChartResponsive();
    const { theme } = useTheme();

    // 다크모드 색상
    const isDark = theme === 'dark';
    const textColor = isDark ? '#e6edf3' : '#1d1d1f';
    const splitLineColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
    const dataLabelColor = isDark ? '#ffd700' : '#333';  // 다크모드: 골드 (확 뜨는 색상)
    const subLabelColor = isDark ? '#66d9ef' : '#666';   // 다크모드: 시안 (보조 라벨용)

    const { metrics, gradeChart, table, analysisChart, carcassChart, rearingConfig } = data;

    // 이유후육성율 산출기준 설정값 (기본값 적용)
    const shipDay = rearingConfig?.shipDay ?? 180;
    const weanPeriod = rearingConfig?.weanPeriod ?? 21;
    const euDays = rearingConfig?.euDays ?? (shipDay - weanPeriod);
    const euDateFrom = rearingConfig?.euDateFrom || '';
    const euDateTo = rearingConfig?.euDateTo || '';
    const total = gradeChart.reduce((sum, d) => sum + d.value, 0) || 1; // 0으로 나누기 방지
    const priceDiff = metrics.farmPrice - metrics.nationalPrice;
    const priceColor = priceDiff >= 0 ? '#28a745' : '#dc3545';

    // 툴팁 외부 클릭 감지
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
                setShowTooltip(false);
            }
        };

        if (showTooltip) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showTooltip]);

    // 등급 분포 가로 막대 차트 옵션
    const gradeChartOption = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            textStyle: { fontSize: chartSizes.tooltipSize },
            formatter: (params: { name: string; value: number }[]) => {
                const d = params[0];
                const name = d.name === '등외' ? '등외' : d.name + '등급';
                const pct = ((d.value / total) * 100).toFixed(1);
                return `${name}: ${d.value}두 (${pct}%)`;
            }
        },
        grid: {
            left: 30,
            right: 75,
            top: 5,
            bottom: 5
        },
        xAxis: {
            type: 'value',
            max: Math.max(...gradeChart.map(d => d.value)) * 1.5,
            show: false
        },
        yAxis: {
            type: 'category',
            data: gradeChart.map(d => d.name).reverse(),
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
            barWidth: 16,
            data: gradeChart.map(d => ({
                value: d.value,
                itemStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 1, y2: 0,
                        colorStops: [
                            { offset: 0, color: d.color },
                            { offset: 1, color: d.colorEnd }
                        ]
                    },
                    borderRadius: [0, 4, 4, 0]
                },
                label: {
                    show: true,
                    position: 'right',
                    formatter: `${d.value}두 (${((d.value / total) * 100).toFixed(1)}%)`,
                    fontSize: chartSizes.dataLabelSize,
                    color: subLabelColor
                }
            })).reverse()
        }]
    };

    // 출하분석 차트 옵션 (복합 차트 - 원본 com.js _initShipmentAnalysisChart 참조)
    const analysisChartOption = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross', crossStyle: { color: isDark ? '#999' : '#999' } },
            backgroundColor: isDark ? 'rgba(30,35,45,0.95)' : 'rgba(255,255,255,0.95)',
            borderColor: isDark ? '#444' : '#e0e0e0',
            borderWidth: 1,
            textStyle: { color: textColor, fontSize: chartSizes.tooltipSize },
            formatter: (params: { axisValue: string; marker: string; seriesName: string; value: number }[]) => {
                let result = '<strong>' + params[0].axisValue + '</strong><br/>';
                params.forEach(item => {
                    const unit = item.seriesName === '출하두수' ? '두' : item.seriesName === '체중' ? 'kg' : 'mm';
                    result += item.marker + ' ' + item.seriesName + ': <strong>' + item.value + '</strong>' + unit + '<br/>';
                });
                return result;
            }
        },
        legend: {
            data: ['체중', '등지방 두께', '출하두수'],
            bottom: '2%',
            textStyle: { fontWeight: 600, fontSize: chartSizes.legendSize, color: textColor },
            itemGap: 15
        },
        grid: {
            left: '3%',
            right: '5%',
            bottom: '12%',
            top: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: analysisChart.dates,
            axisLabel: {
                fontSize: chartSizes.axisLabelSize,
                interval: 0,
                color: textColor,
                rotate: 15,
                formatter: (value: string) => value + '일'
            },
            axisLine: { lineStyle: { width: 2, color: isDark ? '#555' : '#333' } }
        },
        yAxis: [
            {
                type: 'value',
                name: '출하두수',
                nameGap: 20,
                nameTextStyle: { fontSize: chartSizes.axisNameSize, color: isDark ? '#a78bfa' : '#667eea' },
                position: 'left',
                axisLine: { show: true, lineStyle: { color: isDark ? '#a78bfa' : '#667eea', width: 2 } },
                axisLabel: { formatter: '{value}', fontSize: chartSizes.axisLabelSize, color: textColor },
                splitLine: { lineStyle: { type: 'dashed', color: splitLineColor } }
            },
            {
                type: 'value',
                name: '체중/등지방',
                nameGap: 20,
                nameTextStyle: { fontSize: chartSizes.axisNameSize, color: isDark ? '#34d399' : '#10b981' },
                position: 'right',
                min: 0,
                max: 120,
                interval: 10,
                axisLine: { show: true, lineStyle: { color: isDark ? '#34d399' : '#10b981', width: 2 } },
                axisLabel: { formatter: '{value}', fontSize: chartSizes.axisLabelSize, color: textColor },
                splitLine: { show: false }
            }
        ],
        series: [
            {
                name: '출하두수',
                type: 'bar',
                yAxisIndex: 0,
                data: analysisChart.shipCount,
                itemStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: '#667eea' },
                            { offset: 1, color: '#764ba2' }
                        ]
                    },
                    borderRadius: [4, 4, 0, 0]
                },
                barMaxWidth: 35,
                label: {
                    show: true,
                    position: 'insideBottom',
                    offset: [0, -1],
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: chartSizes.dataLabelSize
                }
            },
            {
                name: '체중',
                type: 'line',
                yAxisIndex: 1,
                data: analysisChart.avgWeight,
                symbol: 'rect',
                symbolSize: 10,
                lineStyle: {
                    color: '#10b981',
                    width: 3,
                    shadowBlur: 8,
                    shadowColor: 'rgba(16, 185, 129, 0.4)'
                },
                itemStyle: {
                    color: '#10b981',
                    borderWidth: 3,
                    borderColor: '#fff',
                    shadowBlur: 6,
                    shadowColor: 'rgba(16, 185, 129, 0.4)'
                },
                label: {
                    show: true,
                    position: 'top',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: chartSizes.dataLabelSize,
                    backgroundColor: '#10b981',
                    padding: [2, 4],
                    borderRadius: 3
                }
            },
            {
                name: '등지방 두께',
                type: 'line',
                yAxisIndex: 1,
                data: analysisChart.avgBackfat,
                symbol: 'triangle',
                symbolSize: 10,
                lineStyle: {
                    color: '#ffa500',
                    width: 3,
                    type: 'dashed'
                },
                itemStyle: {
                    color: '#ffa500',
                    borderWidth: 2,
                    borderColor: '#fff'
                },
                label: {
                    show: true,
                    position: 'top',
                    color: '#ffa500',
                    fontWeight: 'bold',
                    fontSize: chartSizes.dataLabelSize
                }
            }
        ]
    };

    // 도체분포 산점도 옵션 (원본 com.js _initShipmentCarcassChart 참조)
    // 60 미만 데이터를 60에 합산 처리
    const carcassDataRaw = carcassChart.data || [];
    let hasUnder60 = false;
    const mergedMap = new Map<number, number>(); // key: backfat, value: count (60 미만 합산용)
    const carcassData: number[][] = [];

    carcassDataRaw.forEach(item => {
        const [weight, backfat, count] = item;
        if (weight < 65) {
            hasUnder60 = true;
            // 65 미만 데이터는 동일 등지방별로 합산
            mergedMap.set(backfat, (mergedMap.get(backfat) || 0) + count);
        } else {
            carcassData.push([weight, backfat, count]);
        }
    });

    // 65 미만 합산 데이터를 65 위치에 추가
    mergedMap.forEach((count, backfat) => {
        carcassData.push([65, backfat, count]);
    });

    // 동적 min/max 계산
    let xMax = -Infinity, yMax = -Infinity;
    let yMinData = Infinity;
    let totalCount = 0, grade1Count = 0, grade2Count = 0;

    // 등급 계산은 원본 데이터 기준
    carcassDataRaw.forEach(item => {
        const [weight, backfat, count] = item;
        if (weight > xMax) xMax = weight;
        if (backfat > yMax) yMax = backfat;
        if (backfat < yMinData) yMinData = backfat;
        totalCount += count;
        // 1등급 범위: 83~92kg, 17~24mm
        if (weight >= 83 && weight <= 92 && backfat >= 17 && backfat <= 24) {
            grade1Count += count;
        }
        // 2등급 범위: 80~97kg, 15~27mm (1등급 제외)
        else if (weight >= 80 && weight <= 97 && backfat >= 15 && backfat <= 27) {
            grade2Count += count;
        }
    });
    const grade1Rate = totalCount > 0 ? ((grade1Count / totalCount) * 100).toFixed(1) : '0.0';
    const grade2Rate = totalCount > 0 ? ((grade2Count / totalCount) * 100).toFixed(1) : '0.0';
    // X축: 65 고정 (65 미만 데이터 합산)
    const xMin = 65;
    // Y축: 데이터 최소값 - 5 (5단위 내림), 최대 10
    const yMin = Math.min(Math.floor((yMinData - 5) / 5) * 5, 10);
    xMax = Math.max(Math.ceil(xMax / 5) * 5, 100);  // 최소 100
    yMax = Math.max(Math.ceil(yMax / 5) * 5, 30);   // 최소 30

    const carcassChartOption = {
        tooltip: {
            trigger: 'item',
            backgroundColor: isDark ? 'rgba(30,35,45,0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: isDark ? '#444' : '#ddd',
            textStyle: { color: textColor, fontSize: chartSizes.tooltipSize },
            formatter: (params: { data: number[] }) =>
                `도체중: ${params.data[0]}kg<br/>등지방두께: ${params.data[1]}mm<br/>두수: ${params.data[2]}두`
        },
        grid: {
            left: '0%',
            right: '2%',
            bottom: '15%',
            top: '8%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            name: '도체중 (kg)',
            nameLocation: 'middle',
            nameGap: 40,
            nameTextStyle: { fontSize: chartSizes.axisNameSize, color: textColor },
            min: xMin,
            max: xMax,
            interval: 5,
            axisLabel: {
                rotate: 45,
                fontSize: chartSizes.axisLabelSize,
                color: textColor,
                formatter: (value: number) => {
                    // 65 미만 데이터가 있으면 65 레이블에 ↓ 표시
                    if (value === 65 && hasUnder60) {
                        return '65↓';
                    }
                    return String(value);
                }
            },
            splitLine: { show: true, lineStyle: { color: splitLineColor, type: 'dashed' } }
        },
        yAxis: {
            type: 'value',
            name: '등지방두께 (mm)',
            nameLocation: 'end',
            nameGap: 5,
            nameTextStyle: { align: 'left', fontSize: chartSizes.axisNameSize, color: textColor },
            min: yMin,
            max: yMax,
            interval: 5,
            axisLabel: { fontSize: chartSizes.axisLabelSize, color: textColor },
            splitLine: { show: true, lineStyle: { color: splitLineColor, type: 'dashed' } }
        },
        series: [{
            type: 'scatter',
            symbolSize: 15,
            itemStyle: { color: 'transparent', borderWidth: 0 },
            label: {
                show: true,
                position: 'inside',
                formatter: (params: { data: number[] }) => params.data[2],
                color: dataLabelColor,
                fontWeight: 'bold',
                fontSize: chartSizes.dataLabelSize
            },
            data: carcassData,
            markArea: {
                silent: true,
                data: [
                    // 2등급 영역 (회색)
                    [
                        { xAxis: 80, yAxis: 15, itemStyle: { color: 'rgba(192, 192, 192, 0.3)' } },
                        { xAxis: 97, yAxis: 27 }
                    ],
                    // 1등급 영역 (파란색)
                    [
                        { xAxis: 83, yAxis: 17, itemStyle: { color: 'rgba(128, 128, 255, 0.3)' } },
                        { xAxis: 92, yAxis: 24 }
                    ]
                ]
            }
        }]
    };

    // 행 하이라이트 스타일 (다크모드 대응)
    const getRowStyle = (highlight?: 'primary' | 'success') => {
        if (highlight === 'primary') {
            return {
                background: isDark
                    ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.2) 100%)'
                    : 'linear-gradient(135deg, #e8f0fe 0%, #d4e4fc 100%)'
            };
        } else if (highlight === 'success') {
            return {
                background: isDark
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(52, 211, 153, 0.15) 100%)'
                    : 'linear-gradient(135deg, #e6f7ed 0%, #d4f0e0 100%)'
            };
        }
        return {};
    };

    return (
        <PopupContainer
            isOpen={isOpen}
            onClose={onClose}
            title="출하 실적"
            subtitle="지난주 출하현황 및 도체분석"
            maxWidth="max-w-3xl"
            id="pop-shipment"
        >
            {/* 탭 헤더 (3탭) */}
            <div className="popup-tabs">
                <button
                    className={`popup-tab ${activeTab === 'summary' ? 'active' : ''}`}
                    onClick={() => setActiveTab('summary')}
                >
                    <FontAwesomeIcon icon={faTable} className="fa-sm" /> 출하현황
                </button>
                <button
                    className={`popup-tab ${activeTab === 'analysis' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analysis')}
                >
                    <FontAwesomeIcon icon={faChartLine} className="fa-sm" /> 출하,체중,등지방
                </button>
                <button
                    className={`popup-tab ${activeTab === 'carcass' ? 'active' : ''}`}
                    onClick={() => setActiveTab('carcass')}
                >
                    <FontAwesomeIcon icon={faCircle} className="fa-sm" /> 도체분포
                </button>
            </div>

            {/* 탭1: 출하현황 */}
            {activeTab === 'summary' && (
                <div className="popup-tab-content" id="tab-shipment-summary">
                    {/* 유형4: 상단 메트릭스/차트 + 하단 가격 비교 바 */}
                    <div className="shipment-top-grid" id="shipment-top-grid">
                        {/* 상단: 메트릭스 2x2 + 등급차트 */}
                        <div className="shipment-top-row">
                            <div className="metrics-2x2">
                                <div className="metric-item highlight">
                                    <div className="metric-value">{formatNumber(metrics.totalCount)}</div>
                                    <div className="metric-label">출하두수</div>
                                </div>
                                <div className="metric-item">
                                    <div className="metric-value">{metrics.grade1Rate}%</div>
                                    <div className="metric-label">1등급↑</div>
                                </div>
                                <div className="metric-item">
                                    <div className="metric-value">{metrics.avgCarcass}kg</div>
                                    <div className="metric-label">도체중</div>
                                </div>
                                <div className="metric-item">
                                    <div className="metric-value">{metrics.avgBackfat}mm</div>
                                    <div className="metric-label">등지방</div>
                                </div>
                            </div>
                            {/* 등급차트 - 가로 막대 */}
                            <div className="grade-chart-wrap" id="cht-shipment-grade">
                                <ReactECharts
                                    option={gradeChartOption}
                                    style={{ width: '100%', height: '120px' }}
                                    opts={{ renderer: 'svg' }}
                                />
                            </div>
                        </div>
                        {/* 하단: 가격 비교 바 */}
                        <div className="price-compare-bar">
                            <div className="price-item">
                                <div className="metric-value" style={{ color: priceColor }}>
                                    {formatNumber(metrics.farmPrice)}원
                                </div>
                                <div className="metric-label">내농장 수취단가</div>
                            </div>
                            <div className={`diff-badge ${priceDiff >= 0 ? 'positive' : 'negative'}`}>
                                {priceDiff >= 0 ? '+' : ''}{formatNumber(priceDiff)}원
                            </div>
                            <div className="price-item">
                                <div className="metric-value">{formatNumber(metrics.nationalPrice)}원</div>
                                <div className="metric-label">전국탕박 (제주,등외제외)</div>
                            </div>
                        </div>
                    </div>

                    {/* 일별 출하현황 테이블 */}
                    <div className="popup-section-label" style={{ marginTop: '12px' }}>
                        <span>일별 출하현황</span>
                    </div>
                    <div className="popup-table-wrap" style={{ overflowX: 'auto' }}>
                        <table className="popup-table-02 shipment-table" id="tbl-shipment-daily" style={{ minWidth: '600px' }}>
                            <thead>
                                <tr>
                                    <th colSpan={2} style={{ minWidth: '90px' }}>구분</th>
                                    {table.days.map((d, i) => (
                                        <th key={i}>{d.slice(-2)}일</th>
                                    ))}
                                    <th>합계</th>
                                    <th>비율</th>
                                    <th>평균</th>
                                </tr>
                            </thead>
                            <tbody>
                                {table.rows.map((row, idx) => {
                                    // 항상 소숫점 1자리: 이유후육성율(2), 합격율(3), 지육체중(11), 등지방(12)
                                    // 총지육(10)은 데이터셀은 정수, 평균만 소숫점
                                    const alwaysDecimalRow = [2, 3, 11, 12].includes(idx);
                                    const isTotalCarcassRow = idx === 10; // 총지육 행
                                    const formatValue = (v: number | null) => {
                                        if (v === null || v === 0) return '-';
                                        if (alwaysDecimalRow) {
                                            return Number(v).toFixed(1);
                                        }
                                        // 총지육 행: 데이터셀은 정수로 표시
                                        if (isTotalCarcassRow) {
                                            return Math.round(v);
                                        }
                                        // 두수: 정수면 정수로, 소숫점 있으면 1자리까지
                                        return v % 1 === 0 ? v : Number(v).toFixed(1);
                                    };

                                    // 비율 컬럼: rate 값 사용 (등급/성별 행만 데이터 있음)
                                    const formatRate = () => {
                                        if (row.rate == null || row.rate === 0) return '-';
                                        return row.rate.toFixed(1) + '%';
                                    };

                                    // 평균 컬럼: avg 값 사용
                                    const formatAvg = () => {
                                        if (row.avg == null || row.avg === 0) return '-';
                                        const avgVal = Number(row.avg);
                                        let formatted: string;
                                        // 총지육(10), 지육체중(11), 등지방(12), 이유후육성율(2), 합격율(3)은 평균에서 소숫점
                                        if (alwaysDecimalRow || isTotalCarcassRow) {
                                            formatted = avgVal.toFixed(1);
                                        } else {
                                            // 두수 평균: 정수면 정수로, 소숫점 있으면 1자리까지
                                            formatted = avgVal % 1 === 0 ? String(avgVal) : avgVal.toFixed(1);
                                        }
                                        return formatted + (row.unit || '');
                                    };

                                    return (
                                        <tr key={idx} style={getRowStyle(row.highlight)}>
                                            {row.colspan ? (
                                                <td colSpan={2} className="label">
                                                    {row.category}
                                                    {/* 이유후육성율(idx===2) 툴팁 */}
                                                    {idx === 2 && (
                                                        <div style={{ display: 'inline-block', marginLeft: '6px', position: 'relative', verticalAlign: 'middle' }} ref={tooltipRef}>
                                                            <FontAwesomeIcon
                                                                icon={faCircleQuestion}
                                                                className="clickable"
                                                                style={{ color: '#aaa', cursor: 'pointer' }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setShowTooltip(!showTooltip);
                                                                }}
                                                            />
                                                            {showTooltip && (
                                                                <div className="help-tooltip" style={{ width: '340px', left: '20px', top: '-10px', textAlign: 'left', zIndex: 100 }}>
                                                                    <div className="help-tooltip-header">
                                                                        <span>이유후육성율 산출기준</span>
                                                                        <button className="close-btn" onClick={() => setShowTooltip(false)}>
                                                                            <FontAwesomeIcon icon={faXmark} />
                                                                        </button>
                                                                    </div>
                                                                    <div className="help-tooltip-body">
                                                                        <div className="help-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                                                                            <span className="label">공식</span>
                                                                            <span className="desc">(출하두수 ÷ 과거이유두수) × 100</span>
                                                                        </div>
                                                                        <div className="help-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                                                                            <span className="label">과거이유두수</span>
                                                                            <span className="desc">
                                                                                출하일 기준 역산된 날짜의 이유두수 합계<br />
                                                                                <span style={{ fontSize: '0.85em', color: 'var(--rp-text-tertiary)' }}>
                                                                                    * 이유일 = 출하일 - (기준출하일령 {shipDay}일 - 평균포유기간 {weanPeriod}일)<br />
                                                                                    (설정값: {shipDay} - {weanPeriod} = {euDays}일 전)
                                                                                </span>
                                                                                {euDateFrom && euDateTo && (
                                                                                    <span style={{ display: 'block', marginTop: '4px', fontSize: '0.85em', color: 'var(--rp-text-secondary)' }}>
                                                                                        * 산출된 이유일: {euDateFrom} ~ {euDateTo}
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            ) : (
                                                <>
                                                    <td className="label">{row.category}</td>
                                                    <td className="label sub">{row.sub}</td>
                                                </>
                                            )}
                                            {row.data.map((v, i) => {
                                                // 이유후육성율(idx===2) 일별 데이터는 빈 셀 (주간 합계 기준만 사용)
                                                if (idx === 2) {
                                                    return <td key={i} className="na-cell"></td>;
                                                }
                                                return <td key={i}>{formatValue(v)}</td>;
                                            })}
                                            <td className="total sum">
                                                {row.sum != null && row.sum !== 0 ? formatNumber(row.sum) : '-'}
                                            </td>
                                            <td className="total rate">
                                                {formatRate()}
                                            </td>
                                            <td className="total avg">
                                                {formatAvg()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 탭2: 출하분석 차트 */}
            {activeTab === 'analysis' && (
                <div className="popup-tab-content" id="tab-shipment-analysis">
                    <div id="cht-shipment-analysis">
                        <ReactECharts
                            option={analysisChartOption}
                            style={{ width: '100%', height: '320px' }}
                            opts={{ renderer: 'svg' }}
                        />
                    </div>
                </div>
            )}

            {/* 탭3: 도체분포 차트 */}
            {activeTab === 'carcass' && (
                <div className="popup-tab-content" id="tab-shipment-carcass">
                    <div className="wr-popup-section-desc">
                        <span style={{ color: 'rgba(128, 128, 255, 0.8)', fontWeight: 600 }}>■</span> 1+ 출현 적정 범위 (83~92kg, 17~24mm): <strong>{grade1Rate}%</strong><br />
                        <span style={{ color: 'rgba(160, 160, 160, 0.8)', fontWeight: 600 }}>■</span> 1  출현 적정 범위 (80~97kg, 15~27mm): <strong>{grade2Rate}%</strong>
                    </div>
                    <div id="cht-shipment-carcass">
                        <ReactECharts
                            option={carcassChartOption}
                            style={{ width: '100%', height: '350px' }}
                            opts={{ renderer: 'svg' }}
                        />
                    </div>
                </div>
            )}
        </PopupContainer>
    );
};
