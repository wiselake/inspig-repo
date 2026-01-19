/**
 * 에러 메시지 상수
 * 시스템 전체에서 사용하는 에러 메시지를 중앙 관리합니다.
 */
export const ErrorMessages = {
    // 데이터베이스 에러
    DB: {
        CONNECTION_FAILED: '데이터베이스 연결에 실패했습니다.',
        QUERY_FAILED: '데이터베이스 쿼리 실행 중 오류가 발생했습니다.',
        TRANSACTION_FAILED: '트랜잭션 처리 중 오류가 발생했습니다.',
    },

    // 인증 에러
    AUTH: {
        INVALID_CREDENTIALS: '아이디 또는 비밀번호가 올바르지 않습니다.',
        TOKEN_EXPIRED: '인증 토큰이 만료되었습니다. 다시 로그인해주세요.',
        TOKEN_INVALID: '유효하지 않은 인증 토큰입니다.',
        UNAUTHORIZED: '인증이 필요합니다.',
    },

    // 권한 에러
    FORBIDDEN: {
        ACCESS_DENIED: '접근 권한이 없습니다.',
        INSUFFICIENT_PERMISSION: '권한이 부족합니다.',
    },

    // 검증 에러
    VALIDATION: {
        REQUIRED_FIELD: '필수 입력 항목입니다.',
        INVALID_FORMAT: '입력 형식이 올바르지 않습니다.',
        INVALID_PARAMETER: '잘못된 파라미터입니다.',
    },

    // 리소스 에러
    NOT_FOUND: {
        RESOURCE: '요청한 리소스를 찾을 수 없습니다.',
        REPORT: '보고서를 찾을 수 없습니다.',
        USER: '사용자를 찾을 수 없습니다.',
        FARM: '농장 정보를 찾을 수 없습니다.',
    },

    // 일반 에러
    GENERAL: {
        INTERNAL_SERVER_ERROR: '서버 내부 오류가 발생했습니다.',
        UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
        SERVICE_UNAVAILABLE: '서비스를 일시적으로 사용할 수 없습니다.',
    },
} as const;
