# 코드 테이블 캐싱 지침

## 개요

애플리케이션 시작 시 코드 테이블(TC_CODE_JOHAP, TC_CODE_SYS)을 메모리에 캐싱하여
별도 DB 조회 없이 즉시 코드명을 조회할 수 있습니다.

**핵심 원칙**: SQL에서 코드명을 직접 조회하지 말고, 백엔드 캐시에서 변환하세요.

## 캐싱 구조

### ComService (api/src/modules/com/com.service.ts)

```typescript
@Injectable()
export class ComService implements OnModuleInit {
  // 캐시 저장소
  private codeJohapCache = new Map<string, string>();  // TC_CODE_JOHAP
  private codeSysCache = new Map<string, string>();    // TC_CODE_SYS CNAME
  private codeSysCvalueCache = new Map<string, string>(); // TC_CODE_SYS CVALUE

  // 앱 시작 시 자동 로딩
  async onModuleInit() {
    await this.loadAllCodes();
  }
}
```

## 주요 코드 테이블

### TC_CODE_JOHAP (농장별 코드)

| PCODE | 용도 | 예시 |
|-------|------|------|
| `031` | 도폐사원인 (OUT_REASON_CD) | 031001=기타, 031038=호흡기질환 |
| `041` | 품종 | |

### TC_CODE_SYS (시스템 공통 코드)

| PCODE | 용도 | 예시 |
|-------|------|------|
| `01` | 모돈상태 (STATUS_CD) | 010001=후보돈, 010002=임신돈, 010003=포유돈, 010004=대리모돈, 010005=이유모돈, 010006=재발돈, 010007=유산돈 |
| `08` | 도폐사구분 (OUT_GUBUN_CD) | 080001=도태, 080002=폐사, 080003=전출, 080004=판매 |
| `941` | 국가→언어그룹 | KOR→01, VNM→02, USA→03 |
| `942` | 언어그룹→언어코드 | 01→ko, 02→vi, 03→en |

## 사용 방법

### 1. 백엔드에서 코드명 변환

```typescript
// weekly.service.ts

// TC_CODE_JOHAP 코드명 조회
const reasonName = this.comService.getCodeJohapName('031', reasonCode);
// 예: getCodeJohapName('031', '031038') → '호흡기 질환'

// TC_CODE_SYS 코드명 조회
const statusName = this.comService.getCodeSysName('01', statusCode);
// 예: getCodeSysName('01', '010001') → '후보돈'

// 여러 코드 일괄 변환
const reasonNames = this.comService.getCodeJohapNames('031', reasonCodes);
// Map<코드, 코드명> 반환
```

### 2. 프로시저에서는 코드만 저장

```sql
-- ❌ 잘못된 방식: SQL에서 코드명 조회
SELECT C.CNAME AS REASON_NM
FROM TB_MODON M
JOIN TC_CODE_JOHAP C ON C.CODE = M.OUT_REASON_CD

-- ✅ 올바른 방식: 코드만 저장
INSERT INTO TS_INS_WEEK_SUB (STR_1, STR_2, ...)
VALUES ('031038', '031001', ...);  -- 코드만 저장

-- 백엔드에서 변환
const reasonName = this.comService.getCodeJohapName('031', sub.str1);
```

### 3. 도태폐사 팝업 예시

**프로시저 (SP_INS_WEEK_DOPE_POPUP)**:
```sql
-- 원인별 테이블: STR_1~15에 원인코드(031xxx) 저장
-- 상태별 차트: STR_1~6에 상태코드(01000x) 저장
INSERT INTO TS_INS_WEEK_SUB (
    GUBUN, STR_1, STR_2, STR_3, STR_4, STR_5, STR_6
)
VALUES (
    'DOPE_CHART', '010001', '010002', '010003', '010004', '010005', '010006'
);
```

**서비스 (weekly.service.ts)**:
```typescript
// 상태코드 → 코드명 변환
const statusCodes = ['010001', '010002', '010003', '010004', '010005', '010006'];
const xAxis = statusCodes.map(
  (code) => this.comService.getCodeSysName('01', code) || code
);
// 결과: ['후보돈', '이유모돈', '임신돈', '포유돈', '사고돈', '비생산돈']
```

## 언어 처리

### 언어코드 결정 우선순위

1. **로그인 사용자**: JWT의 `lang` 필드 (농장 국가 기반)
2. **직접 접속**: 브라우저 `Accept-Language` 헤더

### 국가코드 → 언어코드 변환 체인

```
COUNTRY_CODE → TC_CODE_SYS(941).CVALUE → TC_CODE_SYS(942).CVALUE → 언어코드

예: KOR → 01 → ko
    VNM → 02 → vi
    USA → 03 → en
```

```typescript
// ComService.convertCountryToLang()
const lang = this.comService.convertCountryToLang('KOR'); // → 'ko'
```

### 캐시 메서드 (언어 지원)

```typescript
// 언어 지정 (생략 시 환경변수 DEFAULT_LANG 또는 'ko')
getCodeJohapName('031', '031038', 'vi');  // 베트남어 코드명
getCodeSysName('01', '010001', 'en');     // 영어 코드명
```

## 캐시 관리

### 캐시 통계 확인

```typescript
const stats = this.comService.getCacheStats();
// { johap: 1234, sys: 567, sysCvalue: 89, farmLang: 10, loaded: true }
```

### 수동 리로드

```typescript
await this.comService.reloadCache();
```

## 체크리스트

- [ ] 프로시저에서 코드 테이블 JOIN 대신 코드값만 저장
- [ ] 백엔드 서비스에서 `ComService` 캐시로 코드명 변환
- [ ] 다국어 지원이 필요한 경우 `lang` 파라미터 전달
- [ ] 프론트엔드에서는 이미 변환된 코드명 사용

## 관련 파일

- `api/src/modules/com/com.service.ts` - 캐시 서비스
- `api/src/modules/com/sql/com.sql.ts` - 캐시 로딩 SQL
- `api/src/modules/weekly/weekly.service.ts` - 사용 예시
- `docs/db/sql/ins/week/32_SP_INS_WEEK_DOPE_POPUP.sql` - 프로시저 예시
