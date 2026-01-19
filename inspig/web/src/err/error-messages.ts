import { ErrorCode } from './error-types';

/**
 * 에러 타입별 메시지 (기존 호환)
 */
export const ErrorMessages = {
    // 데이터베이스 에러
    DB: {
        title: 'DB 에러',
        default: '데이터베이스 오류가 발생했습니다.\n관리자에게 문의하세요.',
    },

    // 백엔드 에러
    BACKEND: {
        title: '백엔드 에러',
        default: '서버 오류가 발생했습니다.\n관리자에게 문의하세요.',
    },

    // 검증 에러
    VALIDATION: {
        title: '입력 검증 에러',
        default: '입력값을 확인하세요.',
    },

    // 조회 에러
    NOT_FOUND: {
        title: '조회 에러',
        default: '요청한 데이터를 찾을 수 없습니다.',
    },

    // API 에러
    API: {
        title: 'API 에러',
        default: '요청 처리 중 오류가 발생했습니다.',
    },

    // 인증 에러
    AUTH: {
        title: '인증 에러',
        default: '인증에 실패했습니다.\n다시 로그인해주세요.',
    },

    // 권한 에러
    FORBIDDEN: {
        title: '권한 에러',
        default: '접근 권한이 없습니다.',
    },

    // 프론트엔드 에러
    FRONTEND: {
        title: '프론트엔드 에러',
        default: '예상치 못한 오류가 발생했습니다.',
    },

    // 네트워크 에러
    NETWORK: {
        title: '네트워크 에러',
        default: '네트워크 연결에 실패했습니다.\n서버가 실행 중인지 확인하세요.',
    },

    // 서버 에러
    SERVER: {
        title: '서버 에러',
        default: '서버 오류가 발생했습니다.',
    },

    // 요청 에러
    REQUEST: {
        title: '요청 에러',
        default: '요청 처리 중 오류가 발생했습니다.',
    },

    // 알 수 없는 에러
    UNKNOWN: {
        title: '알 수 없는 에러',
        default: '알 수 없는 오류가 발생했습니다.',
    },
} as const;

/**
 * 에러 코드별 사용자 메시지
 */
export const ErrorCodeMessages: Record<ErrorCode, string> = {
    // ===== 인증 관련 =====
    [ErrorCode.AUTH_INVALID_CREDENTIALS]: '아이디 또는 비밀번호가 일치하지 않습니다.',
    [ErrorCode.AUTH_TOKEN_EXPIRED]: '인증이 만료되었습니다. 다시 로그인해주세요.',
    [ErrorCode.AUTH_TOKEN_INVALID]: '인증 정보가 유효하지 않습니다. 다시 로그인해주세요.',
    [ErrorCode.AUTH_LOGIN_REQUIRED]: '로그인이 필요합니다.',
    [ErrorCode.AUTH_SESSION_EXPIRED]: '세션이 만료되었습니다. 다시 로그인해주세요.',

    // ===== 네트워크 관련 =====
    [ErrorCode.NET_CONNECTION_FAILED]: '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.',
    [ErrorCode.NET_TIMEOUT]: '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.',
    [ErrorCode.NET_DNS_FAILED]: '서버 주소를 찾을 수 없습니다. 네트워크 설정을 확인해주세요.',
    [ErrorCode.NET_OFFLINE]: '인터넷 연결이 없습니다. 네트워크 연결을 확인해주세요.',

    // ===== CORS 관련 =====
    [ErrorCode.CORS_BLOCKED]: '보안 정책으로 인해 요청이 차단되었습니다.',
    [ErrorCode.CORS_ORIGIN_DENIED]: '허용되지 않은 접근입니다.',

    // ===== SSL/TLS 관련 =====
    [ErrorCode.SSL_CERT_ERROR]: '보안 인증서 오류가 발생했습니다.',
    [ErrorCode.SSL_HANDSHAKE_FAILED]: '보안 연결을 설정할 수 없습니다.',
    [ErrorCode.SSL_MIXED_CONTENT]: '보안 연결 문제가 발생했습니다.',

    // ===== 서버 관련 =====
    [ErrorCode.SRV_INTERNAL_ERROR]: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    [ErrorCode.SRV_MAINTENANCE]: '서버 점검 중입니다. 잠시 후 다시 시도해주세요.',
    [ErrorCode.SRV_OVERLOADED]: '서버가 일시적으로 혼잡합니다. 잠시 후 다시 시도해주세요.',
    [ErrorCode.SRV_UNAVAILABLE]: '서비스를 일시적으로 사용할 수 없습니다.',

    // ===== 요청 관련 =====
    [ErrorCode.REQ_INVALID_FORMAT]: '잘못된 요청 형식입니다.',
    [ErrorCode.REQ_MISSING_PARAM]: '필수 입력값이 누락되었습니다.',
    [ErrorCode.REQ_INVALID_PARAM]: '입력값이 올바르지 않습니다.',

    // ===== 데이터 관련 =====
    [ErrorCode.DATA_NOT_FOUND]: '요청한 데이터를 찾을 수 없습니다.',
    [ErrorCode.DATA_DUPLICATE]: '이미 존재하는 데이터입니다.',
    [ErrorCode.DATA_INVALID_FORMAT]: '데이터 형식이 올바르지 않습니다.',

    // ===== 권한 관련 =====
    [ErrorCode.PERM_ACCESS_DENIED]: '접근 권한이 없습니다.',
    [ErrorCode.PERM_ACTION_DENIED]: '해당 작업을 수행할 권한이 없습니다.',

    // ===== 기타 =====
    [ErrorCode.ETC_UNKNOWN]: '알 수 없는 오류가 발생했습니다.',
    [ErrorCode.ETC_PARSE_ERROR]: '응답 처리 중 오류가 발생했습니다.',
};
