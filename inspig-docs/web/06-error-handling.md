# 에러 관리 가이드 (Error Handling)

**대상**: Backend/Frontend 개발자, LLM
**최종 업데이트**: 2025-12-22

---

## 1. 에러 관리 디렉토리 구조

모든 에러 관련 코드는 `err/` 폴더에서 중앙 관리합니다.

```
api/src/common/err/          # Backend 에러 관리
├── error-types.ts           # 에러 타입 enum 및 인터페이스
├── error-messages.ts        # 에러 메시지 상수
└── index.ts                 # 모듈 export

web/src/err/                 # Frontend 에러 관리
├── error-types.ts           # ErrorType, ErrorCode enum 및 인터페이스
├── error-messages.ts        # 에러 타입별/코드별 메시지 상수
├── error-utils.ts           # 에러 감지/파싱/포맷팅 유틸리티
└── index.ts                 # 모듈 export
```

---

## 2. 에러 체계

### 2.1 ErrorType (에러 타입)
| 에러 타입 | 설명 | HTTP 상태 | 발생 위치 |
|----------|------|-----------|----------|
| `DB` | 데이터베이스 오류 | 500 | Backend |
| `BACKEND` | 서버 내부 오류 | 500 | Backend |
| `VALIDATION` | 입력 검증 오류 | 400, 422 | Backend |
| `NOT_FOUND` | 리소스 미존재 | 404 | Backend |
| `API` | 일반 API 오류 | 4xx | Backend |
| `AUTH` | 인증 오류 | 401 | Backend |
| `FORBIDDEN` | 권한 오류 | 403 | Backend |
| `FRONTEND` | 프론트엔드 오류 | - | Frontend |
| `NETWORK` | 네트워크 연결 오류 | - | Frontend |

### 2.2 ErrorCode (상세 에러 코드)
| 코드 그룹 | 코드 예시 | 설명 |
|----------|----------|------|
| `AUTH_xxx` | AUTH_001 ~ AUTH_005 | 인증 관련 (로그인 실패, 토큰 만료, 세션 만료 등) |
| `NET_xxx` | NET_001 ~ NET_004 | 네트워크 관련 (연결 실패, 타임아웃, 오프라인 등) |
| `CORS_xxx` | CORS_001 ~ CORS_002 | CORS 정책 위반, Origin 불허용 |
| `SSL_xxx` | SSL_001 ~ SSL_003 | SSL 인증서 오류, 혼합 콘텐츠 차단 |
| `SRV_xxx` | SRV_001 ~ SRV_004 | 서버 관련 (내부 오류, 점검 중, 과부하 등) |
| `REQ_xxx` | REQ_001 ~ REQ_003 | 요청 관련 (형식 오류, 파라미터 누락 등) |
| `DATA_xxx` | DATA_001 ~ DATA_003 | 데이터 관련 (없음, 중복, 형식 오류) |
| `PERM_xxx` | PERM_001 ~ PERM_002 | 권한 관련 (접근/작업 권한 없음) |
| `ETC_xxx` | ETC_001 ~ ETC_002 | 기타 (알 수 없는 오류, 파싱 오류) |

---

## 3. Backend 에러 처리

### 3.1 Exception Filter (자동 처리)

모든 HTTP 예외는 `HttpExceptionFilter`가 자동으로 처리하여 표준 형식으로 응답합니다.

**응답 형식:**
```json
{
  "success": false,
  "errorType": "DB",
  "statusCode": 500,
  "message": "데이터베이스 오류가 발생했습니다.",
  "timestamp": "2025-12-11T17:55:00.000Z",
  "path": "/api/weekly/list"
}
```

**구현 위치:**
- `api/src/common/filters/http-exception.filter.ts`

### 3.2 Service에서 에러 처리

```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WeeklyService {
  private readonly logger = new Logger(WeeklyService.name);

  async getReportList(farmNo: number) {
    try {
      const results = await this.dataSource.query(SQL, params({ farmNo }));
      return results.map(row => ({ ... }));
    } catch (error) {
      // 에러 로그 기록
      this.logger.error('리포트 목록 조회 실패', error.message);
      
      // 빈 배열 반환 (또는 예외 throw)
      return [];
    }
  }
}
```

### 3.3 에러 타입 사용

```typescript
import { ErrorType, getErrorTypeByStatus } from '@/common/err';

// HTTP 상태 코드로 에러 타입 자동 결정
const errorType = getErrorTypeByStatus(status);
// status 500 → ErrorType.BACKEND
// status 404 → ErrorType.NOT_FOUND
// status 401 → ErrorType.AUTH
```

---

## 4. Frontend 에러 처리

### 4.1 에러 코드 기반 처리 (권장)

```typescript
import { ErrorCode, detectErrorCode, detectErrorCodeByStatus, getErrorMessage } from '@/err';

// 로그인 예시 (AuthContext.tsx)
const login = async (memberId: string, password: string) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, password }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        const code = ErrorCode.AUTH_INVALID_CREDENTIALS;
        return { success: false, error: getErrorMessage(code), code };
      }
      const code = detectErrorCodeByStatus(response.status);
      return { success: false, error: getErrorMessage(code), code };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    // 네트워크/CORS/SSL 에러 자동 감지
    const code = detectErrorCode(error);
    return { success: false, error: getErrorMessage(code), code };
  }
};
```

### 4.2 API 서비스 공통 에러 처리

```typescript
import { ApiError } from '@/services/api';
import { ErrorCode } from '@/err';

try {
  const data = await weeklyApi.getList();
} catch (error) {
  if (error instanceof ApiError) {
    console.log(error.code);       // ErrorCode.NET_CONNECTION_FAILED
    console.log(error.message);    // "서버에 연결할 수 없습니다..."
    console.log(error.statusCode); // 502
  }
}
```

### 4.3 에러 감지 함수

```typescript
import { detectErrorCode, detectErrorCodeByStatus } from '@/err';

// fetch 에러에서 자동 감지 (CORS, SSL, 네트워크 등)
const code = detectErrorCode(error);

// HTTP 상태 코드에서 감지
const code = detectErrorCodeByStatus(response.status, responseBody);
```

### 4.4 에러 정보 구조

```typescript
interface ErrorInfo {
  type: ErrorType;           // 에러 타입
  message: string;           // 사용자 메시지
  details?: any;             // 원본 에러 데이터 (code 포함)
}
```

---

## 5. 에러 메시지 관리

### 5.1 Backend 에러 메시지

**위치**: `api/src/common/err/error-messages.ts`

```typescript
export const ErrorMessages = {
  DB: {
    CONNECTION_FAILED: '데이터베이스 연결에 실패했습니다.',
    QUERY_FAILED: '데이터베이스 쿼리 실행 중 오류가 발생했습니다.',
  },
  AUTH: {
    INVALID_CREDENTIALS: '아이디 또는 비밀번호가 올바르지 않습니다.',
    TOKEN_EXPIRED: '인증 토큰이 만료되었습니다. 다시 로그인해주세요.',
  },
  // ...
};
```

### 5.2 Frontend 에러 메시지

**위치**: `web/src/err/error-messages.ts`

```typescript
// 에러 타입별 메시지 (기존 호환)
export const ErrorMessages = {
  DB: { title: 'DB 에러', default: '데이터베이스 오류가 발생했습니다.' },
  NETWORK: { title: '네트워크 에러', default: '네트워크 연결에 실패했습니다.' },
  // ...
};

// 에러 코드별 사용자 메시지 (신규)
export const ErrorCodeMessages: Record<ErrorCode, string> = {
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: '아이디 또는 비밀번호가 일치하지 않습니다.',
  [ErrorCode.NET_CONNECTION_FAILED]: '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.',
  [ErrorCode.NET_OFFLINE]: '인터넷 연결이 없습니다. 네트워크 연결을 확인해주세요.',
  [ErrorCode.CORS_BLOCKED]: '보안 정책으로 인해 요청이 차단되었습니다.',
  [ErrorCode.SSL_CERT_ERROR]: '보안 인증서 오류가 발생했습니다.',
  // ...
};
```

---

## 6. 에러 메시지 표시 규칙

### 6.1 기본 원칙

1. **사용자 친화적**: 기술적 용어 대신 이해하기 쉬운 설명
2. **에러 유형 표시**: `[DB 에러]`, `[백엔드 에러]` 등 접두어로 명확히 구분
3. **해결 방법 안내**: 가능한 경우 사용자가 취할 수 있는 조치 방법 포함
4. **일관된 형식**: 모든 에러 메시지는 `ErrorMessages` 상수 사용

### 6.2 메시지 형식

```
[에러 타입] 에러 설명
해결 방법 (선택)
```

**예시:**
```
[DB 에러] 데이터베이스 오류가 발생했습니다.
관리자에게 문의하세요.

[네트워크 에러] 네트워크 연결에 실패했습니다.
서버가 실행 중인지 확인하세요.

[입력 검증 에러] 필수 입력 항목입니다.
```

---

## 7. 에러 로깅

### 7.1 Backend 로깅

```typescript
// NestJS Logger 사용
this.logger.error(
  `[${errorType}] ${request.method} ${request.url} ${status} - ${message}`,
  error.stack
);

// 출력 예시:
// [DB] GET /api/weekly/list 500 - 데이터베이스 연결 실패
```

### 7.2 Frontend 로깅

```typescript
// console.error 사용
console.error('API 호출 오류:', error);

// 에러 정보와 함께 로깅
const errorInfo = parseFetchError(error);
console.error(`[${errorInfo.type}]`, errorInfo.message, errorInfo.details);
```

---

## 8. 체크리스트

### Backend 개발 시
- [ ] Service에서 try-catch로 에러 처리
- [ ] 에러 발생 시 적절한 로그 기록 (`this.logger.error`)
- [ ] 빈 배열 반환 또는 명확한 예외 throw
- [ ] `ErrorMessages` 상수 사용

### Frontend 개발 시
- [ ] `parseApiError` 또는 `parseFetchError` 사용
- [ ] 사용자에게 에러 메시지 표시 (alert 또는 Toast)
- [ ] console.error로 상세 정보 로깅
- [ ] 에러 발생 시 적절한 fallback UI 표시

---

## 9. 참고 문서

- **Backend 상세**: `docs/web/03-backend.md`
- **Frontend 상세**: `docs/web/02-frontend.md`
- **프로젝트 개요**: `docs/web/01-project.md`
