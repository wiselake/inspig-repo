# Backend API 및 데이터베이스 가이드

**대상**: Backend 개발자, LLM  
**최종 업데이트**: 2025-12-11

---

## 1. 프로젝트 구조 (Project Structure)

`api/` 디렉토리의 전체 구조입니다.

```
api/
├── src/
│   ├── app.module.ts           # 메인 모듈 (TypeORM, Config, 공통 모듈 통합)
│   ├── app.controller.ts       # 메인 컨트롤러 (Health Check)
│   ├── app.service.ts          # 메인 서비스
│   ├── main.ts                 # 애플리케이션 진입점 (Global Pipes, Interceptors 설정)
│   │
│   ├── config/                 # 환경 설정 (Configuration)
│   │   ├── index.ts            # 설정 모듈 통합 Export
│   │   ├── app.config.ts       # 앱 기본 설정 (Port, Prefix, Env)
│   │   ├── database.config.ts  # Oracle DB 연결 설정
│   │   └── jwt.config.ts       # JWT 인증 설정
│   │
│   ├── common/                 # 공통 유틸리티 및 미들웨어
│   │   ├── index.ts
│   │   ├── guards/             # 인증/인가 가드 (예: JwtAuthGuard)
│   │   ├── interceptors/       # 응답/요청 변환 (예: Logging, Transform)
│   │   ├── filters/            # 예외 처리 필터 (예: HttpExceptionFilter)
│   │   ├── decorators/         # 커스텀 데코레이터 (예: @User)
│   │   └── typeorm-logger.ts   # 커스텀 SQL 로거
│   │
│   ├── data/                   # 정적 데이터 및 Mock
│   │   └── mock/
│   │       └── weekly.mock.ts  # 주간 보고서 Mock 데이터
│   │
│   └── modules/                # 비즈니스 로직 모듈 (Domain Modules)
│       ├── com/                # [공통] 시스템 공통 기능
│       │   ├── sql/            # 공통 SQL 쿼리
│       │   ├── com.module.ts
│       │   └── com.service.ts
│       │
│       ├── auth/               # [인증] 로그인, 토큰 발급
│       │   ├── dto/            # 데이터 전송 객체 (Validation 포함)
│       │   ├── entities/       # DB 엔티티 (TypeORM)
│       │   ├── sql/            # Raw SQL 쿼리 저장소
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   └── auth.module.ts
│       │
│       └── weekly/             # [주간보고서] 조회 및 데이터 처리
│           ├── dto/
│           ├── entities/
│           ├── sql/
│           ├── weekly.controller.ts
│           ├── weekly.service.ts
│           └── weekly.module.ts
│
├── .env                        # 환경 변수 (Git 제외)
├── package.json
├── nest-cli.json
└── tsconfig.json
```

---

## 2. 핵심 아키텍처 패턴 (Key Patterns)

### 2.1 SQL 관리 (Repository Pattern with Raw SQL)
TypeORM의 QueryBuilder 대신, **복잡한 쿼리는 별도 SQL 파일로 분리**하여 관리합니다. (MyBatis 스타일)
*   **위치**: `src/modules/{module}/sql/{module}.sql.ts`
*   **장점**: DBA와의 협업 용이, 쿼리 튜닝 및 가독성 확보.

#### SQL ID 규칙
모든 SQL 쿼리에는 주석으로 SQL ID를 포함해야 합니다:
```sql
/* 서비스.SQL파일.쿼리ID : 간략한 설명 */
SELECT ...
```

#### SQL 스타일 가이드
*   **대문자**: 모든 SQL 키워드와 테이블/컬럼명은 대문자로 작성
*   **테이블 별칭**: 1~2자 대문자로 테이블 성격을 표현 (예: M=Master, W=Week, S=Sub)

```typescript
// 예시: src/modules/auth/sql/auth.sql.ts
export const AUTH_SQL = {
  /** 회원 로그인 조회 */
  login: `
    /* auth.auth.login : 회원 로그인 조회 */
    SELECT
        M.MEMBER_ID,
        M.MEMBER_NM,
        M.FARM_NO
    FROM TA_MEMBER M
    WHERE M.MEMBER_ID = :memberId
      AND M.USE_YN = 'Y'
  `,
};
```

### 2.2 요청 검증 (DTO Validation)
`class-validator`를 사용하여 요청 데이터를 엄격하게 검증합니다.
*   **위치**: `src/modules/{module}/dto/*.dto.ts`
*   **적용**: Controller 핸들러의 파라미터에 DTO 타입 지정.

### 2.3 응답 표준화 (Response Standardization)
모든 API 응답은 `TransformInterceptor`를 통해 일관된 형식을 갖습니다.
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "..."
}
```

### 2.4 커스텀 로깅 (Custom Logging)
`CustomTypeOrmLogger`를 통해 실행된 SQL 쿼리를 가독성 좋게 콘솔에 출력합니다. (파라미터 바인딩 포함)

---

## 3. 주요 모듈 설명 (Module Descriptions)

### 3.1 Config Module (`src/config`)
*   환경 변수(`process.env`)를 Type-safe하게 로드하고 네임스페이스(`app`, `database`, `jwt`)로 구분하여 제공합니다.
*   `ConfigService`를 주입받아 사용합니다.

### 3.2 Common Module (`src/common`)
*   **Guards**: `JwtAuthGuard` - 요청 헤더의 Bearer Token 검증.
*   **Decorators**: `@User()` - Request 객체에서 사용자 정보 추출.
*   **Filters**: `HttpExceptionFilter` - 예외 발생 시 표준 에러 응답 반환.
*   **Interceptors**: `LoggingInterceptor` (실행 시간 로깅), `TransformInterceptor` (응답 래핑).

### 3.3 Com Module (`src/modules/com`) - 공통 모듈
*   **기능**: 시스템 전반에서 공유되는 공통 기능 제공.
*   **용도**:
    *   코드성 데이터 조회 (공통코드 등)
    *   특정 도메인에 종속되지 않는 공통 조회
    *   시스템 전반에서 재사용되는 SQL
*   **SQL 파일**: `com.sql.ts`

> **공통 SQL 관리 원칙**:
> - 특정 도메인에 종속된 SQL은 해당 모듈에 위치 (예: 인증 관련 → `auth/sql/`)
> - 2개 이상의 모듈에서 공유되는 SQL은 `com/sql/`에 위치
> - 코드성 데이터(공통코드, 설정값 등) 조회는 `com/sql/`에 위치

### 3.4 Auth Module (`src/modules/auth`)
*   **기능**: 사용자 로그인, JWT Access Token 발급, **공유 토큰 관리**.
*   **테이블**: `TA_MEMBER` (사용자), `TA_FARM` (농장), `TS_INS_SERVICE` (서비스).
*   **책임 영역**:
    *   로그인/로그아웃 처리
    *   JWT 발급 및 검증
    *   **공유 토큰 (Share Token)** 생성, 검증, 만료 처리
    *   사용자 권한 관리
*   **SQL 파일**:
    *   `auth.sql.ts`: 로그인, 농장/서비스 조회
    *   `share-token.sql.ts`: 공유 토큰 생성/검증/조회
*   **Flow**: `LoginDto` 검증 -> `AuthService.validateUser` -> `AUTH_SQL.login` -> JWT 발급.

### 3.5 Weekly Module (`src/modules/weekly`)
*   **기능**: 주간 보고서 목록/상세 조회, 차트/팝업 데이터 제공.
*   **테이블**: `TS_INS_MASTER` (보고서 마스터), `TS_INS_WEEK` (주간 요약), `TS_INS_WEEK_SUB` (상세 데이터).
*   **책임 영역**:
    *   보고서 목록/상세 데이터 조회
    *   차트/팝업 데이터 제공
    *   ⚠️ **토큰 관련 로직은 Auth 모듈에서 처리** (Weekly는 데이터 조회만 담당)
*   **SQL 파일**: `weekly.sql.ts`에 정의.

---

## 4. API 엔드포인트 요약 (API Summary)

### Auth
*   `POST /api/auth/login`: 로그인 및 토큰 발급

### Weekly Report
*   `GET /api/weekly/list`: 보고서 목록 조회 (기간 필터)
*   `GET /api/weekly/detail/:id`: 보고서 상세 데이터 조회
*   `GET /api/weekly/popup/:type/:id`: 팝업용 상세 데이터 (type: `modon`, `mating` 등)
*   `GET /api/weekly/chart/:type`: 차트용 데이터

---

## 5. 개발 가이드 (Development Guide)

### 5.1 새 모듈 생성
```bash
# 1. 모듈 디렉토리 생성
mkdir -p src/modules/new-feature/{dto,entities,sql}

# 2. 파일 생성 (Controller, Service, Module, SQL, DTO)
# ... (표준 네이밍 준수)
```

### 5.2 로컬 실행
```bash
npm run start:dev
```
*   서버는 `http://localhost:3001` (기본값)에서 실행됩니다.
*   Swagger 문서는 (설정된 경우) `/api/docs`에서 확인 가능합니다.

### 5.3 환경 변수 (.env)
```env
NODE_ENV=development
DB_HOST=...
JWT_SECRET=...
```
