/**
 * ============================================================================
 * 테스트 데이터 (Test/Mock Data)
 * ============================================================================
 * 
 * @description 개발/테스트용 목업 데이터
 * @module data/test
 * 
 * @files
 * - lastweekData.ts  : 지난주 실적 데이터 + 타입 + 계산 함수
 * - thisweekData.ts  : 금주 계획 데이터 + 타입 + 계산 함수
 * - summaryData.ts   : 운영 스냅샷 데이터 + 타입
 * 
 * @usage
 * import { lastweekData, getLastweekCalculatedData } from '@/data/test';
 * 
 * @note
 * - 추후 API 연동 시 DB 조회로 대체 예정
 * - 테스트 완료 후 이 폴더는 삭제 예정
 * ============================================================================
 */

// ─────────────────────────────────────────────────────────────────────────────
// 지난주 실적 데이터
// ─────────────────────────────────────────────────────────────────────────────
export {
  lastweekData,
  getLastweekCalculatedData,
  type SummaryData as LastweekSummaryData,
  type SowStatusItem,
  type ParityDistributionItem,
  type MatingData,
  type AccidentTypeItem,
  type AccidentPeriodItem,
} from './lastweekData';

// ─────────────────────────────────────────────────────────────────────────────
// 금주 계획 데이터
// ─────────────────────────────────────────────────────────────────────────────
export * from './thisweekData';
export { thisweekData, getThisweekCalculatedData } from './thisweekData';

// ─────────────────────────────────────────────────────────────────────────────
// 운영 스냅샷 데이터
// ─────────────────────────────────────────────────────────────────────────────
export * from './summaryData';
export { summaryData } from './summaryData';
