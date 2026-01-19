-- ============================================================
-- TS_INS_CONF: 인사이트피그 설정 테이블
-- 농장별 주간보고서 설정 (금주 작업예정 산정 방식 등)
--
-- 실행 순서: 02_TABLE.sql 실행 후 실행
-- 대상 Oracle: 19c
-- ============================================================

-- ============================================================
-- 1. TS_INS_CONF: 농장별 인사이트피그 설정 테이블
-- ============================================================
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE TS_INS_CONF CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

CREATE TABLE TS_INS_CONF (
    FARM_NO         INTEGER NOT NULL,                   -- 농장번호 (PK, FK)

    -- 금주 작업예정 산정 방식 (JSON 형식)
    -- 형식: {"method": "JOB"|"MODON", "tasks": ["SEQ1", "SEQ2", ...]}
    -- JOB: 농장 기본값 사용
    -- MODON: 모돈 작업설정 사용 (tasks에 선택된 SOW_JOB_CFG_SEQ 목록)
    WEEK_TW_GY      VARCHAR2(500) DEFAULT '{"method":"JOB"}',  -- 교배 예정 산정 방식
    WEEK_TW_BM      VARCHAR2(500) DEFAULT '{"method":"JOB"}',  -- 분만 예정 산정 방식
    WEEK_TW_IM      VARCHAR2(500) DEFAULT '{"method":"JOB"}',  -- 임신감정(진단) 예정 산정 방식
    WEEK_TW_EU      VARCHAR2(500) DEFAULT '{"method":"JOB"}',  -- 이유 예정 산정 방식
    WEEK_TW_VC      VARCHAR2(500) DEFAULT '{"method":"JOB"}',  -- 모돈백신 예정 산정 방식

    -- 관리 컬럼
    LOG_INS_DT      DATE DEFAULT SYSDATE,              -- 생성일 (UTC)
    LOG_UPT_DT      DATE,                              -- 수정일 (UTC)

    CONSTRAINT PK_TS_INS_CONF PRIMARY KEY (FARM_NO),
    CONSTRAINT FK_TS_INS_CONF_FARM FOREIGN KEY (FARM_NO)
        REFERENCES TA_FARM(FARM_NO) ON DELETE CASCADE
)
TABLESPACE PIGXE_DATA;

COMMENT ON TABLE TS_INS_CONF IS '인사이트피그 농장별 설정 테이블';
COMMENT ON COLUMN TS_INS_CONF.FARM_NO IS '농장번호 (FK → TA_FARM)';
COMMENT ON COLUMN TS_INS_CONF.WEEK_TW_GY IS '교배 예정 산정 방식 (JSON: method=JOB|MODON, tasks=[])';
COMMENT ON COLUMN TS_INS_CONF.WEEK_TW_BM IS '분만 예정 산정 방식 (JSON: method=JOB|MODON, tasks=[])';
COMMENT ON COLUMN TS_INS_CONF.WEEK_TW_IM IS '임신감정(진단) 예정 산정 방식 (JSON: method=JOB|MODON, tasks=[])';
COMMENT ON COLUMN TS_INS_CONF.WEEK_TW_EU IS '이유 예정 산정 방식 (JSON: method=JOB|MODON, tasks=[])';
COMMENT ON COLUMN TS_INS_CONF.WEEK_TW_VC IS '모돈백신 예정 산정 방식 (JSON: method=JOB|MODON, tasks=[])';
COMMENT ON COLUMN TS_INS_CONF.LOG_INS_DT IS '생성일';
COMMENT ON COLUMN TS_INS_CONF.LOG_UPT_DT IS '수정일';

-- ============================================================
-- JSON 구조 설명
-- ============================================================
/*
WEEK_TW_* 컬럼 JSON 형식:

1. 농장 기본값 사용 (기본값)
   {"method":"JOB"}

2. 모돈 작업설정 사용 (전체 작업)
   {"method":"MODON"}

3. 모돈 작업설정 사용 (일부 작업 선택)
   {"method":"MODON","tasks":["101","102","105"]}

   - tasks: TB_SOW_JOB_CFG.SOW_JOB_CFG_SEQ 목록
   - 배열이 비어있거나 없으면 전체 작업 선택으로 간주

작업 구분 코드:
- WEEK_TW_GY: 교배 (mating)
- WEEK_TW_BM: 분만 (farrowing)
- WEEK_TW_IM: 임신감정/진단 (pregnancyCheck) - 재발확인 + 임신진단
- WEEK_TW_EU: 이유 (weaning)
- WEEK_TW_VC: 모돈백신 (vaccine)

참조 테이블:
- TB_SOW_JOB_CFG: 피그플랜 모돈 작업설정 테이블
  - SOW_JOB_CFG_SEQ: 작업 고유번호 (tasks 배열에 저장)
  - FARM_NO: 농장번호
  - JOB_GB: 작업구분 (GB:교배, BM:분만, IM:임신, EU:이유, VC:백신 등)
  - JOB_NM: 작업명
*/

-- ============================================================
-- Oracle JSON 활용 예시 (Oracle 12c 이상)
-- ============================================================
/*
-- 1. method 값 조회
SELECT FARM_NO,
       JSON_VALUE(WEEK_TW_GY, '$.method') AS GY_METHOD,
       JSON_VALUE(WEEK_TW_BM, '$.method') AS BM_METHOD
FROM TS_INS_CONF
WHERE FARM_NO = 1234;

-- 2. tasks 배열 존재 여부 확인
SELECT FARM_NO,
       CASE WHEN JSON_EXISTS(WEEK_TW_GY, '$.tasks') THEN 'Y' ELSE 'N' END AS HAS_TASKS
FROM TS_INS_CONF;

-- 3. tasks 배열 요소 개수 조회
SELECT FARM_NO,
       JSON_VALUE(WEEK_TW_GY, '$.tasks.size()' RETURNING NUMBER) AS TASK_CNT
FROM TS_INS_CONF
WHERE JSON_VALUE(WEEK_TW_GY, '$.method') = 'MODON';

-- 4. tasks 배열을 행으로 변환 (UNNEST)
SELECT C.FARM_NO, T.TASK_SEQ
FROM TS_INS_CONF C,
     JSON_TABLE(C.WEEK_TW_GY, '$.tasks[*]'
         COLUMNS (TASK_SEQ VARCHAR2(20) PATH '$')
     ) T
WHERE JSON_VALUE(C.WEEK_TW_GY, '$.method') = 'MODON';

-- 5. 특정 작업 포함 여부 확인
SELECT FARM_NO
FROM TS_INS_CONF
WHERE JSON_VALUE(WEEK_TW_GY, '$.method') = 'MODON'
  AND JSON_EXISTS(WEEK_TW_GY, '$.tasks[*]?(@ == "101")');
*/

-- ============================================================
-- INSERT/UPDATE 예시
-- ============================================================
/*
-- 신규 농장 설정 추가 (기본값)
INSERT INTO TS_INS_CONF (FARM_NO)
VALUES (1234);

-- 교배를 모돈 작업설정으로 변경 (전체 작업)
UPDATE TS_INS_CONF
SET WEEK_TW_GY = '{"method":"MODON"}',
    LOG_UPT_DT = SYSDATE
WHERE FARM_NO = 1234;

-- 교배를 모돈 작업설정으로 변경 (일부 작업만)
UPDATE TS_INS_CONF
SET WEEK_TW_GY = '{"method":"MODON","tasks":["101","102"]}',
    LOG_UPT_DT = SYSDATE
WHERE FARM_NO = 1234;

-- 농장 기본값으로 복원
UPDATE TS_INS_CONF
SET WEEK_TW_GY = '{"method":"JOB"}',
    LOG_UPT_DT = SYSDATE
WHERE FARM_NO = 1234;
*/

-- ============================================================
-- 테이블 생성 확인
-- ============================================================
SELECT TABLE_NAME, NUM_ROWS, LAST_ANALYZED
FROM USER_TABLES
WHERE TABLE_NAME = 'TS_INS_CONF';
