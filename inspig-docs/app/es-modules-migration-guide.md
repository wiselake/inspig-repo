# ES Modules 마이그레이션 가이드

## 개요

현재 프로젝트는 IIFE(즉시실행함수) 패턴을 사용하고 있습니다.
향후 ES Modules 표준으로 전환하여 코드 품질과 유지보수성을 향상시킬 수 있습니다.

---

## 현재 상태 (IIFE 패턴)

```javascript
// 현재 방식: IIFE
window.ibs01 = (function() {
    'use strict';
    var _cf = {};
    var _fn = {};
    var _ts = {};

    return {
        init: initialize,
        close: _fn.close
    };
})();
```

### 장점
- 즉시 실행, 별도 빌드 불필요
- 레거시 브라우저 호환
- 기존 JSP/Tiles 환경에서 바로 사용

### 단점
- 전역 네임스페이스 오염
- 의존성 관리 어려움
- 트리 쉐이킹 불가
- 코드 재사용성 낮음

---

## 목표 상태 (ES Modules)

```javascript
// 목표 방식: ES Modules
// utils.js
export const formatDate = (dt) => { ... };
export const copyToClipboard = (text) => { ... };

// api.js
export class InsApiService {
    async loadFarmList(insDate) { ... }
    async createReport(farmNo) { ... }
}

// ibs01.js
import { formatDate, copyToClipboard } from './utils.js';
import { InsApiService } from './api.js';

export class InsBatchSmsPopup {
    constructor() { ... }
    init() { ... }
}
```

### 장점
- 표준화된 모듈 시스템
- 명시적 의존성 (import/export)
- 트리 쉐이킹 → 번들 최적화
- IDE 자동완성, 타입 추론
- 테스트 용이성

---

## 마이그레이션 계획

### Phase 1: 빌드 환경 구축

#### 1.1 디렉토리 구조
```
pigplanxe/
├── src/main/webapp/
│   ├── js/
│   │   ├── modules/          # ES Modules 소스 (신규)
│   │   │   ├── common/
│   │   │   │   ├── utils.js
│   │   │   │   ├── api.js
│   │   │   │   └── popup.js
│   │   │   └── officers/
│   │   │       └── ibs01.js
│   │   ├── dist/             # 빌드 결과물 (자동 생성)
│   │   │   └── ibs01.bundle.js
│   │   └── ... (기존 JS 파일들)
│   └── ...
├── package.json              # Node.js 설정 (신규)
├── vite.config.js            # Vite 설정 (신규)
└── ...
```

#### 1.2 package.json 생성
```json
{
  "name": "pigplanxe-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "watch": "vite build --watch"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "rollup": "^4.0.0"
  }
}
```

#### 1.3 vite.config.js 생성
```javascript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src/main/webapp/js/modules',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    lib: {
      entry: {
        'ibs01': resolve(__dirname, 'src/main/webapp/js/modules/officers/ibs01.js'),
        // 추가 모듈들...
      },
      formats: ['iife'],
      name: '[name]'
    },
    rollupOptions: {
      external: ['jquery'],
      output: {
        globals: {
          jquery: '$'
        }
      }
    }
  }
});
```

---

### Phase 2: 모듈 변환

#### 2.1 공통 유틸리티 분리 (`modules/common/utils.js`)
```javascript
/**
 * 날짜 포맷 (YYYYMMDD -> MM/DD)
 */
export const formatDate = (dt) => {
    if (!dt) return '';
    const s = String(dt);
    return s.substring(4, 6) + '/' + s.substring(6, 8);
};

/**
 * 클립보드 복사
 */
export const copyToClipboard = async (text) => {
    if (navigator.clipboard) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (e) {
            console.error('클립보드 복사 실패:', e);
        }
    }
    return false;
};

/**
 * 오늘 날짜 (YYYYMMDD)
 */
export const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return yyyy + mm + dd;
};
```

#### 2.2 API 서비스 분리 (`modules/common/api.js`)
```javascript
/**
 * 인사이트 API 서비스
 */
export class InsApiService {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
    }

    async request(url, data = {}) {
        const response = await fetch(this.baseUrl + url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    }

    async loadFarmList(insDate) {
        return this.request('/officers/api/ins/getBatchSmsFarmList.json', { insDate });
    }

    async createReport(farmNo) {
        return this.request('/officers/api/ins/runEtl.json', { farmNo });
    }

    async sendSms(params) {
        return this.request('/pigplan/kakaoMsg/sendInsWeeklyManual.json', params);
    }
}
```

#### 2.3 메인 모듈 (`modules/officers/ibs01.js`)
```javascript
import { formatDate, copyToClipboard, getTodayString } from '../common/utils.js';
import { InsApiService } from '../common/api.js';

/**
 * 인사이트피그 알림톡 일괄 발송 모듈
 */
export class InsBatchSmsPopup {
    constructor() {
        this.api = new InsApiService();
        this.data = [];
        this.currentDate = getTodayString();
        this.isInitialized = false;
        this.elements = {};
    }

    init() {
        if (this.isInitialized) return;

        this.initDoms();
        this.bindEvents();
        this.loadFarmList(this.currentDate);

        this.isInitialized = true;
        console.log('[ibs01] 초기화 완료');
    }

    initDoms() {
        this.elements = {
            insDate: document.getElementById('ibs01-ins-date'),
            weekInfo: document.getElementById('ibs01-week-info'),
            // ... 나머지 요소들
        };
    }

    bindEvents() {
        // 이벤트 바인딩
    }

    async loadFarmList(insDate) {
        const response = await this.api.loadFarmList(insDate);
        // 데이터 처리
    }

    // ... 나머지 메서드들
}

// 전역 노출 (하위 호환성)
window.ibs01 = new InsBatchSmsPopup();
window.INS_BATCH_SMS = {
    init: () => window.ibs01.init(),
    close: () => window.ibs01.close()
};
```

---

### Phase 3: JSP 연동

#### 3.1 JSP에서 빌드된 번들 로드
```jsp
<%-- 빌드된 번들 사용 --%>
<script src="${ctx}/js/dist/ibs01.bundle.js"></script>

<%-- 또는 개발 모드에서 ES Modules 직접 사용 (모던 브라우저만) --%>
<c:if test="${env ne 'release'}">
    <script type="module" src="${ctx}/js/modules/officers/ibs01.js"></script>
</c:if>
```

#### 3.2 서버 데이터 전달 패턴
```jsp
<%-- JSP에서 서버 데이터를 전역 변수로 전달 --%>
<script>
window.__PAGE_DATA__ = {
    memberId: '${memberId}',
    contextPath: '${ctx}',
    locale: '${langLocale}'
};
</script>
<script src="${ctx}/js/dist/ibs01.bundle.js"></script>
```

---

## 배포 프로세스

### 로컬 빌드 후 배포 (권장)

```bash
# 1. JS 빌드
cd pigplanxe
npm run build

# 2. Git 커밋 (빌드 결과물 포함)
git add src/main/webapp/js/dist/
git commit -m "JS 빌드 결과물 업데이트"

# 3. 기존 배포 프로세스 실행
./deploy.sh
```

### CI/CD 파이프라인 적용 시

```yaml
# Jenkins Pipeline 또는 GitHub Actions
steps:
  - name: Checkout
    uses: actions/checkout@v3

  - name: Setup Node.js
    uses: actions/setup-node@v3
    with:
      node-version: '18'

  - name: Install dependencies
    run: npm ci
    working-directory: pigplanxe

  - name: Build JS
    run: npm run build
    working-directory: pigplanxe

  - name: Build WAR
    run: mvn package -DskipTests
    working-directory: pigplanxe

  - name: Deploy
    run: ./deploy.sh
```

---

## 마이그레이션 우선순위

### 1순위 (신규 개발)
- 새로 만드는 팝업/페이지는 ES Modules로 시작
- `InsBatchSmsPopup` 같은 독립적인 모듈

### 2순위 (리팩토링)
- 자주 수정되는 모듈
- 의존성이 적은 독립 모듈

### 3순위 (유지)
- 안정적으로 운영 중인 레거시 코드
- 수정 빈도가 낮은 코드

---

## 주의사항

1. **jQuery 의존성**: 기존 코드가 jQuery를 사용하므로 external로 설정
2. **EasyUI**: 전역 객체로 사용되므로 번들에 포함하지 않음
3. **하위 호환성**: 기존 코드와의 호환을 위해 전역 객체 노출 필요
4. **점진적 마이그레이션**: 한 번에 전체 변환하지 않고 모듈 단위로 진행

---

## 참고 자료

- [Vite 공식 문서](https://vitejs.dev/)
- [ES Modules MDN](https://developer.mozilla.org/ko/docs/Web/JavaScript/Guide/Modules)
- [Rollup 라이브러리 모드](https://rollupjs.org/guide/en/#outputformat)

---

## 변경 이력

| 일자 | 작성자 | 내용 |
|------|--------|------|
| 2025-01-06 | 김길현 | 최초 작성 |
