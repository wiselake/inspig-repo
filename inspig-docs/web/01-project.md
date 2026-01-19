# INSPIG 프로젝트 개요

**프로젝트명**: INSPIG (양돈 농장 관리 시스템)  
**최종 업데이트**: 2025-12-11

---

## 1. 접속 정보

### 개발 서버
| 구분 | URL | 비고 |
|------|-----|------|
| Frontend | `http://localhost:3000` | Next.js 개발 서버 |
| Backend API | `http://localhost:3001` | NestJS API 서버 |

### 주요 페이지 경로
| 페이지 | 경로 | 설명 |
|--------|------|------|
| 로그인 | `/login` | JWT 인증 로그인 |
| 주간 리포트 목록 | `/weekly` | 로그인 필요 |
| 주간 리포트 상세 | `/weekly/{masterSeq}/{farmNo}` | 로그인 필요 |
| 공유 링크 접속 | `/weekly/s/{token}` | 토큰 기반 (로그인 불필요) |

---

## 2. 프로젝트 구조

```
inspig/
├── web/                    # 프론트엔드 (Next.js, TypeScript, Tailwind CSS)
│   └── src/
│       ├── app/            # 페이지 및 레이아웃 (App Router)
│       ├── components/     # UI 컴포넌트
│       ├── contexts/       # React Context (인증, 테마 등)
│       ├── err/            # 에러 관리 (타입, 메시지, 유틸리티)
│       ├── services/       # API 통신 및 Mock 데이터
│       └── utils/          # 유틸리티 함수
│
├── api/                    # 백엔드 (NestJS, TypeORM, Oracle)
│   └── src/
│       ├── common/         # 공통 모듈
│       │   ├── err/        # 에러 관리 (타입, 메시지)
│       │   ├── filters/    # Exception Filters
│       │   ├── guards/     # Auth Guards
│       │   └── interceptors/
│       ├── config/         # 설정 (DB, JWT 등)
│       └── modules/        # 기능 모듈 (auth, weekly 등)
│           └── {module}/
│               ├── sql/    # Raw SQL 쿼리
│               ├── dto/    # 데이터 전송 객체
│               ├── entities/ # TypeORM 엔티티
│               └── *.service.ts
│
└── docs/                   # 프로젝트 문서
    ├── web/                # 웹 관련 문서
    └── db/                 # 데이터베이스 관련 문서
```

---

## 3. 주요 기능

- **인증**: JWT 기반 로그인/로그아웃, 공유 토큰 인증
- **보고서**: 주간 리포트 조회 및 시각화
- **데이터 시각화**: ECharts 기반 차트 (모돈, 교배, 분만, 이유, 도태, 출하 등)
- **UI/UX**: 다크 모드, 반응형 디자인, 인터랙티브 팝업

---

## 4. 개발 환경

- **Frontend**: Node.js 20+, Next.js 15, Tailwind CSS
- **Backend**: NestJS, TypeORM, Oracle 19c
- **인증**: JWT (Access Token 24h)

---

## 5. 서버 실행

```bash
# Frontend (web/)
npm run dev          # http://localhost:3000

# Backend (api/)
npm run start:dev    # http://localhost:3001
```

---

## 6. 문서 가이드

| 파일 | 설명 |
|------|------|
| `01-project.md` | 프로젝트 개요 (현재 문서) |
| `02-frontend.md` | Frontend 상세 가이드 |
| `03-backend.md` | Backend 상세 가이드 |
| `04-deployment.md` | 배포 가이드 |
| `05-auth.md` | 인증 가이드 |
| `06-error-handling.md` | 에러 관리 가이드 |
| `07-code-caching.md` | **코드 테이블 캐싱 가이드** |

---

## 7. 개발 지침 (LLM/개발자용)

> **중요**: 작업 시 관련 문서를 **반드시 함께 확인**하세요.

### 7.1 필수 참조 문서
- **Frontend 작업**: `02-frontend.md`
- **Backend 작업**: `03-backend.md`
- **인증/토큰 관련**: `05-auth.md`
- **에러 처리**: `06-error-handling.md`
- **코드 캐싱**: `07-code-caching.md` ⭐ (SQL에서 코드명 조회 금지, 캐시 사용)
- **배포 관련**: `04-deployment.md`

### 7.2 Backend 모듈 책임 영역
| 모듈 | 책임 | 비고 |
|------|------|------|
| `auth` | 로그인, JWT, **공유 토큰** | 토큰 관련 모든 로직 |
| `weekly` | 보고서 데이터 조회만 | 토큰 처리 X |

### 7.3 SQL 작성 규칙

#### 기본 원칙
1. **SQL ID 주석 필수**: `/* 서비스.SQL파일.쿼리ID : 설명 */`
2. **대문자 사용**: SQL 키워드, 테이블명, 컬럼명
3. **테이블 별칭**: 1~2자 대문자 (M=Master, W=Week, S=Sub)
4. **Named Parameter**: `:paramName` 형식 (위치 기반 `:1`, `:2` 금지)

#### SQL 파일 위치
```
api/src/modules/{module}/sql/{module}.sql.ts
```

**예시:**
```typescript
export const WEEKLY_SQL = {
  getReportList: `
    /* weekly.weekly.getReportList : 보고서 목록 조회 */
    SELECT M.SEQ, M.REPORT_YEAR, M.REPORT_WEEK_NO
    FROM TS_INS_MASTER M
    INNER JOIN TS_INS_WEEK W ON W.MASTER_SEQ = M.SEQ
    WHERE W.FARM_NO = :farmNo
      AND M.STATUS_CD = 'COMPLETE'
    ORDER BY M.REPORT_YEAR DESC
  `,
};
```

### 7.4 에러 처리 규칙

**상세 내용**: `06-error-handling.md` 참조

#### Backend
```typescript
try {
  const results = await this.dataSource.query(SQL, params);
  return results;
} catch (error) {
  this.logger.error('조회 실패', error.message);
  return [];  // 또는 예외 throw
}
```

#### Frontend
```typescript
import { parseApiError, parseFetchError } from '@/err';

if (!res.ok) {
  const errorInfo = parseApiError(await res.json());
  alert(errorInfo.message);  // [DB 에러] 데이터베이스 오류가...
}
```

---

## 8. 공유 링크 시스템

- **형식**: `/weekly/{64자_SHA256_토큰}` (통합 뷰어)
- **유효기간**: 생성일로부터 **7일** (로그인 사용자는 무제한)
- **만료 시**: 만료 안내 → 로그인 페이지 유도
- **세션**: 유효 토큰 접속 시 1시간 임시 JWT 발급

---

## 9. API 엔드포인트 (주간 리포트)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/weekly/list?farmNo={farmNo}` | 리포트 목록 |
| GET | `/api/weekly/view/{token}` | 리포트 상세 (통합) |
| GET | `/api/weekly/popup/{type}/{masterSeq}/{farmNo}` | 팝업 데이터 |
