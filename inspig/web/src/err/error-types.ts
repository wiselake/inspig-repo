/**
 * 에러 타입 정의 (백엔드와 동일)
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

    /** 프론트엔드 에러 */
    FRONTEND = 'FRONTEND',

    /** 네트워크 에러 */
    NETWORK = 'NETWORK',

    /** 알 수 없는 에러 */
    UNKNOWN = 'UNKNOWN',
}

/**
 * 상세 에러 코드 정의
 */
export enum ErrorCode {
    // ===== 인증 관련 (AUTH_xxx) =====
    /** 아이디 또는 비밀번호 불일치 */
    AUTH_INVALID_CREDENTIALS = 'AUTH_001',
    /** 토큰 만료 */
    AUTH_TOKEN_EXPIRED = 'AUTH_002',
    /** 토큰 유효하지 않음 */
    AUTH_TOKEN_INVALID = 'AUTH_003',
    /** 로그인 필요 */
    AUTH_LOGIN_REQUIRED = 'AUTH_004',
    /** 세션 만료 */
    AUTH_SESSION_EXPIRED = 'AUTH_005',

    // ===== 네트워크 관련 (NET_xxx) =====
    /** 서버 연결 실패 */
    NET_CONNECTION_FAILED = 'NET_001',
    /** 요청 타임아웃 */
    NET_TIMEOUT = 'NET_002',
    /** DNS 조회 실패 */
    NET_DNS_FAILED = 'NET_003',
    /** 네트워크 연결 없음 (오프라인) */
    NET_OFFLINE = 'NET_004',

    // ===== CORS 관련 (CORS_xxx) =====
    /** CORS 정책 위반 */
    CORS_BLOCKED = 'CORS_001',
    /** Origin 불허용 */
    CORS_ORIGIN_DENIED = 'CORS_002',

    // ===== SSL/TLS 관련 (SSL_xxx) =====
    /** SSL 인증서 오류 */
    SSL_CERT_ERROR = 'SSL_001',
    /** SSL 핸드셰이크 실패 */
    SSL_HANDSHAKE_FAILED = 'SSL_002',
    /** 혼합 콘텐츠 차단 (HTTP/HTTPS) */
    SSL_MIXED_CONTENT = 'SSL_003',

    // ===== 서버 관련 (SRV_xxx) =====
    /** 서버 내부 오류 */
    SRV_INTERNAL_ERROR = 'SRV_001',
    /** 서버 점검 중 */
    SRV_MAINTENANCE = 'SRV_002',
    /** 서버 과부하 */
    SRV_OVERLOADED = 'SRV_003',
    /** 서비스 일시 중단 */
    SRV_UNAVAILABLE = 'SRV_004',

    // ===== 요청 관련 (REQ_xxx) =====
    /** 잘못된 요청 형식 */
    REQ_INVALID_FORMAT = 'REQ_001',
    /** 필수 파라미터 누락 */
    REQ_MISSING_PARAM = 'REQ_002',
    /** 파라미터 타입 오류 */
    REQ_INVALID_PARAM = 'REQ_003',

    // ===== 데이터 관련 (DATA_xxx) =====
    /** 데이터 없음 */
    DATA_NOT_FOUND = 'DATA_001',
    /** 데이터 중복 */
    DATA_DUPLICATE = 'DATA_002',
    /** 데이터 형식 오류 */
    DATA_INVALID_FORMAT = 'DATA_003',

    // ===== 권한 관련 (PERM_xxx) =====
    /** 접근 권한 없음 */
    PERM_ACCESS_DENIED = 'PERM_001',
    /** 작업 권한 없음 */
    PERM_ACTION_DENIED = 'PERM_002',

    // ===== 기타 (ETC_xxx) =====
    /** 알 수 없는 오류 */
    ETC_UNKNOWN = 'ETC_001',
    /** 응답 파싱 오류 */
    ETC_PARSE_ERROR = 'ETC_002',
}

/**
 * API 에러 응답 인터페이스
 */
export interface ApiErrorResponse {
    success: false;
    errorType: ErrorType;
    statusCode: number;
    message: string;
    timestamp: string;
    path: string;
    details?: any;
}

/**
 * 에러 정보 인터페이스
 */
export interface ErrorInfo {
    type: ErrorType;
    message: string;
    details?: any;
}
