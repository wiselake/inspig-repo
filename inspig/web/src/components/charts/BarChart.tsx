/**
 * ============================================================================
 * 막대 차트 (Bar Chart)
 * ============================================================================
 *
 * @description 수직/수평 막대 차트 컴포넌트
 * @requires echarts-for-react
 *
 * @props
 * - xData      : X축 카테고리 배열
 * - series     : 시리즈 데이터 배열 [{name, data, color?}]
 * - horizontal : 수평 막대 여부 (default: false)
 * - stacked    : 스택형 여부 (default: false)
 * - itemColors : 각 막대별 색상 배열 (단일 시리즈에서 막대마다 다른 색상)
 *
 * @example
 * // 기본 사용
 * <BarChart
 *   xData={['1월', '2월', '3월']}
 *   series={[{ name: '교배', data: [10, 20, 15] }]}
 * />
 *
 * // 막대별 다른 색상 (산차별 분포 등)
 * <BarChart
 *   xData={['1산', '2산', '3산']}
 *   series={[{ name: '두수', data: [10, 20, 15] }]}
 *   itemColors={PARITY_COLORS}
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
interface BarChartProps {
  xData: string[];
  series: SeriesData[];
  title?: string;
  height?: number;
  horizontal?: boolean;     // 수평 막대
  stacked?: boolean;        // 스택형
  barWidth?: string;        // 막대 너비 (예: '60%')
  itemColors?: readonly string[] | string[];  // 각 막대별 색상 (단일 시리즈용)
}

// ─────────────────────────────────────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────
export default function BarChart({
  xData,
  series,
  title,
  height = CHART_DEFAULTS.height,
  horizontal = false,
  stacked = false,
  barWidth,
  itemColors,
}: BarChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // 막대 너비 계산 (시리즈 수에 따라 자동 조절)
  const calculatedBarWidth = barWidth ?? (series.length > 1 ? '30%' : '60%');

  // 막대별 색상 적용을 위한 데이터 변환
  const transformData = (data: number[], colors?: readonly string[] | string[]) => {
    if (!colors || colors.length === 0) return data;
    return data.map((value, idx) => ({
      value,
      itemStyle: {
        color: colors[idx % colors.length],
        borderRadius: horizontal
          ? [0, CHART_DEFAULTS.barRadius[0], CHART_DEFAULTS.barRadius[0], 0]
          : CHART_DEFAULTS.barRadius,
      },
    }));
  };

  const option: EChartsOption = {
    title: getBaseTitleOption(title),
    tooltip: getBaseTooltip('axis'),
    legend: getBaseLegend(series.length > 1),
    grid: getBaseGridOption(!!title, series.length > 1),

    // 수평/수직에 따른 축 설정
    xAxis: horizontal
      ? { type: 'value', axisLabel: { fontSize: CHART_DEFAULTS.fontSize.label } }
      : getBaseXAxis(xData),
    yAxis: horizontal
      ? { type: 'category', data: xData, axisLabel: { fontSize: CHART_DEFAULTS.fontSize.label } }
      : getBaseYAxis(),

    // 시리즈 생성
    series: series.map((s, idx) => {
      // itemColors가 있고 단일 시리즈일 때만 막대별 색상 적용
      const useItemColors = itemColors && series.length === 1;

      return {
        name: s.name,
        type: 'bar' as const,
        data: useItemColors ? transformData(s.data, itemColors) : s.data,
        stack: stacked ? 'total' : undefined,
        itemStyle: useItemColors ? undefined : {
          color: s.color || CHART_COLORS[idx % CHART_COLORS.length],
          borderRadius: horizontal
            ? [0, CHART_DEFAULTS.barRadius[0], CHART_DEFAULTS.barRadius[0], 0]
            : CHART_DEFAULTS.barRadius,
        },
        barWidth: calculatedBarWidth,
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
