# ETL 테이블 정의

> InsightPig ETL 주간/월간/분기 리포트용 테이블

---

## 테이블 구조도

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TA_SYS_CONFIG (시스템 설정)                          │
│  - INS_SCHEDULE_YN: ETL 스케줄 실행 여부 (Y/N)                               │
│  - 전역 설정 (SEQ=1 단일 레코드)                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                       TS_INS_SERVICE (서비스 신청)                           │
│  - 농장별 인사이트피그 서비스 신청 정보 (이력 관리)                             │
│  - PK: FARM_NO + INSPIG_REG_DT (복합키 - 농장당 N건 이력)                     │
│  - INSPIG_YN='Y' 농장만 리포트 생성 대상                                      │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ FARM_NO (1:N)
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TS_INS_MASTER (리포트 마스터)                          │
│  - 주/월별 리포트 생성 배치 정보                                               │
│  - 대상 농장수, 완료 농장수, 실행 상태                                         │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ MASTER_SEQ (1:N)
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TS_INS_WEEK (주간 리포트)                             │
│  - 농장별 리포트 요약 데이터                                                  │
│  - SHARE_TOKEN: 공유 URL 토큰 (64자 SHA256)                                  │
│  - 페이지 표시용 집계 수치                                                    │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ MASTER_SEQ + FARM_NO (1:N)
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       TS_INS_WEEK_SUB (리포트 상세)                           │
│  - 각 팝업별 리스트 데이터                                                    │
│  - GUBUN: MODON/ALERT/GB/BM/EU/SG/DOPE/SHIP/SCHEDULE                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────┐     ┌───────────────────────────┐
│   TS_INS_JOB_LOG (로그)    │     │   TS_INS_ACCESS_LOG       │
│  - 프로시저 실행 로그       │     │  - 사용자 접속 로그         │
│  - MASTER_SEQ 연결         │     │  - 리포트 조회 이력         │
└───────────────────────────┘     └───────────────────────────┘

┌───────────────────────────┐     ┌───────────────────────────────────────────┐
│   TS_PSY_DELAY_HEATMAP    │     │           TM_WEATHER (일별)               │
│  - PSY/지연일 분포 히트맵   │     │  - 기상청 격자(NX, NY) 기준                 │
│  - MASTER_SEQ 연결         │     │  - 1주일 예보 + 당일 실측                   │
└───────────────────────────┘     │  - UK: NX + NY + WK_DATE                   │
                                  └──────────────────────┬────────────────────┘
                                                         │ NX + NY + WK_DATE (1:N)
┌───────────────────────────┐                            ▼
│        TA_FARM            │     ┌───────────────────────────────────────────┐
│  - WEATHER_NX, WEATHER_NY │────▶│       TM_WEATHER_HOURLY (시간별)           │
│  - 농장 좌표로 격자 변환    │     │  - 당일 시간별 상세 예보                     │
│  - N:1 관계 (다수 농장→1날씨)│     │  - UK: NX + NY + WK_DATE + WK_TIME        │
└───────────────────────────┘     └───────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                       TS_PRODUCTIVITY (생산성 데이터)                         │
│  - 외부 API(10.4.35.10:11000) 수집 데이터                                    │
│  - PCODE: 031(교배)/032(분만)/033(이유)/034(번식종합)/035(모돈현황)           │
│  - PERIOD: W(주간)/M(월간)/Q(분기)                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 테이블 목록

| 테이블명 | 설명 | 용도 |
|----------|------|------|
| TA_SYS_CONFIG | 시스템 설정 | ETL 스케줄 실행 여부 설정 |
| TS_INS_SERVICE | 서비스 신청 | 농장별 서비스 신청 정보 |
| TS_INS_MASTER | 리포트 마스터 | 리포트 생성 배치 정보 |
| TS_INS_JOB_LOG | 스케줄러 로그 | 프로시저 실행 로그 |
| TS_INS_WEEK | 주간 리포트 | 농장별 주간 리포트 데이터 |
| TS_INS_WEEK_SUB | 리포트 상세 | 팝업/상세 데이터 |
| TS_INS_MGMT | 관리포인트 | 주요 포인트/추천 콘텐츠 |
| TS_INS_ACCESS_LOG | 접속 로그 | 사용자 접속 로그 |
| TM_WEATHER | 날씨 정보 (일별) | 읍/면/동 기준 일별 날씨 |
| TM_WEATHER_HOURLY | 날씨 정보 (시간별) | 읍/면/동 기준 시간별 날씨 |
| TS_PSY_DELAY_HEATMAP | PSY 히트맵 | 농장 분포 히트맵 |
| TS_PRODUCTIVITY | 생산성 데이터 | 외부 API 수집 (PCODE별 통합) |

---

## 시간 저장 원칙

- **저장**: UTC (SYSDATE) - 글로벌 표준시간
- **계산/비교**: `SF_GET_LOCALE_VW_DATE_2022(LOCALE, SYSDATE)`
  - `KOR`: 한국 +09:00
  - `VNM`: 베트남 +07:00

---

## 1. TA_SYS_CONFIG (시스템 설정)

```sql
CREATE TABLE TA_SYS_CONFIG (
    SEQ             NUMBER DEFAULT 1,           -- 일련번호 (항상 1)
    MODON_HIST_YN   VARCHAR2(1) DEFAULT 'N',    -- 모돈이력제 연계여부 (Y/N)
    EKAPE_YN        VARCHAR2(1) DEFAULT 'N',    -- 축평원 등급판정 연계여부 (Y/N)
    INS_SCHEDULE_YN VARCHAR2(1) DEFAULT 'Y',    -- 인사이트피그플랜 실행여부 (Y/N), 테스트(T)
    TEST_TEL        VARCHAR2(18),               -- 테스트 SMS수신번호
    SISAE_YN        CHAR(1) DEFAULT 'Y',        -- 축평원 도축시세 연계 여부 (Y/N)
    WEATHER_YN      CHAR(1) DEFAULT 'Y',        -- 기상청 API 연계 여부 (Y/N), 테스트(T)
    LOG_INS_DT      DATE DEFAULT SYSDATE,       -- 생성일
    LOG_UPT_DT      DATE DEFAULT SYSDATE,       -- 수정일
    CONSTRAINT PK_TA_SYS_CONFIG PRIMARY KEY (SEQ)
);

-- 초기 데이터
INSERT INTO TA_SYS_CONFIG (SEQ, INS_SCHEDULE_YN) VALUES (1, 'Y');
```

### INS_SCHEDULE_YN 값

| 값 | 설명 | ETL 배치 | 웹 API | 알림톡 발송 번호 |
|----|------|---------|--------|-----------------|
| Y | 운영 모드 | 정상 실행 | 정상 | TA_MEMBER.HP_NUM |
| T | 테스트 모드 | 정상 실행 | 정상 | TA_SYS_CONFIG.TEST_TEL |
| N | 비활성화 | 스킵 | 비활성화 | - |

**참고:** `T` 모드에서 ETL과 웹 API는 `Y`와 동일하게 동작하며, 알림톡만 `TEST_TEL`로 발송됩니다.

---

## 2. TS_INS_SERVICE (서비스 신청)

농장별 인사이트피그 서비스 구독 이력 관리 테이블

```sql
CREATE TABLE TS_INS_SERVICE (
    FARM_NO         INTEGER NOT NULL,           -- 농장번호 (PK 일부, FK)
    INSPIG_REG_DT   VARCHAR2(8) NOT NULL,       -- 등록일 (PK 일부, YYYYMMDD)
    INSPIG_YN       VARCHAR2(1) DEFAULT 'N',    -- 서비스 신청여부
    INSPIG_FROM_DT  VARCHAR2(8),                -- 시작일 (YYYYMMDD)
    INSPIG_TO_DT    VARCHAR2(8),                -- 종료일 (YYYYMMDD)
    INSPIG_STOP_DT  VARCHAR2(8),                -- 중단일 (YYYYMMDD)
    WEB_PAY_YN      VARCHAR2(1) DEFAULT 'N',    -- 웹결재 여부
    REG_TYPE        VARCHAR2(10) DEFAULT 'AUTO', -- AUTO/MANUAL
    USE_YN          VARCHAR2(1) DEFAULT 'Y',
    BIGO            VARCHAR2(500),              -- 비고
    LOG_INS_DT      DATE DEFAULT SYSDATE,
    LOG_UPT_DT      DATE DEFAULT SYSDATE,
    CONSTRAINT PK_TS_INS_SERVICE PRIMARY KEY (FARM_NO, INSPIG_REG_DT)
);

-- 인덱스
CREATE INDEX IDX_TS_INS_SERVICE_01 ON TS_INS_SERVICE(FARM_NO, INSPIG_REG_DT DESC);
CREATE INDEX IDX_TS_INS_SERVICE_02 ON TS_INS_SERVICE(FARM_NO, INSPIG_FROM_DT, INSPIG_TO_DT);
```

### PK 구조

- **FARM_NO + INSPIG_REG_DT**: 복합키 (농장당 N건 이력 관리)
- 동일 농장에 여러 구독 기간 저장 가능
- 현재 유효한 구독은 `INSPIG_YN='Y'`, `USE_YN='Y'`, 기간 조건 충족 건 중 최신 `INSPIG_REG_DT`

### REG_TYPE 값

| 값 | 설명 |
|----|------|
| AUTO | 정기 스케줄 대상 (기본값) |
| MANUAL | 수동 등록 (테스트/개별 실행) |

### 유효 서비스 조회 조건

```sql
-- 현재 유효한 서비스 조회 (ETL에서 사용)
SELECT S1.FARM_NO, S1.INSPIG_REG_DT, ...
FROM TS_INS_SERVICE S1
WHERE S1.INSPIG_YN = 'Y'
  AND S1.USE_YN = 'Y'
  AND S1.INSPIG_FROM_DT IS NOT NULL
  AND S1.INSPIG_TO_DT IS NOT NULL
  AND TO_CHAR(SYSDATE, 'YYYYMMDD') >= S1.INSPIG_FROM_DT
  AND TO_CHAR(SYSDATE, 'YYYYMMDD') <= LEAST(
      S1.INSPIG_TO_DT,
      NVL(S1.INSPIG_STOP_DT, '99991231')
  )
  -- 같은 농장 중 유효한 최신 건만 조회
  AND S1.INSPIG_REG_DT = (
      SELECT MAX(S2.INSPIG_REG_DT)
      FROM TS_INS_SERVICE S2
      WHERE S2.FARM_NO = S1.FARM_NO
        AND S2.INSPIG_YN = 'Y'
        AND S2.USE_YN = 'Y'
        AND S2.INSPIG_FROM_DT IS NOT NULL
        AND S2.INSPIG_TO_DT IS NOT NULL
        AND TO_CHAR(SYSDATE, 'YYYYMMDD') >= S2.INSPIG_FROM_DT
        AND TO_CHAR(SYSDATE, 'YYYYMMDD') <= LEAST(
            S2.INSPIG_TO_DT,
            NVL(S2.INSPIG_STOP_DT, '99991231')
        )
  )
```

---

## 3. TS_INS_MASTER (리포트 마스터)

```sql
CREATE TABLE TS_INS_MASTER (
    SEQ             NUMBER NOT NULL,            -- 일련번호 (PK)
    DAY_GB          VARCHAR2(10) NOT NULL,      -- WEEK/MON/QT
    INS_DT          CHAR(8) NOT NULL,           -- 생성기준일 (YYYYMMDD)

    -- 기간 정보
    REPORT_YEAR     NUMBER(4) NOT NULL,         -- 년도
    REPORT_WEEK_NO  NUMBER(2) NOT NULL,         -- 주차(1~53)/월(1~12)
    DT_FROM         VARCHAR2(8) NOT NULL,       -- 시작일 (YYYYMMDD)
    DT_TO           VARCHAR2(8) NOT NULL,       -- 종료일 (YYYYMMDD)

    -- 실행 현황
    TARGET_CNT      INTEGER DEFAULT 0,          -- 대상 농장수
    COMPLETE_CNT    INTEGER DEFAULT 0,          -- 완료 농장수
    ERROR_CNT       INTEGER DEFAULT 0,          -- 오류 농장수

    -- 상태
    STATUS_CD       VARCHAR2(10) DEFAULT 'READY', -- READY/RUNNING/COMPLETE/ERROR
    START_DT        DATE,                       -- 시작일시
    END_DT          DATE,                       -- 종료일시
    ELAPSED_SEC     INTEGER DEFAULT 0,          -- 소요시간(초)

    LOG_INS_DT      DATE DEFAULT SYSDATE,
    CONSTRAINT PK_TS_INS_MASTER PRIMARY KEY (SEQ)
);

-- 인덱스
CREATE UNIQUE INDEX UK_TS_INS_MASTER_01 ON TS_INS_MASTER(DAY_GB, REPORT_YEAR, REPORT_WEEK_NO);
CREATE INDEX IDX_TS_INS_MASTER_01 ON TS_INS_MASTER(DAY_GB, INS_DT);
CREATE INDEX IDX_TS_INS_MASTER_02 ON TS_INS_MASTER(STATUS_CD);
```

### DAY_GB 값

| 값 | 설명 |
|----|------|
| WEEK | 주간 리포트 |
| MON | 월간 리포트 |
| QT | 분기 리포트 |

---

## 4. TS_INS_JOB_LOG (스케줄러 로그)

```sql
CREATE TABLE TS_INS_JOB_LOG (
    SEQ             NUMBER NOT NULL,            -- 일련번호 (PK)
    MASTER_SEQ      NUMBER,                     -- FK (NULL 허용)
    JOB_NM          VARCHAR2(50) NOT NULL,      -- JOB 이름
    PROC_NM         VARCHAR2(50) NOT NULL,      -- 프로시저명
    FARM_NO         INTEGER,                    -- 농장번호 (NULL=전체)

    -- 리포트 정보
    DAY_GB          VARCHAR2(10),               -- WEEK/MON/QT
    REPORT_YEAR     NUMBER(4),
    REPORT_WEEK_NO  NUMBER(2),

    -- 실행 상태
    STATUS_CD       VARCHAR2(10) DEFAULT 'RUNNING', -- RUNNING/SUCCESS/ERROR
    START_DT        DATE NOT NULL,
    END_DT          DATE,
    ELAPSED_MS      INTEGER DEFAULT 0,          -- 소요시간(ms)

    -- 처리 결과
    PROC_CNT        INTEGER DEFAULT 0,          -- 처리 건수
    ERROR_CD        VARCHAR2(20),
    ERROR_MSG       VARCHAR2(4000),
    ERROR_STACK     CLOB,                       -- 스택 트레이스

    LOG_INS_DT      DATE DEFAULT SYSDATE,
    CONSTRAINT PK_TS_INS_JOB_LOG PRIMARY KEY (SEQ)
);

-- 인덱스
CREATE INDEX IDX_TS_INS_JOB_LOG_01 ON TS_INS_JOB_LOG(MASTER_SEQ);
CREATE INDEX IDX_TS_INS_JOB_LOG_02 ON TS_INS_JOB_LOG(JOB_NM, START_DT);
CREATE INDEX IDX_TS_INS_JOB_LOG_03 ON TS_INS_JOB_LOG(STATUS_CD, START_DT);
CREATE INDEX IDX_TS_INS_JOB_LOG_04 ON TS_INS_JOB_LOG(MASTER_SEQ, FARM_NO, STATUS_CD);
CREATE INDEX IDX_TS_INS_JOB_LOG_05 ON TS_INS_JOB_LOG(DAY_GB, REPORT_YEAR, REPORT_WEEK_NO);
```

### 보관 정책

- 6개월 보관, 이전 로그 자동 삭제

---

## 5. TS_INS_WEEK (주간 리포트)

```sql
CREATE TABLE TS_INS_WEEK (
    MASTER_SEQ      NUMBER NOT NULL,            -- FK → TS_INS_MASTER
    FARM_NO         INTEGER NOT NULL,           -- FK → TS_INS_SERVICE

    -- 기간 정보
    REPORT_YEAR     NUMBER(4),
    REPORT_WEEK_NO  NUMBER(2),
    DT_FROM         VARCHAR2(8),
    DT_TO           VARCHAR2(8),

    -- 헤더 정보
    FARM_NM         VARCHAR2(100),              -- 농장명
    OWNER_NM        VARCHAR2(50),               -- 대표자명
    SIGUNGU_CD      VARCHAR2(10),               -- 시군구코드 (날씨용)

    -- 모돈 현황
    MODON_REG_CNT   INTEGER DEFAULT 0,          -- 현재모돈수
    MODON_REG_CHG   INTEGER DEFAULT 0,          -- 증감
    MODON_SANGSI_CNT INTEGER DEFAULT 0,         -- 상시모돈수
    MODON_SANGSI_CHG INTEGER DEFAULT 0,         -- 증감

    -- 관리대상 모돈 (alertMd)
    ALERT_TOTAL     INTEGER DEFAULT 0,
    ALERT_HUBO      INTEGER DEFAULT 0,          -- 미교배 후보돈
    ALERT_EU_MI     INTEGER DEFAULT 0,          -- 이유후 미교배
    ALERT_SG_MI     INTEGER DEFAULT 0,          -- 사고후 미교배
    ALERT_BM_DELAY  INTEGER DEFAULT 0,          -- 분만지연
    ALERT_EU_DELAY  INTEGER DEFAULT 0,          -- 이유지연

    -- 지난주 교배 (lastWeek.mating)
    LAST_GB_CNT     INTEGER DEFAULT 0,          -- 교배 복수
    LAST_GB_SUM     INTEGER DEFAULT 0,          -- 누계

    -- 지난주 분만 (lastWeek.farrowing)
    LAST_BM_CNT     INTEGER DEFAULT 0,          -- 분만 복수
    LAST_BM_TOTAL   INTEGER DEFAULT 0,          -- 총산자수
    LAST_BM_LIVE    INTEGER DEFAULT 0,          -- 실산자수
    LAST_BM_DEAD    INTEGER DEFAULT 0,          -- 사산
    LAST_BM_MUMMY   INTEGER DEFAULT 0,          -- 미라
    LAST_BM_SUM_CNT INTEGER DEFAULT 0,          -- 누계 복수
    LAST_BM_SUM_TOTAL INTEGER DEFAULT 0,        -- 총산 누계
    LAST_BM_SUM_LIVE INTEGER DEFAULT 0,         -- 실산 누계
    LAST_BM_AVG_TOTAL NUMBER(5,1) DEFAULT 0,    -- 총산 평균
    LAST_BM_AVG_LIVE NUMBER(5,1) DEFAULT 0,     -- 실산 평균
    LAST_BM_SUM_AVG_TOTAL NUMBER(5,1) DEFAULT 0,
    LAST_BM_SUM_AVG_LIVE NUMBER(5,1) DEFAULT 0,

    -- 지난주 이유 (lastWeek.weaning)
    LAST_EU_CNT     INTEGER DEFAULT 0,          -- 이유 복수
    LAST_EU_JD_CNT  INTEGER DEFAULT 0,          -- 이유자돈수
    LAST_EU_AVG_JD  NUMBER(5,1) DEFAULT 0,      -- 평균 이유두수
    LAST_EU_AVG_KG  NUMBER(5,1) DEFAULT 0,      -- 평균체중
    LAST_EU_SUM_CNT INTEGER DEFAULT 0,
    LAST_EU_SUM_JD  INTEGER DEFAULT 0,
    LAST_EU_SUM_AVG_JD NUMBER(5,1) DEFAULT 0,

    -- 지난주 사고 (lastWeek.accident)
    LAST_SG_CNT     INTEGER DEFAULT 0,
    LAST_SG_AVG_GYUNGIL NUMBER(5,1) DEFAULT 0,
    LAST_SG_SUM     INTEGER DEFAULT 0,
    LAST_SG_SUM_AVG_GYUNGIL NUMBER(5,1) DEFAULT 0,

    -- 지난주 도폐 (lastWeek.culling)
    LAST_CL_CNT     INTEGER DEFAULT 0,
    LAST_CL_SUM     INTEGER DEFAULT 0,

    -- 지난주 출하 (lastWeek.shipment)
    LAST_SH_CNT     INTEGER DEFAULT 0,
    LAST_SH_AVG_KG  NUMBER(5,1) DEFAULT 0,
    LAST_SH_SUM     INTEGER DEFAULT 0,
    LAST_SH_AVG_SUM NUMBER(5,1) DEFAULT 0,

    -- 금주 예정 (thisWeek)
    THIS_GB_SUM     INTEGER DEFAULT 0,          -- 교배 예정
    THIS_IMSIN_SUM  INTEGER DEFAULT 0,          -- 임신확인 예정
    THIS_BM_SUM     INTEGER DEFAULT 0,          -- 분만 예정
    THIS_EU_SUM     INTEGER DEFAULT 0,          -- 이유 예정
    THIS_VACCINE_SUM INTEGER DEFAULT 0,         -- 백신 예정
    THIS_SHIP_SUM   INTEGER DEFAULT 0,          -- 출하 예정

    -- KPI
    KPI_PSY         NUMBER(5,1) DEFAULT 0,
    KPI_DELAY_DAY   INTEGER DEFAULT 0,          -- 입력지연일
    PSY_X           INTEGER DEFAULT 0,
    PSY_Y           INTEGER DEFAULT 0,
    PSY_ZONE        VARCHAR2(10),               -- 1A~4D

    -- 상태
    STATUS_CD       VARCHAR2(10) DEFAULT 'READY',

    -- 공유 토큰
    SHARE_TOKEN     VARCHAR2(64),               -- SHA256 (64자)
    TOKEN_EXPIRE_DT VARCHAR2(8),                -- 만료일

    LOG_INS_DT      DATE DEFAULT SYSDATE,
    CONSTRAINT PK_TS_INS_WEEK PRIMARY KEY (MASTER_SEQ, FARM_NO)
);

-- 인덱스
CREATE INDEX IDX_TS_INS_WEEK_01 ON TS_INS_WEEK(FARM_NO, MASTER_SEQ);
CREATE INDEX IDX_TS_INS_WEEK_02 ON TS_INS_WEEK(FARM_NO, REPORT_YEAR, REPORT_WEEK_NO);
CREATE UNIQUE INDEX UK_TS_INS_WEEK_TOKEN ON TS_INS_WEEK(SHARE_TOKEN);
```

---

## 6. TS_INS_WEEK_SUB (리포트 상세)

팝업/섹션별 상세 데이터 저장

```sql
CREATE TABLE TS_INS_WEEK_SUB (
    MASTER_SEQ      NUMBER NOT NULL,
    FARM_NO         INTEGER NOT NULL,
    GUBUN           VARCHAR2(20) NOT NULL,      -- 데이터 구분
    SUB_GUBUN       VARCHAR2(20) DEFAULT '-',   -- 세부 구분
    SORT_NO         INTEGER DEFAULT 0,          -- 정렬순서

    -- 코드
    CODE_1          VARCHAR2(30),               -- 1차 구분코드
    CODE_2          VARCHAR2(30),               -- 2차 구분코드

    -- 숫자형 (CNT_1 ~ CNT_15)
    CNT_1 ~ CNT_15  NUMBER(10,2) DEFAULT 0,

    -- 수치형 (VAL_1 ~ VAL_15)
    VAL_1 ~ VAL_15  NUMBER(10,2) DEFAULT 0,

    -- 문자형 (STR_1 ~ STR_15)
    STR_1 ~ STR_15  VARCHAR2(1000),

    LOG_INS_DT      DATE DEFAULT SYSDATE,
    CONSTRAINT PK_TS_INS_WEEK_SUB PRIMARY KEY (MASTER_SEQ, FARM_NO, GUBUN, SUB_GUBUN, SORT_NO)
);
```

### GUBUN 값

| 값 | 설명 | 내용 |
|----|------|------|
| MODON | 모돈현황 팝업 | 산차별 현황 |
| ALERT | 관리대상 팝업 | 미교배/지연 모돈 목록 |
| GB | 교배 팝업 | 교배 통계/목록 |
| BM | 분만 팝업 | 분만 통계/목록 |
| EU | 이유 팝업 | 이유 통계/목록 |
| SG | 임신사고 팝업 | 사고 통계/목록 |
| DOPE | 도폐 팝업 | 도폐 통계/목록 |
| SHIP | 출하 팝업 | 출하 통계/목록 |
| SCHEDULE | 예정 캘린더 | 일별 예정 작업 |

### SUB_GUBUN 값

| 값 | 설명 |
|----|------|
| STAT | 요약 통계 |
| LIST | 목록 데이터 |
| CHART | 차트 데이터 |
| ROW | 행 데이터 |

---

## 7. 부가 테이블

### TM_WEATHER / TM_WEATHER_HOURLY (날씨)

기상청 격자(NX, NY) 기준 날씨 데이터

| 테이블 | UK | 설명 |
|--------|-----|------|
| TM_WEATHER | NX + NY + WK_DATE | 일별 날씨 |
| TM_WEATHER_HOURLY | NX + NY + WK_DATE + WK_TIME | 시간별 날씨 |

- **관계**: TA_FARM N:1 TM_WEATHER (다수 농장 → 1개 날씨)
- **격자 변환**: TA_FARM.MAP_X/Y → WEATHER_NX/NY (5km 단위)

> **상세 문서**: 테이블 구조, 격자 변환, API 수집 로직, 날씨 코드 등은 공유 문서 참조
> - [07_WEATHER_COLLECT.md](../../../../inspig-docs/etl/07_WEATHER_COLLECT.md)
>
> DDL: [TM_WEATHER.sql](../ddl/TM_WEATHER.sql)

### TS_PSY_DELAY_HEATMAP (히트맵)

```sql
CREATE TABLE TS_PSY_DELAY_HEATMAP (
    MASTER_SEQ      NUMBER NOT NULL,
    X_POS           INTEGER NOT NULL,           -- 0~3: 입력지연일 구간
    Y_POS           INTEGER NOT NULL,           -- 0~3: PSY 구간
    ZONE_CD         VARCHAR2(10),               -- 1A~4D
    FARM_CNT        INTEGER DEFAULT 0,
    LOG_INS_DT      DATE DEFAULT SYSDATE,
    CONSTRAINT PK_TS_PSY_DELAY_HEATMAP PRIMARY KEY (MASTER_SEQ, X_POS, Y_POS)
);
```

---

## 8. TS_PRODUCTIVITY (생산성 데이터)

외부 API(10.4.35.10:11000)에서 수집한 생산성 지표 저장

| 항목 | 설명 |
|------|------|
| UK | FARM_NO + PCODE + STAT_YEAR + PERIOD + PERIOD_NO |
| PCODE | 031(교배), 032(분만), 033(이유), 034(번식종합), 035(모돈현황) |
| PERIOD | W(주간), M(월간), Q(분기) |

> **상세 문서**: 컬럼 생성규칙, PCODE별 항목, ETL 로직 등은 공유 문서 참조
> - [06_PRODUCTIVITY_COLLECT.md](../../../../inspig-docs/etl/06_PRODUCTIVITY_COLLECT.md)
>
> DDL: [TS_PRODUCTIVITY.sql](../ddl/TS_PRODUCTIVITY.sql)

---

## 레거시 Oracle 프로시저 (참조용)

Python ETL 작성 기준이 된 Oracle 프로시저/JOB 백업 파일:

| 파일 | 프로시저/JOB | 설명 |
|------|-------------|------|
| `inspig-docs/db/sql/ins/backup/01_SP_INS_WEEK_MAIN.sql` | SP_INS_WEEK_MAIN | 주간 ETL 메인 (→ orchestrator.py) |
| `inspig-docs/db/sql/ins/backup/02_SP_INS_WEEK_CONFIG.sql` | SP_INS_WEEK_CONFIG | 설정 처리 (→ ConfigProcessor) |
| `inspig-docs/db/sql/ins/backup/11_SP_INS_WEEK_MODON_POPUP.sql` | SP_INS_WEEK_MODON_POPUP | 모돈현황 (→ SowStatusProcessor) |
| `inspig-docs/db/sql/ins/backup/12_SP_INS_WEEK_ALERT_POPUP.sql` | SP_INS_WEEK_ALERT_POPUP | 관리대상 (→ AlertProcessor) |
| `inspig-docs/db/sql/ins/backup/21_SP_INS_WEEK_GB_POPUP.sql` | SP_INS_WEEK_GB_POPUP | 교배 (→ MatingProcessor) |
| `inspig-docs/db/sql/ins/backup/22_SP_INS_WEEK_BM_POPUP.sql` | SP_INS_WEEK_BM_POPUP | 분만 (→ FarrowingProcessor) |
| `inspig-docs/db/sql/ins/backup/23_SP_INS_WEEK_EU_POPUP.sql` | SP_INS_WEEK_EU_POPUP | 이유 (→ WeaningProcessor) |
| `inspig-docs/db/sql/ins/backup/31_SP_INS_WEEK_SG_POPUP.sql` | SP_INS_WEEK_SG_POPUP | 사고 (→ AccidentProcessor) |
| `inspig-docs/db/sql/ins/backup/32_SP_INS_WEEK_DOPE_POPUP.sql` | SP_INS_WEEK_DOPE_POPUP | 도폐 (→ CullingProcessor) |
| `inspig-docs/db/sql/ins/backup/41_SP_INS_WEEK_SHIP_POPUP.sql` | SP_INS_WEEK_SHIP_POPUP | 출하 (→ ShipmentProcessor) |
| `inspig-docs/db/sql/ins/backup/51_SP_INS_WEEK_SCHEDULE_POPUP.sql` | SP_INS_WEEK_SCHEDULE_POPUP | 예정 (→ ScheduleProcessor) |
| `inspig-docs/db/sql/ins/backup/99_JOB_INS_WEEKLY.sql` | JOB_INS_WEEKLY | Oracle JOB (→ run_weekly.sh) |
| `inspig-docs/db/sql/ins/backup/11_SP_INS_COM_LOG.sql` | SP_INS_COM_LOG_* | 로그 프로시저 |

> **Note**: 현재 운영은 Python ETL(`run_etl.py weekly`)로 수행됩니다. 위 SQL은 참조용 백업입니다.

---

## 성능 최적화 인덱스 (운영 DB)

```sql
-- TM_LPD_DATA (약 1,000만 건) - 출하 조회용
CREATE INDEX IDX_TM_LPD_DATA_INS_01 ON TM_LPD_DATA (FARM_NO, DOCHUK_DT);

-- TB_EU (약 1,100만 건) - 이유 조회용
CREATE INDEX IDX_TB_EU_INS_01 ON TB_EU (FARM_NO, WK_DT);
```
