/**
 * 에러 타입 정의
 * 백엔드에서 발생하는 모든 에러 유형을 정의합니다.
 */
export enum ErrorType {
    /** 데이터베이스 관련 에러 */
    DB = 'DB',

    /** 백엔드 서버 내부 에러 */
    BACKEND = 'BACKEND',

    /** 입력 검증 에러 */
    VALIDATION = 'VALIDATION',

    /** 리소스를 찾을 수 없음 */
    NOT_FOUND = 'NOT_FOUND',

    /** 일반 API 에러 */
    API = 'API',

    /** 인증 에러 */
    AUTH = 'AUTH',

    /** 권한 에러 */
    FORBIDDEN = 'FORBIDDEN',
}

/**
 * 에러 응답 인터페이스
 */
export interface ErrorResponse {
    success: false;
    errorType: ErrorType;
    statusCode: number;
    message: string;
    timestamp: string;
    path: string;
    details?: any;
}

/**
 * HTTP 상태 코드에 따른 에러 타입 매핑
 */
export function getErrorTypeByStatus(status: number): ErrorType {
    if (status >= 500) {
        return ErrorType.BACKEND;
    } else if (status === 404) {
        return ErrorType.NOT_FOUND;
    } else if (status === 401) {
        return ErrorType.AUTH;
    } else if (status === 403) {
        return ErrorType.FORBIDDEN;
    } else if (status === 400 || status === 422) {
        return ErrorType.VALIDATION;
    }
    return ErrorType.API;
}
