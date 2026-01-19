import { ErrorType, ErrorCode, ErrorInfo } from './error-types';
import { ErrorMessages, ErrorCodeMessages } from './error-messages';

/**
 * 에러 메시지 포맷팅
 */
export function formatErrorMessage(errorType: ErrorType, message?: string): string {
    const errorConfig = ErrorMessages[errorType] || ErrorMessages.FRONTEND;
    const title = errorConfig.title;
    const defaultMsg = errorConfig.default;

    return `[${title}] ${message || defaultMsg}`;
}

/**
 * 에러 코드로 메시지 가져오기
 */
export function getErrorMessage(code: ErrorCode): string {
    return ErrorCodeMessages[code] || ErrorCodeMessages[ErrorCode.ETC_UNKNOWN];
}

/**
 * API 에러 응답 파싱
 */
export function parseApiError(response: any): ErrorInfo {
    const errorType = (response.errorType as ErrorType) || ErrorType.UNKNOWN;
    const message = response.message || ErrorMessages[errorType]?.default || '알 수 없는 오류가 발생했습니다.';

    return {
        type: errorType,
        message: formatErrorMessage(errorType, message),
        details: response,
    };
}

/**
 * fetch 에러에서 에러 코드 감지
 */
export function detectErrorCode(error: unknown): ErrorCode {
    if (!(error instanceof Error)) {
        return ErrorCode.ETC_UNKNOWN;
    }

    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // 오프라인 상태
    if (!navigator.onLine) {
        return ErrorCode.NET_OFFLINE;
    }

    // TypeError - 네트워크 관련
    if (error instanceof TypeError) {
        if (message.includes('failed to fetch') || message.includes('network')) {
            return ErrorCode.NET_CONNECTION_FAILED;
        }
        if (message.includes('cors') || message.includes('cross-origin')) {
            return ErrorCode.CORS_BLOCKED;
        }
    }

    // AbortError - 타임아웃
    if (name === 'aborterror' || message.includes('timeout') || message.includes('aborted')) {
        return ErrorCode.NET_TIMEOUT;
    }

    // SSL/TLS 관련
    if (message.includes('ssl') || message.includes('certificate') || message.includes('cert')) {
        return ErrorCode.SSL_CERT_ERROR;
    }
    if (message.includes('mixed content') || message.includes('blocked:mixed')) {
        return ErrorCode.SSL_MIXED_CONTENT;
    }

    // CORS 관련
    if (message.includes('cors') || message.includes('cross-origin') || message.includes('access-control')) {
        return ErrorCode.CORS_BLOCKED;
    }

    // DNS 관련
    if (message.includes('dns') || message.includes('getaddrinfo') || message.includes('enotfound')) {
        return ErrorCode.NET_DNS_FAILED;
    }

    // 연결 거부
    if (message.includes('econnrefused') || message.includes('connection refused')) {
        return ErrorCode.NET_CONNECTION_FAILED;
    }

    // JSON 파싱 오류
    if (error instanceof SyntaxError || message.includes('json')) {
        return ErrorCode.ETC_PARSE_ERROR;
    }

    return ErrorCode.ETC_UNKNOWN;
}

/**
 * HTTP 상태 코드에서 에러 코드 감지
 */
export function detectErrorCodeByStatus(status: number, responseBody?: any): ErrorCode {
    // 서버 응답에 에러코드가 있으면 우선 사용
    if (responseBody?.errorCode) {
        const code = responseBody.errorCode as ErrorCode;
        if (Object.values(ErrorCode).includes(code)) {
            return code;
        }
    }

    switch (status) {
        case 400:
            return ErrorCode.REQ_INVALID_FORMAT;
        case 401:
            return ErrorCode.AUTH_LOGIN_REQUIRED;
        case 403:
            return ErrorCode.PERM_ACCESS_DENIED;
        case 404:
            return ErrorCode.DATA_NOT_FOUND;
        case 408:
            return ErrorCode.NET_TIMEOUT;
        case 409:
            return ErrorCode.DATA_DUPLICATE;
        case 422:
            return ErrorCode.REQ_INVALID_PARAM;
        case 500:
            return ErrorCode.SRV_INTERNAL_ERROR;
        case 502:
        case 504:
            return ErrorCode.NET_CONNECTION_FAILED;
        case 503:
            return ErrorCode.SRV_UNAVAILABLE;
        default:
            if (status >= 500) {
                return ErrorCode.SRV_INTERNAL_ERROR;
            }
            return ErrorCode.ETC_UNKNOWN;
    }
}

/**
 * Fetch 에러 파싱 (코드화된 버전)
 */
export function parseFetchError(error: unknown): ErrorInfo {
    const code = detectErrorCode(error);
    const message = getErrorMessage(code);

    return {
        type: ErrorType.NETWORK,
        message,
        details: { code, originalError: error instanceof Error ? error.message : error },
    };
}

/**
 * HTTP 상태 코드 기반 에러 타입 추론
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

/**
 * API 응답 에러 처리 (통합 함수)
 */
export async function handleApiError(response: Response): Promise<{ code: ErrorCode; message: string }> {
    let responseBody: any = null;

    try {
        responseBody = await response.json();
    } catch {
        // JSON 파싱 실패 시 무시
    }

    const code = detectErrorCodeByStatus(response.status, responseBody);
    const message = responseBody?.message || getErrorMessage(code);

    return { code, message };
}
