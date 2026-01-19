/**
 * ============================================================================
 * 선 차트 (Line Chart)
 * ============================================================================
 * 
 * @description 추이/비교용 선 차트 컴포넌트
 * @requires echarts-for-react
 * 
 * @props
 * - xData     : X축 카테고리 배열
 * - series    : 시리즈 데이터 배열 [{name, data, color?}]
 * - areaStyle : 영역 채우기 여부 (default: false)
 * - smooth    : 부드러운 곡선 여부 (default: true)
 * 
 * @example
 * <LineChart
 *   xData={['1월', '2월', '3월']}
 *   series={[
 *     { name: 'PSY', data: [24.5, 25.1, 25.8], color: '#2a5298' },
 *     { name: '목표', data: [25, 25, 25], color: '#28a745' }
 *   ]}
 * />
 * ============================================================================
 */
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { EChartsOption } from 'echarts';
import {
  CHART_COLORS,
  CHART_DEFAULTS,
  ECHARTS_PROPS,
  getBaseTitleOption,
  getBaseGridOption,
  getBaseTooltip,
  getBaseLegend,
  getBaseXAxis,
  getBaseYAxis,
  type SeriesData,
} from './chartConfig';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

// ─────────────────────────────────────────────────────────────────────────────
// Props 타입
// ─────────────────────────────────────────────────────────────────────────────
interface LineChartProps {
  xData: string[];
  series: SeriesData[];
  title?: string;
  height?: number;
  areaStyle?: boolean;      // 영역 채우기
  smooth?: boolean;         // 부드러운 곡선
  showSymbol?: boolean;     // 데이터 포인트 표시
}

// ─────────────────────────────────────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────
export default function LineChart({
  xData,
  series,
  title,
  height = CHART_DEFAULTS.height,
  areaStyle = false,
  smooth = true,
  showSymbol = true,
}: LineChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const option: EChartsOption = {
    title: getBaseTitleOption(title),
    tooltip: getBaseTooltip('axis'),
    legend: getBaseLegend(series.length > 1),
    grid: getBaseGridOption(!!title, series.length > 1),
    
    xAxis: {
      ...getBaseXAxis(xData),
      boundaryGap: false as const,     // 선 차트는 경계에서 시작
    } as EChartsOption['xAxis'],
    yAxis: getBaseYAxis(),
    
    // 시리즈 생성
    series: series.map((s, idx) => {
      const seriesColor = s.color || CHART_COLORS[idx % CHART_COLORS.length];
      return {
        name: s.name,
        type: 'line' as const,
        data: s.data,
        smooth,
        showSymbol,
        symbolSize: 6,
        itemStyle: { color: seriesColor },
        lineStyle: { 
          color: seriesColor, 
          width: CHART_DEFAULTS.lineWidth,
        },
        // 영역 채우기 (투명도 20%)
        areaStyle: areaStyle ? { 
          color: `${seriesColor}33`,
        } : undefined,
        animationDuration: CHART_DEFAULTS.animation.duration,
        animationEasing: CHART_DEFAULTS.animation.easing,
      };
    }),
  };

  // SSR 로딩 상태
  if (!isMounted) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <ReactECharts
      option={option}
      style={{ height }}
      {...ECHARTS_PROPS}
    />
  );
}
