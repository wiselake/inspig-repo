/**
 * 지난주 실적 테스트 데이터
 * - 추후 DB 조회로 대체 예정
 */

// 요약 카드 데이터
export interface SummaryData {
  sowCount: { value: number; change: number; registered: number };
  mating: { value: number; change: number; yearly: number };
  accident: { value: number; change: number; yearly: number };
  farrowing: { value: number; piglets: number; change: number; pigletsChange: number; yearly: number; yearlyPiglets: number };
  weaning: { value: number; piglets: number; change: number; pigletsChange: number; yearly: number; yearlyPiglets: number };
  shipment: { value: number; change: number; yearly: number };
}

// 모돈 현황 데이터
export interface SowStatusItem {
  status: string;
  count: number;
  rate: number;
  change: string;
}

// 산차 분포 데이터
export interface ParityDistributionItem {
  parity: string;
  count: number;
}

// 교배 실적 데이터
export interface MatingData {
  kyungsan: { planned: number; actual: number; rate: number };
  hubo: { planned: number; actual: number; rate: number };
  sago: { planned: number; actual: number; rate: number };
  total: { planned: number; actual: number; rate: number };
}

// 사고 유형 데이터
export interface AccidentTypeItem {
  type: string;
  lastWeek: number;
  lastMonth: number;
}

// 임신일별 사고 데이터
export interface AccidentPeriodItem {
  period: string;
  count: number;
}

// 분만 실적 데이터
export interface FarrowingData {
  planned: number;
  actual: number;
  rate: number;
  stats: {
    totalBorn: { sum: number; avg: number };
    bornAlive: { sum: number; avg: number; rate: number };
    stillborn: { sum: number; avg: number; rate: number };
    mummy: { sum: number; avg: number; rate: number };
    culled: { sum: number; avg: number; rate: number };
  };
}

// 이유 실적 데이터
export interface WeaningData {
  planned: number;
  actual: number;
  rate: number;
  stats: {
    weanPigs: { sum: number; avg: number };
    partialWean: { sum: number; avg: number };
    avgWeight: number;
    survivalRate: number;
  };
}

// 도폐사 데이터
export interface CullingData {
  dotae: number;
  dead: number;
  transfer: number;
  sale: number;
  reasons: { reason: string; count: number; rate: number }[];
}

// 출하 실적 데이터
export interface ShipmentData {
  count: number;
  grade1Rate: number;
  avgCarcass: number;
  avgBackfat: number;
  farmPrice: number;
  nationalPrice: number;
}

// 전체 지난주 데이터 타입
export interface LastweekData {
  summary: SummaryData;
  sowStatus: SowStatusItem[];
  parityDistribution: ParityDistributionItem[];
  mating: MatingData;
  accidentType: AccidentTypeItem[];
  accidentPeriod: AccidentPeriodItem[];
  farrowing: FarrowingData;
  weaning: WeaningData;
  culling: CullingData;
  shipment: ShipmentData;
}

// 테스트 데이터
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
  mating: {
    kyungsan: { planned: 35, actual: 32, rate: 91.4 },
    hubo: { planned: 10, actual: 8, rate: 80.0 },
    sago: { planned: 7, actual: 5, rate: 71.4 },
    total: { planned: 52, actual: 45, rate: 86.5 },
  },
  accidentType: [
    { type: '재발', lastWeek: 3, lastMonth: 15 },
    { type: '불임', lastWeek: 0, lastMonth: 2 },
    { type: '공태', lastWeek: 2, lastMonth: 8 },
    { type: '유산', lastWeek: 1, lastMonth: 5 },
    { type: '도태', lastWeek: 4, lastMonth: 12 },
    { type: '폐사', lastWeek: 1, lastMonth: 6 },
    { type: '임돈전출', lastWeek: 2, lastMonth: 0 },
    { type: '임돈판매', lastWeek: 0, lastMonth: 2 },
  ],
  accidentPeriod: [
    { period: '~7', count: 3 },
    { period: '8~10', count: 1 },
    { period: '11~15', count: 2 },
    { period: '16~20', count: 1 },
    { period: '21~35', count: 0 },
    { period: '36~40', count: 4 },
    { period: '41~45', count: 2 },
    { period: '46~', count: 0 },
  ],
  farrowing: {
    planned: 225,
    actual: 221,
    rate: 98.2,
    stats: {
      totalBorn: { sum: 2890, avg: 13.1 },
      bornAlive: { sum: 2650, avg: 12.0, rate: 91.7 },
      stillborn: { sum: 156, avg: 0.7, rate: 5.4 },
      mummy: { sum: 84, avg: 0.4, rate: 2.9 },
      culled: { sum: 320, avg: 1.4, rate: 12.1 },
    },
  },
  weaning: {
    planned: 210,
    actual: 205,
    rate: 97.6,
    stats: {
      weanPigs: { sum: 2208, avg: 10.8 },
      partialWean: { sum: 110, avg: 0.5 },
      avgWeight: 6.2,
      survivalRate: 92.1,
    },
  },
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

// 계산된 데이터 (메서드로 추출되는 데이터)
export function getLastweekCalculatedData(data: LastweekData) {
  // 총 사고 계산
  const totalLastWeek = data.accidentType.reduce((sum, item) => sum + item.lastWeek, 0);
  const totalLastMonth = data.accidentType.reduce((sum, item) => sum + item.lastMonth, 0);

  // 모돈 합계
  const totalSowCount = data.sowStatus.reduce((sum, item) => sum + item.count, 0);

  // 도폐사 합계
  const totalCulling = data.culling.dotae + data.culling.dead + data.culling.transfer + data.culling.sale;

  return {
    totalLastWeek,
    totalLastMonth,
    totalSowCount,
    totalCulling,
  };
}
