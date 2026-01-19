/**
 * 금주 계획 테스트 데이터
 * - 추후 DB 조회로 대체 예정
 */

// 스케줄 아이템 타입
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

// 테스트 데이터
export const thisweekData: WeeklyCalendarData = {
  mating: [
    { day: 'mon', dayName: '월', items: [{ count: 5, label: '후보' }, { count: 3, label: '이유' }, { count: 3, label: '재발' }] },
    { day: 'tue', dayName: '화', items: [{ count: 5, label: '후보' }, { count: 2, label: '재발' }] },
    { day: 'wed', dayName: '수', items: [{ count: 2, label: '후보' }] },
    { day: 'thu', dayName: '목', items: [{ count: 3, label: '후보' }] },
    { day: 'fri', dayName: '금', items: [{ count: 3, label: '후보' }] },
    { day: 'sat', dayName: '토', items: [{ count: 5, label: '후보' }, { count: 1, label: '이유' }] },
    { day: 'sun', dayName: '일', items: [{ count: 4, label: '후보' }, { count: 2, label: '이유' }] }
  ],
  pregnancy: [
    { day: 'mon', dayName: '월', items: [{ count: 8, label: '경산' }, { count: 3, label: '후보' }] },
    { day: 'tue', dayName: '화', items: [{ count: 7, label: '경산' }, { count: 2, label: '후보' }] },
    { day: 'wed', dayName: '수', items: [{ count: 6, label: '경산' }, { count: 2, label: '후보' }] },
    { day: 'thu', dayName: '목', items: [{ count: 9, label: '경산' }, { count: 3, label: '후보' }] },
    { day: 'fri', dayName: '금', items: [{ count: 10, label: '경산' }, { count: 3, label: '후보' }] },
    { day: 'sat', dayName: '토', items: [{ count: 6, label: '경산' }, { count: 1, label: '후보' }] },
    { day: 'sun', dayName: '일', items: [{ count: 6, label: '경산' }, { count: 2, label: '후보' }] }
  ],
  farrowing: [
    { day: 'mon', dayName: '월', items: [{ count: 8, label: '경산' }, { count: 3, label: '후보' }] },
    { day: 'tue', dayName: '화', items: [{ count: 7, label: '경산' }, { count: 2, label: '후보' }] },
    { day: 'wed', dayName: '수', items: [{ count: 6, label: '경산' }, { count: 2, label: '후보' }] },
    { day: 'thu', dayName: '목', items: [{ count: 9, label: '경산' }, { count: 3, label: '후보' }] },
    { day: 'fri', dayName: '금', items: [{ count: 10, label: '경산' }, { count: 3, label: '후보' }] },
    { day: 'sat', dayName: '토', items: [{ count: 6, label: '경산' }, { count: 1, label: '후보' }] },
    { day: 'sun', dayName: '일', items: [{ count: 6, label: '경산' }, { count: 2, label: '후보' }] }
  ],
  weaning: [
    { day: 'mon', dayName: '월', items: [{ count: 8, label: '경산' }, { count: 3, label: '후보' }] },
    { day: 'tue', dayName: '화', items: [{ count: 7, label: '경산' }, { count: 2, label: '후보' }] },
    { day: 'wed', dayName: '수', items: [{ count: 6, label: '경산' }, { count: 2, label: '후보' }] },
    { day: 'thu', dayName: '목', items: [{ count: 9, label: '경산' }, { count: 3, label: '후보' }] },
    { day: 'fri', dayName: '금', items: [{ count: 10, label: '경산' }, { count: 3, label: '후보' }] },
    { day: 'sat', dayName: '토', items: [{ count: 6, label: '경산' }, { count: 1, label: '후보' }] },
    { day: 'sun', dayName: '일', items: [{ count: 6, label: '경산' }, { count: 2, label: '후보' }] }
  ],
  vaccine: [
    { day: 'mon', dayName: '월', items: [{ count: 4, label: '임신' }, { count: 3, label: '후보' }, { count: 5, label: '이유' }] },
    { day: 'tue', dayName: '화', items: [{ count: 3, label: '임신' }, { count: 2, label: '후보' }, { count: 4, label: '이유' }] },
    { day: 'wed', dayName: '수', items: [{ count: 5, label: '임신' }, { count: 4, label: '후보' }, { count: 6, label: '이유' }] },
    { day: 'thu', dayName: '목', items: [{ count: 4, label: '임신' }, { count: 3, label: '후보' }, { count: 4, label: '이유' }] },
    { day: 'fri', dayName: '금', items: [{ count: 5, label: '임신' }, { count: 3, label: '후보' }, { count: 5, label: '이유' }] },
    { day: 'sat', dayName: '토', items: [{ count: 3, label: '임신' }, { count: 2, label: '후보' }, { count: 2, label: '이유' }] },
    { day: 'sun', dayName: '일', items: [{ count: 4, label: '임신' }, { count: 2, label: '후보' }, { count: 5, label: '이유' }] }
  ],
  shipping: [
    { day: 'mon', dayName: '월', count: 50 },
    { day: 'tue', dayName: '화', count: 48 },
    { day: 'wed', dayName: '수', count: 52 },
    { day: 'thu', dayName: '목', count: 55 },
    { day: 'fri', dayName: '금', count: 60 },
    { day: 'sat', dayName: '토', count: 45 },
    { day: 'sun', dayName: '일', count: 40 }
  ]
};

// 계산된 데이터 (합계 등)
export function getThisweekCalculatedData(data: WeeklyCalendarData) {
  // 교배: 후보, 이유, 재발별
  const matingByType = { gilt: 0, weaned: 0, repeat: 0 };
  data.mating.forEach(day => {
    day.items?.forEach(item => {
      if (item.label === '후보') matingByType.gilt += item.count;
      else if (item.label === '이유') matingByType.weaned += item.count;
      else if (item.label === '재발') matingByType.repeat += item.count;
    });
  });

  // 임신확인: 경산, 후보별
  const pregnancyByType = { parity: 0, gilt: 0 };
  data.pregnancy.forEach(day => {
    day.items?.forEach(item => {
      if (item.label === '경산') pregnancyByType.parity += item.count;
      else if (item.label === '후보') pregnancyByType.gilt += item.count;
    });
  });

  // 분만: 경산, 후보별
  const farrowingByType = { parity: 0, gilt: 0 };
  data.farrowing.forEach(day => {
    day.items?.forEach(item => {
      if (item.label === '경산') farrowingByType.parity += item.count;
      else if (item.label === '후보') farrowingByType.gilt += item.count;
    });
  });

  // 이유: 경산, 후보별
  const weaningByType = { parity: 0, gilt: 0 };
  data.weaning.forEach(day => {
    day.items?.forEach(item => {
      if (item.label === '경산') weaningByType.parity += item.count;
      else if (item.label === '후보') weaningByType.gilt += item.count;
    });
  });

  // 백신: 임신, 후보, 이유별
  const vaccineByType = { pregnant: 0, gilt: 0, weaned: 0 };
  data.vaccine.forEach(day => {
    day.items?.forEach(item => {
      if (item.label === '임신') vaccineByType.pregnant += item.count;
      else if (item.label === '후보') vaccineByType.gilt += item.count;
      else if (item.label === '이유') vaccineByType.weaned += item.count;
    });
  });

  // 출하 합계
  const shippingTotal = data.shipping.reduce((sum, day) => sum + (day.count || 0), 0);

  return {
    mating: { ...matingByType, total: matingByType.gilt + matingByType.weaned + matingByType.repeat },
    pregnancy: { ...pregnancyByType, total: pregnancyByType.parity + pregnancyByType.gilt },
    farrowing: { ...farrowingByType, total: farrowingByType.parity + farrowingByType.gilt },
    weaning: { ...weaningByType, total: weaningByType.parity + weaningByType.gilt },
    vaccine: { ...vaccineByType, total: vaccineByType.pregnant + vaccineByType.gilt + vaccineByType.weaned },
    shipping: shippingTotal
  };
}
