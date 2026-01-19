/**
 * ============================================================================
 * 타입 정의 (Type Definitions)
 * ============================================================================
 * 
 * @description 앱 전역 TypeScript 타입/인터페이스 정의
 * @module types
 * 
 * @categories
 * - 농장 (Farm)           : Farm
 * - 주간 리포트 (Weekly)  : WeeklyReportData, SowStatus, MatingData, etc.
 * - 공통 (Common)         : AccidentType, CullingReason, etc.
 * 
 * @usage
 * import type { Farm, WeeklyReportData, SowStatus } from '@/types';
 * ============================================================================
 */

// ─────────────────────────────────────────────────────────────────────────────
// 농장 정보
// ─────────────────────────────────────────────────────────────────────────────
export interface Farm {
  id: string;
  name: string;
  code: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 주간 리포트 메인 데이터
// ─────────────────────────────────────────────────────────────────────────────
export interface WeeklyReportData {
  farmId: string;
  weekNumber: number;
  year: number;
  startDate: string;
  endDate: string;
  sowStatus: SowStatus;
  mating: MatingData;
  accident: AccidentData;
  farrowing: FarrowingData;
  weaning: WeaningData;
  culling: CullingData;
  shipment: ShipmentData;
}

// ─────────────────────────────────────────────────────────────────────────────
// 모돈 현황
// ─────────────────────────────────────────────────────────────────────────────
export interface SowStatus {
  totalCount: number;
  registeredCount: number;
  change: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 교배 데이터
// ─────────────────────────────────────────────────────────────────────────────
export interface MatingData {
  count: number;
  yearlyTotal: number;
  change: number;
  details: MatingDetail[];
}

export interface MatingDetail {
  type: string;
  count: number;
  rate: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 사고 데이터
// ─────────────────────────────────────────────────────────────────────────────
export interface AccidentData {
  count: number;
  yearlyTotal: number;
  change: number;
  types: AccidentType[];
}

export interface AccidentType {
  type: string;
  lastWeek: number;
  lastMonth: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 분만 데이터
// ─────────────────────────────────────────────────────────────────────────────
export interface FarrowingData {
  count: number;
  yearlyTotal: number;
  pigletCount: number;
  yearlyPigletTotal: number;
  avgBornAlive: number;
  avgTotalBorn: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 이유 데이터
// ─────────────────────────────────────────────────────────────────────────────
export interface WeaningData {
  count: number;
  yearlyTotal: number;
  pigletCount: number;
  yearlyPigletTotal: number;
  avgWeaningCount: number;
  avgWeaningWeight: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 도태/폐사 데이터
// ─────────────────────────────────────────────────────────────────────────────
export interface CullingData {
  culling: number;
  death: number;
  transfer: number;
  sale: number;
  reasons: CullingReason[];
}

export interface CullingReason {
  reason: string;
  count: number;
  rate: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 출하 데이터
// ─────────────────────────────────────────────────────────────────────────────
export interface ShipmentData {
  count: number;
  yearlyTotal: number;
  change: number;
  grade1Rate: number;
  avgCarcassWeight: number;
  avgBackfat: number;
  farmPrice: number;
  nationalPrice: number;
}
