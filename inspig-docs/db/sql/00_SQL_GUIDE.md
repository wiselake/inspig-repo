# inspig SQL 작성 지침서

> **중요**: 모든 SQL 및 프로시저 작성 시 반드시 이 문서의 지침을 준수해야 합니다.

---

## 1. 시간 처리 원칙

### 1.1 저장 vs 비교

| 구분 | 사용 함수 | 설명 |
|------|----------|------|
| **저장** | `SYSDATE` | LOG_INS_DT, START_DT, END_DT 등 (서버시간/UTC) |
| **비교** | `SF_GET_LOCALE_VW_DATE_2022` | WK_DT(CHAR 8)와 비교 시 (다국가 로케일) |
| **조회** | 애플리케이션 | 필요 시 로케일 변환 |

### 1.2 날짜 비교 함수 (다국가 지원)

```sql
-- SF_GET_LOCALE_VW_DATE_2022: 다국가 로케일 지원 함수
-- LOCALE 파라미터: 'KOR' (한국 +09:00), 'VNM' (베트남 +07:00)
SF_GET_LOCALE_VW_DATE_2022(LOCALE, IN_DATE)

-- 예시: 한국 로케일 오늘 날짜
TRUNC(SF_GET_LOCALE_VW_DATE_2022('KOR', SYSDATE))

-- 예시: 베트남 로케일 오늘 날짜
TRUNC(SF_GET_LOCALE_VW_DATE_2022('VNM', SYSDATE))
```

#### SF_GET_LOCALE_VW_DATE_2022 함수 정의

```sql
CREATE OR REPLACE FUNCTION SF_GET_LOCALE_VW_DATE_2022
    (LOCALE IN VARCHAR2, IN_DATE DATE)
    RETURN DATE
IS
    V_RTN DATE;
BEGIN
    SELECT CASE
        WHEN UPPER(LOCALE) = 'KOR' THEN
            from_tz(CAST(NVL(IN_DATE,SYSDATE) as timestamp), 'UTC') at time zone '+09:00'
        WHEN UPPER(LOCALE) = 'VNM' THEN
            from_tz(CAST(NVL(IN_DATE,SYSDATE) as timestamp), 'UTC') at time zone '+07:00'
        ELSE
            from_tz(CAST(NVL(IN_DATE,SYSDATE) as timestamp), 'UTC') at time zone '+09:00'
    END INTO V_RTN
    FROM DUAL;
    RETURN V_RTN;
END;
```

### 1.3 WK_DT 비교 예시

```sql
-- WK_DT는 CHAR(8) 형식 (YYYYMMDD)
-- 비교 시 TO_DATE 변환 필요
-- P_LOCALE: 농장의 로케일 ('KOR', 'VNM')
WHERE (TRUNC(SF_GET_LOCALE_VW_DATE_2022(P_LOCALE, SYSDATE)) - TO_DATE(WK.WK_DT, 'YYYYMMDD')) >= :기준일수
```

### 1.4 로케일 조회

```sql
-- 농장 로케일 조회 (TA_FARM.COUNTRY_CODE 사용)
SELECT NVL(COUNTRY_CODE, 'KOR') AS LOCALE FROM TA_FARM WHERE FARM_NO = :farm_no;
```

### 1.5 보고서 기준일

#### 기간 구분

| 보고서 | 기간 (DT_FROM ~ DT_TO) | 기준일 | 비고 |
|--------|------------------------|--------|------|
| **주간 (WEEK)** | 전주 월요일 ~ 일요일 | 전주 일요일 (DT_TO) | 관리대상 계산 기준 |
| **월간 (MON)** | 전월 1일 ~ 마지막일 | 전월 마지막일 (DT_TO) = 기말 | - |
| **분기 (QT)** | 전분기 시작 ~ 종료 | 전분기 마지막일 (DT_TO) | 예정 |

### 1.6 날짜 처리 원칙 (API SQL)

> **중요**: API에서 사용하는 SQL 작성 시 아래 날짜 변환 규칙을 반드시 준수해야 합니다.

#### 컬럼 타입별 처리 규칙

| 구분 | 컬럼 타입 | 처리 방법 | 포맷 |
|------|----------|----------|------|
| **SELECT** | DATE | `SF_GET_LOCALE_VW_DATE_2022` | `'YYYY.MM.DD'` |
| **SELECT** | VARCHAR(8) YYYYMMDD | `TO_CHAR(TO_DATE(...), ...)` | `'YY.MM.DD'` |
| **WHERE** | DATE | `SF_GET_LOCALE_DATE_2020` | `'YYYYMMDD'` |
| **WHERE** | VARCHAR(8) YYYYMMDD | 직접 비교 | `'YYYYMMDD'` |

#### SELECT 절 - DATE 컬럼 (조회)
*   **함수**: `SF_GET_LOCALE_VW_DATE_2022(LOCALE, DATE_COL)` + `TO_CHAR(..., 'FORMAT')`
*   **포맷**: `'YYYY.MM.DD'` (기본 표출용)
*   **예시**:
    ```sql
    -- DATE 컬럼 표출 (예: LOG_INS_DT, START_DT, END_DT)
    TO_CHAR(SF_GET_LOCALE_VW_DATE_2022('KOR', M.LOG_INS_DT), 'YYYY.MM.DD') AS LOG_INS_DT
    ```

#### SELECT 절 - VARCHAR(8) YYYYMMDD 컬럼 (조회)
*   **함수**: `TO_CHAR(TO_DATE(COL, 'YYYYMMDD'), 'FORMAT')`
*   **포맷**: `'YY.MM.DD'` (간결한 표출용)
*   **예시**:
    ```sql
    -- VARCHAR(8) YYYYMMDD 컬럼 표출 (예: DT_FROM, DT_TO, TOKEN_EXPIRE_DT)
    TO_CHAR(TO_DATE(M.DT_FROM, 'YYYYMMDD'), 'YY.MM.DD') AS DT_FROM,
    TO_CHAR(TO_DATE(M.DT_TO, 'YYYYMMDD'), 'YY.MM.DD') AS DT_TO
    ```

#### WHERE 절 - DATE 컬럼 (조건)
*   **함수**: `SF_GET_LOCALE_DATE_2020(LOCALE, DATE_COL)` + `TO_CHAR(..., 'FORMAT')`
*   **비교**: 입력받은 파라미터(YYYYMMDD 문자열)와 비교 시 `TO_CHAR`로 변환하여 비교
*   **예시**:
    ```sql
    -- DATE 컬럼 조건 비교
    WHERE TO_CHAR(SF_GET_LOCALE_DATE_2020('KOR', M.INS_DT), 'YYYYMMDD') >= :from
      AND TO_CHAR(SF_GET_LOCALE_DATE_2020('KOR', M.INS_DT), 'YYYYMMDD') <= :to
    ```

#### WHERE 절 - VARCHAR(8) YYYYMMDD 컬럼 (조건)
*   **비교**: YYYYMMDD 문자열 직접 비교
*   **예시**:
    ```sql
    -- VARCHAR(8) YYYYMMDD 컬럼 조건 비교
    WHERE M.DT_FROM >= :dtFrom
      AND M.DT_TO <= :dtTo
    ```

#### 기간 계산 예시

```sql
-- 주간: 전주 월요일 ~ 일요일 (스케줄 실행일 기준)
V_DT_TO := TRUNC(V_BASE_DT, 'IW') - 1;  -- 지난주 일요일
V_DT_FROM := V_DT_TO - 6;                -- 지난주 월요일

-- 월간: 전월 1일 ~ 마지막일
V_DT_FROM := TRUNC(ADD_MONTHS(V_BASE_DT, -1), 'MM');  -- 전월 1일
V_DT_TO := TRUNC(V_BASE_DT, 'MM') - 1;                 -- 전월 마지막일 (기말)
```

#### 기준일 사용처

- **관리대상 모돈**: 기준일(DT_TO) 시점 기준으로 지연일 계산
- **실적 집계**: DT_FROM ~ DT_TO 기간 내 작업 집계
- **현황 조회**: 기준일(DT_TO) 시점의 상태

---

## 2. 기준 테이블 및 뷰

### 2.1 필수 참조 테이블

| 테이블/뷰 | 용도 | 비고 |
|-----------|------|------|
| `TB_MODON` | 모돈 마스터 | 기본 모돈 정보 |
| `TB_MODON_WK` | 모돈 작업 이력 | 모든 작업 로그 |
| `VM_LAST_MODON_SEQ_WK` | 최종 작업 조회 | 뷰 또는 동일 로직 사용 |
| `TC_FARM_CONFIG` | 농장별 설정 | 기준일수 등 |
| `TA_FARM` | 농장 마스터 | 농장 기본정보 |

### 2.2 VM_LAST_MODON_SEQ_WK (최종 작업 뷰)

최종 작업 조회 시 **뷰 사용 또는 동일한 MAX(SEQ) 로직**을 사용합니다.

#### 뷰 구조
```sql
-- VM_LAST_MODON_SEQ_WK 핵심 로직
SELECT WKM.FARM_NO, WKM.PIG_NO, TB1.*
FROM (
    -- 최종 작업 시퀀스 추출 (MAX(SEQ) 사용)
    SELECT FARM_NO, PIG_NO, MAX(SEQ) AS MSEQ
    FROM TB_MODON_WK
    WHERE USE_YN = 'Y'
    GROUP BY FARM_NO, PIG_NO
) WKM
INNER JOIN TB_MODON_WK TB1
    ON TB1.FARM_NO = WKM.FARM_NO
   AND TB1.PIG_NO = WKM.PIG_NO
   AND TB1.SEQ = WKM.MSEQ
```

#### 뷰 컬럼
| 컬럼 | 설명 |
|------|------|
| `FARM_NO` | 농장번호 |
| `PIG_NO` | 모돈번호 |
| `WK_DT` | 작업일자 (CHAR 8) |
| `WK_DATE` | 작업일자 (DATE) |
| `SANCHA` | 산차 |
| `GYOBAE_CNT` | 교배차수 |
| `WK_GUBUN` | 작업구분 (G/B/E/F 등) |
| `DAERI_YN` | 대리돈여부 |
| `SAGO_GUBUN_CD` | 사고구분코드 |
| `LOC_CD` | 위치코드 |
| `SEQ` | 시퀀스 |

#### 사용 방법

```sql
-- 방법 1: 뷰 직접 사용
SELECT WK.*, MD.*
FROM VM_LAST_MODON_SEQ_WK WK
INNER JOIN TB_MODON MD
    ON MD.FARM_NO = WK.FARM_NO AND MD.PIG_NO = WK.PIG_NO
WHERE WK.FARM_NO = :farm_no
  AND WK.WK_GUBUN = 'E'  -- 이유

-- 방법 2: WITH 절로 동일 로직 구현 (필요 컬럼만 추출)
WITH LAST_WK AS (
    SELECT FARM_NO, PIG_NO, MAX(SEQ) AS MSEQ
    FROM TB_MODON_WK
    WHERE FARM_NO = :farm_no
      AND USE_YN = 'Y'
    GROUP BY FARM_NO, PIG_NO
)
SELECT WK.WK_DT, WK.WK_GUBUN, WK.DAERI_YN
FROM LAST_WK LW
INNER JOIN TB_MODON_WK WK
    ON WK.FARM_NO = LW.FARM_NO
   AND WK.PIG_NO = LW.PIG_NO
   AND WK.SEQ = LW.MSEQ
WHERE WK.WK_GUBUN = 'E'
```

> **주의**: MAX(WK_DT)가 아닌 **MAX(SEQ)**로 최종 작업을 판단합니다.

---

## 3. 모돈 상태 코드 (STATUS_CD)

### 3.1 TB_MODON.STATUS_CD (상위코드: 01)

| 코드 | 항목명 | 설명 |
|------|--------|------|
| `010001` | 후보돈 | 미교배 상태 (SANCHA=0, 작업이력 없음) |
| `010002` | 임신돈 | 임신확인 완료 |
| `010003` | 포유돈 | 분만 완료, 이유 전 |
| `010004` | 대리모돈 | 대리모 역할 수행 중 |
| `010005` | 이유모돈 | 이유 완료, 재교배 대기 |
| `010006` | 재발돈(사고) | 임신사고 - 재발정 |
| `010007` | 유산돈(사고) | 임신사고 - 유산/공태 |
| `010008` | 도폐사돈 | 도태/폐사 (OUT_DT ≠ 9999/12/31) |
| `019999` | 전체 모돈 | 시스템용 (숨김, 삭제 금지) |

### 3.2 상태별 조회 조건

```sql
-- 미교배 후보돈
WHERE STATUS_CD = '010001' 

-- 임신돈
WHERE STATUS_CD = '010002'

-- 포유돈 (포유돈 + 대리모돈)
WHERE STATUS_CD IN ('010003', '010004')

-- 이유모돈 (이유후 미교배)
WHERE STATUS_CD = '010005'

-- 사고돈 (재발 + 유산)
WHERE STATUS_CD IN ('010006', '010007')

-- 도폐사돈
WHERE STATUS_CD = '010008'
```

### 3.3 예정작업 기준작업 코드 (TB_PLAN_MODON.MODON_STATUS_CD)

예정작업 설정 시 기준이 되는 작업 코드 (상위코드: 02)

| 코드 | 항목명 | 설명 |
|------|--------|------|
| `020001` | 출생 | 출생 기준 예정 |
| `020002` | 전입 | 전입 기준 예정 |
| `020003` | 교배 | 교배 기준 예정 |
| `020004` | 분만 | 분만 기준 예정 |
| `020005` | 이유 | 이유 기준 예정 |
| `020006` | 대리포유 | 대리포유 기준 예정 |
| `020007` | 재발붙임 | 재발붙임 기준 예정 |
| `020008` | 유산 | 유산 기준 예정 |
| `020097` | 재교배 | 재교배 기준 예정 |
| `020098` | 도폐사/판매 | 도폐사/판매 기준 예정 |
| `020099` | 사고 | 사고 기준 예정 |
| `029999` | 전체 | 시스템용 (숨김) |

### 3.4 예정작업 구분 코드 (TB_PLAN_MODON.JOB_GUBUN_CD)

| 코드 | 항목명 | 대상 모돈 상태 |
|------|--------|----------------|
| `150001` | 임신진단 예정 | 임신돈 (010002) |
| `150002` | 분만 예정 | 임신돈 (010002) |
| `150003` | 이유 예정 | 포유돈 (010003), 대리모돈 (010004) |
| `150004` | 백신 예정 | 전체 모돈 |
| `150005` | 교배 예정 | 후보돈 (010001), 이유모돈 (010005), 재발돈 (010006), 유산돈 (010007) |
| `150004` | 백신 예정2 | 전체 모돈 |

---

## 4. 작업 구분 코드 (WK_GUBUN)

### 4.1 TB_MODON_WK.WK_GUBUN

| 코드 | 명칭 | 설명 |
|------|------|------|
| `A` | 후보돈 |  |
| `G` | 교배 | 교배 작업 |
| `B` | 분만 | 분만 작업 |
| `E` | 이유 | 이유 작업 |
| `F` | 사고 | 임신사고 (재발/공태) |
| `Z` | 도태폐사 | 도태, 폐사, 전출 |

### 4.2 작업구분별 조회

```sql
-- 최종 교배 작업
WHERE WK_GUBUN = 'G'

-- 최종 분만 작업
WHERE WK_GUBUN = 'B'

-- 최종 이유 작업
WHERE WK_GUBUN = 'E'

-- 최종 사고 작업
WHERE WK_GUBUN = 'F'
```

---

## 5. 농장 설정값 (TC_FARM_CONFIG)

> **참고**: 코드 정의는 TC_CODE_SYS 테이블에서 관리

### 5.1 주요 설정 코드

| CODE | 명칭 | 기본값 | 설명 |
|------|------|--------|------|
| `140002` | 평균임신기간 | 115 | 교배~분만 기준일수 |
| `140003` | 평균포유기간 | 21 | 분만~이유 기준일수 |
| `140007` | 후보돈초교배일령 | 240 | 출생~초교배 기준일수 |
| `140008` | 평균재귀일 | 7 | 이유~재교배 기준일수 |
| `140005` | 기준출하일령 | 180 | 자돈분만일~출하 기준일수 |

### 5.2 설정값 조회 방법

```sql
-- 권장: WITH 절 사용
WITH FARM_CONF AS (
    SELECT CODE, CVALUE
    FROM TC_FARM_CONFIG
    WHERE FARM_NO = :farm_no
      AND CODE IN ('140002', '140003', '140007', '140008')
)
SELECT NVL(MAX(CASE WHEN CODE = '140007' THEN TO_NUMBER(CVALUE) END), 240) AS FIRST_GB_DAY,
       NVL(MAX(CASE WHEN CODE = '140008' THEN TO_NUMBER(CVALUE) END), 7) AS AVG_RETURN,
       NVL(MAX(CASE WHEN CODE = '140002' THEN TO_NUMBER(CVALUE) END), 115) AS PREG_PERIOD,
       NVL(MAX(CASE WHEN CODE = '140003' THEN TO_NUMBER(CVALUE) END), 21) AS WEAN_PERIOD
FROM FARM_CONF;
```

---

## 6. 모돈 날짜 필드 및 필터링

### 6.1 주요 날짜 필드

| 필드 | 설명 | 비고 |
|------|------|------|
| `IN_DT` | 전입일 | 시스템에 전입시킨 일자 |
| `OUT_DT` | 도폐사일 | 도태/폐사/전출 일자 |
| `BIRTH_DT` | 출생일 | 후보돈 초교배일 계산에 사용 |
| `LAST_WK_DT` | 최종작업일 | 전입 시 설정된 최종 작업일이며 금주 작업예정 추출시 사용 |

### 6.2 OUT_DT 값 해석

| OUT_DT 값 | 의미 |
|-----------|------|
| `'9999-12-31'` | 미도폐사 모돈 (도폐사일 미도래, 현재 존재) |
| `실제 날짜` | 해당 일자에 도태/폐사/전출됨 |

> **주의**: OUT_DT가 기준일보다 같거나 과거인 경우 기준일기준으로 도폐사된 모돈입니다.

### 6.3 필수 조건 (미도폐사 모돈 조회)

**모든 모돈 조회 시 반드시 아래 조건을 포함해야 합니다.**

```sql
WHERE MD.OUT_DT = TO_DATE('9999-12-31', 'YYYY-MM-DD')  -- 미도폐사 모돈 (도폐사일 미도래)
  AND MD.USE_YN = 'Y'                                   -- 사용중
```

### 6.4 대리돈 제외

```sql
-- 이유후 미교배 조회 시
WHERE WK_GUBUN='E' AND WK.DAERI_YN = 'N'  -- 이유가 끝난 모돈(교배대기돈)
```

---

## 7. 관리대상 모돈 추출 로직

> **기준일**: 관리대상 계산은 리포트 종료일(P_DT_TO)을 기준일로 사용
> - 주간: 전주 일요일
> - 월간: 전월 마지막일 (기말)

### 7.1 후보돈 판별 기준

> **중요**: 후보돈은 작업이력(TB_MODON_WK)이 **없는** 상태에서만 판별합니다.

| 조건 | STATUS_CD | 추가 조건 | 설명 |
|------|-----------|----------|------|
| 조건1 | `010001` (후보돈) | - | 일반 미교배 후보돈 |
| 조건2 | `010002` (임신돈) | IN_SANCHA=0, IN_GYOBAE_CNT=1 | 전입 임신돈 (초교배) |

#### 후보돈 조회 SQL

```sql
-- 후보돈 추출 (기준일 시점에 작업이력 없는 경우만)
SELECT MD.*
FROM TB_MODON MD
WHERE MD.FARM_NO = :farm_no
  AND MD.OUT_DT = TO_DATE('9999-12-31', 'YYYY-MM-DD')
  AND MD.USE_YN = 'Y'
  AND MD.IN_SANCHA = 0  
  AND MD.IN_GYOBAE_CNT = 0   
  AND NOT EXISTS (
      SELECT 1 FROM TB_MODON_WK WK
      WHERE WK.FARM_NO = :farm_no
        AND WK.PIG_NO = MD.PIG_NO
        AND WK.WK_DT < :기준일
        AND WK.USE_YN = 'Y'
  );
```

#### 전입 임신돈 (초교배) 설명

- `IN_SANCHA = 0`: 전입 시 산차가 0 (초산)
- `IN_GYOBAE_CNT = 1`: 전입 시 교배차수가 1 (첫 교배)
- 전입 시점에 이미 교배된 상태이지만, 작업이력이 없으면 후보돈으로 취급

### 7.2 관리대상 유형별 추출 조건

| 유형 | 설명 | 기준작업 | 지연일 계산 |
|------|------|----------|-------------|
| **미교배 후보돈** | 후보돈 (7.1 기준) | 출생일 | 기준일 - 출생일 - 후보돈초교배일령 |
| **이유후 미교배** | 이유완료 후 재교배 대기 | 이유일 | 기준일 - 이유일 - 평균재귀일 |
| **사고후 미교배** | 임신사고 후 재교배 대기 | 사고일 | 기준일 - 사고일 |
| **분만지연** | 임신돈, 분만 예정일 경과 | 교배일 | 기준일 - 교배일 - 평균임신기간 |
| **이유지연** | 포유돈, 이유 예정일 경과 | 분만일 | 기준일 - 분만일 - 평균포유기간 |

### 7.3 지연일 구간

| 구간 | 범위 | 설명 |
|------|------|------|
| ~3일 | 0 ~ 3일 | 경미한 지연 |
| 4~7일 | 4 ~ 7일 | 주의 필요 |
| 8~14일 | 8 ~ 14일 | 관리 필요 |
| 14일~ | 15일 이상 | 즉시 조치 필요 |

### 7.4 농장 설정값 참조

관리대상 계산에 사용하는 기준일수:

| CODE | 명칭 | 기본값 | 사용처 |
|------|------|--------|--------|
| `140007` | 후보돈초교배일령 | 240 | 미교배 후보돈 |
| `140008` | 평균재귀일 | 7 | 이유후 미교배 |
| `140002` | 평균임신기간 | 115 | 분만지연 |
| `140003` | 평균포유기간 | 21 | 이유지연 |

---

## 8. 예정돈 조회 패턴 (심플 SQL)

> 레거시 FN_MD_SCHEDULE_BSE_2020 함수를 테이블 직접 조회로 단순화

### 8.0 FN_MD_SCHEDULE_BSE_2020 함수 (레거시)

예정작업 대상 모돈을 조회하는 파이프라인 테이블 함수

#### 반환 타입 정의

```sql
CREATE OR REPLACE TYPE PKSU.TBL_MD_SCHEDULE_BSE AS OBJECT
(
  FARM_NO         NUMBER,
  PIG_NO          NUMBER,
  FARM_PIG_NO     VARCHAR2(40),
  IGAK_NO         VARCHAR2(40),
  WK_NM           VARCHAR2(100),   -- 예정작업명
  AUTO_GRP        VARCHAR2(40),
  LOC_NM          VARCHAR2(100),
  SANCHA          VARCHAR2(100),
  GYOBAE_CNT      VARCHAR2(100),
  LAST_WK_DT      VARCHAR2(10),    -- 마지막 작업일자
  PASS_DAY        NUMBER,          -- 경과일
  PASS_DT         VARCHAR2(10),    -- 작업 예정일
  LAST_WK_NM      VARCHAR2(100),   -- 마지막 작업명
  LAST_WK_GUBUN   VARCHAR2(1),
  LAST_WK_GUBUN_CD VARCHAR2(6),
  ARTICLE_NM      VARCHAR2(200),   -- 백신명
  HCODE           INTEGER,         -- 백신코드
  DAERI_YN        VARCHAR2(1)
);
/
```

#### 함수 시그니처

```sql
FN_MD_SCHEDULE_BSE_2020(
    P_FARM_NO       INTEGER,      -- 농장번호
    P_REPORT_GB     VARCHAR2,     -- 리포트구분 ('JOB-DAJANG')
    P_JOB_GUBUN_CD  VARCHAR2,     -- 예정작업구분 (150002/150003/150004/150005)
    P_STATUS_CD     VARCHAR2,     -- 모돈상태코드 (NULL=전체)
    P_SDT           VARCHAR2,     -- 시작일 (yyyy-MM-dd)
    P_EDT           VARCHAR2,     -- 종료일 (yyyy-MM-dd)
    P_GRP           VARCHAR2,     -- 모돈그룹 (NULL=전체)
    P_LANG          VARCHAR2,     -- 언어 ('ko')
    P_DATE_FORMAT   VARCHAR2,     -- 날짜포맷 ('yyyy-MM-dd')
    P_SEQ           VARCHAR2,     -- SEQ ('-1'=전체)
    P_SANCHA        VARCHAR2      -- 산차범위 (NULL=전체)
) RETURN TBL_TBL_MD_SCHEDULE_BSE PIPELINED
```

#### 사용 예시

```sql
-- 교배예정 조회 (150005)
SELECT WK_NM, LAST_WK_NM, PASS_DAY, COUNT(*) CNT
FROM TABLE(FN_MD_SCHEDULE_BSE_2020(
    1456, 'JOB-DAJANG', '150005', NULL,
    '2025-12-15', '2025-12-21', NULL, 'ko', 'yyyy-MM-dd', '-1', NULL
))
GROUP BY WK_NM, LAST_WK_NM, PASS_DAY
ORDER BY WK_NM, PASS_DAY;

-- 백신예정 조회 (150004) - ARTICLE_NM 포함
SELECT WK_NM, ARTICLE_NM, PASS_DAY, COUNT(*) CNT
FROM TABLE(FN_MD_SCHEDULE_BSE_2020(
    1456, 'JOB-DAJANG', '150004', NULL,
    '2025-12-15', '2025-12-21', NULL, 'ko', 'yyyy-MM-dd', '-1', NULL
))
GROUP BY WK_NM, ARTICLE_NM, PASS_DAY;
```

### 8.1 기본 구조

```sql
-- 예정돈 = 재적모돈 + 마지막작업 + 예정작업설정
SELECT M.FARM_NO, M.PIG_NO, M.FARM_PIG_NO,
       M.STATUS_CD,
       W.WK_GUBUN, W.WK_DATE, W.SANCHA,
       P.WK_NM, P.PASS_DAY,
       W.WK_DATE + P.PASS_DAY AS EXPECTED_DT  -- 예정일
FROM TB_MODON M
-- 마지막 작업 조회
LEFT JOIN (
    SELECT FARM_NO, PIG_NO, WK_GUBUN, WK_DATE, SANCHA, DAERI_YN,
           ROW_NUMBER() OVER (PARTITION BY FARM_NO, PIG_NO
                              ORDER BY WK_DATE DESC, SEQ DESC) RN
    FROM TB_MODON_WK
    WHERE FARM_NO = :P_FARM_NO AND USE_YN = 'Y'
) W ON M.FARM_NO = W.FARM_NO AND M.PIG_NO = W.PIG_NO AND W.RN = 1
-- 예정작업 설정
INNER JOIN TB_PLAN_MODON P
    ON P.FARM_NO = M.FARM_NO
   AND P.JOB_GUBUN_CD = :P_JOB_GUBUN_CD  -- 예정작업구분
   AND (P.MODON_STATUS_CD = M.STATUS_CD OR P.MODON_STATUS_CD = '019999')
   AND P.USE_YN = 'Y'
WHERE M.FARM_NO = :P_FARM_NO
  AND M.OUT_DT = TO_DATE('9999-12-31', 'YYYY-MM-DD')  -- 재적
  AND W.WK_DATE + P.PASS_DAY BETWEEN :P_SDT AND :P_EDT;  -- 예정일 범위
```

### 8.2 예정작업별 대상 모돈

| 예정작업 (JOB_GUBUN_CD) | 대상 STATUS_CD |
|-------------------------|----------------|
| 150005 (교배예정) | 010001, 010005, 010006, 010007 |
| 150002 (분만예정) | 010002 |
| 150003 (이유예정) | 010003, 010004 |
| 150001 (임신진단) | 010002 |
| 150004 (백신) | 전체 (019999) |

### 8.3 기준작업별 예정일 계산

| 기준작업 (STD_CD) | 예정일 계산 |
|-------------------|-------------|
| 020001 (출생) | BIRTH_DT + PASS_DAY |
| 020002 (전입) | IN_DT + PASS_DAY |
| 020003 (교배) | 마지막교배일 + PASS_DAY |
| 020005 (이유) | 마지막이유일 + PASS_DAY |
| 029999 (전체) | 마지막작업일 + PASS_DAY |

### 8.4 분만예정돈 조회 예제

```sql
-- 분만예정돈: 임신돈 중 교배일 + 114일이 조회범위 내
SELECT M.FARM_NO, M.PIG_NO, M.FARM_PIG_NO,
       G.WK_DATE AS GYOBAE_DT,
       G.SANCHA,
       G.WK_DATE + 114 AS EXPECTED_BUNMAN_DT
FROM TB_MODON M
INNER JOIN (
    SELECT FARM_NO, PIG_NO, WK_DATE, SANCHA,
           ROW_NUMBER() OVER (PARTITION BY FARM_NO, PIG_NO
                              ORDER BY WK_DATE DESC, SEQ DESC) RN
    FROM TB_MODON_WK
    WHERE FARM_NO = :P_FARM_NO
      AND WK_GUBUN = 'G'  -- 교배
      AND USE_YN = 'Y'
) G ON M.FARM_NO = G.FARM_NO AND M.PIG_NO = G.PIG_NO AND G.RN = 1
WHERE M.FARM_NO = :P_FARM_NO
  AND M.STATUS_CD = '010002'  -- 임신돈
  AND M.OUT_DT = TO_DATE('9999-12-31', 'YYYY-MM-DD')
  AND G.WK_DATE + 114 BETWEEN :P_SDT AND :P_EDT;
```

### 8.5 이유예정돈 조회 예제

```sql
-- 이유예정돈: 포유돈 중 분만일 + 21일이 조회범위 내
SELECT M.FARM_NO, M.PIG_NO, M.FARM_PIG_NO,
       B.WK_DATE AS BUNMAN_DT,
       B.SANCHA,
       B.WK_DATE + 21 AS EXPECTED_EU_DT
FROM TB_MODON M
INNER JOIN (
    SELECT FARM_NO, PIG_NO, WK_DATE, SANCHA,
           ROW_NUMBER() OVER (PARTITION BY FARM_NO, PIG_NO
                              ORDER BY WK_DATE DESC, SEQ DESC) RN
    FROM TB_MODON_WK
    WHERE FARM_NO = :P_FARM_NO
      AND WK_GUBUN = 'B'  -- 분만
      AND USE_YN = 'Y'
) B ON M.FARM_NO = B.FARM_NO AND M.PIG_NO = B.PIG_NO AND B.RN = 1
WHERE M.FARM_NO = :P_FARM_NO
  AND M.STATUS_CD IN ('010003', '010004')  -- 포유돈, 대리모돈
  AND M.OUT_DT = TO_DATE('9999-12-31', 'YYYY-MM-DD')
  AND B.WK_DATE + 21 BETWEEN :P_SDT AND :P_EDT;
```

---

## 9. SQL 파일 실행 순서

### 9.1 파일 번호 체계

### ins/ 공통

| 번호 | 용도 |
|------|------|
| 01~09 | 시퀀스, 테이블 등 기본 객체 |
| 11~19 | 공통 프로시저 |

### ins/week/ 주간 리포트

| 번호 | 용도 |
|------|------|
| 01~09 | 메인/핵심 프로시저 |
| 11~89 | 팝업 프로시저 (계속 추가) |
| 99 | 스케줄러 JOB |

### 9.2 현재 파일 목록

**sql/ref/** (참조용 - DB 적용 불필요)

| 파일명 | 설명 |
|--------|------|
| 01_TABLE.sql | 운영 테이블 DDL |
| 02_VIEW.sql | VW_MODON_DATE_2020_MAX_WK |
| 03_FUNCTION.sql | SF_GET_MODONGB_STATUS |

**sql/ins/** (신규 - DB 적용 대상)

| 파일명 | 설명 |
|--------|------|
| 01_SEQUENCE.sql | 시퀀스 생성 |
| 02_ALTER_TABLE.sql | 테이블 컬럼 추가 |
| 11_SP_INS_COM_LOG.sql | 공통 로그 프로시저 |

**sql/ins/week/** (주간 리포트)

| 파일명 | 설명 |
|--------|------|
| 01_SP_INS_WEEK_MAIN.sql | 메인 프로시저 |
| 11_SP_INS_WEEK_MODON_POPUP.sql | 모돈현황 팝업 |
| 12_SP_INS_WEEK_ALERT_POPUP.sql | 관리대상 모돈 |
| 21_SP_INS_WEEK_GB_POPUP.sql | 교배 팝업 |
| 22_SP_INS_WEEK_BM_POPUP.sql | 분만 팝업 |
| 23_SP_INS_WEEK_EU_POPUP.sql | 이유 팝업 |
| 31_SP_INS_WEEK_SG_POPUP.sql | 임신사고 팝업 |
| 32_SP_INS_WEEK_DOPE_POPUP.sql | 도태폐사 팝업 |
| 41_SP_INS_WEEK_SHIP_POPUP.sql | 출하 팝업 |
| 51_SP_INS_WEEK_SCHEDULE_POPUP.sql | 금주 작업예정 팝업 |
| 99_JOB_INS_WEEKLY.sql | 스케줄러 JOB |

---

## 10. 통계 테이블 구조

### 10.1 3-tier 구조

```
TS_INS_MASTER (리포트 마스터)
    │
    ├── TS_INS_WEEK (농장별 요약)
    │       │
    │       └── TS_INS_WEEK_SUB (상세 데이터, GUBUN별)
    │
    └── TS_INS_JOB_LOG (실행 로그)
```

### 10.2 TS_INS_WEEK_SUB GUBUN 코드

| GUBUN | 용도 | CNT_1~5 매핑 |
|-------|------|-------------|
| `ALERT` | 관리대상 모돈 | 후보,이유미,사고미,분만지연,이유지연 |
| `MODON` | 모돈 현황 | 후보,임신,포유,이유모,사고,증감 |
| `MATING_T` | 교배 유형별 | 계획,실적 |
| `FARROWING` | 분만 성적 | 항목별 |
| `WEANING` | 이유 성적 | 항목별 |
| `SCHEDULE` | 작업예정 요약 | 교배,재발확인,분만,이유,백신,출하 |
| `SCHEDULE_CAL` | 작업예정 캘린더 | 요일별 예정복수 |

### 10.3 SCHEDULE / SCHEDULE_CAL 상세 매핑

#### GUBUN='SCHEDULE' (요약, SORT_NO=1)

| 컬럼 | 용도 | 비고 |
|------|------|------|
| CNT_1 | 교배예정 합계 | FN_MD_SCHEDULE_BSE_2020 (150005) |
| CNT_2 | 재발확인 합계 | 3주 + 4주 |
| CNT_3 | 분만예정 합계 | FN_MD_SCHEDULE_BSE_2020 (150002) |
| CNT_4 | 이유예정 합계 | FN_MD_SCHEDULE_BSE_2020 (150003) |
| CNT_5 | 백신예정 합계 | FN_MD_SCHEDULE_BSE_2020 (150004) |
| CNT_6 | 출하예정 합계 | 미구현 |
| CNT_7 | 주차 | ISO 주차 |
| STR_1 | 시작일 | MM.DD |
| STR_2 | 종료일 | MM.DD |

#### GUBUN='SCHEDULE_CAL' (캘린더, SORT_NO=1~6)

| SORT_NO | CODE_1 | 용도 |
|---------|--------|------|
| 1 | GB | 교배예정 |
| 2 | BM | 분만예정 |
| 3 | IMSIN_3W | 재발확인 3주 (18~24일) |
| 4 | IMSIN_4W | 재발확인 4주 (25~31일) |
| 5 | EU | 이유예정 |
| 6 | VACCINE | 백신예정 |

| 컬럼 | 용도 |
|------|------|
| STR_1~STR_7 | 요일별 날짜 (DD) |
| CNT_1~CNT_7 | 월~일 예정 복수 |

---

## 11. 프로시저 작성 규칙

### 11.1 로그 기록

```sql
-- 시작
SP_INS_COM_LOG_START(P_MASTER_SEQ, P_JOB_NM, 'SP_프로시저명', P_FARM_NO, V_LOG_SEQ);

-- 정상 종료
SP_INS_COM_LOG_END(V_LOG_SEQ, V_PROC_CNT);

-- 오류 종료
SP_INS_COM_LOG_ERROR(V_LOG_SEQ, SQLCODE, SQLERRM);
```

### 11.2 EXCEPTION 처리

```sql
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        SP_INS_COM_LOG_ERROR(V_LOG_SEQ, SQLCODE, SQLERRM);
        RAISE;
```

### 11.3 COMMIT 정책

- 각 논리적 단위 완료 시 COMMIT
- EXCEPTION 발생 시 ROLLBACK 후 로그 기록

---

## 12. 체크리스트

### SQL 작성 전 확인사항

- [ ] `VM_LAST_MODON_SEQ_WK` 뷰 사용 (직접 MAX 조회 금지)
- [ ] `OUT_DT = '9999-12-31'` 조건 포함 (미도폐사 모돈)
- [ ] `USE_YN = 'Y'` 조건 포함
- [ ] `DAERI_YN = 'N'` 조건 확인 (이유 관련)
- [ ] WK_DT 비교 시 `TO_DATE(WK_DT, 'YYYY-MM-DD')` 변환
- [ ] 농장 설정값 `TC_FARM_CONFIG` 참조
- [ ] 기본값 `NVL` 처리

### 프로시저 작성 전 확인사항

- [ ] 로그 시작/종료 호출
- [ ] EXCEPTION 처리
- [ ] COMMIT/ROLLBACK 정책 준수
- [ ] 파라미터 검증

---

## 13. 운영 데이터 규모

### 13.1 주요 테이블 건수 (2025.12 기준)

| 테이블 | 건수 | 비고 |
|--------|------|------|
| `TB_MODON_WK` | **40,465,033** | 모돈 작업 이력 (최대) |
| `TB_GYOBAE` | 14,881,595 | 교배 |
| `TB_BUNMAN` | 11,485,759 | 분만 |
| `TB_EU` | 11,383,819 | 이유 |
| `TB_MODON_JADON_TRANS` | 10,000,368 | 자돈 전입 |
| `TB_MODON` | **3,317,247** | 모돈 마스터 |
| `TB_SAGO` | 2,713,315 | 임신사고 |
| `TB_WT_BCS` | 893,954 | 체중/BCS |
| `TC_FARM_CONFIG` | 597,935 | 농가설정 |
| `TB_PLAN_MODON` | 27,948 | 예정작업 |
| `TC_CODE_FARM` | 16,277 | 농장코드 |
| `TA_MEMBER` | 3,163 | 회원 |
| `TA_FARM` | 3,135 | 농장 |
| `TC_CODE_SYS` | 2,588 | 시스템코드 |

### 13.2 성능 고려사항

#### TB_MODON_WK (4천만건)
```sql
-- 금지: WK_DT 기준 MAX 조회 (동일 날짜 복수 작업 시 오류)
SELECT * FROM TB_MODON_WK
WHERE WK_DT = (SELECT MAX(WK_DT) FROM TB_MODON_WK WHERE ...)  -- 잘못된 방식

-- 권장: SEQ 기준 MAX 조회 (뷰 또는 동일 로직)
SELECT * FROM VM_LAST_MODON_SEQ_WK WHERE ...
-- 또는
WITH LAST_WK AS (
    SELECT FARM_NO, PIG_NO, MAX(SEQ) AS MSEQ
    FROM TB_MODON_WK WHERE FARM_NO = :farm_no AND USE_YN = 'Y'
    GROUP BY FARM_NO, PIG_NO
)
SELECT ... FROM LAST_WK ...
```

#### TB_MODON (350만건)
```sql
-- 권장: 농장번호 + 상태코드 조건 필수
WHERE FARM_NO = :farm_no      -- 파티션/인덱스 활용
  AND STATUS_CD = '010001'    -- 추가 필터링
  AND OUT_DT = TO_DATE('9999-12-31', 'YYYY-MM-DD')
  AND USE_YN = 'Y'
```


### 13.3 인덱스 활용

| 테이블 | 주요 인덱스 컬럼 | 용도 |
|--------|-----------------|------|
| `TB_MODON` | FARM_NO, STATUS_CD, OUT_DT | 재적 모돈 조회 |
| `TB_MODON_WK` | FARM_NO, PIG_NO, WK_DT | 작업 이력 조회 |
| `TB_GYOBAE` | FARM_NO, PIG_NO, WK_DT | 교배 이력 |
| `TB_BUNMAN` | FARM_NO, PIG_NO, WK_DT | 분만 이력 |

### 13.4 OUTER JOIN 최적화

> **원칙**: 데이터 건수가 적은 테이블을 드라이빙 테이블로 사용

```sql
-- 권장: 소량 테이블(TB_MODON) 기준으로 대량 테이블(TB_MODON_WK) OUTER JOIN
SELECT MD.*, WK.WK_DT
FROM TB_MODON MD                              -- 소량 (농장별 수백~수천 건)
LEFT OUTER JOIN (
    SELECT /*+ INDEX(TB_MODON_WK IX_TB_MODON_WK_01) */
           DISTINCT FARM_NO, PIG_NO
    FROM TB_MODON_WK
    WHERE FARM_NO = :farm_no
      AND USE_YN = 'Y'
) WK ON WK.FARM_NO = MD.FARM_NO AND WK.PIG_NO = MD.PIG_NO
WHERE MD.FARM_NO = :farm_no
  AND MD.OUT_DT = TO_DATE('9999-12-31', 'YYYY-MM-DD')
  AND MD.USE_YN = 'Y'
  AND WK.FARM_NO IS NULL;  -- 작업이력 없는 모돈
```

### 13.5 힌트 사용 가이드

#### 자주 사용하는 힌트

| 힌트 | 용도 | 예시 |
|------|------|------|
| `/*+ INDEX(table idx) */` | 특정 인덱스 강제 사용 | 대용량 테이블 조회 |
| `/*+ LEADING(t1 t2) */` | 조인 순서 지정 | 소량 → 대량 순서 |
| `/*+ USE_NL(t2) */` | Nested Loop 조인 | 소량 결과 예상 시 |
| `/*+ USE_HASH(t2) */` | Hash 조인 | 대량 결과 예상 시 |
| `/*+ PARALLEL(table n) */` | 병렬 처리 | 배치 작업 시 |

#### 힌트 사용 예시

```sql
-- 예시 1: 대용량 TB_MODON_WK 조회 시 인덱스 힌트
SELECT /*+ INDEX(WK IX_TB_MODON_WK_01) */
       WK.*
FROM TB_MODON_WK WK
WHERE WK.FARM_NO = :farm_no
  AND WK.USE_YN = 'Y';

-- 예시 2: 조인 순서 지정 (TB_MODON 먼저 → TB_MODON_WK)
SELECT /*+ LEADING(MD WK) USE_NL(WK) */
       MD.PIG_NO, WK.WK_DT
FROM TB_MODON MD
INNER JOIN TB_MODON_WK WK
    ON WK.FARM_NO = MD.FARM_NO AND WK.PIG_NO = MD.PIG_NO
WHERE MD.FARM_NO = :farm_no
  AND MD.STATUS_CD = '010003';

-- 예시 3: 배치 프로시저에서 병렬 처리
SELECT /*+ PARALLEL(WK 4) */
       COUNT(*)
FROM TB_MODON_WK WK
WHERE WK.FARM_NO = :farm_no;
```

### 13.6 성능 최적화 체크리스트

- [ ] 대용량 테이블 조회 시 FARM_NO 조건 필수
- [ ] OUTER JOIN 시 소량 테이블을 드라이빙 테이블로 사용
- [ ] TB_MODON_WK 조회 시 인덱스 힌트 검토
- [ ] 집계 쿼리 시 WITH 절로 대상 축소 후 처리
- [ ] 조인 순서가 비효율적이면 LEADING 힌트 사용
- [ ] 실행 계획(EXPLAIN PLAN) 확인 후 튜닝

---

## 14. 자돈 두수 관리 (TB_MODON_JADON_TRANS)

> 포유 기간 중 발생하는 자돈 증감 내역(폐사, 부분이유, 양자전입/전출)을 기록
>
> **테이블 상세**: [docs/db/ref/01.table.md](../../ref/01.table.md)

### 14.1 GUBUN_CD 코드 정의

| GUBUN_CD | 명칭 | 두수 영향 |
|----------|------|----------|
| `160001` | 포유자돈폐사 | 감소 (-) |
| `160002` | 부분이유 | 감소 (-) |
| `160003` | 양자전입 | 증가 (+) |
| `160004` | 양자전출 | 감소 (-) |

### 14.2 이유 실적 집계 시 두수 계산

| 항목 | 계산 방법 | 비고 |
|------|----------|------|
| 이유두수 | TB_EU.DUSU + TB_EU.DUSU_SU | 이유 시점 실제 두수 |
| 실산 | TB_BUNMAN.SILSAN | 분만 시 총산 |
| 포유기간 | 이유일 - 분만일 | TB_MODON_WK 날짜 차이 |
| 이유육성율 | 이유두수 / 실산 * 100 | 포유 기간 생존율 |

> **참고**: TB_MODON_JADON_TRANS는 포유 기간 중 세부 증감 내역 추적용이며,
> 이유 실적 집계 시에는 TB_EU의 최종 두수(DUSU + DUSU_SU)를 사용합니다.

---

## 변경 이력

| 버전 | 일자 | 작성자 | 내용 |
|------|------|--------|------|
```
        ROLLBACK;
        SP_INS_COM_LOG_ERROR(V_LOG_SEQ, SQLCODE, SQLERRM);
        RAISE;
```

### 11.3 COMMIT 정책

- 각 논리적 단위 완료 시 COMMIT
- EXCEPTION 발생 시 ROLLBACK 후 로그 기록

---

## 12. 체크리스트

### SQL 작성 전 확인사항

- [ ] `VM_LAST_MODON_SEQ_WK` 뷰 사용 (직접 MAX 조회 금지)
- [ ] `OUT_DT = '9999-12-31'` 조건 포함 (미도폐사 모돈)
- [ ] `USE_YN = 'Y'` 조건 포함
- [ ] `DAERI_YN = 'N'` 조건 확인 (이유 관련)
- [ ] WK_DT 비교 시 `TO_DATE(WK_DT, 'YYYY-MM-DD')` 변환
- [ ] 농장 설정값 `TC_FARM_CONFIG` 참조
- [ ] 기본값 `NVL` 처리

### 프로시저 작성 전 확인사항

- [ ] 로그 시작/종료 호출
- [ ] EXCEPTION 처리
- [ ] COMMIT/ROLLBACK 정책 준수
- [ ] 파라미터 검증

---

## 13. 운영 데이터 규모

### 13.1 주요 테이블 건수 (2025.12 기준)

| 테이블 | 건수 | 비고 |
|--------|------|------|
| `TB_MODON_WK` | **40,465,033** | 모돈 작업 이력 (최대) |
| `TB_GYOBAE` | 14,881,595 | 교배 |
| `TB_BUNMAN` | 11,485,759 | 분만 |
| `TB_EU` | 11,383,819 | 이유 |
| `TB_MODON_JADON_TRANS` | 10,000,368 | 자돈 전입 |
| `TB_MODON` | **3,317,247** | 모돈 마스터 |
| `TB_SAGO` | 2,713,315 | 임신사고 |
| `TB_WT_BCS` | 893,954 | 체중/BCS |
| `TC_FARM_CONFIG` | 597,935 | 농가설정 |
| `TB_PLAN_MODON` | 27,948 | 예정작업 |
| `TC_CODE_FARM` | 16,277 | 농장코드 |
| `TA_MEMBER` | 3,163 | 회원 |
| `TA_FARM` | 3,135 | 농장 |
| `TC_CODE_SYS` | 2,588 | 시스템코드 |

### 13.2 성능 고려사항

#### TB_MODON_WK (4천만건)
```sql
-- 금지: WK_DT 기준 MAX 조회 (동일 날짜 복수 작업 시 오류)
SELECT * FROM TB_MODON_WK
WHERE WK_DT = (SELECT MAX(WK_DT) FROM TB_MODON_WK WHERE ...)  -- 잘못된 방식

-- 권장: SEQ 기준 MAX 조회 (뷰 또는 동일 로직)
SELECT * FROM VM_LAST_MODON_SEQ_WK WHERE ...
-- 또는
WITH LAST_WK AS (
    SELECT FARM_NO, PIG_NO, MAX(SEQ) AS MSEQ
    FROM TB_MODON_WK WHERE FARM_NO = :farm_no AND USE_YN = 'Y'
    GROUP BY FARM_NO, PIG_NO
)
SELECT ... FROM LAST_WK ...
```

#### TB_MODON (350만건)
```sql
-- 권장: 농장번호 + 상태코드 조건 필수
WHERE FARM_NO = :farm_no      -- 파티션/인덱스 활용
  AND STATUS_CD = '010001'    -- 추가 필터링
  AND OUT_DT = TO_DATE('9999-12-31', 'YYYY-MM-DD')
  AND USE_YN = 'Y'
```


### 13.3 인덱스 활용

| 테이블 | 주요 인덱스 컬럼 | 용도 |
|--------|-----------------|------|
| `TB_MODON` | FARM_NO, STATUS_CD, OUT_DT | 재적 모돈 조회 |
| `TB_MODON_WK` | FARM_NO, PIG_NO, WK_DT | 작업 이력 조회 |
| `TB_GYOBAE` | FARM_NO, PIG_NO, WK_DT | 교배 이력 |
| `TB_BUNMAN` | FARM_NO, PIG_NO, WK_DT | 분만 이력 |

### 13.4 OUTER JOIN 최적화

> **원칙**: 데이터 건수가 적은 테이블을 드라이빙 테이블로 사용

```sql
-- 권장: 소량 테이블(TB_MODON) 기준으로 대량 테이블(TB_MODON_WK) OUTER JOIN
SELECT MD.*, WK.WK_DT
FROM TB_MODON MD                              -- 소량 (농장별 수백~수천 건)
LEFT OUTER JOIN (
    SELECT /*+ INDEX(TB_MODON_WK IX_TB_MODON_WK_01) */
           DISTINCT FARM_NO, PIG_NO
    FROM TB_MODON_WK
    WHERE FARM_NO = :farm_no
      AND USE_YN = 'Y'
) WK ON WK.FARM_NO = MD.FARM_NO AND WK.PIG_NO = MD.PIG_NO
WHERE MD.FARM_NO = :farm_no
  AND MD.OUT_DT = TO_DATE('9999-12-31', 'YYYY-MM-DD')
  AND MD.USE_YN = 'Y'
  AND WK.FARM_NO IS NULL;  -- 작업이력 없는 모돈
```

### 13.5 힌트 사용 가이드

#### 자주 사용하는 힌트

| 힌트 | 용도 | 예시 |
|------|------|------|
| `/*+ INDEX(table idx) */` | 특정 인덱스 강제 사용 | 대용량 테이블 조회 |
| `/*+ LEADING(t1 t2) */` | 조인 순서 지정 | 소량 → 대량 순서 |
| `/*+ USE_NL(t2) */` | Nested Loop 조인 | 소량 결과 예상 시 |
| `/*+ USE_HASH(t2) */` | Hash 조인 | 대량 결과 예상 시 |
| `/*+ PARALLEL(table n) */` | 병렬 처리 | 배치 작업 시 |

#### 힌트 사용 예시

```sql
-- 예시 1: 대용량 TB_MODON_WK 조회 시 인덱스 힌트
SELECT /*+ INDEX(WK IX_TB_MODON_WK_01) */
       WK.*
FROM TB_MODON_WK WK
WHERE WK.FARM_NO = :farm_no
  AND WK.USE_YN = 'Y';

-- 예시 2: 조인 순서 지정 (TB_MODON 먼저 → TB_MODON_WK)
SELECT /*+ LEADING(MD WK) USE_NL(WK) */
       MD.PIG_NO, WK.WK_DT
FROM TB_MODON MD
INNER JOIN TB_MODON_WK WK
    ON WK.FARM_NO = MD.FARM_NO AND WK.PIG_NO = MD.PIG_NO
WHERE MD.FARM_NO = :farm_no
  AND MD.STATUS_CD = '010003';

-- 예시 3: 배치 프로시저에서 병렬 처리
SELECT /*+ PARALLEL(WK 4) */
       COUNT(*)
FROM TB_MODON_WK WK
WHERE WK.FARM_NO = :farm_no;
```

### 13.6 성능 최적화 체크리스트

- [ ] 대용량 테이블 조회 시 FARM_NO 조건 필수
- [ ] OUTER JOIN 시 소량 테이블을 드라이빙 테이블로 사용
- [ ] TB_MODON_WK 조회 시 인덱스 힌트 검토
- [ ] 집계 쿼리 시 WITH 절로 대상 축소 후 처리
- [ ] 조인 순서가 비효율적이면 LEADING 힌트 사용
- [ ] 실행 계획(EXPLAIN PLAN) 확인 후 튜닝

---

## 14. 자돈 두수 관리 (TB_MODON_JADON_TRANS)

> 포유 기간 중 발생하는 자돈 증감 내역(폐사, 부분이유, 양자전입/전출)을 기록
>
> **테이블 상세**: [docs/db/ref/01.table.md](../../ref/01.table.md)

### 14.1 GUBUN_CD 코드 정의

| GUBUN_CD | 명칭 | 두수 영향 |
|----------|------|----------|
| `160001` | 포유자돈폐사 | 감소 (-) |
| `160002` | 부분이유 | 감소 (-) |
| `160003` | 양자전입 | 증가 (+) |
| `160004` | 양자전출 | 감소 (-) |

### 14.2 이유 실적 집계 시 두수 계산

| 항목 | 계산 방법 | 비고 |
|------|----------|------|
| 이유두수 | TB_EU.DUSU + TB_EU.DUSU_SU | 이유 시점 실제 두수 |
| 실산 | TB_BUNMAN.SILSAN | 분만 시 총산 |
| 포유기간 | 이유일 - 분만일 | TB_MODON_WK 날짜 차이 |
| 이유육성율 | 이유두수 / 실산 * 100 | 포유 기간 생존율 |

> **참고**: TB_MODON_JADON_TRANS는 포유 기간 중 세부 증감 내역 추적용이며,
> 이유 실적 집계 시에는 TB_EU의 최종 두수(DUSU + DUSU_SU)를 사용합니다.

---

## 변경 이력

| 버전 | 일자 | 작성자 | 내용 |
|------|------|--------|------|
| 1.0 | 2025-12-09 | - | 최초 작성 |
| 1.1 | 2025-12-15 | - | 7. 관리대상 모돈 추출 로직 상세화 (후보돈 판별 기준 추가) |
| 1.2 | 2025-12-16 | - | 14. TB_MODON_JADON_TRANS 자돈 두수 관리 테이블 정의 추가 |
---

## 13. 운영 데이터 규모 및 인덱스 현황

SQL 작성 및 튜닝 시 아래 데이터 규모와 인덱스 구성을 고려하여 최적의 쿼리를 작성해야 합니다.

### 13.1 주요 테이블 건수 (2025-12-18 기준)

| 테이블명 | 건수 | 비고 |
|----------|------|------|
| **TA_FARM** | 3,137 | 농장 마스터 |
| **TB_MODON** | 3,318,516 | 모돈 마스터 |
| **TB_MODON_WK** | 40,495,449 | **대용량** (작업 이력) |
| **TB_GYOBAE** | 14,892,455 | 교배 기록 |
| **TB_BUNMAN** | 11,494,542 | 분만 기록 |
| **TB_EU** | 11,392,475 | **대용량** (이유 기록) |
| **TB_SAGO** | 2,715,432 | 사고 기록 |
| **TM_LPD_DATA** | 10,352,012 | **대용량** (도축 데이터) |
| **TM_SISAE_DETAIL** | 27,201 | 시세 상세 |
| **TS_INS_WEEK** | 30 | 리포트 요약 |
| **TS_INS_WEEK_SUB** | 3,861 | 리포트 상세 |

### 13.2 주요 테이블 인덱스 현황

| 테이블명 | 인덱스명 | 구성 컬럼 (순서 중요) | 유형 |
|----------|----------|-----------------------|------|
| **TB_MODON_WK** | IDX_TB_MODON_WK_03 | FARM_NO, PIG_NO, **WK_DATE**, WK_GUBUN | UNIQUE |
| | IDX_TB_MODON_WK | FARM_NO, PIG_NO, WK_DT, WK_GUBUN | UNIQUE |
| **TM_LPD_DATA** | IDX_TM_LPD_DATA_00 | **FARM_NO, DOCHUK_DT**, DOCHUK_NO, FACTORY_CD | UNIQUE |
| **TB_MODON** | IDX_TB_MODON | FARM_NO, PIG_NO | UNIQUE |
| | IDX_TB_MODON_01 | FARM_NO, FARM_PIG_NO, **OUT_DT DESC**, USE_YN | FUNCTION-BASED |
| **TB_EU** | IDX_TB_EU | FARM_NO, PIG_NO, WK_DT, WK_GUBUN | UNIQUE |
| **TB_BUNMAN** | IDX_TB_BUNMAN | FARM_NO, PIG_NO, WK_DT, WK_GUBUN | UNIQUE |
| | IDX_TB_BUNMAN_01 | FARM_NO, WK_DT, WK_GUBUN, USE_YN | NONUNIQUE |

### 13.3 튜닝 지침
1. **인덱스 선두 컬럼 활용**: 모든 대용량 테이블 조회 시 `FARM_NO`를 반드시 조건절 최상단에 배치합니다.
2. **데이터 타입 매칭**: `WK_DATE`는 DATE 타입, `WK_DT` 및 `DOCHUK_DT`는 문자열 타입임에 주의하여 비교 연산자를 사용합니다.
3. **복합 인덱스 순서 고려**: `TM_LPD_DATA` 조회 시 `FARM_NO`와 `DOCHUK_DT`를 함께 조건으로 주면 `IDX_TM_LPD_DATA_00`을 효율적으로 탈 수 있습니다.
4. **일괄 집계 방식**: 루프 내 반복 조회 대신 `GROUP BY`를 통한 일괄 처리를 지향합니다.
```
