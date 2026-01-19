/**
 * 운영 스냅샷 테스트 데이터
 * - 추후 DB 조회로 대체 예정
 */

// PSY 데이터
export interface PsyData {
  value: number;
  description: string;
}

// 관리대상모돈 데이터
export interface ManagementTargetData {
  value: number;
  description: string;
}

// PSY & 입력지연 데이터
export interface PsyDelayData {
  zone: string;
  status: 'success' | 'warning' | 'danger' | 'info';
  statusLabel: string;
  psy: number;
  delay: number;
}

// 출하예측 데이터
export interface ShipmentPredictionData {
  predicted: number;
  actual: number;
}

// 경락가격 데이터
export interface AuctionPriceData {
  national: number;
  central: number;
  dodram: number;
  date: string;
}

// 날씨 데이터
export interface WeatherData {
  min: number;
  max: number;
  location: string;
  date: string;
}

// 인사이트 데이터
export interface InsightsData {
  good: { value: string; label: string }[];
  bad: string[];
}

// PSY 트렌드 데이터
export interface PsyTrendData {
  xData: string[];
  psy: number[];
  msy: number[];
  top30: number[];
}

// 전체 운영 스냅샷 데이터 타입
export interface SummaryData {
  psy: PsyData;
  managementTarget: ManagementTargetData;
  psyDelay: PsyDelayData;
  shipment: ShipmentPredictionData;
  auctionPrice: AuctionPriceData;
  weather: WeatherData;
  insights: InsightsData;
  psyTrend: PsyTrendData;
}

// 테스트 데이터
export const summaryData: SummaryData = {
  psy: {
    value: 26.8,
    description: '최근 1년 평균 (전국 상위권)'
  },
  managementTarget: {
    value: 42,
    description: '전체 합계 (중점관리 대상)'
  },
  psyDelay: {
    zone: '2B구간',
    status: 'success',
    statusLabel: '우수',
    psy: 26.8,
    delay: 8
  },
  shipment: {
    predicted: 250,
    actual: 265
  },
  auctionPrice: {
    national: 5170,
    central: 5220,
    dodram: 5300,
    date: '11.13일'
  },
  weather: {
    min: 5,
    max: 15,
    location: '서울/경기',
    date: '11.13일'
  },
  insights: {
    good: [
      { value: '12.2두', label: '2-5산 실산 평균' },
      { value: '84.6%', label: '1등급 이상 출하율' },
      { value: '94.2%', label: '이유후 육성율' }
    ],
    bad: [
      '1산 이유전 육성율 8.2% (평균 7.2% 초과)',
      '재발률 61.5% (교배 후 사고 중 최빈)',
      '초산돈 관리 프로토콜 보강'
    ]
  },
  psyTrend: {
    xData: ['24.11월', '24.12월', '25.1월', '25.2월', '25.3월', '25.4월', '25.5월', '25.6월', '25.7월', '25.8월', '25.9월', '25.11월'],
    psy: [25.8, 26.1, 26.3, 26.5, 26.2, 26.7, 26.9, 26.5, 26.8, 27.0, 26.6, 26.8],
    msy: [24.2, 24.5, 24.7, 24.9, 24.6, 25.1, 25.3, 24.9, 25.2, 25.4, 25.0, 25.2],
    top30: [28.2, 28.4, 28.6, 28.7, 28.5, 28.8, 29.0, 28.7, 28.9, 29.1, 28.8, 29.0]
  }
};
