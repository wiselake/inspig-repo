/**
 * 날짜 유틸리티
 * 서버가 UTC 시간대로 운영되어도 비즈니스 로직은 한국 시간(KST) 기준으로 처리
 */

/**
 * 현재 한국 시간(KST) 반환
 * @returns Date 객체 (KST 기준)
 */
export function getKSTDate(): Date {
  const now = new Date();
  const kstOffset = 9 * 60; // KST = UTC+9
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utcTime + (kstOffset * 60000));
}

/**
 * 오늘 날짜 (한국 시간 기준) YYYYMMDD 형식
 * @returns YYYYMMDD 형식 문자열
 */
export function getTodayKST(): string {
  const kst = getKSTDate();
  const yyyy = kst.getFullYear();
  const mm = String(kst.getMonth() + 1).padStart(2, '0');
  const dd = String(kst.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}
