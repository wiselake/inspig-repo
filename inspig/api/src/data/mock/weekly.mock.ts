/**
 * 주간 리포트 Mock 데이터
 * - 추후 Oracle DB 연동 시 Repository 패턴으로 교체
 */

// ─────────────────────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────────────────────

// 지난주 실적 타입
export interface SummaryData {
  sowCount: { value: number; change: number; registered: number };
  mating: { value: number; change: number; yearly: number };
  accident: { value: number; change: number; yearly: number };
  farrowing: { value: number; piglets: number; change: number; pigletsChange: number; yearly: number; yearlyPiglets: number };
  weaning: { value: number; piglets: number; change: number; pigletsChange: number; yearly: number; yearlyPiglets: number };
  shipment: { value: number; change: number; yearly: number };
}

export interface SowStatusItem {
  status: string;
  count: number;
  rate: number;
  change: string;
}

export interface ParityDistributionItem {
  parity: string;
  count: number;
}

// AccidentTypeItem, AccidentPeriodItem - DB 연동 완료 (SG, SG_CHART)

export interface CullingData {
  dotae: number;
  dead: number;
  transfer: number;
  sale: number;
  reasons: { reason: string; count: number; rate: number }[];
}

export interface ShipmentData {
  count: number;
  grade1Rate: number;
  avgCarcass: number;
  avgBackfat: number;
  farmPrice: number;
  nationalPrice: number;
}

export interface LastweekData {
  summary: SummaryData;
  sowStatus: SowStatusItem[];
  parityDistribution: ParityDistributionItem[];
  // accidentType, accidentPeriod - DB 연동 완료 (SG, SG_CHART)
  culling: CullingData;
  shipment: ShipmentData;
}

// 금주 계획 타입
export interface ScheduleItem {
  count: number;
  label: string;
}

export interface DaySchedule {
  day: string;
  dayName: string;
  items?: ScheduleItem[];
  count?: number;
}

export interface WeeklyCalendarData {
  mating: DaySchedule[];
  pregnancy: DaySchedule[];
  farrowing: DaySchedule[];
  weaning: DaySchedule[];
  vaccine: DaySchedule[];
  shipping: DaySchedule[];
}

// 운영 스냅샷 타입
export interface PsyData {
  value: number;
  description: string;
}

export interface ManagementTargetData {
  value: number;
  description: string;
}

export interface PsyDelayData {
  zone: string;
  status: 'success' | 'warning' | 'danger' | 'info';
  statusLabel: string;
  psy: number;
  delay: number;
}

export interface ShipmentPredictionData {
  predicted: number;
  actual: number;
}

export interface AuctionPriceData {
  national: number;
  central: number;
  dodram: number;
  date: string;
}

export interface WeatherData {
  min: number;
  max: number;
  location: string;
  date: string;
}

export interface InsightsData {
  good: { value: string; label: string }[];
  bad: string[];
}

export interface PsyTrendData {
  xData: string[];
  psy: number[];
  msy: number[];
  top30: number[];
}

export interface OperationSummaryData {
  psy: PsyData;
  managementTarget: ManagementTargetData;
  psyDelay: PsyDelayData;
  shipment: ShipmentPredictionData;
  auctionPrice: AuctionPriceData;
  weather: WeatherData;
  insights: InsightsData;
  psyTrend: PsyTrendData;
}

// ─────────────────────────────────────────────────────────────────────────────
// 지난주 실적 데이터
// ─────────────────────────────────────────────────────────────────────────────

export const lastweekData: LastweekData = {
  summary: {
    sowCount: { value: 465, change: 3, registered: 463 },
    mating: { value: 45, change: 5, yearly: 2340 },
    accident: { value: 13, change: 2, yearly: 678 },
    farrowing: { value: 38, piglets: 491, change: -2, pigletsChange: -10, yearly: 1976, yearlyPiglets: 23092 },
    weaning: { value: 42, piglets: 428, change: 3, pigletsChange: 8, yearly: 2184, yearlyPiglets: 23368 },
    shipment: { value: 156, change: 12, yearly: 8112 },
  },
  sowStatus: [
    { status: '경산돈', count: 420, rate: 90.3, change: '+2' },
    { status: '후보돈', count: 45, rate: 9.7, change: '+1' },
  ],
  parityDistribution: [
    { parity: '0산(후보)', count: 52 },
    { parity: '1산', count: 78 },
    { parity: '2산', count: 85 },
    { parity: '3산', count: 72 },
    { parity: '4산', count: 65 },
    { parity: '5산', count: 113 },
    { parity: '6산', count: 113 },
    { parity: '7산', count: 113 },
    { parity: '8산', count: 113 },
    { parity: '9산↑', count: 113 },
  ],
  // accidentType, accidentPeriod - DB 연동 완료 (SG, SG_CHART)
  culling: {
    dotae: 27,
    dead: 5,
    transfer: 3,
    sale: 2,
    reasons: [
      { reason: '번식장애', count: 12, rate: 32.4 },
      { reason: '지제불량', count: 8, rate: 21.6 },
      { reason: '노령', count: 6, rate: 16.2 },
      { reason: '질병', count: 5, rate: 13.5 },
      { reason: '기타', count: 6, rate: 16.2 },
    ],
  },
  shipment: {
    count: 156,
    grade1Rate: 84.6,
    avgCarcass: 118.5,
    avgBackfat: 21.5,
    farmPrice: 5220,
    nationalPrice: 5200,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 금주 계획 데이터
// ─────────────────────────────────────────────────────────────────────────────

export const thisweekData: WeeklyCalendarData = {
  mating: [
    { day: 'mon', dayName: '월', items: [{ count: 5, label: '후보' }, { count: 3, label: '이유' }, { count: 3, label: '재발' }] },
    { day: 'tue', dayName: '화', items: [{ count: 5, label: '후보' }, { count: 2, label: '재발' }] },
    { day: 'wed', dayName: '수', items: [{ count: 2, label: '후보' }] },
    { day: 'thu', dayName: '목', items: [{ count: 3, label: '후보' }] },
    { day: 'fri', dayName: '금', items: [{ count: 3, label: '후보' }] },
    { day: 'sat', dayName: '토', items: [{ count: 5, label: '후보' }, { count: 1, label: '이유' }] },
    { day: 'sun', dayName: '일', items: [{ count: 4, label: '후보' }, { count: 2, label: '이유' }] },
  ],
  pregnancy: [
    { day: 'mon', dayName: '월', items: [{ count: 8, label: '경산' }, { count: 3, label: '후보' }] },
    { day: 'tue', dayName: '화', items: [{ count: 7, label: '경산' }, { count: 2, label: '후보' }] },
    { day: 'wed', dayName: '수', items: [{ count: 6, label: '경산' }, { count: 2, label: '후보' }] },
    { day: 'thu', dayName: '목', items: [{ count: 9, label: '경산' }, { count: 3, label: '후보' }] },
    { day: 'fri', dayName: '금', items: [{ count: 10, label: '경산' }, { count: 3, label: '후보' }] },
    { day: 'sat', dayName: '토', items: [{ count: 6, label: '경산' }, { count: 1, label: '후보' }] },
    { day: 'sun', dayName: '일', items: [{ count: 6, label: '경산' }, { count: 2, label: '후보' }] },
  ],
  farrowing: [
    { day: 'mon', dayName: '월', items: [{ count: 8, label: '경산' }, { count: 3, label: '후보' }] },
    { day: 'tue', dayName: '화', items: [{ count: 7, label: '경산' }, { count: 2, label: '후보' }] },
    { day: 'wed', dayName: '수', items: [{ count: 6, label: '경산' }, { count: 2, label: '후보' }] },
    { day: 'thu', dayName: '목', items: [{ count: 9, label: '경산' }, { count: 3, label: '후보' }] },
    { day: 'fri', dayName: '금', items: [{ count: 10, label: '경산' }, { count: 3, label: '후보' }] },
    { day: 'sat', dayName: '토', items: [{ count: 6, label: '경산' }, { count: 1, label: '후보' }] },
    { day: 'sun', dayName: '일', items: [{ count: 6, label: '경산' }, { count: 2, label: '후보' }] },
  ],
  weaning: [
    { day: 'mon', dayName: '월', items: [{ count: 8, label: '경산' }, { count: 3, label: '후보' }] },
    { day: 'tue', dayName: '화', items: [{ count: 7, label: '경산' }, { count: 2, label: '후보' }] },
    { day: 'wed', dayName: '수', items: [{ count: 6, label: '경산' }, { count: 2, label: '후보' }] },
    { day: 'thu', dayName: '목', items: [{ count: 9, label: '경산' }, { count: 3, label: '후보' }] },
    { day: 'fri', dayName: '금', items: [{ count: 10, label: '경산' }, { count: 3, label: '후보' }] },
    { day: 'sat', dayName: '토', items: [{ count: 6, label: '경산' }, { count: 1, label: '후보' }] },
    { day: 'sun', dayName: '일', items: [{ count: 6, label: '경산' }, { count: 2, label: '후보' }] },
  ],
  vaccine: [
    { day: 'mon', dayName: '월', items: [{ count: 4, label: '임신' }, { count: 3, label: '후보' }, { count: 5, label: '이유' }] },
    { day: 'tue', dayName: '화', items: [{ count: 3, label: '임신' }, { count: 2, label: '후보' }, { count: 4, label: '이유' }] },
    { day: 'wed', dayName: '수', items: [{ count: 5, label: '임신' }, { count: 4, label: '후보' }, { count: 6, label: '이유' }] },
    { day: 'thu', dayName: '목', items: [{ count: 4, label: '임신' }, { count: 3, label: '후보' }, { count: 4, label: '이유' }] },
    { day: 'fri', dayName: '금', items: [{ count: 5, label: '임신' }, { count: 3, label: '후보' }, { count: 5, label: '이유' }] },
    { day: 'sat', dayName: '토', items: [{ count: 3, label: '임신' }, { count: 2, label: '후보' }, { count: 2, label: '이유' }] },
    { day: 'sun', dayName: '일', items: [{ count: 4, label: '임신' }, { count: 2, label: '후보' }, { count: 5, label: '이유' }] },
  ],
  shipping: [
    { day: 'mon', dayName: '월', count: 50 },
    { day: 'tue', dayName: '화', count: 48 },
    { day: 'wed', dayName: '수', count: 52 },
    { day: 'thu', dayName: '목', count: 55 },
    { day: 'fri', dayName: '금', count: 60 },
    { day: 'sat', dayName: '토', count: 45 },
    { day: 'sun', dayName: '일', count: 40 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 운영 스냅샷 데이터
// ─────────────────────────────────────────────────────────────────────────────

export const operationSummaryData: OperationSummaryData = {
  psy: {
    value: 26.8,
    description: '최근 1년 평균 (전국 상위권)',
  },
  managementTarget: {
    value: 42,
    description: '전체 합계 (중점관리 대상)',
  },
  psyDelay: {
    zone: '2B구간',
    status: 'success',
    statusLabel: '우수',
    psy: 26.8,
    delay: 8,
  },
  shipment: {
    predicted: 250,
    actual: 265,
  },
  auctionPrice: {
    national: 5170,
    central: 5220,
    dodram: 5300,
    date: '11.13일',
  },
  weather: {
    min: 5,
    max: 15,
    location: '서울/경기',
    date: '11.13일',
  },
  insights: {
    good: [
      { value: '12.2두', label: '2-5산 실산 평균' },
      { value: '84.6%', label: '1등급 이상 출하율' },
      { value: '94.2%', label: '이유후 육성율' },
    ],
    bad: [
      '1산 이유전 육성율 8.2% (평균 7.2% 초과)',
      '재발률 61.5% (교배 후 사고 중 최빈)',
      '초산돈 관리 프로토콜 보강',
    ],
  },
  psyTrend: {
    xData: ['24.11월', '24.12월', '25.1월', '25.2월', '25.3월', '25.4월', '25.5월', '25.6월', '25.7월', '25.8월', '25.9월', '25.11월'],
    psy: [25.8, 26.1, 26.3, 26.5, 26.2, 26.7, 26.9, 26.5, 26.8, 27.0, 26.6, 26.8],
    msy: [24.2, 24.5, 24.7, 24.9, 24.6, 25.1, 25.3, 24.9, 25.2, 25.4, 25.0, 25.2],
    top30: [28.2, 28.4, 28.6, 28.7, 28.5, 28.8, 29.0, 28.7, 28.9, 29.1, 28.8, 29.0],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 차트 데이터 (차트 팝업용)
// ─────────────────────────────────────────────────────────────────────────────

// 산차별 모돈현황
export const parityDistribution = lastweekData.parityDistribution;

// 재귀일별 교배복수
export const matingByReturnDay = {
  xData: ['7일', '10일', '15일', '20일', '25일', '30일', '35일', '40일', '45일', '50일↑'],
  data: [8, 5, 12, 7, 6, 3, 2, 1, 1, 0],
};

// 산차별 재귀일
export const parityReturn = {
  xData: ['1산', '2산', '3산', '4산', '5산', '6산', '7산', '8산', '9산↑'],
  data: [0, 3, 7, 10, 14, 16, 18, 20, 21],
};

// accidentByPeriod, parityAccident - DB 연동 완료 (SG, SG_CHART)

// 산차별 분만성적
export const parityBirth = {
  xData: ['1산', '2산', '3산', '4산', '5산', '6산', '7산', '8산', '9산↑'],
  series: [
    { name: '총산', data: [320, 380, 420, 350, 310, 280, 250, 180, 100] },
    { name: '실산', data: [290, 350, 390, 320, 285, 255, 225, 160, 90] },
  ],
};

// 산차별 이유성적
export const parityWean = {
  xData: ['1산', '2산', '3산', '4산', '5산', '6산', '7산', '8산', '9산↑'],
  series: [
    { name: '이유복수', data: [35, 40, 33, 26, 23, 18, 14, 9, 7] },
    { name: '이유자돈수', data: [347, 432, 380, 304, 260, 189, 141, 88, 67] },
  ],
};

// 도폐사원인분포
export const cullingDistribution = lastweekData.culling.reasons.map((r) => ({
  name: r.reason,
  value: r.count,
}));

// 출하자료분석
export const shipmentAnalysis = {
  xData: ['11.18', '11.19', '11.20', '11.21', '11.22', '11.23', '11.24'],
  data: [371, 294, 341, 315, 364, 221, 275],
};

// 도체중/등지방분포
export const carcassDistribution = [
  { name: '1+등급', value: 15 },
  { name: '1등급', value: 55 },
  { name: '2등급', value: 20 },
  { name: '등외', value: 10 },
];

// 차트 타입별 데이터 매핑
export const chartDataMap = {
  sowChart: parityDistribution,
  matingChart: matingByReturnDay,
  parityReturn: parityReturn,
  parityBirth: parityBirth,
  parityWean: parityWean,
  cullingChart: cullingDistribution,
  shipmentAnalysis: shipmentAnalysis,
  carcassChart: carcassDistribution,
};

export type ChartType = keyof typeof chartDataMap;

// ─────────────────────────────────────────────────────────────────────────────
// 보고서 목록/상세/팝업 데이터 (Frontend 연동용)
// ─────────────────────────────────────────────────────────────────────────────

// 보고서 목록
export interface ReportListItem {
  id: string;
  title: string;
  period: string;
  status: 'completed' | 'pending' | 'draft';
  date: string;
}

export const reportList: ReportListItem[] = [
  { id: '40', title: '10월 1주차 주간 보고서', period: '2023.10.01 ~ 2023.10.07', status: 'completed', date: '2023.10.08' },
  { id: '39', title: '9월 5주차 주간 보고서', period: '2023.09.24 ~ 2023.09.30', status: 'completed', date: '2023.10.01' },
  { id: '38', title: '9월 4주차 주간 보고서', period: '2023.09.17 ~ 2023.09.23', status: 'pending', date: '2023.09.24' },
  { id: '37', title: '9월 3주차 주간 보고서', period: '2023.09.10 ~ 2023.09.16', status: 'draft', date: '2023.09.17' },
];

// 보고서 상세
export interface ReportDetail {
  header: {
    farmName: string;
    period: string;
    owner: string;
    weekNum: number;
  };
  alertMd: {
    count: number;
    list: { id: string; sowId: string; issue: string; days: number; desc: string }[];
  };
  lastWeek: {
    period: { weekNum: number; from: string; to: string };
    modon: { regCnt: number; sangsiCnt: number };
    mating: { cnt: number; sum: number };
    farrowing: { cnt: number; totalCnt: number; liveCnt: number; deadCnt: number; mummyCnt: number };
    weaning: { cnt: number; jdCnt: number; pigletCnt: number; avgWeight: number };
    accident: { cnt: number; sum: number };
    culling: { cnt: number; sum: number };
    shipment: { cnt: number; avg: number; sum: number; avgSum: number };
  };
  thisWeek: {
    calendar: { date: string; type: string; count: number; title: string }[];
    summary: { matingGoal: number; farrowingGoal: number; weaningGoal: number };
  };
  kpi: {
    psy: number;
    weaningAge: number;
    marketPrice: number;
  };
  weather: {
    forecast: any[];
  };
  todo: {
    items: any[];
  };
  popupData?: Record<string, any>;
}

export const reportDetail: ReportDetail = {
  header: {
    farmName: '행복한 농장',
    period: '2023.10.01 ~ 2023.10.07',
    owner: '홍길동',
    weekNum: 40,
  },
  alertMd: {
    count: 3,
    list: [
      { id: '1', sowId: '001', issue: '재발', days: 25, desc: '재발 확인 필요' },
      { id: '2', sowId: '005', issue: '유산', days: 5, desc: '유산 의심' },
      { id: '3', sowId: '012', issue: '도태', days: 0, desc: '도태 예정' },
    ],
  },
  lastWeek: {
    period: { weekNum: 39, from: '09.24', to: '09.30' },
    modon: { regCnt: 450, sangsiCnt: 420 },
    mating: { cnt: 25, sum: 850 },
    farrowing: { cnt: 22, totalCnt: 250, liveCnt: 230, deadCnt: 15, mummyCnt: 5 },
    weaning: { cnt: 20, jdCnt: 200, pigletCnt: 210, avgWeight: 6.5 },
    accident: { cnt: 1, sum: 15 },
    culling: { cnt: 2, sum: 40 },
    shipment: { cnt: 150, avg: 115, sum: 4500, avgSum: 112 },
  },
  thisWeek: {
    calendar: [
      { date: '2023-10-02', type: 'mating', count: 5, title: '교배 5두' },
      { date: '2023-10-04', type: 'farrowing', count: 8, title: '분만 8두' },
      { date: '2023-10-06', type: 'weaning', count: 10, title: '이유 10두' },
    ],
    summary: {
      matingGoal: 30,
      farrowingGoal: 25,
      weaningGoal: 25,
    },
  },
  kpi: {
    psy: 25.5,
    weaningAge: 24.5,
    marketPrice: 5800,
  },
  weather: {
    forecast: [],
  },
  todo: {
    items: [],
  },
  // 팝업 데이터는 DB에서 조회 (Mock 사용 안함)
  popupData: {},
};

// 팝업 데이터는 DB에서 조회 - Mock fallback 제거됨
// DB 연동 완료: modon, mating, farrowing, weaning, accident, culling, shipment
export const popupData: Record<string, any> = {};
