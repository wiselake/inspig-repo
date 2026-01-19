'use client';

import React, { useEffect, useRef } from 'react';
import { PsyTrendPopupData } from '@/types/weekly';
import { PopupContainer } from './PopupContainer';
import * as echarts from 'echarts';
import { useChartResponsive } from './useChartResponsive';

interface PsyTrendPopupProps {
    isOpen: boolean;
    onClose: () => void;
    data: PsyTrendPopupData;
}

export const PsyTrendPopup: React.FC<PsyTrendPopupProps> = ({ isOpen, onClose, data }) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<echarts.ECharts | null>(null);
    const chartSizes = useChartResponsive();

    useEffect(() => {
        if (!isOpen || !chartRef.current) return;

        // Dispose existing chart
        if (chartInstance.current) {
            chartInstance.current.dispose();
        }

        // Initialize chart
        const chart = echarts.init(chartRef.current);
        chartInstance.current = chart;

        const isDark = document.documentElement.classList.contains('dark');
        const labelColor = isDark ? '#e6edf3' : '#1a1a2e';
        const borderColor = isDark ? '#161b22' : '#ffffff';

        const option: echarts.EChartsOption = {
            tooltip: {
                trigger: 'item',
                formatter: (params: unknown) => {
                    const p = params as { dataIndex: number };
                    if (data?.heatmapData?.length > 0) {
                        const d = data.heatmapData[p.dataIndex];
                        return `구간: ${d[3]}<br/>농가수: ${d[2]}개`;
                    }
                    return '';
                },
                backgroundColor: isDark ? 'rgba(22, 27, 34, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#ddd',
                textStyle: { color: isDark ? '#e6edf3' : '#333' }
            },
            grid: {
                left: '5%',
                right: '3%',
                top: '5%',
                bottom: '22%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: ['3일이내', '4일~14일', '15일~30일', '30일 초과'],
                name: '입력 지연일',
                nameLocation: 'middle',
                nameGap: 35,
                nameTextStyle: {
                    color: isDark ? '#e6edf3' : '#555',
                    fontSize: chartSizes.axisNameSize,
                    fontWeight: 500
                },
                axisLabel: {
                    fontSize: chartSizes.axisLabelSize,
                    color: isDark ? '#e6edf3' : '#555',
                    interval: 0
                },
                axisTick: { show: false },
                axisLine: { show: false },
                splitArea: { show: true }
            },
            yAxis: {
                type: 'category',
                data: ['PSY<20', '20≤PSY<24', '24≤PSY<28', 'PSY≥28'],
                axisLabel: {
                    fontSize: chartSizes.axisLabelSize,
                    color: isDark ? '#e6edf3' : '#555'
                },
                axisTick: { show: false },
                axisLine: { show: false },
                splitArea: { show: true }
            },
            visualMap: {
                min: 0,
                max: 110,
                calculable: true,
                orient: 'horizontal',
                left: 'center',
                bottom: '2%',
                inRange: {
                    color: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b']
                },
                textStyle: { color: isDark ? '#e6edf3' : '#555', fontSize: chartSizes.legendSize }
            },
            series: [{
                type: 'heatmap',
                data: (data?.heatmapData || []).map((item) => [item[0], item[1], item[2]]),
                label: {
                    show: true,
                    fontSize: chartSizes.dataLabelSize + 4,
                    fontWeight: 'bold',
                    color: labelColor,
                    formatter: (params: unknown) => {
                        const p = params as { dataIndex: number };
                        if (data?.heatmapData?.length > 0) {
                            const d = data.heatmapData[p.dataIndex];
                            return `${d[3]}\n${d[2]}`;
                        }
                        return '';
                    },
                    textBorderColor: borderColor,
                    textBorderWidth: 2
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                },
                markPoint: {
                    symbol: 'pin',
                    symbolSize: 50,
                    symbolOffset: ['60%', 0],
                    itemStyle: {
                        color: '#ff4444',
                        borderColor: borderColor,
                        borderWidth: 2
                    },
                    label: {
                        show: true,
                        formatter: 'My',
                        fontSize: 11,
                        fontWeight: 'bold',
                        color: '#fff'
                    },
                    data: [{
                        name: '내농장',
                        coord: data?.myFarmPosition || [1, 2],
                        value: '내농장'
                    }]
                }
            }]
        };

        chart.setOption(option);

        // Resize handler
        const handleResize = () => chart.resize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.dispose();
            chartInstance.current = null;
        };
    }, [isOpen, data, chartSizes]);

    return (
        <PopupContainer
            isOpen={isOpen}
            onClose={onClose}
            title="PSY & 입력지연 상관관계 분석"
            subtitle="모니터링농가 기준 (약 50%)"
            maxWidth="max-w-2xl"
            id="pop-psy"
        >
            <div id="cht-psy-heatmap" ref={chartRef} style={{ width: '100%', height: '400px' }} />
        </PopupContainer>
    );
};
