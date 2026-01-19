# Frontend 개발 가이드

**대상**: Frontend 개발자, LLM  
**최종 업데이트**: 2025-12-11

---

## 1. 프로젝트 구조 (Project Structure)

`web/` 디렉토리의 전체 구조입니다.

```
web/
├── src/
│   ├── app/                        # Next.js App Router (Pages & Layouts)
│   │   ├── (report)/               # [Route Group] 보고서 관련 페이지 (공통 레이아웃 공유)
│   │   │   ├── weekly/             # 주간 보고서
│   │   │   ├── monthly/            # 월간 보고서 (예정)
│   │   │   └── quarterly/          # 분기 보고서 (예정)
│   │   ├── login/                  # 로그인 페이지
│   │   ├── layout.tsx              # Root Layout
│   │   └── globals.css             # Tailwind Directives & Global Styles
│   │
│   ├── components/                 # React 컴포넌트
│   │   ├── common/                 # 전역 공통 (Header, Icon 등)
│   │   ├── layout/                 # 레이아웃 (Sidebar, ThemeToggle)
│   │   ├── ui/                     # 재사용 UI (GridTable, Badge, Calendar)
│   │   ├── charts/                 # ECharts 래퍼 및 설정
│   │   └── weekly/                 # 주간 보고서 전용 컴포넌트
│   │
│   ├── css/                        # 커스텀 스타일 (Tailwind 보완)
│   │   ├── style.css               # Base Styles (Variables, Typography)
│   │   ├── common.css              # Component Styles (Card, Grid)
│   │   └── popup.css               # Popup Specific Styles
│   │
│   ├── services/                   # API 통신 및 데이터 페칭
│   │   ├── api.ts                  # Axios 인스턴스 및 API 함수
│   │   └── mockData.ts             # 로컬 개발용 Mock 데이터
│   │
│   ├── utils/                      # 순수 유틸리티 함수
│   │   └── format.ts               # 날짜/숫자 포맷팅
│   │
│   └── types/                      # TypeScript 타입 정의
│       └── weekly.ts               # 보고서 데이터 인터페이스
│
├── public/                         # 정적 에셋 (Images, Fonts)
├── tailwind.config.ts              # Tailwind 설정 (v4)
└── next.config.ts                  # Next.js 설정
```

---

## 2. 핵심 아키텍처 원칙 (Key Principles)

### 2.1 Mobile First Styling
모든 스타일은 **모바일(480px 이하)**을 기준으로 작성하며, 더 큰 화면은 미디어 쿼리(`min-width`)로 확장합니다.
*   **CSS**: `base` -> `sm:` (Tablet) -> `md:` (Desktop)
*   **Tailwind**: `w-full md:w-1/2`

### 2.2 다크 모드 (Dark Mode)
시스템은 **Light/Dark 모드**를 모두 지원하며, 지정된 색상 팔레트를 엄격히 준수해야 합니다.
*   **구현**: `next-themes` 사용 + Tailwind `dark:` 클래스.
*   **색상 계열**:
    *   기본: Neutral Gray
    *   지난주 실적: Green Tint
    *   금주 실적: Warm Gray
    *   팝업: Blue Tint

### 2.3 ID 명명 규칙 (ID Naming Convention)
테스트 및 스타일링을 위해 주요 요소에 **고유 ID**를 부여합니다.

#### 접두어 규칙
| 접두어 | 용도 | 예시 |
|--------|------|------|
| `sec-` | 섹션 | `sec-lastweek`, `sec-alert` |
| `tbl-` | 테이블 | `tbl-mating-type`, `tbl-farrowing-stats` |
| `cht-` | 차트 | `cht-mating-trend`, `cht-modon-parity` |
| `pop-` | 팝업/드롭다운 | `pop-alert`, `pop-user-menu` |
| `btn-` | 버튼 | `btn-user-menu`, `btn-logout` |

#### ID 부여 필수 대상
*   **버튼**: 주요 액션 버튼 (로그인, 로그아웃, 메뉴 토글 등)
*   **팝업/드롭다운**: 동적으로 표시되는 모든 팝업 컨테이너
*   **섹션**: 페이지의 주요 구역
*   **테이블**: 데이터 테이블
*   **차트**: 차트 컨테이너

#### 형식
*   `{접두어}-{컨텍스트}` 또는 `{접두어}-{컨텍스트}-{세부사항}`
*   예시: `btn-user-menu`, `pop-user-menu`, `tbl-weaning-stats`

> **중요**: 버튼과 해당 버튼이 열리는 팝업은 동일한 컨텍스트명을 사용합니다.
> 예: `btn-user-menu` (버튼) → `pop-user-menu` (팝업)

---

## 3. 주요 디렉토리 설명 (Directory Descriptions)

### 3.1 App Router (`src/app`)
*   **(report)**: Header와 Sidebar를 공유하는 보고서 페이지 그룹입니다.
*   **weekly**: 주간 보고서의 목록(`page.tsx`)과 상세(`[id]/page.tsx`) 페이지가 위치합니다.

### 3.2 Components (`src/components`)
*   **ui**: 도메인 로직이 없는 순수 UI 컴포넌트 (예: `GridTable`, `Badge`).
*   **charts**: ECharts 라이브러리를 래핑하여 공통 옵션(폰트, 색상)을 적용한 차트 컴포넌트.
*   **weekly**: 주간 보고서의 비즈니스 로직이 포함된 섹션별 컴포넌트.

### 3.3 CSS (`src/css`)
Tailwind로 처리하기 복잡한 스타일이나 레거시 호환성을 위해 사용합니다.
*   `style.css`: CSS 변수(`:root`), 기본 타이포그래피.
*   `popup.css`: 팝업 내 복잡한 테이블 스타일 (우선순위 높음).

### 3.4 Services (`src/services`)
*   API 호출 로직을 캡슐화합니다.
*   `NEXT_PUBLIC_USE_MOCK=true`일 경우 실제 API 대신 Mock 데이터를 반환하도록 추상화되어 있습니다.

---

## 4. 개발 가이드 (Development Guide)

### 4.1 새 컴포넌트 추가
1.  **UI 컴포넌트**: `src/components/ui`에 추가 (재사용성 고려).
2.  **비즈니스 컴포넌트**: 해당 도메인 폴더(`src/components/weekly` 등)에 추가.

### 4.2 스타일링
*   기본적으로 **Tailwind CSS** 유틸리티 클래스를 사용합니다.
*   복잡한 스타일은 `src/css/common.css` 등에 `@apply` 또는 CSS 클래스로 정의합니다.
*   **반드시 다크 모드(`dark:`) 스타일을 함께 정의**해야 합니다.

### 4.3 API 연동
`src/services/api.ts`에 함수를 추가하여 사용합니다. 컴포넌트에서 직접 `axios`나 `fetch`를 호출하지 않습니다.

```typescript
// src/services/api.ts
export const weeklyApi = {
  getList: async (from: string, to: string) => { ... },
  getDetail: async (id: string) => { ... }
};
```

---

## 5. 환경 변수 (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_USE_MOCK=true  # true: Mock 데이터 사용, false: API 호출
```
