/**
 * ============================================================================
 * 차트 컴포넌트 (Chart Components)
 * ============================================================================
 *
 * @description ECharts 기반 데이터 시각화 컴포넌트
 * @module components/charts
 * @requires echarts-for-react
 * ============================================================================
 */

// ─────────────────────────────────────────────────────────────────────────────
// 차트 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────
export { default as BarChart } from './BarChart';
export { default as LineChart } from './LineChart';
export { default as PieChart } from './PieChart';
export { default as CompactBar } from './CompactBar';
export { default as ChartModal } from './ChartModal';
export type { ChartType } from './ChartModal';

// ─────────────────────────────────────────────────────────────────────────────
// 공통 설정 및 타입
// ─────────────────────────────────────────────────────────────────────────────
export {
  // 기본 색상
  CHART_COLORS,
  CHART_GRADIENTS,
  // 테마별 색상
  PARITY_COLORS,
  GRADIENT_BLUE,
  GRADIENT_GREEN,
  GRADIENT_BLUE_PURPLE,
  GRADIENT_TEAL_BLUE,
  GRADIENT_ORANGE_RED,
  STATUS_COLORS,
  MATING_COLORS,
  ACCIDENT_COLORS,
  CULLING_COLORS,
  COMPARISON_COLORS,
  GRADE_COLORS,
  getThemeColors,
  type ColorTheme,
  // 기본 설정
  CHART_DEFAULTS,
  ECHARTS_PROPS,
  // 타입
  type SeriesData,
  type PieData,
} from './chartConfig';
