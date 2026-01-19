# PigPlan 새로운 CSS 아키텍처 가이드

## 1. 개요

기존 CSS 구조의 문제점을 해결하고, 새로운 프론트엔드 화면에 적용할 모던 CSS 체계입니다.

### 1.1 기존 CSS 문제점

- 전역 스타일 충돌 (namespace 없음)
- 일관성 없는 네이밍 컨벤션
- 중복된 스타일 정의
- 유지보수 어려움

### 1.2 새로운 CSS 체계 목표

- **격리(Isolation)**: CSS Scoping으로 스타일 충돌 방지
- **재사용성(Reusability)**: 공통 컴포넌트 스타일 모듈화
- **일관성(Consistency)**: CSS Variables로 디자인 토큰 통합
- **유지보수성(Maintainability)**: 명확한 파일 구조와 네이밍 규칙

---

## 2. 디렉토리 구조

```
/css/new/
├── _variables.css          # 디자인 토큰 (색상, 크기, 그림자 등)
├── base.v1.css             # 공통 기본 스타일 + 컴포넌트
├── popup.v1.css            # 팝업 통합 CSS (컴포넌트 import)
│   └── compop.v1.css       # 공통 팝업 모달 시스템 (compop- 접두사)
├── pp-popup-common.v1.css  # 공통 팝업 스타일 (.pp-popup-container 스코프)
├── components/             # 공통 컴포넌트
│   ├── button.v1.css       # 버튼 컴포넌트 (pp-btn-*)
│   ├── form.v1.css         # 폼 요소 (pp-input, pp-select 등)
│   ├── badge.v1.css        # 뱃지/상태 (pp-badge-*, pp-status-*)
│   └── ...
├── layout/                 # (향후 확장)
│   ├── grid.css            # 그리드 시스템
│   └── spacing.css         # 마진/패딩 유틸리티
└── pages/                  # (향후 확장)
    ├── officers/           # 관리자 페이지별 CSS
    └── popup/              # 팝업별 CSS
```

### 2.1 현재 구현된 파일

| 파일명 | 용도 |
|--------|------|
| `_variables.css` | CSS 변수 (디자인 토큰) 정의 |
| `base.v1.css` | 공통 컴포넌트 (pp- 접두사) |
| `popup.v1.css` | 팝업 통합 CSS (import용) |
| `compop.v1.css` | 공통 팝업 모달 시스템 (compop- 접두사) |
| `pp-popup-common.v1.css` | 공통 팝업 스타일 (.pp-popup-container 스코프) |
| `components/button.v1.css` | 버튼 컴포넌트 (pp-btn-*) |
| `components/form.v1.css` | 폼 요소 컴포넌트 (pp-input, pp-select 등) |
| `components/badge.v1.css` | 뱃지/상태 컴포넌트 (pp-badge-*, pp-status-*) |
| `components/pp-table.v1.css` | **테이블 컴포넌트 (헤더/바디 분리 방식, Fixed Header)** |

---

## 3. CSS 네이밍 컨벤션

### 3.1 BEM (Block Element Modifier) 방식

```css
/* Block */
.pp-card { }

/* Element */
.pp-card__header { }
.pp-card__body { }
.pp-card__footer { }

/* Modifier */
.pp-card--primary { }
.pp-card--bordered { }
```

### 3.2 접두사 규칙

| 접두사 | 용도 | 예시 |
|--------|------|------|
| `pp-` | **P**ig**P**lan 공통 컴포넌트 | `pp-btn`, `pp-card`, `pp-table`, `pp-popup-container` |
| `pop-` | 팝업 전용 스타일 | `pop-header`, `pop-body`, `pop-buttons` |
| `off-` | Officers(관리자) 전용 | `off-pop`, `off-grid` |
| `compop-` | 공통 팝업 모달 시스템 | `compop-modal`, `compop-overlay` |
| `ibs01-` | 페이지/팝업별 고유 ID | `ibs01-main-div` (Ins Batch Sms 01) |

> **Note**: `pp-`는 "PigPlan"의 약자이며, 팝업(popup)과 혼동하지 않도록 팝업 전용은 `pop-` 접두사를 사용합니다.

### 3.3 페이지별 고유 ID 규칙

각 페이지/팝업은 고유 접두사를 사용하여 스타일 충돌 방지:

```
[기능코드][숫자]-[요소명]

예시:
- ibs01-main-div     → InsightPig Batch SMS 팝업 01
- fim01-search-form  → Farm Info Management 01
- uih02-table        → Usage Info History 02
```

### 3.4 클래스명 생성 규칙 (중복 방지)

동일한 이름의 클래스가 이미 존재할 경우, 숫자 접미사를 사용하여 구분합니다.

**규칙**: `[클래스명]` → `[클래스명]01`, `[클래스명]02`, ...

```css
/* 첫 번째 버전 */
.popup-header { }
.popup-container { }

/* 동일 이름 필요 시 → 숫자 접미사 추가 */
.popup-header01 { }      /* 카카오 주소팝업용 */
.popup-container01 { }

/* 추가 버전 필요 시 */
.popup-header02 { }      /* 다른 팝업용 */
```

**적용 원칙**:
| 상황 | 처리 방법 |
|------|----------|
| 클래스명이 기존에 없음 | 그대로 사용 (`popup-header`) |
| 동일 클래스명 존재 | 숫자 접미사 추가 (`popup-header01`) |
| 페이지별 고유 스타일 | 페이지 접두사 사용 (`kam01-header`, `ibs01-table`) |

**파일명 규칙**:
- CSS 파일도 동일 규칙 적용
- 예: `popup-kakao-addr.v1.css`, `popup-kakao-addr01.v1.css`

---

## 4. CSS Variables (디자인 토큰)

### 4.1 색상 팔레트

```css
/* _variables.css */
:root {
    /* Primary */
    --pp-primary: #4f46e5;
    --pp-primary-hover: #4338ca;
    --pp-primary-light: #eef2ff;

    /* Semantic Colors */
    --pp-success: #10b981;
    --pp-success-light: #ecfdf5;
    --pp-danger: #ef4444;
    --pp-danger-light: #fef2f2;
    --pp-warning: #f59e0b;
    --pp-warning-light: #fffbeb;
    --pp-info: #3b82f6;
    --pp-info-light: #eff6ff;

    /* Grayscale */
    --pp-gray-50: #f9fafb;
    --pp-gray-100: #f3f4f6;
    --pp-gray-200: #e5e7eb;
    --pp-gray-300: #d1d5db;
    --pp-gray-400: #9ca3af;
    --pp-gray-500: #6b7280;
    --pp-gray-600: #4b5563;
    --pp-gray-700: #374151;
    --pp-gray-800: #1f2937;
    --pp-gray-900: #111827;

    /* Background */
    --pp-bg-primary: #ffffff;
    --pp-bg-secondary: #f9fafb;
    --pp-bg-tertiary: #f3f4f6;

    /* Border */
    --pp-border-color: #e5e7eb;
    --pp-border-color-dark: #d1d5db;
}
```

### 4.2 타이포그래피

```css
:root {
    /* Font Family */
    --pp-font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Malgun Gothic', sans-serif;
    --pp-font-mono: 'Consolas', 'Monaco', monospace;

    /* Font Size */
    --pp-text-xs: 11px;
    --pp-text-sm: 12px;
    --pp-text-base: 14px;
    --pp-text-lg: 16px;
    --pp-text-xl: 18px;
    --pp-text-2xl: 20px;

    /* Font Weight */
    --pp-font-normal: 400;
    --pp-font-medium: 500;
    --pp-font-semibold: 600;
    --pp-font-bold: 700;

    /* Line Height */
    --pp-leading-tight: 1.25;
    --pp-leading-normal: 1.5;
    --pp-leading-relaxed: 1.75;
}
```

### 4.3 레이아웃

```css
:root {
    /* Border Radius */
    --pp-radius-sm: 4px;
    --pp-radius-md: 6px;
    --pp-radius-lg: 8px;
    --pp-radius-xl: 12px;
    --pp-radius-full: 9999px;

    /* Shadow */
    --pp-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --pp-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --pp-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    --pp-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

    /* Spacing */
    --pp-space-1: 4px;
    --pp-space-2: 8px;
    --pp-space-3: 12px;
    --pp-space-4: 16px;
    --pp-space-5: 20px;
    --pp-space-6: 24px;
    --pp-space-8: 32px;
    --pp-space-10: 40px;

    /* Transition */
    --pp-transition-fast: 0.15s ease;
    --pp-transition-normal: 0.2s ease;
    --pp-transition-slow: 0.3s ease;
}
```

---

## 5. CSS Scoping 패턴

### 5.1 컨테이너 기반 스코핑

모든 스타일을 부모 컨테이너 내부로 제한:

```css
/* popup.v1.css - 좋은 예 */
.off-pop {
    --primary: #4f46e5;
    /* ... */
}

.off-pop .popup-table { }
.off-pop .popup-table th { }
.off-pop .popup-table td { }
.off-pop .btn-primary { }
```

### 5.2 공통 CSS vs 인라인 스타일 분리 원칙

**공통 CSS 파일** - 구조, 색상, 폰트, 상태 등 불변 스타일:
```css
/* pp-popup-common.v1.css */
.pp-popup-container .table-container {
    border: 1px solid var(--pp-gray-200);
    border-radius: var(--pp-radius-lg);
    overflow: hidden;
    overflow-y: auto;
    /* max-height는 인라인으로 페이지별 지정 */
}
```

**인라인 스타일** - 페이지별 가변값 (width, height, flex 비율 등):
```html
<!-- InsBatchSmsPopup.jsp -->
<div class="table-container" style="max-height: 500px;">
    <table class="popup-table" style="min-width: 1100px;">
        ...
    </table>
</div>

<div class="popup-section" style="flex: 0 0 60%;">
    ...
</div>
```

| 구분 | 공통 CSS 파일 | 인라인 스타일 |
|------|--------------|---------------|
| **대상** | 구조, 색상, 폰트, 간격, 상태 | 페이지별 가변 크기 |
| **예시** | `.table-container`, `.popup-table`, `.status-badge` | `max-height`, `min-width`, `flex` 비율 |
| **장점** | 일관성, 재사용성 | 유연성, 페이지별 최적화 |

### 5.3 Multi-Row Sticky Header System

CSS Variables를 활용한 유동적 테이블 헤더 고정 시스템입니다. 최대 4단 헤더까지 자동 지원합니다.

**CSS Variables 정의 (pp-popup-common.v1.css)**:
```css
.pp-popup-container {
    /* 헤더 행 기본 높이 */
    --pp-thead-row-height: 37px;

    /* 각 행의 top 위치 (자동 계산) */
    --pp-thead-row-1-top: 0;
    --pp-thead-row-2-top: var(--pp-thead-row-height);
    --pp-thead-row-3-top: calc(var(--pp-thead-row-height) * 2);
    --pp-thead-row-4-top: calc(var(--pp-thead-row-height) * 3);
}
```

**Sticky 스타일 적용**:
```css
/* 1단 헤더 */
.pp-popup-container .popup-table thead tr:first-child th {
    position: sticky;
    top: var(--pp-thead-row-1-top, 0);
    z-index: 14;
}

/* 2단 헤더 */
.pp-popup-container .popup-table thead tr:nth-child(2) th {
    position: sticky;
    top: var(--pp-thead-row-2-top);
    z-index: 13;
}
/* 3단, 4단도 동일 패턴 */
```

**사용법**:

| 시나리오 | 사용법 |
|---------|-------|
| 기본값 사용 (37px) | 별도 설정 없이 자동 적용 |
| 커스텀 높이 (모든 행 동일) | `style="--pp-thead-row-height: 45px;"` |
| 개별 행 높이가 다를 경우 | 각 행에 직접 `--pp-thead-row-N-top` 재정의 |

**예시 1: 기본 사용 (2단 헤더)**
```html
<div class="pp-popup-container">
    <table class="popup-table">
        <thead>
            <tr><th colspan="3">그룹 헤더</th></tr>
            <tr><th>항목1</th><th>항목2</th><th>항목3</th></tr>
        </thead>
        <!-- ... -->
    </table>
</div>
```

**예시 2: 커스텀 헤더 높이**
```html
<div class="pp-popup-container" style="--pp-thead-row-height: 45px;">
    <!-- 모든 헤더 행이 45px 기준으로 sticky 적용 -->
</div>
```

**예시 3: 개별 행 높이가 다를 경우**
```html
<div class="pp-popup-container" style="
    --pp-thead-row-1-top: 0;
    --pp-thead-row-2-top: 50px;
    --pp-thead-row-3-top: 87px;">
    <!-- 1행: 50px, 2행: 37px 처럼 개별 높이 지정 가능 -->
</div>
```

> **장점**: 하드코딩 제거, CSS Variables로 유동적 관리, calc()를 통한 자동 계산, 최대 4단 헤더 지원

### 5.4 페이지별 전용 스타일

JSP 내부에서 해당 페이지 전용 스타일 정의:

```html
<!-- InsBatchSmsPopup.jsp -->
<style>
/* 이 팝업 전용 스타일 - ibs01 접두사 사용 */
#ibs01-main-div { }
.ibs01-row-check { }
.ibs01-hp-input { }
.ibs01-row-disabled { }
</style>
```

---

## 6. 컴포넌트 스타일 가이드

### 6.1 테이블 (pp-table) - 독립 컴포넌트

팝업, 일반 페이지 어디서든 사용 가능한 **독립적인** 테이블 컴포넌트입니다.

**파일**: `components/pp-table.v1.css`

**기본 사용법**:
```html
<link rel="stylesheet" href="/css/new/components/pp-table.v1.css">

<div class="pp-table-wrapper" style="max-height: 500px;">
    <table class="pp-table pp-table--sticky" style="min-width: 1100px;">
        <thead>
            <tr>
                <th rowspan="2">농장명</th>
                <th colspan="3">주간리포트</th>
            </tr>
            <tr>
                <th>생성</th>
                <th>발송</th>
                <th>상태</th>
            </tr>
        </thead>
        <tbody>
            <tr><td>농장A</td><td>O</td><td>O</td><td>완료</td></tr>
        </tbody>
    </table>
</div>
```

**CSS Variables (커스터마이징)**:
```css
/* wrapper 또는 :root에서 재정의 가능 */
--pp-table-row-height: 37px;      /* 헤더 행 높이 */
--pp-table-row-1-top: 0;          /* 1단 헤더 top */
--pp-table-row-2-top: 37px;       /* 2단 헤더 top */
```

**Modifiers**:
| 클래스 | 설명 |
|--------|------|
| `.pp-table--sticky` | 헤더 고정 (최대 4단) |
| `.pp-table--striped` | 줄무늬 |
| `.pp-table--bordered` | 테두리 |
| `.pp-table--compact` | 좁은 패딩 |
| `.pp-table--relaxed` | 넓은 패딩 |

**Row States**:
| 클래스 | 설명 |
|--------|------|
| `.row-selected` | 선택된 행 (파란 배경) |
| `.row-disabled` | 비활성 행 (반투명) |

### 6.2 버튼

```css
/* components/button.css */
.pp-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 16px;
    font-size: var(--pp-text-base);
    font-weight: var(--pp-font-medium);
    border: none;
    border-radius: var(--pp-radius-md);
    cursor: pointer;
    transition: var(--pp-transition-fast);
}

.pp-btn--primary {
    color: #fff;
    background: var(--pp-primary);
}

.pp-btn--primary:hover {
    background: var(--pp-primary-hover);
}

.pp-btn--sm { padding: 4px 12px; font-size: var(--pp-text-sm); }
.pp-btn--lg { padding: 12px 24px; font-size: var(--pp-text-lg); }
```

### 6.2 폼 요소

```css
/* components/form.css */
.pp-input {
    width: 100%;
    padding: 8px 12px;
    font-size: var(--pp-text-base);
    color: var(--pp-gray-700);
    background: #fff;
    border: 1px solid var(--pp-border-color);
    border-radius: var(--pp-radius-md);
    transition: var(--pp-transition-fast);
}

.pp-input:focus {
    border-color: var(--pp-primary);
    outline: none;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.pp-input--error {
    border-color: var(--pp-danger);
}

.pp-select {
    /* ... */
}
```

### 6.3 테이블

```css
/* components/table.css */
.pp-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--pp-text-sm);
}

.pp-table th {
    padding: 12px 10px;
    font-weight: var(--pp-font-semibold);
    text-align: center;
    color: var(--pp-gray-500);
    background: var(--pp-gray-50);
    border-bottom: 1px solid var(--pp-border-color);
}

.pp-table td {
    padding: 10px;
    color: var(--pp-gray-700);
    border-bottom: 1px solid var(--pp-gray-100);
}

.pp-table--striped tbody tr:nth-child(even) {
    background: var(--pp-gray-50);
}

.pp-table--hover tbody tr:hover {
    background: var(--pp-gray-50);
}
```

### 6.4 뱃지/상태

```css
/* components/badge.css */
.pp-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    font-size: var(--pp-text-sm);
    font-weight: var(--pp-font-medium);
    border-radius: var(--pp-radius-full);
}

.pp-badge--success {
    color: var(--pp-success);
    background: var(--pp-success-light);
}

.pp-badge--danger {
    color: var(--pp-danger);
    background: var(--pp-danger-light);
}

.pp-badge--warning {
    color: var(--pp-warning);
    background: var(--pp-warning-light);
}

.pp-badge--info {
    color: var(--pp-info);
    background: var(--pp-info-light);
}
```

---

## 7. 유틸리티 클래스

```css
/* utilities.css */

/* Display */
.pp-hidden { display: none; }
.pp-block { display: block; }
.pp-inline { display: inline; }
.pp-flex { display: flex; }

/* Flexbox */
.pp-items-center { align-items: center; }
.pp-justify-center { justify-content: center; }
.pp-justify-between { justify-content: space-between; }
.pp-gap-1 { gap: var(--pp-space-1); }
.pp-gap-2 { gap: var(--pp-space-2); }
.pp-gap-4 { gap: var(--pp-space-4); }

/* Text */
.pp-text-center { text-align: center; }
.pp-text-left { text-align: left; }
.pp-text-right { text-align: right; }
.pp-font-medium { font-weight: var(--pp-font-medium); }
.pp-font-semibold { font-weight: var(--pp-font-semibold); }

/* Colors */
.pp-text-primary { color: var(--pp-primary); }
.pp-text-success { color: var(--pp-success); }
.pp-text-danger { color: var(--pp-danger); }
.pp-text-muted { color: var(--pp-gray-500); }

/* Spacing */
.pp-m-0 { margin: 0; }
.pp-mt-2 { margin-top: var(--pp-space-2); }
.pp-mb-2 { margin-bottom: var(--pp-space-2); }
.pp-p-2 { padding: var(--pp-space-2); }
.pp-p-4 { padding: var(--pp-space-4); }
```

---

## 8. 파일 버전 관리

### 8.1 버전 관리 규칙

CSS 파일명에 버전 번호를 포함하여 캐시 무효화:

```
popup.v1.css → popup.v2.css
button.v1.css → button.v2.css
```

### 8.2 JSP에서 사용

```html
<link rel="stylesheet" href="${ctx}/css/new/popup.v1.css">
```

버전 업데이트 시:
```html
<link rel="stylesheet" href="${ctx}/css/new/popup.v2.css">
```

---

## 9. 마이그레이션 전략

### 9.1 단계별 적용

1. **Phase 1**: 새 팝업/페이지에 새 CSS 체계 적용
2. **Phase 2**: 기존 팝업 리팩토링 (우선순위별)
3. **Phase 3**: 공통 컴포넌트 CSS 분리
4. **Phase 4**: 레거시 CSS 정리

### 9.2 공존 전략

기존 CSS와 새 CSS가 충돌하지 않도록:

```html
<!-- 기존 페이지 -->
<link rel="stylesheet" href="${ctx}/css/popup.css">

<!-- 새 페이지 -->
<link rel="stylesheet" href="${ctx}/css/new/popup.v1.css">
```

---

## 10. Officers 분리 전략

현재 Officers(관리자) 영역을 pig3.1에서 분리하여 별도 프로젝트로 구축할 계획입니다.
CSS 구조도 이에 맞게 손쉽게 이동할 수 있도록 설계되어 있습니다.

### 10.1 CSS 파일 분류

| 파일 | 용도 | 분리 시 이동 대상 |
|------|------|------------------|
| `_variables.css` | 디자인 토큰 | **공통** (양쪽 모두 사용) |
| `base.v1.css` | 공통 컴포넌트 | **공통** (양쪽 모두 사용) |
| `compop.v1.css` | 모달 시스템 | **공통** (양쪽 모두 사용) |
| `off-pop.v1.css` | Officers 팝업 | **Officers 전용** |
| `popup.v1.css` | 통합 import | 필요에 따라 분리 |

### 10.2 JSP별 CSS 로드 전략

**팝업을 호출하는 페이지 (FarmInfoMgmt.jsp 등)**
```html
<%-- 모달 시스템만 필요 --%>
<link rel="stylesheet" href="${ctx}/css/new/compop.v1.css">
```

**팝업 레이아웃 (popup-layout.jsp)**
```html
<%-- 팝업 컨텐츠 전체 필요 --%>
<link rel="stylesheet" href="${ctx}/css/new/popup.v1.css">
```

**또는 개별 로드**
```html
<link rel="stylesheet" href="${ctx}/css/new/compop.v1.css">
<link rel="stylesheet" href="${ctx}/css/new/off-pop.v1.css">
```

### 10.3 분리 시 파일 이동 계획

```
Officers 프로젝트/
├── css/new/
│   ├── _variables.css       # 복사 (공통)
│   ├── base.v1.css          # 복사 (공통)
│   ├── compop.v1.css        # 복사 (공통)
│   ├── off-pop.v1.css       # 이동 (Officers 전용)
│   └── popup.v1.css         # 재구성 (필요한 것만 import)
└── js/
    ├── popup.js             # 이동 (comPop 모달 시스템)
    └── modules/officers/    # 이동 (Officers 전용 JS)
```

### 10.4 의존성 최소화 원칙

1. **CSS는 독립적으로 작동**: 다른 CSS 파일 없이도 동작
2. **JS는 jQuery만 의존**: EasyUI 등 레거시 의존성 제거
3. **페이지별 스타일은 인라인**: JSP 내부 `<style>` 태그 사용

---

## 11. 체크리스트

새 CSS 파일 작성 시 확인사항:

- [ ] 적절한 접두사 사용 (`pp-`, `off-`, `compop-`, 또는 페이지별 ID)
- [ ] CSS Variables 활용 (하드코딩된 색상/크기 지양)
- [ ] BEM 네이밍 규칙 준수
- [ ] 스코핑 적용 (전역 스타일 오염 방지)
- [ ] 반응형 고려 (필요시)
- [ ] 버전 번호 포함된 파일명

---

## 12. 참고 자료

- [Tailwind CSS](https://tailwindcss.com/) - 유틸리티 클래스 참고
- [BEM Methodology](https://en.bem.info/methodology/) - 네이밍 컨벤션
- [CSS Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [ES Modules 마이그레이션 가이드](./es-modules-migration-guide.md) - JS 모듈화 전략
