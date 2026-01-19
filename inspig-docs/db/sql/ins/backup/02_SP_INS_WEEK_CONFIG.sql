-- ============================================================
-- SP_INS_WEEK_CONFIG: 농장 설정값 저장 프로시저
--
-- 상세 문서: docs/db/ins/week/02.config.md
--
-- 역할:
--   - 농장별 설정값을 TS_INS_WEEK_SUB에 1ROW로 저장
--   - 다른 프로시저(ALERT, SHIP, SCHEDULE 등)에서 이 값을 조회하여 사용
--   - 프론트엔드 info-note 헬프 메시지 표시용 데이터 제공
--
-- ★ 중요: 다른 프로시저에서 직접 TC_CODE_SYS/TC_FARM_CONFIG 조회하지 않음
--         SP_INS_WEEK_CONFIG에서 한 번에 저장 → 각 프로시저에서 조회
--
-- 데이터 구조:
--   - TS_INS_WEEK_SUB (GUBUN='CONFIG', 1ROW)
--
-- DB 컬럼 매핑 (개별 컬럼):
--   - CNT_1: 140002 평균임신기간 (기본 115)
--   - CNT_2: 140003 평균포유기간 (기본 21)
--   - CNT_3: 140005 기준출하일령 (기본 180)
--   - CNT_4: 140007 후보돈초교배일령 (기본 240)
--   - CNT_5: 140008 평균재귀일 (기본 7)
--   - VAL_1: 이유후육성율 (6개월 평균, 기본 90%)
--
-- DB 컬럼 매핑 (JSON - 프론트엔드용):
--   - STR_1: 코드 목록 (JSON 배열) - ["140002","140003",...]
--   - STR_2: 코드명 목록 (JSON 배열) - ["평균임신기간","평균포유기간",...]
--   - STR_3: 적용값 목록 (JSON 배열) - [115,21,...]
--
-- DB 컬럼 매핑 (이유후육성율 계산 기간):
--   - STR_4: 이유후육성율 계산 시작월 (YY.MM 형식, 예: "24.06")
--   - STR_5: 이유후육성율 계산 종료월 (YY.MM 형식, 예: "24.11")
--   ※ 이유후육성율은 최근 6개월간의 출하두수/이유두수 평균 (당월 제외)
--
-- 등록 대상 코드 (9개):
--   140002: 평균임신기간 (기본 115) → CNT_1
--   140003: 평균포유기간 (기본 21) → CNT_2
--   140004: 기준출하체중 (기본 110)
--   140005: 기준출하일령 (기본 180) → CNT_3
--   140006: 후보돈초발정체크일령 (기본 180)
--   140007: 후보돈초교배일령 (기본 240) → CNT_4
--   140008: 평균재귀일 (기본 7) → CNT_5
--   140012: 기준규격체중 (기본 100)
--   140018: 후보돈초교배평균재발정일 (기본 20)
-- ============================================================

CREATE OR REPLACE PROCEDURE SP_INS_WEEK_CONFIG (
    P_MASTER_SEQ    IN  NUMBER,
    P_JOB_NM        IN  VARCHAR2,
    P_FARM_NO       IN  INTEGER,
    P_LOCALE        IN  VARCHAR2
) AS
    V_LOG_SEQ       NUMBER;
    V_PROC_CNT      INTEGER := 0;

    -- JSON 문자열 변수 (프론트엔드용)
    V_CODES         VARCHAR2(500);
    V_NAMES         VARCHAR2(1000);
    V_VALUES        VARCHAR2(500);

    -- 개별 설정값 변수 (다른 프로시저에서 조회용)
    V_PREG_PERIOD   INTEGER := 115;   -- 140002: 평균임신기간
    V_WEAN_PERIOD   INTEGER := 21;    -- 140003: 평균포유기간
    V_SHIP_DAY      INTEGER := 180;   -- 140005: 기준출하일령
    V_FIRST_GB_DAY  INTEGER := 240;   -- 140007: 후보돈초교배일령
    V_AVG_RETURN    INTEGER := 7;     -- 140008: 평균재귀일
    V_REARING_RATE  NUMBER := 90;     -- 이유후육성율 (6개월 평균)
    V_SHIP_OFFSET   INTEGER := 159;   -- 출하→이유 역산일 (V_SHIP_DAY - V_WEAN_PERIOD)
    V_RATE_FROM     VARCHAR2(10);     -- 이유후육성율 계산 시작월 (YY.MM)
    V_RATE_TO       VARCHAR2(10);     -- 이유후육성율 계산 종료월 (YY.MM)

BEGIN
    -- 로그 시작
    SP_INS_COM_LOG_START(P_MASTER_SEQ, P_JOB_NM, 'SP_INS_WEEK_CONFIG', P_FARM_NO, V_LOG_SEQ);

    -- ================================================
    -- 1. 기존 데이터 삭제 (GUBUN='CONFIG')
    -- ================================================
    DELETE FROM TS_INS_WEEK_SUB
    WHERE MASTER_SEQ = P_MASTER_SEQ
      AND FARM_NO = P_FARM_NO
      AND GUBUN = 'CONFIG';

    -- ================================================
    -- 2. 농장 설정값 조회 (개별 컬럼 + JSON 배열)
    --    TC_CODE_SYS: 시스템 기본값 (CVALUE → ORIGIN_VALUE)
    --    TC_FARM_CONFIG: 농장별 설정값 - 없으면 시스템 기본값 사용
    -- ================================================
    BEGIN
        SELECT
            -- 개별 설정값 (다른 프로시저에서 조회용)
            NVL(MAX(CASE WHEN TA1.CODE = '140002' THEN TO_NUMBER(NVL(TA2.CVALUE, TA1.ORIGIN_VALUE)) END), 115),
            NVL(MAX(CASE WHEN TA1.CODE = '140003' THEN TO_NUMBER(NVL(TA2.CVALUE, TA1.ORIGIN_VALUE)) END), 21),
            NVL(MAX(CASE WHEN TA1.CODE = '140005' THEN TO_NUMBER(NVL(TA2.CVALUE, TA1.ORIGIN_VALUE)) END), 180),
            NVL(MAX(CASE WHEN TA1.CODE = '140007' THEN TO_NUMBER(NVL(TA2.CVALUE, TA1.ORIGIN_VALUE)) END), 240),
            NVL(MAX(CASE WHEN TA1.CODE = '140008' THEN TO_NUMBER(NVL(TA2.CVALUE, TA1.ORIGIN_VALUE)) END), 7)
        INTO V_PREG_PERIOD, V_WEAN_PERIOD, V_SHIP_DAY, V_FIRST_GB_DAY, V_AVG_RETURN
        FROM (
            SELECT T1.CODE, T1.CVALUE AS ORIGIN_VALUE
            FROM TC_CODE_SYS T1
            WHERE T1.PCODE = '14'
              AND T1.CODE IN ('140002', '140003', '140005', '140007', '140008')
              AND T1.LANGUAGE_CD = 'ko'
              AND T1.USE_YN = 'Y'
        ) TA1
        LEFT OUTER JOIN TC_FARM_CONFIG TA2
            ON TA1.CODE = TA2.CODE
           AND TA2.FARM_NO = P_FARM_NO
           AND TA2.USE_YN = 'Y';
    EXCEPTION
        WHEN OTHERS THEN
            V_PREG_PERIOD := 115;
            V_WEAN_PERIOD := 21;
            V_SHIP_DAY := 180;
            V_FIRST_GB_DAY := 240;
            V_AVG_RETURN := 7;
    END;
    V_SHIP_OFFSET := V_SHIP_DAY - V_WEAN_PERIOD;

    -- JSON 배열 생성 (프론트엔드용)
    SELECT
        '[' || LISTAGG('"' || CODE || '"', ',') WITHIN GROUP (ORDER BY SORT_NO) || ']',
        '[' || LISTAGG('"' || CNAME || '"', ',') WITHIN GROUP (ORDER BY SORT_NO) || ']',
        '[' || LISTAGG(CVALUE, ',') WITHIN GROUP (ORDER BY SORT_NO) || ']'
    INTO V_CODES, V_NAMES, V_VALUES
    FROM (
        SELECT
            TA1.CODE,
            TA1.CNAME,
            NVL(TA2.CVALUE, TA1.ORIGIN_VALUE) AS CVALUE,
            TA1.SORT_NO
        FROM (
            SELECT T1.CODE, T1.CNAME, T1.CVALUE AS ORIGIN_VALUE, T1.SORT_NO
            FROM TC_CODE_SYS T1
            WHERE T1.PCODE = '14'
              AND T1.CODE IN ('140002', '140003', '140004', '140005', '140006',
                              '140007', '140008', '140012', '140018')
              AND T1.LANGUAGE_CD = 'ko'
              AND T1.USE_YN = 'Y'
        ) TA1
        LEFT OUTER JOIN TC_FARM_CONFIG TA2
            ON TA1.CODE = TA2.CODE
           AND TA2.FARM_NO = P_FARM_NO
           AND TA2.USE_YN = 'Y'
    );

    -- ================================================
    -- 2-1. 이유후육성율 계산 (최근 6개월)
    -- ================================================
    BEGIN

        WITH RAW_DATA AS (
            -- 1. 출하 데이터 집계 (최근 6개월, 당월 제외)
            SELECT SUBSTR(REPLACE(L.DOCHUK_DT, '-', ''), 1, 6) AS YM,
                   COUNT(*) AS SHIP_CNT,
                   0 AS WEAN_CNT
            FROM TM_LPD_DATA L
            WHERE L.FARM_NO = P_FARM_NO 
              AND L.USE_YN = 'Y'
              AND L.DOCHUK_DT >= TO_CHAR(ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -6), 'YYYY-MM-DD')
              AND L.DOCHUK_DT <  TO_CHAR(TRUNC(SYSDATE, 'MM'), 'YYYY-MM-DD')
            GROUP BY SUBSTR(REPLACE(L.DOCHUK_DT, '-', ''), 1, 6)
            UNION ALL
            -- 2. 이유 데이터 집계 (출하일령 Offset 반영하여 역산)
            --    이유일 + Offset = 예상출하일 -> 해당 월의 실적과 매칭
            SELECT TO_CHAR(TO_DATE(E.WK_DT, 'YYYYMMDD') + V_SHIP_OFFSET, 'YYYYMM') AS YM,
                   0 AS SHIP_CNT,
                   SUM(NVL(E.DUSU, 0) + NVL(E.DUSU_SU, 0)) AS WEAN_CNT
            FROM TB_EU E
            WHERE E.FARM_NO = P_FARM_NO 
              AND E.USE_YN = 'Y'
              AND E.WK_DT >= TO_CHAR(ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -6) - V_SHIP_OFFSET, 'YYYYMMDD')
              AND E.WK_DT <  TO_CHAR(TRUNC(SYSDATE, 'MM') - V_SHIP_OFFSET, 'YYYYMMDD')
            GROUP BY TO_CHAR(TO_DATE(E.WK_DT, 'YYYYMMDD') + V_SHIP_OFFSET, 'YYYYMM')
        ),
        MONTHLY_STATS AS (
            -- 월별로 출하/이유 합산
            SELECT YM, 
                   SUM(SHIP_CNT) AS SHIP_CNT, 
                   SUM(WEAN_CNT) AS WEAN_CNT
            FROM RAW_DATA
            GROUP BY YM
        )
        -- 월별 이유후육성율의 평균 계산
        SELECT ROUND(AVG(CASE WHEN WEAN_CNT > 0 THEN SHIP_CNT / WEAN_CNT * 100 END), 1)
        INTO V_REARING_RATE
        FROM MONTHLY_STATS;
    EXCEPTION
        WHEN OTHERS THEN
            V_REARING_RATE := 90;
    END;

    IF V_REARING_RATE IS NULL THEN
        V_REARING_RATE := 90;
    END IF;

    -- 이유후육성율 계산 기간 설정 (최근 6개월, 당월 제외)
    V_RATE_FROM := TO_CHAR(ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -6), 'YY.MM');
    V_RATE_TO := TO_CHAR(ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -1), 'YY.MM');

    -- JSON에 이유후육성율 추가
    V_CODES := SUBSTR(V_CODES, 1, LENGTH(V_CODES)-1) || ',"REARING_RATE"]';
    V_NAMES := SUBSTR(V_NAMES, 1, LENGTH(V_NAMES)-1) || ',"이유후육성율(6개월)"]';
    V_VALUES := SUBSTR(V_VALUES, 1, LENGTH(V_VALUES)-1) || ',' || V_REARING_RATE || ']';

    -- ================================================
    -- 3. 1ROW INSERT (GUBUN='CONFIG')
    --    개별 컬럼: CNT_1~CNT_5 (다른 프로시저에서 조회용)
    --    JSON: STR_1~STR_3 (프론트엔드용)
    --    STR_4~STR_5: 이유후육성율 계산 기간 (YY.MM 형식)
    -- ================================================
    INSERT INTO TS_INS_WEEK_SUB (
        MASTER_SEQ, FARM_NO, GUBUN, SORT_NO,
        CNT_1, CNT_2, CNT_3, CNT_4, CNT_5, VAL_1,
        STR_1, STR_2, STR_3, STR_4, STR_5
    ) VALUES (
        P_MASTER_SEQ,
        P_FARM_NO,
        'CONFIG',
        1,
        V_PREG_PERIOD,   -- CNT_1: 140002 평균임신기간
        V_WEAN_PERIOD,   -- CNT_2: 140003 평균포유기간
        V_SHIP_DAY,      -- CNT_3: 140005 기준출하일령
        V_FIRST_GB_DAY,  -- CNT_4: 140007 후보돈초교배일령
        V_AVG_RETURN,    -- CNT_5: 140008 평균재귀일
        V_REARING_RATE,  -- VAL_1: 이유후육성율 (6개월 평균)
        V_CODES,         -- STR_1: 코드 목록 JSON
        V_NAMES,         -- STR_2: 코드명 목록 JSON
        V_VALUES,        -- STR_3: 적용값 목록 JSON
        V_RATE_FROM,     -- STR_4: 이유후육성율 계산 시작월 (YY.MM)
        V_RATE_TO        -- STR_5: 이유후육성율 계산 종료월 (YY.MM)
    );

    V_PROC_CNT := 1;

    COMMIT;
    SP_INS_COM_LOG_END(V_LOG_SEQ, V_PROC_CNT);

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        SP_INS_COM_LOG_ERROR(V_LOG_SEQ, SQLCODE, SQLERRM);
        RAISE;
END SP_INS_WEEK_CONFIG;
/

-- 프로시저 확인
SELECT OBJECT_NAME, STATUS FROM USER_OBJECTS WHERE OBJECT_NAME = 'SP_INS_WEEK_CONFIG';
