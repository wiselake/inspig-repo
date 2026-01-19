/**
 * 숫자 포맷팅 유틸리티
 * 천단위 콤마 표시 (날짜 제외)
 */

/**
 * 숫자에 천단위 콤마를 추가합니다
 * @param value - 포맷팅할 숫자 또는 문자열
 * @returns 천단위 콤마가 추가된 문자열
 */
export function formatNumber(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(num)) {
        return String(value);
    }

    return num.toLocaleString('ko-KR');
}

/**
 * 소수점 자릿수를 지정하여 숫자를 포맷팅합니다
 * @param value - 포맷팅할 숫자
 * @param decimals - 소수점 자릿수 (기본값: 1)
 * @returns 포맷팅된 문자열
 */
export function formatDecimal(value: number | string | null | undefined, decimals: number = 1): string {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(num)) {
        return String(value);
    }

    return num.toLocaleString('ko-KR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}
