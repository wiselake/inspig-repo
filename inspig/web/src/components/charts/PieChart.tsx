/**
 * ============================================================================
 * 파이 차트 (Pie Chart)
 * ============================================================================
 * 
 * @description 비율 표시용 파이/도넛 차트 컴포넌트
 * @requires echarts-for-react
 * 
 * @props
 * - data      : 데이터 배열 [{name, value}]
 * - donut     : 도넛형 여부 (default: false)
 * - showLabel : 라벨 표시 여부 (default: true)
 * - roseType  : 장미형 차트 (default: false) - 반지름이 값에 비례
 * 
 * @example
 * <PieChart
 *   data={[
 *     { name: '1등급', value: 55 },
 *     { name: '2등급', value: 30 },
 *     { name: '등외', value: 15 }
 *   ]}
 *   donut
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
  getBaseTooltip,
  getBaseLegend,
  type PieData,
} from './chartConfig';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

// ─────────────────────────────────────────────────────────────────────────────
// Props 타입
// ─────────────────────────────────────────────────────────────────────────────
interface PieChartProps {
  data: PieData[];
  title?: string;
  height?: number;
  donut?: boolean;          // 도넛형 (중앙 빈 공간)
  showLabel?: boolean;      // 라벨 표시
  roseType?: boolean;       // 장미형 (반지름 비례)
  colors?: string[];        // 커스텀 색상
}

// ─────────────────────────────────────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────
export default function PieChart({
  data,
  title,
  height = CHART_DEFAULTS.height,
  donut = false,
  showLabel = true,
  roseType = false,
  colors = CHART_COLORS as unknown as string[],
}: PieChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const option: EChartsOption = {
    title: getBaseTitleOption(title),
    tooltip: {
      ...getBaseTooltip('item'),
      formatter: '{b}: {c} ({d}%)',  // 이름: 값 (비율%)
    },
    legend: getBaseLegend(true, 'bottom'),
    color: colors,
    
    series: [
      {
        type: 'pie',
        // 도넛형: 내부 반지름 40%, 일반: 0%
        radius: donut ? ['40%', '70%'] : ['0%', '70%'],
        center: ['50%', '45%'],
        roseType: roseType ? 'radius' : undefined,  // 장미형
        data: data,
        
        // 라벨 설정
        label: {
          show: showLabel,
          fontSize: CHART_DEFAULTS.fontSize.label,
          formatter: '{b}: {d}%',
        },
        labelLine: {
          show: showLabel,
          length: 10,
          length2: 10,
        },
        
        // 호버 효과
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
          },
          label: {
            show: true,
            fontWeight: 'bold',
          },
        },
        
        animationDuration: CHART_DEFAULTS.animation.duration,
        animationEasing: CHART_DEFAULTS.animation.easing,
      },
    ],
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
