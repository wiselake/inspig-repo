/**
 * ============================================================================
 * 차트 공통 설정 (Chart Common Configuration)
 * ============================================================================
 *
 * @description ECharts 공통 옵션 및 유틸리티
 * @module components/charts/chartConfig
 *
 * @exports
 * - CHART_COLORS      : 기본 색상 팔레트
 * - PARITY_COLORS     : 산차 분포용 색상 (10색)
 * - MATING_COLORS     : 교배 차트용 (블루 계열)
 * - ACCIDENT_COLORS   : 사고/폐사 차트용 (레드 계열)
 * - CULLING_COLORS    : 도태 차트용 (오렌지-레드 계열)
 * - STATUS_COLORS     : 상태 표시용 색상
 * - COMPARISON_COLORS : 비교 차트용 색상
 * - GRADE_COLORS      : 등급별 색상
 * - getThemeColors    : 테마별 색상 배열 반환 함수
 * - CHART_DEFAULTS    : 차트 기본 설정값
 * ============================================================================
 */

import type { EChartsOption } from 'echarts';

// ─────────────────────────────────────────────────────────────────────────────
// 기본 색상 팔레트
// ─────────────────────────────────────────────────────────────────────────────

/** 기본 색상 팔레트 (6색) */
export const CHART_COLORS = [
  '#2a5298',  // primary blue
  '#28a745',  // success green
  '#ff9800',  // warning orange
  '#dc3545',  // danger red
  '#17a2b8',  // info cyan
  '#6c757d',  // secondary gray
] as const;

/** 그라데이션용 색상 */
export const CHART_GRADIENTS = {
  blue: ['#667eea', '#764ba2'],
  green: ['#11998e', '#38ef7d'],
  orange: ['#f46b45', '#eea849'],
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 차트별 색상 테마 (Color Themes)
// ─────────────────────────────────────────────────────────────────────────────

/** 산차 분포 차트용 (10색) - 블루→퍼플 그라데이션 */
export const PARITY_COLORS = [
  '#8cb2d9', '#7e9fd6', '#7088d3', '#616dd1', '#5452cf',
  '#5743cd', '#5d33cc', '#692ec0', '#7429b4', '#7c24a8',
] as const;

/** 블루 단색 그라데이션 (옅은색→짙은색) */
export const GRADIENT_BLUE = [
  '#c9d9e8', '#b6cce2', '#a2bfdd', '#8db2d8', '#77a6d4',
  '#6199d1', '#4a8ccf', '#327fcd', '#2973bc', '#2266aa',
] as const;

/** 그린 단색 그라데이션 (옅은색→짙은색) */
export const GRADIENT_GREEN = [
  '#c9e8d4', '#b6e2c5', '#a2ddb5', '#8dd8a6', '#77d496',
  '#61d186', '#4acf76', '#32cd66', '#29bc5a', '#22aa4f',
] as const;

/** 블루→퍼플 듀얼 그라데이션 */
export const GRADIENT_BLUE_PURPLE = [
  '#8cb2d9', '#7e9fd6', '#7088d3', '#616dd1', '#5452cf',
  '#5743cd', '#5d33cc', '#692ec0', '#7429b4', '#7c24a8',
] as const;

/** 틸→블루 듀얼 그라데이션 */
export const GRADIENT_TEAL_BLUE = [
  '#8cd9d9', '#7ecfd6', '#70c5d3', '#61b8d1', '#52aacf',
  '#439acd', '#3388cc', '#2e74c0', '#2962b4', '#2450a8',
] as const;

/** 오렌지→레드 듀얼 그라데이션 */
export const GRADIENT_ORANGE_RED = [
  '#d9b38c', '#d6a57e', '#d39670', '#d18661', '#cf7552',
  '#cd6143', '#cc4c33', '#c03e2e', '#b43029', '#a82424',
] as const;

/** 상태 표시용 색상 */
export const STATUS_COLORS = {
  success: '#28a745', warning: '#ff9800', danger: '#dc3545',
  primary: '#2a5298', info: '#17a2b8', muted: '#6c757d',
} as const;

/** 교배/번식 차트용 (블루 계열) */
export const MATING_COLORS = ['#4292c6', '#6baed6', '#9ecae1', '#c6dbef'] as const;

/** 사고/폐사 차트용 (레드 계열) */
export const ACCIDENT_COLORS = ['#dc3545', '#e35d6a', '#eb8c95', '#f4bcc1'] as const;

/** 도태 차트용 (오렌지-레드 계열) */
export const CULLING_COLORS = ['#ef6c00', '#ff9800', '#dc3545', '#c62828'] as const;

/** 성적/실적 비교 차트용 */
export const COMPARISON_COLORS = {
  target: '#28a745', actual: '#2a5298', previous: '#6c757d', current: '#17a2b8',
} as const;

/** 등급별 색상 (1등급~등외) */
export const GRADE_COLORS = {
  grade1: '#28a745', grade2: '#17a2b8', grade3: '#ff9800', outgrade: '#dc3545',
} as const;

export type ColorTheme = 'default' | 'parity' | 'mating' | 'accident' | 'culling' | 'grade';

/** 테마별 색상 배열 반환 */
export const getThemeColors = (theme: ColorTheme): readonly string[] => ({
  default: CHART_COLORS, parity: PARITY_COLORS, mating: MATING_COLORS,
  accident: ACCIDENT_COLORS, culling: CULLING_COLORS,
  grade: [GRADE_COLORS.grade1, GRADE_COLORS.grade2, GRADE_COLORS.grade3, GRADE_COLORS.outgrade],
})[theme];

// ─────────────────────────────────────────────────────────────────────────────
// 기본 설정값
// ─────────────────────────────────────────────────────────────────────────────

export const CHART_DEFAULTS = {
  height: 300,
  fontSize: { title: 14, label: 11, legend: 11 },
  animation: { duration: 500, easing: 'cubicOut' as const },
  barRadius: [4, 4, 0, 0] as number[],
  lineWidth: 2,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 공통 옵션 생성 함수
// ─────────────────────────────────────────────────────────────────────────────

export const getBaseTitleOption = (title?: string): EChartsOption['title'] => {
  if (!title) return undefined;
  return {
    text: title,
    left: 'center',
    textStyle: { fontSize: CHART_DEFAULTS.fontSize.title, fontWeight: 500 },
  };
};

export const getBaseGridOption = (
  hasTitle = false,
  hasLegend = false
): EChartsOption['grid'] => ({
  left: '3%',
  right: '4%',
  bottom: hasLegend ? '15%' : '3%',
  top: hasTitle ? '15%' : '10%',
  containLabel: true,
});

export const getBaseTooltip = (
  trigger: 'axis' | 'item' = 'axis'
): EChartsOption['tooltip'] => ({
  trigger,
  axisPointer: trigger === 'axis' ? { type: 'shadow' } : undefined,
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  borderColor: '#e0e0e0',
  borderWidth: 1,
  textStyle: { fontSize: 12 },
});

export const getBaseLegend = (
  show = true,
  position: 'bottom' | 'top' | 'right' = 'bottom'
): EChartsOption['legend'] => {
  if (!show) return undefined;
  const positionMap = {
    bottom: { bottom: 0, orient: 'horizontal' as const },
    top: { top: 0, orient: 'horizontal' as const },
    right: { right: 0, orient: 'vertical' as const, top: 'center' },
  };
  return {
    ...positionMap[position],
    itemWidth: 12,
    itemHeight: 12,
    textStyle: { fontSize: CHART_DEFAULTS.fontSize.legend },
  };
};

export const getBaseXAxis = (
  data: string[],
  rotate?: number
): EChartsOption['xAxis'] => ({
  type: 'category',
  data,
  axisLabel: {
    fontSize: CHART_DEFAULTS.fontSize.label,
    interval: 0,  // 모든 라벨 표시
    rotate: rotate ?? (data.length > 8 ? 30 : 0),
  },
  axisLine: { lineStyle: { color: '#e0e0e0' } },
  axisTick: { show: false },
});

export const getBaseYAxis = (): EChartsOption['yAxis'] => ({
  type: 'value',
  axisLabel: { fontSize: CHART_DEFAULTS.fontSize.label },
  axisLine: { show: false },
  splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
});

// ─────────────────────────────────────────────────────────────────────────────
// ReactECharts 공통 Props
// ─────────────────────────────────────────────────────────────────────────────

export const ECHARTS_PROPS = {
  notMerge: true,
  lazyUpdate: true,
  opts: { renderer: 'svg' as const },
};

// ─────────────────────────────────────────────────────────────────────────────
// 시리즈 데이터 타입
// ─────────────────────────────────────────────────────────────────────────────

export interface SeriesData {
  name: string;
  data: number[];
  color?: string;
}

export interface PieData {
  name: string;
  value: number;
}
