'use client';

import React, { useEffect, useRef } from 'react';
import { AuctionPopupData } from '@/types/weekly';
import { PopupContainer } from './PopupContainer';
import * as echarts from 'echarts';
import { useChartResponsive } from './useChartResponsive';

interface AuctionPopupProps {
    isOpen: boolean;
    onClose: () => void;
    data: AuctionPopupData;
}

export const AuctionPopup: React.FC<AuctionPopupProps> = ({ isOpen, onClose, data }) => {
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
        const borderWhite = isDark ? '#161b22' : '#fff';
        const labelColor = isDark ? '#ff6b6b' : '#EF4444';

        const option: echarts.EChartsOption = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                backgroundColor: isDark ? 'rgba(22, 27, 34, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#ddd',
                textStyle: { color: isDark ? '#e6edf3' : '#333' }
            },
            legend: {
                data: ['1+', '1', '2', '등외', '등외제외', '평균'],
                show: true,
                bottom: '2%',
                left: 'center',
                itemGap: 12,
                itemWidth: 14,
                itemHeight: 10,
                textStyle: {
                    fontSize: chartSizes.legendSize,
                    color: isDark ? '#e6edf3' : '#555'
                }
            },
            grid: {
                left: '3%',
                right: '2%',
                top: '5%',
                bottom: '18%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: data?.xData || [],
                axisLabel: {
                    fontSize: chartSizes.axisLabelSize,
                    color: isDark ? '#e6edf3' : '#555',
                    rotate: 30,
                    interval: 0
                },
                axisLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.2)' : '#ddd' } }
            },
            yAxis: {
                type: 'value',
                min: 3500,
                max: 7000,
                axisLabel: {
                    fontSize: chartSizes.axisLabelSize,
                    color: isDark ? '#e6edf3' : '#555'
                },
                axisLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.2)' : '#ddd' } },
                splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' } }
            },
            series: [
                {
                    name: '1+',
                    type: 'bar',
                    data: data?.grade1Plus || [],
                    barMaxWidth: 30,
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#4F46E5' },
                            { offset: 1, color: '#4338CA' }
                        ]),
                        borderRadius: [4, 4, 0, 0]
                    }
                },
                {
                    name: '1',
                    type: 'bar',
                    data: data?.grade1 || [],
                    barMaxWidth: 30,
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#818CF8' },
                            { offset: 1, color: '#6366F1' }
                        ]),
                        borderRadius: [4, 4, 0, 0]
                    }
                },
                {
                    name: '2',
                    type: 'bar',
                    data: data?.grade2 || [],
                    barMaxWidth: 30,
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#C7D2FE' },
                            { offset: 1, color: '#A5B4FC' }
                        ]),
                        borderRadius: [4, 4, 0, 0]
                    }
                },
                {
                    name: '등외',
                    type: 'bar',
                    data: data?.gradeOut || [],
                    barMaxWidth: 30,
                    itemStyle: {
                        color: '#D1D5DB',
                        borderRadius: [4, 4, 0, 0],
                        borderColor: '#9CA3AF',
                        borderWidth: 1
                    }
                },
                {
                    name: '등외제외',
                    type: 'line',
                    data: data?.excludeOut || [],
                    smooth: true,
                    lineStyle: {
                        width: 4,
                        color: '#EF4444',
                        shadowBlur: 10,
                        shadowColor: '#EF4444'
                    },
                    itemStyle: {
                        color: '#EF4444',
                        borderWidth: 4,
                        borderColor: borderWhite
                    },
                    symbolSize: 10,
                    label: {
                        show: true,
                        position: 'top',
                        offset: [0, -5],
                        fontWeight: 'bold',
                        fontSize: chartSizes.dataLabelSize,
                        color: labelColor,
                        textBorderColor: isDark ? '#161b22' : '#ffffff',
                        textBorderWidth: 2,
                        formatter: (params) => {
                            const value = params.value as number;
                            return value.toLocaleString();
                        }
                    },
                    z: 10
                },
                {
                    name: '평균',
                    type: 'line',
                    data: data?.average || [],
                    smooth: true,
                    lineStyle: {
                        width: 2.5,
                        type: 'dashed',
                        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                            { offset: 0, color: '#FBBF24' },
                            { offset: 1, color: '#F59E0B' }
                        ])
                    },
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                            { offset: 0, color: '#FBBF24' },
                            { offset: 1, color: '#F59E0B' }
                        ])
                    },
                    symbolSize: 6
                }
            ]
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
            title="경락가격 추이"
            subtitle="축산물품질평가원 지육거래정보"
            maxWidth="max-w-2xl"
            id="pop-auction"
        >
            <div id="cht-auction-price" ref={chartRef} style={{ width: '100%', height: '350px' }} />
        </PopupContainer>
    );
};
