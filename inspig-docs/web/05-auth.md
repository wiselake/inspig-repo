# 인증 및 권한 시스템

**대상**: Full-stack 개발자
**최종 업데이트**: 2025-12-11

---

## 1. 인증 방식 개요

| 방식 | 대상 | 토큰 유형 | 유효기간 |
|------|------|----------|---------|
| 일반 로그인 | 내부 사용자 | JWT Access Token | 24시간 |
| 공유 링크 | 외부 사용자 | SHA256 Share Token | 7일 |
| 공유 세션 | 공유 링크 접속자 | 임시 JWT | 1시간 |

---

## 2. 통합 뷰어 아키텍처 (Unified Viewer)

**핵심 변경 사항 (2025-12-11)**:
로그인 사용자와 외부 공유 사용자는 **동일한 상세 페이지**와 **동일한 API**를 사용합니다.

### 2.1 접근 권한 구분
URL은 동일하지만, **HTTP Header**를 통해 접근 권한을 구분합니다.

| 구분 | 로그인 사용자 (Login Access) | 공유 사용자 (Share Access) |
| :--- | :--- | :--- |
| **진입 경로** | 리포트 목록 클릭 | 카카오톡/문자 공유 링크 클릭 |
| **URL 형식** | `/weekly/{token}` | `/weekly/{token}` |
| **인증 방식** | `Authorization: Bearer <JWT>` 헤더 포함 | 헤더 없음 (토큰만으로 식별) |
| **만료일 검증** | **생략** (로그인 세션이 유효하면 접근 허용) | **필수** (토큰 만료일 지나면 차단) |
| **토큰 정책** | 토큰이 없으면 **자동 생성** 후 이동 | 유효한 토큰이 있어야만 접근 가능 |

---

## 3. 일반 로그인 플로우

```
[로그인 페이지] → [/api/auth/login] → [JWT 발급] → [localStorage 저장] → [보고서 접근]
```

**저장 위치**: `sessionStorage.token` (또는 `localStorage`)
**API 헤더**: `Authorization: Bearer {token}`

---

## 4. 공유 토큰 시스템

### 4.1 토큰 사양

| 항목 | 값 |
|------|-----|
| 알고리즘 | SHA256 (Oracle `STANDARD_HASH`) |
| 길이 | 64자 (hex) |
| 유효기간 | 7일 (설정 가능) |
| 생성 규칙 | `HASH(FARM_NO + MASTER_SEQ + TIMESTAMP)` |

### 4.2 적용 대상

| 보고서 | 테이블 | URL 형식 | 상태 |
|--------|--------|----------|------|
| 주간 | `TS_INS_WEEK` | `/weekly/{token}` | 완료 |
| 월간 | `TS_INS_MONTH` | `/monthly/{token}` | 예정 |
| 분기 | `TS_INS_QUARTER` | `/quarterly/{token}` | 예정 |

### 4.3 DB 컬럼 (공통)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `SHARE_TOKEN` | VARCHAR2(64) | SHA256 토큰 |
| `TOKEN_EXPIRE_DT` | DATE | 만료일시 |

### 4.4 인증 흐름

```
[통합 뷰 API 호출] → [WeeklyController.getView]
                           │
                           ├─ Authorization 헤더 확인
                           │    ├─ 있음: skipExpiryCheck = true
                           │    └─ 없음: skipExpiryCheck = false
                           │
                           └─ [WeeklyService.getReportByShareTokenWithExpiry]
                                      │
                                      ├─ 토큰 없음 → 404 Not Found
                                      │
                                      ├─ 토큰 만료 (skipExpiryCheck=false) → 만료 안내
                                      │
                                      └─ 토큰 유효 → 데이터 반환
```

---

## 5. 파일 구조

### Backend (NestJS)
```
api/src/modules/auth/
├── auth.controller.ts      # 로그인/로그아웃 API
├── auth.service.ts         # JWT 발급/검증
├── share-token.service.ts  # 공유 토큰 전담 (validate/generate/get)
└── sql/
    ├── auth.sql.ts         # 로그인 SQL
    └── share-token.sql.ts  # 토큰 SQL

api/src/modules/weekly/
├── weekly.controller.ts    # 통합 뷰 API (getView)
└── weekly.service.ts       # 리포트 데이터 조회
```

### Frontend (Next.js)
```
web/src/
├── app/
│   ├── login/page.tsx           # 로그인 페이지
│   └── (report)/weekly/[id]/page.tsx  # 통합 상세 페이지 (id=token)
├── contexts/AuthContext.tsx     # 인증 상태 관리
└── services/api.ts              # API 호출
```

---

## 6. API 엔드포인트

### 인증 API
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/api/auth/login` | 로그인 | 불필요 |

### 리포트 API (통합)
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/api/weekly/view/:token` | 리포트 상세 (통합) | 선택 (Header) |
| POST | `/api/weekly/share/create` | 토큰 생성 | JWT |

---

## 7. 응답 형식

### 통합 뷰 성공
```json
{ 
  "success": true, 
  "data": {...}, 
  "sessionToken": "임시JWT",
  "isLoginAccess": true/false 
}
```

### 공유 토큰 만료
```json
{ "success": false, "expired": true, "message": "공유 링크가 만료되었습니다." }
```

---

## 8. 보안 고려사항

- **URL 보안**: PK(`masterSeq`)를 URL에 노출하지 않고 난수화된 토큰 사용.
- **접근 제어**: 로그인 사용자는 만료된 토큰으로도 접근 가능하나, 외부 사용자는 차단.
- **JWT**: Access Token 24시간, Share Session Token 1시간.
