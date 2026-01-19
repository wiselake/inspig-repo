-- ============================================================
-- INS 통계 테이블 DDL 스크립트
-- 인사이트피그플랜(inspig) 주간/월간/분기 리포트용 테이블
--
-- 실행 순서: 01_SEQUENCE.sql 실행 후 실행
-- 대상 Oracle: 19c
--
-- 시간 저장 원칙:
--   - 저장: UTC (SYSDATE) - 글로벌 표준시간으로 저장
--   - 계산/비교: SF_GET_LOCALE_VW_DATE_2022(LOCALE, SYSDATE) - 다국가 로케일
--     * KOR: 한국 +09:00
--     * VNM: 베트남 +07:00
-- ============================================================

-- ============================================================
-- 1. TA_SYS_CONFIG: 시스템 설정 테이블 (1 row)
-- ============================================================
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE TA_SYS_CONFIG CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

CREATE TABLE TA_SYS_CONFIG (
    SEQ             NUMBER DEFAULT 1,                   -- 일련번호 (항상 1)
    MODON_HIST_YN   VARCHAR2(1) DEFAULT 'N',            -- 모돈이력제 연계여부
    EKAPE_YN        VARCHAR2(1) DEFAULT 'N',            -- 축평원 연계여부
    INS_SCHEDULE_YN VARCHAR2(1) DEFAULT 'Y',            -- 인사이트피그플랜 스케줄 실행여부
    LOG_INS_DT      DATE DEFAULT SYSDATE,              -- 생성일 (UTC)
    LOG_UPT_DT      DATE DEFAULT SYSDATE,              -- 수정일 (UTC)

    CONSTRAINT PK_TA_SYS_CONFIG PRIMARY KEY (SEQ)
)
TABLESPACE PIGXE_DATA;

COMMENT ON TABLE TA_SYS_CONFIG IS '시스템 설정 테이블';
COMMENT ON COLUMN TA_SYS_CONFIG.SEQ IS '일련번호 (항상 1)';
COMMENT ON COLUMN TA_SYS_CONFIG.MODON_HIST_YN IS '모돈이력제 연계여부 (Y/N)';
COMMENT ON COLUMN TA_SYS_CONFIG.EKAPE_YN IS '축평원 연계여부 (Y/N)';
COMMENT ON COLUMN TA_SYS_CONFIG.INS_SCHEDULE_YN IS '인사이트피그플랜 스케줄 실행여부 (Y/N)';
COMMENT ON COLUMN TA_SYS_CONFIG.LOG_INS_DT IS '생성일';
COMMENT ON COLUMN TA_SYS_CONFIG.LOG_UPT_DT IS '수정일';

-- 초기 데이터
INSERT INTO TA_SYS_CONFIG (SEQ, MODON_HIST_YN, EKAPE_YN, INS_SCHEDULE_YN)
VALUES (1, 'N', 'N', 'Y');
COMMIT;

-- ============================================================
-- 2. TS_INS_SERVICE: 서비스 신청 테이블
-- ============================================================
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE TS_INS_SERVICE CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

CREATE TABLE TS_INS_SERVICE (
    FARM_NO         INTEGER NOT NULL,                   -- 농장번호 (PK, FK)
    INSPIG_YN       VARCHAR2(1) DEFAULT 'N',            -- 서비스 신청여부
    INSPIG_REG_DT   VARCHAR2(8),                        -- 서비스 신청일 (YYYYMMDD)
    INSPIG_FROM_DT  VARCHAR2(8),                        -- 서비스 시작일 (YYYYMMDD)
    INSPIG_TO_DT    VARCHAR2(8),                        -- 서비스 종료일 (YYYYMMDD)
    INSPIG_STOP_DT  VARCHAR2(8),                        -- 서비스 중단일 (YYYYMMDD)
    WEB_PAY_YN      VARCHAR2(1) DEFAULT 'N',            -- 웹결재 여부
    REG_TYPE        VARCHAR2(10) DEFAULT 'AUTO',         -- 등록유형: AUTO(정기 스케줄), MANUAL(수동 등록)
    USE_YN          VARCHAR2(1) DEFAULT 'Y',            -- 사용여부
    LOG_INS_DT      DATE DEFAULT SYSDATE,              -- 생성일 (UTC)
    LOG_UPT_DT      DATE DEFAULT SYSDATE,              -- 수정일 (UTC)

    CONSTRAINT PK_TS_INS_SERVICE PRIMARY KEY (FARM_NO),
    CONSTRAINT FK_TS_INS_SERVICE_FARM FOREIGN KEY (FARM_NO)
        REFERENCES TA_FARM(FARM_NO) ON DELETE CASCADE
)
TABLESPACE PIGXE_DATA;

COMMENT ON TABLE TS_INS_SERVICE IS '인사이트피그플랜 서비스 신청 테이블';
COMMENT ON COLUMN TS_INS_SERVICE.FARM_NO IS '농장번호';
COMMENT ON COLUMN TS_INS_SERVICE.INSPIG_YN IS '서비스 신청여부 (Y/N)';
COMMENT ON COLUMN TS_INS_SERVICE.INSPIG_REG_DT IS '서비스 신청일 (YYYYMMDD)';
COMMENT ON COLUMN TS_INS_SERVICE.INSPIG_FROM_DT IS '서비스 시작일 (YYYYMMDD)';
COMMENT ON COLUMN TS_INS_SERVICE.INSPIG_TO_DT IS '서비스 종료일 (YYYYMMDD)';
COMMENT ON COLUMN TS_INS_SERVICE.INSPIG_STOP_DT IS '서비스 중단일 (YYYYMMDD)';
COMMENT ON COLUMN TS_INS_SERVICE.WEB_PAY_YN IS '웹결재 여부 (Y/N)';
COMMENT ON COLUMN TS_INS_SERVICE.REG_TYPE IS '등록유형: AUTO(정기 스케줄 대상), MANUAL(수동 등록)';
COMMENT ON COLUMN TS_INS_SERVICE.USE_YN IS '사용여부 (Y/N)';
COMMENT ON COLUMN TS_INS_SERVICE.LOG_INS_DT IS '생성일';
COMMENT ON COLUMN TS_INS_SERVICE.LOG_UPT_DT IS '수정일';

-- ============================================================
-- 3. TS_INS_MASTER: 리포트 생성 마스터 테이블
-- ============================================================
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE TS_INS_MASTER CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

CREATE TABLE TS_INS_MASTER (
    SEQ             NUMBER NOT NULL,                    -- 일련번호 (시퀀스, PK)
    DAY_GB          VARCHAR2(10) NOT NULL,              -- 기간구분: WEEK, MON, QT
    INS_DT          CHAR(8) NOT NULL,                   -- 생성기준일 (YYYYMMDD)

    -- 기간 정보
    REPORT_YEAR     NUMBER(4) NOT NULL,                 -- 년도
    REPORT_WEEK_NO  NUMBER(2) NOT NULL,                 -- 주차 (1~53) / 월 (1~12)
    DT_FROM         VARCHAR2(8) NOT NULL,               -- 리포트 시작일 (YYYYMMDD)
    DT_TO           VARCHAR2(8) NOT NULL,               -- 리포트 종료일 (YYYYMMDD)

    -- 대상 및 실행 현황
    TARGET_CNT      INTEGER DEFAULT 0,                  -- 대상 농장수
    COMPLETE_CNT    INTEGER DEFAULT 0,                  -- 실행완료 농장수
    ERROR_CNT       INTEGER DEFAULT 0,                  -- 오류 농장수

    -- 생성 상태
    STATUS_CD       VARCHAR2(10) DEFAULT 'READY',       -- READY, RUNNING, COMPLETE, ERROR
    START_DT        DATE,                               -- 실행 시작일시
    END_DT          DATE,                               -- 실행 종료일시
    ELAPSED_SEC     INTEGER DEFAULT 0,                  -- 실행 소요시간(초)

    -- 관리 컬럼
    LOG_INS_DT      DATE DEFAULT SYSDATE,              -- 생성일 (UTC)

    CONSTRAINT PK_TS_INS_MASTER PRIMARY KEY (SEQ)
)
TABLESPACE PIGXE_DATA;

-- 인덱스: 중복 체크용 (DAY_GB + 년도 + 주차)
CREATE UNIQUE INDEX UK_TS_INS_MASTER_01 ON TS_INS_MASTER(DAY_GB, REPORT_YEAR, REPORT_WEEK_NO) TABLESPACE PIGXE_IDX;
CREATE INDEX IDX_TS_INS_MASTER_01 ON TS_INS_MASTER(DAY_GB, INS_DT) TABLESPACE PIGXE_IDX;
CREATE INDEX IDX_TS_INS_MASTER_02 ON TS_INS_MASTER(STATUS_CD) TABLESPACE PIGXE_IDX;

COMMENT ON TABLE TS_INS_MASTER IS '리포트 생성 마스터 테이블';
COMMENT ON COLUMN TS_INS_MASTER.SEQ IS '일련번호';
COMMENT ON COLUMN TS_INS_MASTER.DAY_GB IS '기간구분 (WEEK:주간, MON:월간, QT:분기)';
COMMENT ON COLUMN TS_INS_MASTER.INS_DT IS '생성기준일 (YYYYMMDD)';
COMMENT ON COLUMN TS_INS_MASTER.REPORT_YEAR IS '년도';
COMMENT ON COLUMN TS_INS_MASTER.REPORT_WEEK_NO IS '주차 (1~53) 또는 월 (1~12)';
COMMENT ON COLUMN TS_INS_MASTER.DT_FROM IS '리포트 시작일 (YYYYMMDD)';
COMMENT ON COLUMN TS_INS_MASTER.DT_TO IS '리포트 종료일 (YYYYMMDD)';
COMMENT ON COLUMN TS_INS_MASTER.TARGET_CNT IS '대상 농장수';
COMMENT ON COLUMN TS_INS_MASTER.COMPLETE_CNT IS '실행완료 농장수';
COMMENT ON COLUMN TS_INS_MASTER.ERROR_CNT IS '오류 농장수';
COMMENT ON COLUMN TS_INS_MASTER.STATUS_CD IS '상태 (READY:대기, RUNNING:실행중, COMPLETE:완료, ERROR:오류)';
COMMENT ON COLUMN TS_INS_MASTER.START_DT IS '실행 시작일시';
COMMENT ON COLUMN TS_INS_MASTER.END_DT IS '실행 종료일시';
COMMENT ON COLUMN TS_INS_MASTER.ELAPSED_SEC IS '실행 소요시간(초)';

-- ============================================================
-- 4. TS_INS_JOB_LOG: 스케줄러 실행 로그 테이블
--    주의: 당일 로그만 유지 (매일 전일 로그 삭제)
-- ============================================================
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE TS_INS_JOB_LOG CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

CREATE TABLE TS_INS_JOB_LOG (
    SEQ             NUMBER NOT NULL,                    -- 일련번호 (PK)
    MASTER_SEQ      NUMBER,                             -- 마스터 일련번호 (FK, NULL 허용)
    JOB_NM          VARCHAR2(50) NOT NULL,              -- JOB 이름
    PROC_NM         VARCHAR2(50) NOT NULL,              -- 프로시저명
    FARM_NO         INTEGER,                            -- 농장번호 (NULL=전체)

    -- 리포트 기준 정보 (조회/모니터링 편의용)
    DAY_GB          VARCHAR2(10),                       -- 기간구분 (WEEK, MON, QT)
    REPORT_YEAR     NUMBER(4),                          -- 리포트 년도
    REPORT_WEEK_NO  NUMBER(2),                          -- 리포트 주차/월/분기

    -- 실행 상태
    STATUS_CD       VARCHAR2(10) DEFAULT 'RUNNING',     -- RUNNING, SUCCESS, ERROR
    START_DT        DATE NOT NULL,                      -- 시작일시
    END_DT          DATE,                               -- 종료일시
    ELAPSED_MS      INTEGER DEFAULT 0,                  -- 소요시간(ms)

    -- 처리 결과
    PROC_CNT        INTEGER DEFAULT 0,                  -- 처리 건수
    ERROR_CD        VARCHAR2(20),                       -- 오류 코드
    ERROR_MSG       VARCHAR2(4000),                     -- 오류 메시지

    -- 관리 컬럼
    LOG_INS_DT      DATE DEFAULT SYSDATE,              -- 생성일 (UTC)

    CONSTRAINT PK_TS_INS_JOB_LOG PRIMARY KEY (SEQ)
)
TABLESPACE PIGXE_DATA;

-- 인덱스
CREATE INDEX IDX_TS_INS_JOB_LOG_01 ON TS_INS_JOB_LOG(MASTER_SEQ) TABLESPACE PIGXE_IDX;
CREATE INDEX IDX_TS_INS_JOB_LOG_02 ON TS_INS_JOB_LOG(JOB_NM, START_DT) TABLESPACE PIGXE_IDX;
CREATE INDEX IDX_TS_INS_JOB_LOG_03 ON TS_INS_JOB_LOG(STATUS_CD, START_DT) TABLESPACE PIGXE_IDX;
CREATE INDEX IDX_TS_INS_JOB_LOG_04 ON TS_INS_JOB_LOG(MASTER_SEQ, FARM_NO, STATUS_CD) TABLESPACE PIGXE_IDX;
CREATE INDEX IDX_TS_INS_JOB_LOG_05 ON TS_INS_JOB_LOG(DAY_GB, REPORT_YEAR, REPORT_WEEK_NO) TABLESPACE PIGXE_IDX;

COMMENT ON TABLE TS_INS_JOB_LOG IS '스케줄러 실행 로그 테이블 (6개월 보관)';
COMMENT ON COLUMN TS_INS_JOB_LOG.SEQ IS '일련번호';
COMMENT ON COLUMN TS_INS_JOB_LOG.MASTER_SEQ IS '마스터 일련번호';
COMMENT ON COLUMN TS_INS_JOB_LOG.JOB_NM IS 'JOB 이름';
COMMENT ON COLUMN TS_INS_JOB_LOG.PROC_NM IS '프로시저명';
COMMENT ON COLUMN TS_INS_JOB_LOG.FARM_NO IS '농장번호 (NULL=전체)';
COMMENT ON COLUMN TS_INS_JOB_LOG.DAY_GB IS '기간구분 (WEEK:주간, MON:월간, QT:분기)';
COMMENT ON COLUMN TS_INS_JOB_LOG.REPORT_YEAR IS '리포트 년도';
COMMENT ON COLUMN TS_INS_JOB_LOG.REPORT_WEEK_NO IS '리포트 주차/월/분기';
COMMENT ON COLUMN TS_INS_JOB_LOG.STATUS_CD IS '상태 (RUNNING:실행중, SUCCESS:성공, ERROR:오류)';
COMMENT ON COLUMN TS_INS_JOB_LOG.START_DT IS '시작일시';
COMMENT ON COLUMN TS_INS_JOB_LOG.END_DT IS '종료일시';
COMMENT ON COLUMN TS_INS_JOB_LOG.ELAPSED_MS IS '소요시간(ms)';
COMMENT ON COLUMN TS_INS_JOB_LOG.PROC_CNT IS '처리 건수';
COMMENT ON COLUMN TS_INS_JOB_LOG.ERROR_CD IS '오류 코드';
COMMENT ON COLUMN TS_INS_JOB_LOG.ERROR_MSG IS '오류 메시지';

-- ============================================================
-- 5. TS_INS_WEEK: 주간 리포트 테이블
--    - 주간 리포트 전용 (월간: TS_INS_MON, 분기: TS_INS_QT 별도)
-- ============================================================
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE TS_INS_WEEK CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

CREATE TABLE TS_INS_WEEK (
    MASTER_SEQ      NUMBER NOT NULL,                    -- FK → TS_INS_MASTER.SEQ
    FARM_NO         INTEGER NOT NULL,                   -- FK → TS_INS_SERVICE.FARM_NO

    -- 기간 정보
    REPORT_YEAR     NUMBER(4),                          -- 년도
    REPORT_WEEK_NO  NUMBER(2),                          -- 주차 (1~53) / 월 (1~12)
    DT_FROM         VARCHAR2(8),                        -- 시작일 (YYYYMMDD)
    DT_TO           VARCHAR2(8),                        -- 종료일 (YYYYMMDD)

    -- 헤더 정보
    FARM_NM         VARCHAR2(100),                      -- 농장명
    OWNER_NM        VARCHAR2(50),                       -- 대표자명

    -- 위치 정보 (날씨 조회용)
    SIGUNGU_CD      VARCHAR2(10),                       -- 시군구코드 (TM_WEATHER 조인용)

    -- 모돈 현황 (lastWeek.modon)
    MODON_REG_CNT   INTEGER DEFAULT 0,                  -- 현재모돈(등록모돈수)
    MODON_REG_CHG   INTEGER DEFAULT 0,                  -- 현재모돈 증감 (전주 대비)
    MODON_SANGSI_CNT NUMBER(10,2) DEFAULT 0,            -- 상시모돈수 (소수점 2자리)
    MODON_SANGSI_CHG NUMBER(10,2) DEFAULT 0,            -- 상시모돈 증감 (전주 대비, 소수점 2자리)

    -- 관리대상 모돈 요약 (alertMd)
    ALERT_TOTAL     INTEGER DEFAULT 0,                  -- 관리대상 합계
    ALERT_HUBO      INTEGER DEFAULT 0,                  -- 미교배 후보돈
    ALERT_EU_MI     INTEGER DEFAULT 0,                  -- 이유후 미교배
    ALERT_SG_MI     INTEGER DEFAULT 0,                  -- 사고후 미교배
    ALERT_BM_DELAY  INTEGER DEFAULT 0,                  -- 교배후 분만지연
    ALERT_EU_DELAY  INTEGER DEFAULT 0,                  -- 분만후 이유지연

    -- 지난주 교배 실적 (lastWeek.mating)
    LAST_GB_CNT     INTEGER DEFAULT 0,                  -- 교배 복수
    LAST_GB_SUM     INTEGER DEFAULT 0,                  -- 교배 누계

    -- 지난주 분만 실적 (lastWeek.farrowing)
    LAST_BM_CNT     INTEGER DEFAULT 0,                  -- 분만 복수
    LAST_BM_TOTAL   INTEGER DEFAULT 0,                  -- 총산자수
    LAST_BM_LIVE    INTEGER DEFAULT 0,                  -- 실산자수
    LAST_BM_DEAD    INTEGER DEFAULT 0,                  -- 사산
    LAST_BM_MUMMY   INTEGER DEFAULT 0,                  -- 미라
    LAST_BM_SUM_CNT INTEGER DEFAULT 0,                  -- 분만 누계 복수
    LAST_BM_SUM_TOTAL INTEGER DEFAULT 0,                -- 총산 누계
    LAST_BM_SUM_LIVE INTEGER DEFAULT 0,                 -- 실산 누계
    LAST_BM_AVG_TOTAL NUMBER(5,1) DEFAULT 0,            -- 총산 평균 (지난주)
    LAST_BM_AVG_LIVE NUMBER(5,1) DEFAULT 0,             -- 실산 평균 (지난주)
    LAST_BM_SUM_AVG_TOTAL NUMBER(5,1) DEFAULT 0,        -- 총산 평균 (누계)
    LAST_BM_SUM_AVG_LIVE NUMBER(5,1) DEFAULT 0,         -- 실산 평균 (누계)
    LAST_BM_CHG_TOTAL NUMBER(5,1) DEFAULT 0,            -- 총산 증감 (1년평균 대비)
    LAST_BM_CHG_LIVE NUMBER(5,1) DEFAULT 0,             -- 실산 증감

    -- 지난주 이유 실적 (lastWeek.weaning)
    LAST_EU_CNT     INTEGER DEFAULT 0,                  -- 이유 복수
    LAST_EU_JD_CNT  INTEGER DEFAULT 0,                  -- 이유자돈수
    LAST_EU_AVG_JD  NUMBER(5,1) DEFAULT 0,              -- 평균 이유두수 (지난주)
    LAST_EU_AVG_KG  NUMBER(5,1) DEFAULT 0,              -- 평균체중
    LAST_EU_SUM_CNT INTEGER DEFAULT 0,                  -- 이유 누계 복수
    LAST_EU_SUM_JD  INTEGER DEFAULT 0,                  -- 이유자돈 누계
    LAST_EU_SUM_AVG_JD NUMBER(5,1) DEFAULT 0,           -- 누계 평균 이유두수
    LAST_EU_CHG_JD  NUMBER(5,1) DEFAULT 0,              -- 평균 이유두수 증감 (1년평균 대비)
    LAST_EU_CHG_KG  NUMBER(5,1) DEFAULT 0,              -- 평균체중 증감

    -- 지난주 임신사고 (lastWeek.accident)
    LAST_SG_CNT     INTEGER DEFAULT 0,                  -- 사고 두수
    LAST_SG_AVG_GYUNGIL NUMBER(5,1) DEFAULT 0,          -- 지난주 평균 경과일
    LAST_SG_SUM     INTEGER DEFAULT 0,                  -- 사고 누계
    LAST_SG_SUM_AVG_GYUNGIL NUMBER(5,1) DEFAULT 0,      -- 당해년도 평균 경과일

    -- 지난주 도태폐사 (lastWeek.culling)
    LAST_CL_CNT     INTEGER DEFAULT 0,                  -- 도폐 두수
    LAST_CL_SUM     INTEGER DEFAULT 0,                  -- 도폐 누계

    -- 지난주 출하 실적 (lastWeek.shipment)
    LAST_SH_CNT     INTEGER DEFAULT 0,                  -- 출하 두수
    LAST_SH_AVG_KG  NUMBER(5,1) DEFAULT 0,              -- 평균 도체중
    LAST_SH_SUM     INTEGER DEFAULT 0,                  -- 출하 누계
    LAST_SH_AVG_SUM NUMBER(5,1) DEFAULT 0,              -- 평균 도체중 누계

    -- 금주 예정 요약 (thisWeek.calendarGrid)
    THIS_GB_SUM     INTEGER DEFAULT 0,                  -- 교배 예정 합계
    THIS_IMSIN_SUM  INTEGER DEFAULT 0,                  -- 임신확인 예정 합계
    THIS_BM_SUM     INTEGER DEFAULT 0,                  -- 분만 예정 합계
    THIS_EU_SUM     INTEGER DEFAULT 0,                  -- 이유 예정 합계
    THIS_VACCINE_SUM INTEGER DEFAULT 0,                 -- 백신 예정 합계
    THIS_SHIP_SUM   INTEGER DEFAULT 0,                  -- 출하 예정 합계

    -- KPI 요약
    KPI_PSY         NUMBER(5,1) DEFAULT 0,              -- PSY
    KPI_DELAY_DAY   INTEGER DEFAULT 0,                  -- 입력지연일

    -- PSY 히트맵 위치 (TS_PSY_DELAY_HEATMAP 참조)
    PSY_X           INTEGER DEFAULT 0,                  -- 히트맵 X좌표 (0~3: 입력지연일 구간)
    PSY_Y           INTEGER DEFAULT 0,                  -- 히트맵 Y좌표 (0~3: PSY 구간)
    PSY_ZONE        VARCHAR2(10),                       -- 구간코드 (1A~4D)

    -- 생성 상태
    STATUS_CD       VARCHAR2(10) DEFAULT 'READY',       -- READY, RUNNING, COMPLETE, ERROR

    -- 공유 토큰 (외부 URL 공유용)
    SHARE_TOKEN     VARCHAR2(64),                       -- SHA256 해시 토큰 (64자)
    TOKEN_EXPIRE_DT VARCHAR2(8),                        -- 토큰 만료일 (YYYYMMDD, 생성일 + 7일)

    -- 관리 컬럼
    LOG_INS_DT      DATE DEFAULT SYSDATE,              -- 생성일 (UTC)

    CONSTRAINT PK_TS_INS_WEEK PRIMARY KEY (MASTER_SEQ, FARM_NO),
    CONSTRAINT FK_TS_INS_WEEK_MASTER FOREIGN KEY (MASTER_SEQ)
        REFERENCES TS_INS_MASTER(SEQ) ON DELETE CASCADE,
    CONSTRAINT FK_TS_INS_WEEK_SERVICE FOREIGN KEY (FARM_NO)
        REFERENCES TS_INS_SERVICE(FARM_NO)
)
TABLESPACE PIGXE_DATA;

-- 인덱스
CREATE INDEX IDX_TS_INS_WEEK_01 ON TS_INS_WEEK(FARM_NO, MASTER_SEQ) TABLESPACE PIGXE_IDX;
CREATE INDEX IDX_TS_INS_WEEK_02 ON TS_INS_WEEK(FARM_NO, REPORT_YEAR, REPORT_WEEK_NO) TABLESPACE PIGXE_IDX;
CREATE UNIQUE INDEX UK_TS_INS_WEEK_TOKEN ON TS_INS_WEEK(SHARE_TOKEN) TABLESPACE PIGXE_IDX;

COMMENT ON TABLE TS_INS_WEEK IS '주간 리포트 테이블';
COMMENT ON COLUMN TS_INS_WEEK.MASTER_SEQ IS '마스터 일련번호 (FK → TS_INS_MASTER)';
COMMENT ON COLUMN TS_INS_WEEK.FARM_NO IS '농장번호 (FK → TS_INS_SERVICE)';
COMMENT ON COLUMN TS_INS_WEEK.MODON_REG_CNT IS '현재모돈(등록모돈수)';
COMMENT ON COLUMN TS_INS_WEEK.MODON_REG_CHG IS '현재모돈 증감 (전주 대비)';
COMMENT ON COLUMN TS_INS_WEEK.MODON_SANGSI_CNT IS '상시모돈수';
COMMENT ON COLUMN TS_INS_WEEK.MODON_SANGSI_CHG IS '상시모돈 증감 (전주 대비)';
COMMENT ON COLUMN TS_INS_WEEK.STATUS_CD IS '상태 (READY:대기, RUNNING:실행중, COMPLETE:완료, ERROR:오류)';
COMMENT ON COLUMN TS_INS_WEEK.SHARE_TOKEN IS '공유용 토큰 (SHA256 해시, 64자)';
COMMENT ON COLUMN TS_INS_WEEK.TOKEN_EXPIRE_DT IS '토큰 만료일 (YYYYMMDD, 생성일 + 7일)';

-- ============================================================
-- 6. TS_INS_WEEK_SUB: 리포트 상세 테이블 (팝업 데이터)
-- ============================================================
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE TS_INS_WEEK_SUB CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

CREATE TABLE TS_INS_WEEK_SUB (
    MASTER_SEQ      NUMBER NOT NULL,                    -- FK → TS_INS_MASTER.SEQ
    FARM_NO         INTEGER NOT NULL,                   -- 농장번호
    GUBUN           VARCHAR2(20) NOT NULL,              -- 데이터 구분 (팝업/섹션 식별)
    SUB_GUBUN       VARCHAR2(20) DEFAULT '-' NOT NULL,  -- 세부 구분 (같은 GUBUN 내 데이터 유형 구분)
    SORT_NO         INTEGER DEFAULT 0,                  -- 정렬순서

    -- 공통 코드 컬럼 (용도에 따라 다르게 사용)
    CODE_1          VARCHAR2(30),                       -- 1차 구분코드 (산차, 기간, 유형 등)
    CODE_2          VARCHAR2(30),                       -- 2차 구분코드 (그룹, 상세유형 등)

    -- 숫자형 데이터 (용도에 따라 다르게 사용) - NUMBER(10,2): 평균값 등 소숫점 지원
    CNT_1           NUMBER(10,2) DEFAULT 0,             -- 카운트1 (두수, 합계, 평균 등)
    CNT_2           NUMBER(10,2) DEFAULT 0,             -- 카운트2
    CNT_3           NUMBER(10,2) DEFAULT 0,             -- 카운트3
    CNT_4           NUMBER(10,2) DEFAULT 0,             -- 카운트4
    CNT_5           NUMBER(10,2) DEFAULT 0,             -- 카운트5
    CNT_6           NUMBER(10,2) DEFAULT 0,             -- 카운트6
    CNT_7           NUMBER(10,2) DEFAULT 0,             -- 카운트7
    CNT_8           NUMBER(10,2) DEFAULT 0,             -- 카운트8
    CNT_9           NUMBER(10,2) DEFAULT 0,             -- 카운트9
    CNT_10          NUMBER(10,2) DEFAULT 0,             -- 카운트10
    CNT_11          NUMBER(10,2) DEFAULT 0,             -- 카운트11
    CNT_12          NUMBER(10,2) DEFAULT 0,             -- 카운트12
    CNT_13          NUMBER(10,2) DEFAULT 0,             -- 카운트13
    CNT_14          NUMBER(10,2) DEFAULT 0,             -- 카운트14
    CNT_15          NUMBER(10,2) DEFAULT 0,             -- 카운트15

    -- 수치형 데이터
    VAL_1           NUMBER(10,2) DEFAULT 0,             -- 값1 (평균, 비율 등)
    VAL_2           NUMBER(10,2) DEFAULT 0,             -- 값2
    VAL_3           NUMBER(10,2) DEFAULT 0,             -- 값3
    VAL_4           NUMBER(10,2) DEFAULT 0,             -- 값4
    VAL_5           NUMBER(10,2) DEFAULT 0,             -- 값5
    VAL_6           NUMBER(10,2) DEFAULT 0,             -- 값6
    VAL_7           NUMBER(10,2) DEFAULT 0,             -- 값6
    VAL_8           NUMBER(10,2) DEFAULT 0,             -- 값6
    VAL_9           NUMBER(10,2) DEFAULT 0,             -- 값6
    VAL_10           NUMBER(10,2) DEFAULT 0,             -- 값6
    VAL_11           NUMBER(10,2) DEFAULT 0,             -- 값6
    VAL_12           NUMBER(10,2) DEFAULT 0,             -- 값6
    VAL_13           NUMBER(10,2) DEFAULT 0,             -- 값6
    VAL_14           NUMBER(10,2) DEFAULT 0,             -- 값6
    VAL_15           NUMBER(10,2) DEFAULT 0,             -- 값6

    -- 문자형 데이터 (라벨, 명칭 등 - 최대 15개)
    -- VARCHAR2(500): LISTAGG 결과 등 긴 문자열 저장 가능
    STR_1           VARCHAR2(1000),                     -- 문자열1
    STR_2           VARCHAR2(1000),                     -- 문자열2
    STR_3           VARCHAR2(1000),                     -- 문자열3
    STR_4           VARCHAR2(1000),                     -- 문자열4
    STR_5           VARCHAR2(1000),                     -- 문자열5
    STR_6           VARCHAR2(1000),                     -- 문자열6
    STR_7           VARCHAR2(1000),                     -- 문자열7
    STR_8           VARCHAR2(1000),                     -- 문자열8
    STR_9           VARCHAR2(1000),                     -- 문자열9
    STR_10          VARCHAR2(1000),                     -- 문자열10
    STR_11          VARCHAR2(1000),                     -- 문자열11
    STR_12          VARCHAR2(1000),                     -- 문자열12
    STR_13          VARCHAR2(1000),                     -- 문자열13
    STR_14          VARCHAR2(1000),                     -- 문자열14
    STR_15          VARCHAR2(1000),                     -- 문자열15

    -- 관리 컬럼
    LOG_INS_DT      DATE DEFAULT SYSDATE,              -- 생성일 (UTC)

    CONSTRAINT PK_TS_INS_WEEK_SUB PRIMARY KEY (MASTER_SEQ, FARM_NO, GUBUN, SUB_GUBUN, SORT_NO),
    CONSTRAINT FK_TS_INS_WEEK_SUB FOREIGN KEY (MASTER_SEQ, FARM_NO)
        REFERENCES TS_INS_WEEK(MASTER_SEQ, FARM_NO) ON DELETE CASCADE
)
TABLESPACE PIGXE_DATA;

-- 인덱스
CREATE INDEX IDX_TS_INS_WEEK_SUB_01 ON TS_INS_WEEK_SUB(MASTER_SEQ, FARM_NO, GUBUN) TABLESPACE PIGXE_IDX;
CREATE INDEX IDX_TS_INS_WEEK_SUB_02 ON TS_INS_WEEK_SUB(MASTER_SEQ, FARM_NO, GUBUN, SUB_GUBUN) TABLESPACE PIGXE_IDX;

COMMENT ON TABLE TS_INS_WEEK_SUB IS '리포트 상세 테이블 (팝업 데이터)';
COMMENT ON COLUMN TS_INS_WEEK_SUB.MASTER_SEQ IS '마스터 일련번호 (FK)';
COMMENT ON COLUMN TS_INS_WEEK_SUB.FARM_NO IS '농장번호';
COMMENT ON COLUMN TS_INS_WEEK_SUB.GUBUN IS '데이터 구분코드 (팝업/섹션 식별: MODON, GB, BM, EU, SG, DOPE, SHIP, SCHEDULE)';
COMMENT ON COLUMN TS_INS_WEEK_SUB.SUB_GUBUN IS '세부 구분코드 (STAT:요약, LIST:목록, CHART:차트, ROW:행데이터)';
COMMENT ON COLUMN TS_INS_WEEK_SUB.SORT_NO IS '정렬순서';
COMMENT ON COLUMN TS_INS_WEEK_SUB.CODE_1 IS '1차 구분코드';
COMMENT ON COLUMN TS_INS_WEEK_SUB.CODE_2 IS '2차 구분코드';

-- ============================================================
-- 7. TS_INS_MGMT: 관리포인트 테이블
-- ============================================================
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE TS_INS_MGMT CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

CREATE TABLE TS_INS_MGMT (
    SEQ             NUMBER NOT NULL,                    -- 일련번호 (PK)
    MGMT_TYPE       VARCHAR2(20) NOT NULL,              -- 유형: QUIZ, HIGHLIGHT, RECOMMEND
    SORT_NO         INTEGER DEFAULT 0,                  -- 정렬순서
    TITLE           VARCHAR2(200) NOT NULL,             -- 카드 표시 제목 (한줄)
    CONTENT         CLOB,                               -- 상세 내용 (팝업 표시, TEXT/HTML)
    CONTENT_TYPE    VARCHAR2(10) DEFAULT 'TEXT',        -- 콘텐츠 타입 (TEXT/HTML)
    LINK_URL        VARCHAR2(500),                      -- 링크 URL (선택)
    LINK_TARGET     VARCHAR2(10) DEFAULT 'POPUP',       -- 링크 열기 방식 (POPUP/DIRECT)
    VIDEO_URL       VARCHAR2(500),                      -- 동영상 URL (선택)
    POST_FROM       DATE,                               -- 게시 시작일
    POST_TO         DATE,                               -- 게시 종료일
    USE_YN          CHAR(1) DEFAULT 'Y',                -- 사용여부
    REG_DT          DATE DEFAULT SYSDATE,               -- 등록일시
    UPD_DT          DATE,                               -- 수정일시

    CONSTRAINT PK_TS_INS_MGMT PRIMARY KEY (SEQ)
)
TABLESPACE PIGXE_DATA;

-- 시퀀스
CREATE SEQUENCE SEQ_TS_INS_MGMT START WITH 1 INCREMENT BY 1 NOCACHE;

-- 인덱스
CREATE INDEX IDX_TS_INS_MGMT_01 ON TS_INS_MGMT(MGMT_TYPE, USE_YN) TABLESPACE PIGXE_IDX;
CREATE INDEX IDX_TS_INS_MGMT_02 ON TS_INS_MGMT(POST_FROM, POST_TO) TABLESPACE PIGXE_IDX;

COMMENT ON TABLE TS_INS_MGMT IS '주간 관리포인트 테이블 (퀴즈/중점사항/추천학습자료) - 독립 테이블';
COMMENT ON COLUMN TS_INS_MGMT.SEQ IS '일련번호';
COMMENT ON COLUMN TS_INS_MGMT.MGMT_TYPE IS '유형 (QUIZ: 피그플랜 퀴즈&정보, HIGHLIGHT: 피그플랜 퀴즈&정보, RECOMMEND: 한돈&업계소식)';
COMMENT ON COLUMN TS_INS_MGMT.SORT_NO IS '정렬순서';
COMMENT ON COLUMN TS_INS_MGMT.TITLE IS '카드에 표시될 제목 (한줄)';
COMMENT ON COLUMN TS_INS_MGMT.CONTENT IS '상세 내용 (팝업에 표시, CLOB - TEXT/HTML 모두 저장 가능)';
COMMENT ON COLUMN TS_INS_MGMT.CONTENT_TYPE IS '콘텐츠 타입 (TEXT: 일반 텍스트, HTML: HTML 형식)';
COMMENT ON COLUMN TS_INS_MGMT.LINK_URL IS '링크 URL';
COMMENT ON COLUMN TS_INS_MGMT.LINK_TARGET IS '링크 열기 방식 (POPUP: 팝업, DIRECT: 새탭)';
COMMENT ON COLUMN TS_INS_MGMT.VIDEO_URL IS '동영상 URL';
COMMENT ON COLUMN TS_INS_MGMT.POST_FROM IS '게시 시작일';
COMMENT ON COLUMN TS_INS_MGMT.POST_TO IS '게시 종료일';
COMMENT ON COLUMN TS_INS_MGMT.USE_YN IS '사용여부 (Y/N)';
COMMENT ON COLUMN TS_INS_MGMT.REG_DT IS '등록일시';
COMMENT ON COLUMN TS_INS_MGMT.UPD_DT IS '수정일시';

-- ============================================================
-- 8. TS_INS_ACCESS_LOG: 접속 로그 테이블
--     - 로그인, 메뉴, 보고서 접속 로그 통합 관리
--     - 보관기간: 1년 (파티션 권장)
-- ============================================================
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE TS_INS_ACCESS_LOG CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

CREATE TABLE TS_INS_ACCESS_LOG (
    SEQ             NUMBER NOT NULL,                    -- 일련번호 (PK)

    -- 사용자 정보 (필수)
    MEMBER_ID       VARCHAR2(40) NOT NULL,              -- 회원ID
    FARM_NO         INTEGER NOT NULL,                   -- 농장번호

    -- 접속 유형 구분
    LOG_TYPE        VARCHAR2(20) NOT NULL,              -- 로그유형: LOGIN, LOGOUT, MENU, REPORT

    -- 상세 정보
    MENU_CD         VARCHAR2(50),                       -- 메뉴코드: 8자리 (WY000000, MY000000, QY000000, ST000000)
    REPORT_GB       VARCHAR2(10),                       -- 보고서구분: WEEK, MON, QT
    REPORT_SEQ      NUMBER,                             -- 보고서 일련번호
    ACCESS_GB       VARCHAR2(10),                       -- 접속경로: LIST, LINK, DIRECT

    -- 접속 환경 정보
    IP_ADDRESS      VARCHAR2(45),                       -- IP 주소 (IPv6 지원)
    USER_AGENT      VARCHAR2(500),                      -- User Agent
    DEVICE_TYPE     VARCHAR2(20),                       -- 디바이스: PC, MOBILE, TABLET
    BROWSER         VARCHAR2(50),                       -- 브라우저
    OS              VARCHAR2(50),                       -- 운영체제
    REFERER         VARCHAR2(500),                      -- 이전 페이지 URL

    -- 시간 정보
    ACCESS_DT       TIMESTAMP DEFAULT SYSTIMESTAMP,     -- 접속일시
    YEAR            VARCHAR2(4) AS (TO_CHAR(ACCESS_DT, 'YYYY')) VIRTUAL,  -- 년도 (가상컬럼)
    MONTH           VARCHAR2(2) AS (TO_CHAR(ACCESS_DT, 'MM')) VIRTUAL,    -- 월 (가상컬럼)

    -- 관리 컬럼
    LOG_INS_DT      DATE DEFAULT SYSDATE,              -- 생성일 (UTC)

    CONSTRAINT PK_TS_INS_ACCESS_LOG PRIMARY KEY (SEQ)
)
TABLESPACE PIGXE_DATA;

-- 인덱스
CREATE INDEX IDX_TS_INS_ACCESS_LOG_01 ON TS_INS_ACCESS_LOG(MEMBER_ID, ACCESS_DT) TABLESPACE PIGXE_IDX;
CREATE INDEX IDX_TS_INS_ACCESS_LOG_02 ON TS_INS_ACCESS_LOG(FARM_NO, ACCESS_DT) TABLESPACE PIGXE_IDX;
CREATE INDEX IDX_TS_INS_ACCESS_LOG_03 ON TS_INS_ACCESS_LOG(LOG_TYPE, ACCESS_DT) TABLESPACE PIGXE_IDX;
CREATE INDEX IDX_TS_INS_ACCESS_LOG_04 ON TS_INS_ACCESS_LOG(YEAR, MONTH) TABLESPACE PIGXE_IDX;
CREATE INDEX IDX_TS_INS_ACCESS_LOG_05 ON TS_INS_ACCESS_LOG(REPORT_GB, REPORT_SEQ) TABLESPACE PIGXE_IDX;
CREATE INDEX IDX_TS_INS_ACCESS_LOG_06 ON TS_INS_ACCESS_LOG(ACCESS_DT) TABLESPACE PIGXE_IDX;

COMMENT ON TABLE TS_INS_ACCESS_LOG IS '인사이트피그플랜 접속 로그 테이블 (1년 보관)';
COMMENT ON COLUMN TS_INS_ACCESS_LOG.SEQ IS '일련번호';
COMMENT ON COLUMN TS_INS_ACCESS_LOG.MEMBER_ID IS '회원ID';
COMMENT ON COLUMN TS_INS_ACCESS_LOG.FARM_NO IS '농장번호';
COMMENT ON COLUMN TS_INS_ACCESS_LOG.LOG_TYPE IS '로그유형 (LOGIN:로그인, LOGOUT:로그아웃, MENU:메뉴, REPORT:보고서)';
COMMENT ON COLUMN TS_INS_ACCESS_LOG.MENU_CD IS '메뉴코드 8자리 (WY:주간, MY:월간, QY:분기, ST:설정)';
COMMENT ON COLUMN TS_INS_ACCESS_LOG.REPORT_GB IS '보고서구분 (WEEK:주간, MON:월간, QT:분기)';
COMMENT ON COLUMN TS_INS_ACCESS_LOG.REPORT_SEQ IS '보고서 일련번호 (TS_INS_MASTER.SEQ)';
COMMENT ON COLUMN TS_INS_ACCESS_LOG.ACCESS_GB IS '접속경로 (LIST:리스트, LINK:링크, DIRECT:직접URL)';
COMMENT ON COLUMN TS_INS_ACCESS_LOG.IP_ADDRESS IS 'IP 주소 (IPv6 지원)';
COMMENT ON COLUMN TS_INS_ACCESS_LOG.USER_AGENT IS 'User Agent';
COMMENT ON COLUMN TS_INS_ACCESS_LOG.DEVICE_TYPE IS '디바이스 유형 (PC, MOBILE, TABLET)';
COMMENT ON COLUMN TS_INS_ACCESS_LOG.BROWSER IS '브라우저';
COMMENT ON COLUMN TS_INS_ACCESS_LOG.OS IS '운영체제';
COMMENT ON COLUMN TS_INS_ACCESS_LOG.REFERER IS '이전 페이지 URL';
COMMENT ON COLUMN TS_INS_ACCESS_LOG.ACCESS_DT IS '접속일시';
COMMENT ON COLUMN TS_INS_ACCESS_LOG.YEAR IS '년도 (가상컬럼)';
COMMENT ON COLUMN TS_INS_ACCESS_LOG.MONTH IS '월 (가상컬럼)';

-- ============================================================
-- 테이블 생성 확인
-- ============================================================
SELECT TABLE_NAME, NUM_ROWS, LAST_ANALYZED
FROM USER_TABLES
WHERE TABLE_NAME IN (
    'TA_SYS_CONFIG',
    'TS_INS_SERVICE',
    'TS_INS_MASTER',
    'TS_INS_JOB_LOG',
    'TS_INS_WEEK',
    'TS_INS_WEEK_SUB',
    'TS_INS_MGMT',
    'TS_INS_ACCESS_LOG'
)
ORDER BY TABLE_NAME;
