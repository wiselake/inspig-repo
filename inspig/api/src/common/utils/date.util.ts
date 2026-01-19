/**
 * 날짜 유틸리티
 * 서버가 UTC 시간대로 운영되어도 비즈니스 로직은 한국 시간(KST) 기준으로 처리
 */

/**
 * 현재 한국 시간(KST) 반환
 * @returns Date 객체 (KST 기준)
 */
export function nowKst(): Date {
  const now = new Date();
  // UTC + 9시간 = KST
  return new Date(now.getTime() + 9 * 60 * 60 * 1000);
}

/**
 * 오늘 날짜 (한국 시간 기준) YYYYMMDD 형식
 * @returns YYYYMMDD 형식 문자열
 */
export function todayKst(): string {
  const kst = nowKst();
  const yyyy = kst.getUTCFullYear();
  const mm = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(kst.getUTCDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

/**
 * YYYYMMDD 형식 문자열을 Date 객체로 변환 (KST 기준 23:59:59)
 * TOKEN_EXPIRE_DT 비교용
 * @param yyyymmdd YYYYMMDD 형식 문자열
 * @returns Date 객체
 */
export function parseExpireDateKst(yyyymmdd: string): Date {
  if (!yyyymmdd || yyyymmdd.length !== 8) {
    return new Date(0); // 잘못된 형식이면 과거 날짜 반환
  }
  const year = parseInt(yyyymmdd.substring(0, 4));
  const month = parseInt(yyyymmdd.substring(4, 6)) - 1;
  const day = parseInt(yyyymmdd.substring(6, 8));
  // KST 23:59:59를 UTC로 변환 (KST - 9시간)
  // KST 23:59:59 = UTC 14:59:59 (같은 날)
  return new Date(Date.UTC(year, month, day, 14, 59, 59));
}
