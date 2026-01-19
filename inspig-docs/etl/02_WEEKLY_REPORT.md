# 주간 리포트 (Weekly Report)

DAY_GB: `WEEK`

## 1. 개요

주간 리포트는 매주 월요일 새벽 2시에 실행되어 지난주(월~일)의 농장 생산 데이터를 집계합니다.

### 1.1 실행 주기
- **스케줄**: 매주 월요일 02:00
- **대상 기간**: 지난주 월요일 ~ 일요일
- **대상 농장**: TS_INS_SERVICE 조건 충족 농장 (상세: 2장 참조)

### 1.2 날짜 계산 예시 (2025-12-22 월요일 실행 시)
```
지난주 (리포트 대상): 2025-12-15(월) ~ 2025-12-21(일)
금주 (예정 작업):      2025-12-22(월) ~ 2025-12-28(일)
```


## 2. 대상 농가 추출 프로세스

### 2.1 추출 조건 (TS_INS_SERVICE)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          대상 농가 추출 프로세스                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                      TS_INS_SERVICE 테이블 조건                            │ │
│  ├───────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                           │ │
│  │  1. INSPIG_YN = 'Y'         → 인사이트피그 서비스 사용 여부                  │ │
│  │  2. USE_YN = 'Y'            → 서비스 레코드 활성화 여부                      │ │
│  │                                                                           │ │
│  │  3. 서비스 기간 체크:                                                       │ │
│  │     ┌─────────────────────────────────────────────────────────────────┐   │ │
│  │     │  INSPIG_FROM_DT  <=  SYSDATE  <=  유효종료일                     │   │ │
│  │     │                                                                 │   │ │
│  │     │  유효종료일 = LEAST(INSPIG_TO_DT, INSPIG_STOP_DT)               │   │ │
│  │     │                                                                 │   │ │
│  │     │  ※ NULL 처리:                                                   │   │ │
│  │     │     - INSPIG_FROM_DT NULL → ❌ 제외 (시작일 필수)                │   │ │
│  │     │     - INSPIG_TO_DT NULL   → ❌ 제외 (종료일 필수)                │   │ │
│  │     │     - INSPIG_STOP_DT NULL → '99991231' (중지 안됨)               │   │ │
│  │     └─────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                           │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                      TA_FARM 테이블 조건 (JOIN)                            │ │
│  ├───────────────────────────────────────────────────────────────────────────┤ │
│  │  USE_YN = 'Y'               → 농장 사용 여부                               │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 조건별 상세 설명

| 조건 | 컬럼 | 설명 |
|------|------|------|
| 서비스 사용 | `INSPIG_YN = 'Y'` | 인사이트피그 서비스 신청 여부 |
| 레코드 활성 | `USE_YN = 'Y'` | 서비스 레코드 활성화 상태 |
| 시작일 필수 | `INSPIG_FROM_DT IS NOT NULL` | 시작일 없으면 제외 |
| 종료일 필수 | `INSPIG_TO_DT IS NOT NULL` | 종료일 없으면 제외 |
| 시작일 체크 | `SYSDATE >= INSPIG_FROM_DT` | 서비스 시작일 이후여야 함 |
| 종료일 체크 | `SYSDATE <= INSPIG_TO_DT` | 서비스 종료일 이전이어야 함 |
| 중지일 체크 | `SYSDATE <= INSPIG_STOP_DT` | 서비스 중지일 이전이어야 함 (NULL이면 중지 안됨) |

### 2.3 실행 모드별 농가 추출

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          실행 모드별 농가 추출 흐름                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  [1] 정규 스케줄 실행 (Cron: 매주 월요일 02:00)                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  python run_etl.py weekly                                               │    │
│  │         │                                                               │    │
│  │         ▼                                                               │    │
│  │  ┌──────────────────────────────────────────────┐                       │    │
│  │  │ _get_target_farms(farm_list=None)            │                       │    │
│  │  │                                              │                       │    │
│  │  │ → TS_INS_SERVICE 전체 조건 체크               │                       │    │
│  │  │ → 조건 충족하는 모든 농장 반환                 │                       │    │
│  │  └──────────────────────────────────────────────┘                       │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  [2] 테스트 모드 실행 (--test)                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  python run_etl.py weekly --test                                        │    │
│  │         │                                                               │    │
│  │         ▼                                                               │    │
│  │  ┌──────────────────────────────────────────────┐                       │    │
│  │  │ _get_target_farms(farm_list=TEST_FARM_LIST)  │                       │    │
│  │  │                                              │                       │    │
│  │  │ → TEST_FARM_LIST = '1387,2807,4448,1456,...' │                       │    │
│  │  │ → TS_INS_SERVICE 조건 체크 + FARM_NO 필터     │                       │    │
│  │  │ → 테스트 농장 중 조건 충족하는 농장만 반환     │                       │    │
│  │  └──────────────────────────────────────────────┘                       │    │
│  │                                                                         │    │
│  │  ※ test_mode=True, init_delete=True → 기존 데이터 전체 삭제 후 생성      │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  [3] 날짜 범위 지정 실행 (--date-from, --date-to)                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  python run_etl.py --date-from 2025-11-10 --date-to 2025-12-22          │    │
│  │         │                                                               │    │
│  │         ▼                                                               │    │
│  │  ┌──────────────────────────────────────────────┐                       │    │
│  │  │ 날짜 범위 내 각 주(월요일)마다 반복 실행:      │                       │    │
│  │  │   2025-11-10 → 45주차 생성                   │                       │    │
│  │  │   2025-11-17 → 46주차 생성                   │                       │    │
│  │  │   ...                                        │                       │    │
│  │  │   2025-12-22 → 51주차 생성                   │                       │    │
│  │  │                                              │                       │    │
│  │  │ ※ 각 주마다 _get_target_farms() 호출         │                       │    │
│  │  │ ※ 농장 조건은 ETL 실행일(SYSDATE) 기준 체크   │                       │    │
│  │  └──────────────────────────────────────────────┘                       │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  [4] 단일 농장 수동 실행 (--manual --farm-no)                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  python run_etl.py --manual --farm-no 2807                              │    │
│  │         │                                                               │    │
│  │         ▼                                                               │    │
│  │  ┌──────────────────────────────────────────────┐                       │    │
│  │  │ run_single_farm(farm_no=2807)                │                       │    │
│  │  │                                              │                       │    │
│  │  │ → TA_FARM에서 직접 조회 (TS_INS_SERVICE 무시) │                       │    │
│  │  │ → 서비스 가입 여부와 무관하게 강제 생성        │                       │    │
│  │  └──────────────────────────────────────────────┘                       │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 대상 농가 추출 SQL

```sql
-- orchestrator.py _get_target_farms()
SELECT DISTINCT F.FARM_NO, F.FARM_NM, F.PRINCIPAL_NM, F.SIGUN_CD,
       NVL(F.COUNTRY_CODE, 'KOR') AS LOCALE
FROM TA_FARM F
INNER JOIN TS_INS_SERVICE S ON F.FARM_NO = S.FARM_NO
WHERE F.USE_YN = 'Y'
  AND S.INSPIG_YN = 'Y'
  AND S.USE_YN = 'Y'
  AND S.INSPIG_FROM_DT IS NOT NULL          -- 시작일 필수
  AND S.INSPIG_TO_DT IS NOT NULL            -- 종료일 필수
  AND TO_CHAR(SYSDATE, 'YYYYMMDD') >= S.INSPIG_FROM_DT
  AND TO_CHAR(SYSDATE, 'YYYYMMDD') <= LEAST(
      S.INSPIG_TO_DT,
      NVL(S.INSPIG_STOP_DT, '99991231')     -- 중지일 NULL이면 중지 안됨
  )
ORDER BY F.FARM_NO
```

### 2.5 서비스 기간 예시

```
시나리오 1: 정상 서비스 기간 내
┌──────────────────────────────────────────────────────────────────┐
│ INSPIG_FROM_DT = 20250101                                        │
│ INSPIG_TO_DT   = 20251231                                        │
│ INSPIG_STOP_DT = NULL (99991231)                                 │
│                                                                  │
│ 실행일 2025-06-15:                                                │
│   20250101 <= 20250615 <= 20251231  → ✅ 대상                    │
└──────────────────────────────────────────────────────────────────┘

시나리오 2: 서비스 시작 전
┌──────────────────────────────────────────────────────────────────┐
│ INSPIG_FROM_DT = 20250701                                        │
│ INSPIG_TO_DT   = 20251231                                        │
│                                                                  │
│ 실행일 2025-06-15:                                                │
│   20250615 < 20250701  → ❌ 제외 (시작일 이전)                    │
└──────────────────────────────────────────────────────────────────┘

시나리오 3: 서비스 종료 후
┌──────────────────────────────────────────────────────────────────┐
│ INSPIG_FROM_DT = 20240101                                        │
│ INSPIG_TO_DT   = 20241231                                        │
│                                                                  │
│ 실행일 2025-06-15:                                                │
│   20250615 > 20241231  → ❌ 제외 (종료일 이후)                    │
└──────────────────────────────────────────────────────────────────┘

시나리오 4: 서비스 중지 (STOP_DT < TO_DT)
┌──────────────────────────────────────────────────────────────────┐
│ INSPIG_FROM_DT = 20250101                                        │
│ INSPIG_TO_DT   = 20251231                                        │
│ INSPIG_STOP_DT = 20250601  ← 6월 1일에 중지됨                     │
│                                                                  │
│ 실행일 2025-06-15:                                                │
│   LEAST(20251231, 20250601) = 20250601                           │
│   20250615 > 20250601  → ❌ 제외 (중지일 이후)                    │
└──────────────────────────────────────────────────────────────────┘

시나리오 5: 시작일/종료일 NULL (미가입)
┌──────────────────────────────────────────────────────────────────┐
│ INSPIG_FROM_DT = NULL                                            │
│ INSPIG_TO_DT   = NULL                                            │
│                                                                  │
│ → ❌ 제외 (시작일/종료일 필수)                                     │
│                                                                  │
│ ※ INSPIG_YN = 'Y'라도 FROM_DT, TO_DT가 없으면 서비스 미가입 상태   │
└──────────────────────────────────────────────────────────────────┘
```


## 3. 실행 흐름

```
run_etl.py weekly
       │
       ▼
WeeklyReportOrchestrator.run()
       │
       ├──▶ Step 1: 외부 데이터 수집 (병렬 처리)
       │         ├── ProductivityCollector (생산성 API)
       │         │     └── get_service_farm_nos() ← 공통 농장 조회
       │         │
       │         └── WeatherCollector (기상청 API)
       │
       └──▶ Step 2: 주간 리포트 생성
              │
              ├── 전국 탕박 평균 단가 계산
              ├── TS_INS_MASTER 생성(주차정보)
              ├── get_service_farms() ← 공통 농장 조회
              │
              └── 농장별 병렬 처리 (ThreadPoolExecutor)
                     │
                     └──▶ FarmProcessor.process()
                            │
                            ├── FarmDataLoader.load() (데이터 1회 로드)
                            │
                            └── 프로세서 순차 실행 (10개)
                                 ├── 1. ConfigProcessor    (설정값)
                                 ├── 2. AlertProcessor     (관리대상)
                                 ├── 3. ModonProcessor     (모돈현황)
                                 ├── 4. MatingProcessor    (교배)
                                 ├── 5. FarrowingProcessor (분만)
                                 ├── 6. WeaningProcessor   (이유)
                                 ├── 7. AccidentProcessor  (임신사고)
                                 ├── 8. CullingProcessor   (도태폐사)
                                 ├── 9. ShipmentProcessor  (출하)
                                 └── 10. ScheduleProcessor (금주예정)

※ 농장 목록 조회 SQL은 src/common/farm_service.py에서 중앙 관리
```


## 3. 프로세서 상세

### 3.1 프로세서 목록

| # | 프로세서 | GUBUN | 설명 | Oracle 원본 |
|---|----------|-------|------|-------------|
| 1 | ConfigProcessor | CONFIG | 농장 설정값 | SP_INS_WEEK_CONFIG |
| 2 | AlertProcessor | MANAGE | 관리대상 모돈 | SP_INS_WEEK_MANAGE_SOW |
| 3 | ModonProcessor | MODON | 모돈현황 통계 | SP_INS_WEEK_MODON |
| 4 | MatingProcessor | MATING | 교배 현황 | SP_INS_WEEK_MATING |
| 5 | FarrowingProcessor | BUN | 분만 현황 | SP_INS_WEEK_BUN |
| 6 | WeaningProcessor | EU | 이유 현황 | SP_INS_WEEK_EU |
| 7 | AccidentProcessor | SAGO | 임신사고 현황 | SP_INS_WEEK_SAGO |
| 8 | CullingProcessor | DOPE | 도태/폐사 현황 | SP_INS_WEEK_DOPE |
| 9 | ShipmentProcessor | SHIP | 출하 현황 | SP_INS_WEEK_SHIP |
| 10 | ScheduleProcessor | SCHEDULE | 금주 예정 작업 | SP_INS_WEEK_SCHEDULE |

### 3.2 GUBUN/SUB_GUBUN 구조

| GUBUN | SUB_GUBUN | 설명 |
|-------|-----------|------|
| CONFIG | CONFIG | 농장 설정값 |
| MANAGE | LIMIT_LIST | 관리대상 모돈 목록 |
| MANAGE | ETC_LIST | 관리대상 기타 목록 |
| MODON | MODON_STAT | 모돈현황 통계 |
| MATING | GB_LIST | 교배 목록 |
| MATING | GB_STAT | 교배 통계 |
| BUN | BM_LIST | 분만 목록 |
| BUN | BM_STAT | 분만 통계 |
| EU | EU_LIST | 이유 목록 |
| EU | EU_STAT | 이유 통계 |
| SAGO | SAGO_LIST | 임신사고 목록 |
| SAGO | SAGO_STAT | 임신사고 통계 |
| DOPE | DOPE_LIST | 도태폐사 목록 |
| DOPE | DOPE_STAT | 도태폐사 통계 |
| SHIP | SHIP_LIST | 출하 목록 |
| SHIP | SHIP_STAT | 출하 통계 |
| SCHEDULE | GB | 분만예정 팝업 |
| SCHEDULE | BM | 발정재귀 팝업 |
| SCHEDULE | EU | 이유예정 팝업 |
| SCHEDULE | VACCINE | 백신예정 팝업 |
| SCHEDULE | HELP | 도움말 정보 |


## 4. 기술 구현

### 4.1 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│                      FarmProcessor                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. FarmDataLoader.load()                                       │
│     └── Oracle DB에서 모든 원시 데이터 1회 로드                   │
│         ├── 모돈 정보 (TA_MODON)                                 │
│         ├── 작업 이력 (TB_WORK_MODON)                            │
│         ├── 분만 정보 (TB_BUN_MODON)                             │
│         ├── 폐사/사고 정보 (TB_DEAD_MODON)                       │
│         └── 기타 참조 테이블                                     │
│                                                                 │
│  2. 프로세서 순차 실행                                           │
│     └── 각 프로세서는 로드된 데이터를 Python으로 가공             │
│         ├── filter_by_period()                                  │
│         ├── group_by()                                          │
│         ├── sum_field(), count()                                │
│         └── pivot_data()                                        │
│                                                                 │
│  3. 결과 저장                                                    │
│     └── TS_INS_WEEK, TS_INS_WEEK_SUB INSERT/UPDATE              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 병렬 처리 구조

```
Level 1: 농장별 병렬 (ThreadPoolExecutor)
         max_farm_workers = 4
         │
         ├── Farm A ──┬── Processor 1~10
         │
         ├── Farm B ──┬── Processor 1~10
         │
         └── Farm C ──┬── ...
```

### 4.3 BaseProcessor 주요 메서드

#### 데이터 조회/저장

| 메서드 | 설명 |
|--------|------|
| `fetch_all(sql, params)` | SELECT 결과를 튜플 리스트로 반환 |
| `fetch_dict(sql, params)` | SELECT 결과를 딕셔너리 리스트로 반환 |
| `execute(sql, params)` | INSERT/UPDATE/DELETE 실행 |
| `save_sub(sub_type, data)` | TS_INS_WEEK_SUB 저장 |
| `update_week(updates)` | TS_INS_WEEK 업데이트 |

#### Python 데이터 가공

| 메서드 | 설명 |
|--------|------|
| `filter_by_period(data, date_field, dt_from, dt_to)` | 기간 필터링 |
| `filter_by_code(data, code_field, code_value)` | 코드값 필터링 |
| `group_by(data, key_field)` | 단일 필드 그룹핑 |
| `count(data)` / `sum_field(data, field)` | 집계 |
| `pivot_data(data, row_key, col_key, value_field, agg)` | 피벗 변환 |


## 5. 프로세서별 특이사항

### 5.1 WeaningProcessor (이유)

#### DAERI_YN 분기 처리
대리모돈 자돈 증감 계산 시 **ETL 수행일(SYSDATE)이 아닌 dt_to(지난주 일요일)** 기준 사용

```sql
AND JT.WK_DT <= CASE
    WHEN NW.NEXT_WK_GUBUN = 'G' THEN NW.NEXT_WK_DT
    WHEN NW.NEXT_WK_DT IS NULL AND A.DAERI_YN = 'N' THEN :dt_to  -- 여기!
    ELSE TO_CHAR(TO_DATE(A.WK_DT, 'YYYYMMDD') - 1, 'YYYYMMDD')
END
```

### 5.2 ScheduleProcessor (금주 예정)

#### 5.2.1 산정방식 분기 처리 (TS_INS_CONF)

금주 작업예정은 **농장기본값** 또는 **모돈작업설정** 두 가지 방식으로 산정할 수 있습니다.
농장별로 TS_INS_CONF 테이블에 설정된 값에 따라 분기 처리됩니다.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    금주 작업예정 산정방식 분기 처리 흐름                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  [1] TS_INS_CONF 설정 조회                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ WEEK_TW_GY: {"method":"farm"}           ← 교배예정                       │    │
│  │ WEEK_TW_BM: {"method":"modon","tasks":[1,2]}  ← 분만예정                 │    │
│  │ WEEK_TW_IM: {"method":"farm"}           ← 임신감정                       │    │
│  │ WEEK_TW_EU: {"method":"modon","tasks":[3]}    ← 이유예정                 │    │
│  │ WEEK_TW_VC: {"method":"modon","tasks":[]}     ← 백신예정                 │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                              │                                                  │
│                              ▼                                                  │
│  [2] 예정 유형별 분기 처리                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                                                                         │    │
│  │   ┌──────────────┐                    ┌──────────────┐                  │    │
│  │   │ method=farm  │                    │ method=modon │                  │    │
│  │   │ (농장기본값)  │                    │ (모돈작업설정) │                  │    │
│  │   └──────┬───────┘                    └──────┬───────┘                  │    │
│  │          │                                   │                          │    │
│  │          ▼                                   ▼                          │    │
│  │   TC_FARM_CONFIG에서                  FN_MD_SCHEDULE_BSE_2020            │    │
│  │   기간값 조회 후 계산                  Oracle Function 호출               │    │
│  │                                                                         │    │
│  │   ┌─────────────────────────┐       ┌─────────────────────────┐        │    │
│  │   │ 901001: 평균임신기간     │       │ TB_PLAN_MODON 기준       │        │    │
│  │   │ 901002: 평균포유기간     │       │ tasks=[1,2,3] 필터       │        │    │
│  │   │ 901003: 평균재귀일       │       │                         │        │    │
│  │   │ 901007: 초교배일령       │       │ seq_filter='1,2,3'       │        │    │
│  │   └─────────────────────────┘       └─────────────────────────┘        │    │
│  │                                                                         │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                              │                                                  │
│                              ▼                                                  │
│  [3] 데이터 저장 (TS_INS_WEEK_SUB)                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ SUB_GUBUN='-'     : 요약 카운트                                          │    │
│  │ SUB_GUBUN='CAL'   : 캘린더 데이터 (요일별 카운트)                          │    │
│  │ SUB_GUBUN='GB'    : 교배예정 팝업 (모돈작업설정일 때만)                     │    │
│  │ SUB_GUBUN='BM'    : 분만예정 팝업 (모돈작업설정일 때만)                     │    │
│  │ SUB_GUBUN='EU'    : 이유예정 팝업 (모돈작업설정일 때만)                     │    │
│  │ SUB_GUBUN='IMSIN' : 임신감정 팝업 (모돈작업설정일 때만)                     │    │
│  │ SUB_GUBUN='VACCINE': 백신예정 팝업 (항상 모돈작업설정)                      │    │
│  │ SUB_GUBUN='METHOD': 산정방식 정보 (farm/modon)                            │    │
│  │ SUB_GUBUN='HELP'  : 도움말 정보                                           │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### 5.2.2 예정 유형별 산정 기준

| 예정 유형 | 농장기본값 (method=farm) | 모돈작업설정 (method=modon) |
|----------|------------------------|---------------------------|
| **교배예정** | 이유일 + 평균재귀일(901003) / 생년월일 + 초교배일령(901007) | FN_MD_SCHEDULE_BSE_2020('150005') |
| **분만예정** | 교배일 + 평균임신기간(901001) | FN_MD_SCHEDULE_BSE_2020('150002') |
| **임신감정** | 교배일 + 21일(3주) / 28일(4주) 고정 | FN_MD_SCHEDULE_BSE_2020('150001') |
| **이유예정** | 분만일 + 평균포유기간(901002) | FN_MD_SCHEDULE_BSE_2020('150003') |
| **백신예정** | - (항상 modon) | FN_MD_SCHEDULE_BSE_2020('150004') |

#### 5.2.3 SUB_GUBUN='METHOD' 저장 구조

웹에서 산정방식에 따른 화면 분기 처리를 위해 각 예정별 method 정보를 저장합니다.

```sql
-- TS_INS_WEEK_SUB (GUBUN='SCHEDULE', SUB_GUBUN='METHOD')
INSERT INTO TS_INS_WEEK_SUB (
    MASTER_SEQ, FARM_NO, GUBUN, SUB_GUBUN, SORT_NO,
    STR_1,      -- 교배예정 method (farm/modon)
    STR_2,      -- 분만예정 method (farm/modon)
    STR_3,      -- 임신감정 method (farm/modon)
    STR_4,      -- 이유예정 method (farm/modon)
    STR_5       -- 백신예정 method (farm/modon)
) VALUES (:master_seq, :farm_no, 'SCHEDULE', 'METHOD', 1, ...);
```

#### 5.2.4 캘린더 데이터 분기 (SUB_GUBUN='CAL')

임신감정은 산정방식에 따라 캘린더 표시가 달라집니다:

| 산정방식 | 캘린더 CODE_1 | 설명 |
|----------|--------------|------|
| 농장기본값 | IMSIN_3W, IMSIN_4W | 3주(21일), 4주(28일) 별도 표시 |
| 모돈작업설정 | IMSIN | 통합 표시 (TB_PLAN_MODON 기준) |

#### 5.2.5 팝업 상세 분기 (SUB_GUBUN='GB/BM/EU/IMSIN')

**농장기본값**일 때는 TB_PLAN_MODON 기반이 아니므로 팝업 상세 데이터를 생성하지 않습니다.

```
산정방식 = farm → 팝업 상세 생략 (팝업 클릭 시 "농장기본값 기준" 메시지 표시)
산정방식 = modon → 팝업 상세 INSERT (작업명별 그룹화)
```

#### 5.2.6 팝업 종류별 처리
```python
# GB, BM, EU는 공통 메서드
popup_configs = [
    ('GB', '150005'),   # 교배예정
    ('BM', '150002'),   # 분만예정
    ('EU', '150003'),   # 이유예정
]

for sub_gubun, job_gubun_cd in popup_configs:
    # method='farm'이면 팝업 상세 생략
    if conf['method'] == 'farm':
        continue
    self._insert_popup_by_job(sub_gubun, job_gubun_cd, ...)

# 임신감정(IMSIN): 모돈작업설정일 때만 팝업 상세 INSERT
if ins_conf['pregnancy']['method'] == 'modon':
    self._insert_popup_by_job('IMSIN', '150001', ...)

# VACCINE은 ARTICLE_NM(백신명) 포함으로 별도 처리
self._insert_vaccine_popup(...)
```

#### 5.2.7 HELP 정보 표시 예시 (btn-schedule-help 클릭 시)

HELP 데이터는 `SUB_GUBUN='HELP'`에 저장되며, 웹에서 도움말 버튼 클릭 시 표시됩니다.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         금주 작업예정 도움말                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ※ 산정방식                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ • 교배예정: 농장기본값                                                    │    │
│  │ • 분만예정: 모돈작업(2개) - 분만대기(115일), 분만임박(113일)               │    │
│  │ • 임신감정: 농장기본값 - 교배후 3주(21일), 4주(28일) 대상모돈              │    │
│  │ • 이유예정: 모돈작업(1개) - 이유예정(25일)                                 │    │
│  │ • 백신예정: 모돈작업(3개) - 백신A(7일), 백신B(14일), 백신C(21일)           │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  ※ 출하예정 계산                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ • 육성율: 92% (2024-01 ~ 2024-12 평균, 기본 90%)                         │    │
│  │ • 공식: 155일전 이유두수 × 육성율                                         │    │
│  │   - 기준출하일령(180일) - 평균포유기간(25일) = 155일                       │    │
│  │ • 이유기간: 2024-07-22 ~ 2024-07-28                                      │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**HELP 데이터 저장 컬럼 (TS_INS_WEEK_SUB, SUB_GUBUN='HELP')**

| 컬럼 | 내용 | 예시 |
|------|------|------|
| STR_1 | 교배예정 작업 목록 | `'농장기본값'` 또는 `'분만대기(115일),분만임박(113일)'` |
| STR_2 | 분만예정 작업 목록 | 동일 |
| STR_3 | 이유예정 작업 목록 | 동일 |
| STR_4 | 백신예정 작업 목록 | 동일 |
| STR_5 | 출하예정 계산 정보 | `'* 육성율: 92% ...'` |
| STR_6 | 임신감정 도움말 | `'(농장기본값) 교배후 3주(21일), 4주(28일) 대상모돈'` |

**산정방식별 표시 문구**

| 산정방식 | 표시 문구 예시 |
|----------|--------------|
| 농장기본값 | `'농장기본값'` |
| 모돈작업(선택없음) | `'(선택된 작업 없음)'` |
| 모돈작업(선택있음) | `'작업명A(N일),작업명B(M일)'` |

### 5.3 CullingProcessor (도태/폐사)

#### 원인별 피벗 구조
DOPE_GUBUN_CD별 CNT를 피벗하여 저장
- 결과: CNT_1(050011), CNT_2(050012), ... CNT_10(050020)


## 6. Oracle Function 연동

### FN_MD_SCHEDULE_BSE_2020 호출
```python
sql = """
SELECT WK_NM, PIG_NO, MODON_STATUS_CD, PASS_DAY, PASS_DT
FROM TABLE(FN_MD_SCHEDULE_BSE_2020(
    :farm_no, 'JOB-DAJANG', '150004', NULL,
    :v_sdt, :v_edt, NULL, 'ko', 'yyyy-MM-dd', '-1', NULL
))
"""
result = self.fetch_dict(sql, {...})
```


## 7. 에러 처리

### 농장별 에러 격리
```python
class FarmProcessor:
    def process(self, ...):
        try:
            # 처리 로직
            self._update_status('COMPLETE')
        except Exception as e:
            # 해당 농장만 ERROR 상태로 기록
            self._update_status('ERROR')
            self._log_error(str(e))
            return {'status': 'error', 'error': str(e)}
```

### 에러 로그 테이블 (TS_INS_JOB_LOG)
```sql
INSERT INTO TS_INS_JOB_LOG (
    SEQ, MASTER_SEQ, FARM_NO, JOB_NM, PROC_NM,
    STATUS_CD, ERROR_MSG, LOG_INS_DT
) VALUES (
    SEQ_TS_INS_JOB_LOG.NEXTVAL, :master_seq, :farm_no,
    'PYTHON_ETL', 'FarmProcessor',
    'ERROR', :error_msg, SYSDATE
)
```


## 8. Oracle → Python 전환 매핑

| Oracle Procedure | Python Class | 상태 |
|------------------|--------------|------|
| SP_INS_WEEK_MAIN | WeeklyReportOrchestrator | 완료 |
| SP_INS_WEEK_FARM_PROCESS | FarmProcessor | 완료 |
| SP_INS_WEEK_CONFIG | ConfigProcessor | 완료 |
| SP_INS_WEEK_MANAGE_SOW | AlertProcessor | 완료 |
| SP_INS_WEEK_MODON | ModonProcessor | 완료 |
| SP_INS_WEEK_MATING | MatingProcessor | 완료 |
| SP_INS_WEEK_BUN | FarrowingProcessor | 완료 |
| SP_INS_WEEK_EU | WeaningProcessor | 완료 |
| SP_INS_WEEK_SAGO | AccidentProcessor | 완료 |
| SP_INS_WEEK_DOPE | CullingProcessor | 완료 |
| SP_INS_WEEK_SHIP | ShipmentProcessor | 완료 |
| SP_INS_WEEK_SCHEDULE | ScheduleProcessor | 완료 |


## 9. API 응답 필드

### 9.1 ETL 실행 응답 (POST /api/run-farm)

```json
{
    "status": "success",
    "farmNo": 2807,
    "dayGb": "WEEK",
    "masterSeq": 123,
    "shareToken": "abc123...",
    "year": 2025,
    "weekNo": 52,
    "insDate": "20251229",
    "dtFrom": "20251222",
    "dtTo": "20251228"
}
```

### 9.2 masterSeq 필드 설명

| 필드 | 설명 |
|------|------|
| `masterSeq` | TS_INS_MASTER.SEQ (PK) |

**masterSeq가 필요한 이유:**
- 동일 농장/년도/주차에 리포트가 재생성될 수 있음
- 예: 데이터 오류로 TS_INS_* 테이블 삭제 후 재생성
- 정확한 리포트 식별을 위해 PK(masterSeq) 사용

**masterSeq 사용처:**
- SMS/알림톡 발송 시 필수 파라미터
- `selectInsWeeklyReportForManual(farmNo, reportYear, reportWeekNo, masterSeq)`
- masterSeq가 없으면 "마스터 시퀀스가 필요합니다." 에러 발생

### 9.3 pig3.1 연동 흐름

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           masterSeq 전달 흐름                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  [1] ETL API 서버 (inspig-etl)                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  POST /api/run-farm                                                     │    │
│  │         │                                                               │    │
│  │         ▼                                                               │    │
│  │  RunFarmResponse {                                                      │    │
│  │      status: "success",                                                 │    │
│  │      masterSeq: 123,      ← TS_INS_MASTER.SEQ 반환                       │    │
│  │      shareToken: "abc...",                                              │    │
│  │      ...                                                                │    │
│  │  }                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                              │                                                  │
│                              ▼                                                  │
│  [2] pig3.1 서버 (InsEtlApiController)                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  POST /officers/api/ins/getOrCreateWeeklyReport.json                    │    │
│  │         │                                                               │    │
│  │         ▼                                                               │    │
│  │  result.put("masterSeq", reportResult.get("masterSeq"));                │    │
│  │  result.put("shareToken", reportResult.get("shareToken"));              │    │
│  │  ...                                                                    │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                              │                                                  │
│                              ▼                                                  │
│  [3] 프론트엔드 (JSP)                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  var masterSeq = result.masterSeq;                                      │    │
│  │  var shareToken = result.shareToken;                                    │    │
│  │                                                                         │    │
│  │  // SMS 발송 시 masterSeq 전달                                           │    │
│  │  sendSms({                                                              │    │
│  │      farmNo: farmNo,                                                    │    │
│  │      masterSeq: masterSeq,       ← 필수                                  │    │
│  │      reportYear: year,                                                  │    │
│  │      reportWeekNo: weekNo,                                              │    │
│  │      toTel: phoneNumber                                                 │    │
│  │  });                                                                    │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```
