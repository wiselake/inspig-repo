-- ============================================================
-- SP_INS_WEEK_SCHEDULE_POPUP: 금주 작업예정 데이터 추출 프로시저
--
-- 상세 문서: docs/db/ins/week/51.schedule-popup.md
--
-- 데이터 구조:
--   - TS_INS_WEEK_SUB (GUBUN='SCHEDULE', SUB_GUBUN='-'): 작업예정 요약 (합계)
--   - TS_INS_WEEK_SUB (GUBUN='SCHEDULE', SUB_GUBUN='CAL'): 캘린더 그리드 (요일별)
--   - TS_INS_WEEK_SUB (GUBUN='SCHEDULE', SUB_GUBUN='GB'): 교배예정 팝업 상세
--   - TS_INS_WEEK_SUB (GUBUN='SCHEDULE', SUB_GUBUN='BM'): 분만예정 팝업 상세
--   - TS_INS_WEEK_SUB (GUBUN='SCHEDULE', SUB_GUBUN='EU'): 이유예정 팝업 상세
--   - TS_INS_WEEK_SUB (GUBUN='SCHEDULE', SUB_GUBUN='VACCINE'): 백신예정 팝업 상세
--   - TS_INS_WEEK_SUB (GUBUN='SCHEDULE', SUB_GUBUN='HELP'): 산출기준 도움말 (1ROW)
--
-- DB 컬럼 매핑 (SUB_GUBUN='-'):
--   - CNT_1: GB_SUM (교배예정 합계)
--   - CNT_2: IMSIN_SUM (재발확인 합계 = 3주 + 4주)
--   - CNT_3: BM_SUM (분만예정 합계)
--   - CNT_4: EU_SUM (이유예정 합계)
--   - CNT_5: VACCINE_SUM (모돈백신 합계)
--   - CNT_6: SHIP_SUM (출하예정 두수)
--   - STR_1: PERIOD_FROM (시작일 MM.DD)
--   - STR_2: PERIOD_TO (종료일 MM.DD)
--   - CNT_7: WEEK_NUM (주차)
--
-- DB 컬럼 매핑 (SUB_GUBUN='CAL'):
--   - CODE_1: 작업구분 (GB, BM, IMSIN_3W, IMSIN_4W, EU, VACCINE)
--   - STR_1~STR_7: 요일별 날짜 (DD)
--   - CNT_1~CNT_7: 월~일 예정 복수
--   - SORT_NO: 1=GB, 2=BM, 3=IMSIN_3W, 4=IMSIN_4W, 5=EU, 6=VACCINE
--
-- DB 컬럼 매핑 (SUB_GUBUN='HELP'):
--   - STR_1: 교배 산출기준 (예: "이유후교배(7일),사고후교배(0일)")
--   - STR_2: 분만 산출기준 (예: "분만예정(115일)")
--   - STR_3: 이유 산출기준 (예: "이유예정(21일)")
--   - STR_4: 백신 산출기준 (예: "분만전백신(-7일)")
--   - STR_5: 출하 산출기준 (예: "이유일+(180-21)=159일")
--   - STR_6: 재발확인 산출기준 (고정: "교배일+21일/28일")
--
-- [예정작업 기준]
-- - 교배예정 (150005): 후보돈(010001) + 이유돈(010005) + 사고돈(010006, 010007)
-- - 분만예정 (150002): 임신돈(010002)
-- - 이유예정 (150003): 포유돈(010003) + 대리모돈(010004)
-- - 백신예정 (150004): 전체 모돈
-- - 출하예정: TB_EU 이유두수 기준, 이유일 + (기준출하일령 - 평균포유기간) = 출하예정일
--
-- [재발확인 기준]
-- - 마지막 작업이 교배(G)인 모돈
-- - 3주령: 교배 후 18~24일 (21일 ± 3일)
-- - 4주령: 교배 후 25~31일 (28일 ± 3일)
--
-- [출하예정 산출 기준]
-- - TC_FARM_CONFIG 참조: 140005(기준출하일령, 기본 180) - 140003(평균포유기간, 기본 21)
-- - 이유일 + (기준출하일령 - 평균포유기간) = 출하예정일
-- - 예: 이유일 + (180 - 21) = 이유일 + 159일 = 출하예정일
-- - 출하예정 두수 = 이유두수 * 90% (이유후육성율)
-- ============================================================

CREATE OR REPLACE PROCEDURE SP_INS_WEEK_SCHEDULE_POPUP (
    P_MASTER_SEQ    IN  NUMBER,
    P_JOB_NM        IN  VARCHAR2,
    P_FARM_NO       IN  INTEGER,
    P_LOCALE        IN  VARCHAR2,
    P_DT_FROM       IN  VARCHAR2,       -- 금주 시작일 YYYYMMDD
    P_DT_TO         IN  VARCHAR2        -- 금주 종료일 YYYYMMDD
) AS
    V_LOG_SEQ       NUMBER;
    V_PROC_CNT      INTEGER := 0;

    -- 날짜 변환용
    V_SDT           VARCHAR2(10);
    V_EDT           VARCHAR2(10);
    V_DT_FROM       DATE;
    V_DT_TO         DATE;

    -- 주차 정보
    V_WEEK_NUM      INTEGER := 0;
    V_PERIOD_FROM   VARCHAR2(10);
    V_PERIOD_TO     VARCHAR2(10);

    -- 예정 합계 변수
    V_GB_SUM        INTEGER := 0;
    V_IMSIN_SUM     INTEGER := 0;
    V_BM_SUM        INTEGER := 0;
    V_EU_SUM        INTEGER := 0;
    V_VACCINE_SUM   INTEGER := 0;
    V_SHIP_SUM      INTEGER := 0;

    -- 출하예정 계산용 농장 설정값
    V_SHIP_DAY      INTEGER := 180;  -- 기준출하일령 (140005)
    V_WEAN_PERIOD   INTEGER := 21;   -- 평균포유기간 (140003)
    V_SHIP_OFFSET   INTEGER := 159;  -- 이유→출하 경과일 (V_SHIP_DAY - V_WEAN_PERIOD)
    V_REARING_RATE  NUMBER := 90;    -- 이유후육성율 (CONFIG에서 조회)
    V_RATE_FROM     VARCHAR2(10);    -- 이유후육성율 계산 시작월 (YY.MM)
    V_RATE_TO       VARCHAR2(10);    -- 이유후육성율 계산 종료월 (YY.MM)

    -- 요일별 날짜 배열 (월~일)
    TYPE T_DATE_ARR IS TABLE OF DATE INDEX BY PLS_INTEGER;
    V_DATES         T_DATE_ARR;

    -- 요일별 카운트 배열
    TYPE T_CNT_ARR IS TABLE OF INTEGER INDEX BY PLS_INTEGER;
    V_GB_ARR        T_CNT_ARR;
    V_BM_ARR        T_CNT_ARR;
    V_IMSIN3W_ARR   T_CNT_ARR;
    V_IMSIN4W_ARR   T_CNT_ARR;
    V_EU_ARR        T_CNT_ARR;
    V_VACCINE_ARR   T_CNT_ARR;

BEGIN
    -- 로그 시작
    SP_INS_COM_LOG_START(P_MASTER_SEQ, P_JOB_NM, 'SP_INS_WEEK_SCHEDULE_POPUP', P_FARM_NO, V_LOG_SEQ);

    -- 날짜 변환
    V_DT_FROM := TO_DATE(P_DT_FROM, 'YYYYMMDD');
    V_DT_TO := TO_DATE(P_DT_TO, 'YYYYMMDD');

    -- FN_MD_SCHEDULE_BSE_2020용 날짜 포맷 (yyyy-MM-dd)
    V_SDT := SUBSTR(P_DT_FROM, 1, 4) || '-' || SUBSTR(P_DT_FROM, 5, 2) || '-' || SUBSTR(P_DT_FROM, 7, 2);
    V_EDT := SUBSTR(P_DT_TO, 1, 4) || '-' || SUBSTR(P_DT_TO, 5, 2) || '-' || SUBSTR(P_DT_TO, 7, 2);

    -- ================================================
    -- 농장 설정값 조회 (SP_INS_WEEK_CONFIG에서 저장한 값)
    -- ★ TC_CODE_SYS/TC_FARM_CONFIG 직접 조회 제거
    --    → TS_INS_WEEK_SUB (GUBUN='CONFIG')에서 조회
    -- ================================================
    BEGIN
        SELECT NVL(CNT_3, 180),  -- 기준출하일령
               NVL(CNT_2, 21),   -- 평균포유기간
               NVL(VAL_1, 90),   -- 이유후육성율 (6개월 평균)
               STR_4,            -- 이유후육성율 계산 시작월 (YY.MM)
               STR_5             -- 이유후육성율 계산 종료월 (YY.MM)
        INTO V_SHIP_DAY, V_WEAN_PERIOD, V_REARING_RATE, V_RATE_FROM, V_RATE_TO
        FROM TS_INS_WEEK_SUB
        WHERE MASTER_SEQ = P_MASTER_SEQ
          AND FARM_NO = P_FARM_NO
          AND GUBUN = 'CONFIG';
    EXCEPTION
        WHEN OTHERS THEN
            V_SHIP_DAY := 180;
            V_WEAN_PERIOD := 21;
            V_REARING_RATE := 90;
            V_RATE_FROM := TO_CHAR(ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -6), 'YY.MM');
            V_RATE_TO := TO_CHAR(ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -1), 'YY.MM');
    END;
    V_SHIP_OFFSET := V_SHIP_DAY - V_WEAN_PERIOD;

    -- 주차 정보 (ISO 주차 기준)
    V_WEEK_NUM := TO_NUMBER(TO_CHAR(V_DT_FROM, 'IW'));
    V_PERIOD_FROM := TO_CHAR(V_DT_FROM, 'MM.DD');
    V_PERIOD_TO := TO_CHAR(V_DT_TO, 'MM.DD');

    -- 요일별 날짜 초기화 (월~일 = 1~7)
    FOR i IN 1..7 LOOP
        V_DATES(i) := V_DT_FROM + (i - 1);
        V_GB_ARR(i) := 0;
        V_BM_ARR(i) := 0;
        V_IMSIN3W_ARR(i) := 0;
        V_IMSIN4W_ARR(i) := 0;
        V_EU_ARR(i) := 0;
        V_VACCINE_ARR(i) := 0;
    END LOOP;

    -- ================================================
    -- 1. 기존 데이터 삭제 (GUBUN='SCHEDULE'만 삭제 - SUB_GUBUN으로 구분)
    -- ================================================
    DELETE FROM TS_INS_WEEK_SUB
    WHERE MASTER_SEQ = P_MASTER_SEQ
      AND FARM_NO = P_FARM_NO
      AND GUBUN = 'SCHEDULE';

    -- ================================================
    -- 2. 교배예정 (FN_MD_SCHEDULE_BSE_2020, 150005)
    --    후보돈(010001) + 이유돈(010005) + 사고돈(010006, 010007)
    --    PASS_DT: 예정일 (yyyy-MM-dd 형식)
    --    기간 이전 데이터는 첫째 날(월요일)에 합산
    -- ================================================
    FOR rec IN (
        SELECT TO_DATE(PASS_DT, 'YYYY-MM-DD') AS SCH_DT
        FROM TABLE(FN_MD_SCHEDULE_BSE_2020(
            P_FARM_NO, 'JOB-DAJANG', '150005', NULL,
            V_SDT, V_EDT, NULL, 'ko', 'yyyy-MM-dd', '-1', NULL
        ))
    ) LOOP
        -- 기간 이전 데이터는 첫째 날에 합산
        IF TRUNC(rec.SCH_DT) < V_DATES(1) THEN
            V_GB_ARR(1) := V_GB_ARR(1) + 1;
            V_GB_SUM := V_GB_SUM + 1;
        ELSE
            FOR i IN 1..7 LOOP
                IF TRUNC(rec.SCH_DT) = V_DATES(i) THEN
                    V_GB_ARR(i) := V_GB_ARR(i) + 1;
                    V_GB_SUM := V_GB_SUM + 1;
                    EXIT;
                END IF;
            END LOOP;
        END IF;
    END LOOP;

    -- ================================================
    -- 3. 분만예정 (FN_MD_SCHEDULE_BSE_2020, 150002)
    --    임신돈(010002)
    -- ================================================
    FOR rec IN (
        SELECT TO_DATE(PASS_DT, 'YYYY-MM-DD') AS SCH_DT
        FROM TABLE(FN_MD_SCHEDULE_BSE_2020(
            P_FARM_NO, 'JOB-DAJANG', '150002', NULL,
            V_SDT, V_EDT, NULL, 'ko', 'yyyy-MM-dd', '-1', NULL
        ))
    ) LOOP
        FOR i IN 1..7 LOOP
            IF TRUNC(rec.SCH_DT) = V_DATES(i) THEN
                V_BM_ARR(i) := V_BM_ARR(i) + 1;
                V_BM_SUM := V_BM_SUM + 1;
                EXIT;
            END IF;
        END LOOP;
    END LOOP;

    -- ================================================
    -- 4. 재발확인 (마지막 작업이 교배(G)인 모돈)
    --    3주령: 교배일 + 21일 (정확히 21일째)
    --    4주령: 교배일 + 28일 (정확히 28일째)
    --    모돈당 해당 날짜에 1번만 카운트
    -- ================================================
    FOR rec IN (
        SELECT /*+ INDEX(WK IX_TB_MODON_WK_01) */
               TO_DATE(WK.WK_DT, 'YYYYMMDD') AS GB_DT,
               WK.PIG_NO
        FROM VM_LAST_MODON_SEQ_WK WK
        INNER JOIN TB_MODON MD
            ON MD.FARM_NO = WK.FARM_NO AND MD.PIG_NO = WK.PIG_NO
           AND MD.USE_YN = 'Y'
           AND MD.OUT_DT = TO_DATE('9999-12-31', 'YYYY-MM-DD')
        WHERE WK.FARM_NO = P_FARM_NO
          AND WK.WK_GUBUN = 'G'  -- 마지막 작업이 교배
    ) LOOP
        -- 3주령: 교배일 + 21일이 기간 내에 있으면 해당 날짜에 카운트
        DECLARE
            V_3W_DT DATE := rec.GB_DT + 21;
            V_4W_DT DATE := rec.GB_DT + 28;
        BEGIN
            FOR i IN 1..7 LOOP
                IF V_3W_DT = V_DATES(i) THEN
                    V_IMSIN3W_ARR(i) := V_IMSIN3W_ARR(i) + 1;
                    EXIT;
                END IF;
            END LOOP;

            FOR i IN 1..7 LOOP
                IF V_4W_DT = V_DATES(i) THEN
                    V_IMSIN4W_ARR(i) := V_IMSIN4W_ARR(i) + 1;
                    EXIT;
                END IF;
            END LOOP;
        END;
    END LOOP;

    -- 재발확인 합계 계산
    FOR i IN 1..7 LOOP
        V_IMSIN_SUM := V_IMSIN_SUM + V_IMSIN3W_ARR(i) + V_IMSIN4W_ARR(i);
    END LOOP;

    -- ================================================
    -- 5. 이유예정 (FN_MD_SCHEDULE_BSE_2020, 150003)
    --    포유돈(010003) + 대리모돈(010004)
    --    PASS_DT: 예정일 (yyyy-MM-dd 형식)
    -- ================================================
    -- 포유돈 이유예정
    FOR rec IN (
        SELECT TO_DATE(PASS_DT, 'YYYY-MM-DD') AS SCH_DT
        FROM TABLE(FN_MD_SCHEDULE_BSE_2020(
            P_FARM_NO, 'JOB-DAJANG', '150003', '010003',
            V_SDT, V_EDT, NULL, 'ko', 'yyyy-MM-dd', '-1', NULL
        ))
    ) LOOP
        FOR i IN 1..7 LOOP
            IF TRUNC(rec.SCH_DT) = V_DATES(i) THEN
                V_EU_ARR(i) := V_EU_ARR(i) + 1;
                V_EU_SUM := V_EU_SUM + 1;
            END IF;
        END LOOP;
    END LOOP;

    -- 대리모돈 이유예정
    FOR rec IN (
        SELECT TO_DATE(PASS_DT, 'YYYY-MM-DD') AS SCH_DT
        FROM TABLE(FN_MD_SCHEDULE_BSE_2020(
            P_FARM_NO, 'JOB-DAJANG', '150003', '010004',
            V_SDT, V_EDT, NULL, 'ko', 'yyyy-MM-dd', '-1', NULL
        ))
    ) LOOP
        FOR i IN 1..7 LOOP
            IF TRUNC(rec.SCH_DT) = V_DATES(i) THEN
                V_EU_ARR(i) := V_EU_ARR(i) + 1;
                V_EU_SUM := V_EU_SUM + 1;
            END IF;
        END LOOP;
    END LOOP;

    -- ================================================
    -- 6. 백신예정 (FN_MD_SCHEDULE_BSE_2020, 150004)
    --    전체 모돈 - STATUS_CD = NULL (전체)
    --    PASS_DT: 예정일 (yyyy-MM-dd 형식)
    -- ================================================
    FOR rec IN (
        SELECT TO_DATE(PASS_DT, 'YYYY-MM-DD') AS SCH_DT
        FROM TABLE(FN_MD_SCHEDULE_BSE_2020(
            P_FARM_NO, 'JOB-DAJANG', '150004', NULL,
            V_SDT, V_EDT, NULL, 'ko', 'yyyy-MM-dd', '-1', NULL
        ))
    ) LOOP
        FOR i IN 1..7 LOOP
            IF TRUNC(rec.SCH_DT) = V_DATES(i) THEN
                V_VACCINE_ARR(i) := V_VACCINE_ARR(i) + 1;
                V_VACCINE_SUM := V_VACCINE_SUM + 1;
            END IF;
        END LOOP;
    END LOOP;

    -- ================================================
    -- 7. 출하예정 (TB_EU 이유두수 기반)
    --    이유일 + (기준출하일령 - 평균포유기간) = 출하예정일
    --    출하예정 두수 = 이유두수 * 이유후육성율 (CONFIG에서 이미 조회됨)
    -- ================================================
    -- ★ 최적화: 좌측 컬럼 가공 제거 → WK_DT 인덱스 활용 가능
    -- 기존: TO_DATE(E.WK_DT) + V_SHIP_OFFSET BETWEEN V_DT_FROM AND V_DT_TO
    -- 변환: E.WK_DT BETWEEN TO_CHAR(V_DT_FROM - V_SHIP_OFFSET) AND TO_CHAR(V_DT_TO - V_SHIP_OFFSET)
    SELECT NVL(ROUND(SUM(NVL(E.DUSU, 0) + NVL(E.DUSU_SU, 0)) * (V_REARING_RATE / 100)), 0)
    INTO V_SHIP_SUM
    FROM TB_EU E
    WHERE E.FARM_NO = P_FARM_NO
      AND E.USE_YN = 'Y'
      AND E.WK_DT BETWEEN TO_CHAR(V_DT_FROM - V_SHIP_OFFSET, 'YYYYMMDD')
                      AND TO_CHAR(V_DT_TO - V_SHIP_OFFSET, 'YYYYMMDD');

    -- ================================================
    -- 8. 요약 INSERT (GUBUN='SCHEDULE', SUB_GUBUN='-')
    -- ================================================
    INSERT INTO TS_INS_WEEK_SUB (
        MASTER_SEQ, FARM_NO, GUBUN, SUB_GUBUN, SORT_NO,
        CNT_1, CNT_2, CNT_3, CNT_4, CNT_5, CNT_6, CNT_7,
        STR_1, STR_2
    ) VALUES (
        P_MASTER_SEQ, P_FARM_NO, 'SCHEDULE', '-', 1,
        V_GB_SUM,       -- CNT_1: 교배예정 합계
        V_IMSIN_SUM,    -- CNT_2: 재발확인 합계
        V_BM_SUM,       -- CNT_3: 분만예정 합계
        V_EU_SUM,       -- CNT_4: 이유예정 합계
        V_VACCINE_SUM,  -- CNT_5: 백신예정 합계
        V_SHIP_SUM,     -- CNT_6: 출하예정 두수
        V_WEEK_NUM,     -- CNT_7: 주차
        V_PERIOD_FROM,  -- STR_1: 시작일
        V_PERIOD_TO     -- STR_2: 종료일
    );

    V_PROC_CNT := 1;

    -- ================================================
    -- 9. 캘린더 그리드 INSERT (GUBUN='SCHEDULE', SUB_GUBUN='CAL')
    -- ================================================

    -- 9.1 교배 (SORT_NO=1)
    INSERT INTO TS_INS_WEEK_SUB (
        MASTER_SEQ, FARM_NO, GUBUN, SUB_GUBUN, SORT_NO, CODE_1,
        STR_1, STR_2, STR_3, STR_4, STR_5, STR_6, STR_7,
        CNT_1, CNT_2, CNT_3, CNT_4, CNT_5, CNT_6, CNT_7
    ) VALUES (
        P_MASTER_SEQ, P_FARM_NO, 'SCHEDULE', 'CAL', 1, 'GB',
        TO_CHAR(V_DATES(1), 'DD'), TO_CHAR(V_DATES(2), 'DD'), TO_CHAR(V_DATES(3), 'DD'),
        TO_CHAR(V_DATES(4), 'DD'), TO_CHAR(V_DATES(5), 'DD'), TO_CHAR(V_DATES(6), 'DD'),
        TO_CHAR(V_DATES(7), 'DD'),
        V_GB_ARR(1), V_GB_ARR(2), V_GB_ARR(3), V_GB_ARR(4),
        V_GB_ARR(5), V_GB_ARR(6), V_GB_ARR(7)
    );

    -- 9.2 분만 (SORT_NO=2)
    INSERT INTO TS_INS_WEEK_SUB (
        MASTER_SEQ, FARM_NO, GUBUN, SUB_GUBUN, SORT_NO, CODE_1,
        STR_1, STR_2, STR_3, STR_4, STR_5, STR_6, STR_7,
        CNT_1, CNT_2, CNT_3, CNT_4, CNT_5, CNT_6, CNT_7
    ) VALUES (
        P_MASTER_SEQ, P_FARM_NO, 'SCHEDULE', 'CAL', 2, 'BM',
        TO_CHAR(V_DATES(1), 'DD'), TO_CHAR(V_DATES(2), 'DD'), TO_CHAR(V_DATES(3), 'DD'),
        TO_CHAR(V_DATES(4), 'DD'), TO_CHAR(V_DATES(5), 'DD'), TO_CHAR(V_DATES(6), 'DD'),
        TO_CHAR(V_DATES(7), 'DD'),
        V_BM_ARR(1), V_BM_ARR(2), V_BM_ARR(3), V_BM_ARR(4),
        V_BM_ARR(5), V_BM_ARR(6), V_BM_ARR(7)
    );

    -- 9.3 재발확인 3주 (SORT_NO=3)
    INSERT INTO TS_INS_WEEK_SUB (
        MASTER_SEQ, FARM_NO, GUBUN, SUB_GUBUN, SORT_NO, CODE_1,
        STR_1, STR_2, STR_3, STR_4, STR_5, STR_6, STR_7,
        CNT_1, CNT_2, CNT_3, CNT_4, CNT_5, CNT_6, CNT_7
    ) VALUES (
        P_MASTER_SEQ, P_FARM_NO, 'SCHEDULE', 'CAL', 3, 'IMSIN_3W',
        TO_CHAR(V_DATES(1), 'DD'), TO_CHAR(V_DATES(2), 'DD'), TO_CHAR(V_DATES(3), 'DD'),
        TO_CHAR(V_DATES(4), 'DD'), TO_CHAR(V_DATES(5), 'DD'), TO_CHAR(V_DATES(6), 'DD'),
        TO_CHAR(V_DATES(7), 'DD'),
        V_IMSIN3W_ARR(1), V_IMSIN3W_ARR(2), V_IMSIN3W_ARR(3), V_IMSIN3W_ARR(4),
        V_IMSIN3W_ARR(5), V_IMSIN3W_ARR(6), V_IMSIN3W_ARR(7)
    );

    -- 9.4 재발확인 4주 (SORT_NO=4)
    INSERT INTO TS_INS_WEEK_SUB (
        MASTER_SEQ, FARM_NO, GUBUN, SUB_GUBUN, SORT_NO, CODE_1,
        STR_1, STR_2, STR_3, STR_4, STR_5, STR_6, STR_7,
        CNT_1, CNT_2, CNT_3, CNT_4, CNT_5, CNT_6, CNT_7
    ) VALUES (
        P_MASTER_SEQ, P_FARM_NO, 'SCHEDULE', 'CAL', 4, 'IMSIN_4W',
        TO_CHAR(V_DATES(1), 'DD'), TO_CHAR(V_DATES(2), 'DD'), TO_CHAR(V_DATES(3), 'DD'),
        TO_CHAR(V_DATES(4), 'DD'), TO_CHAR(V_DATES(5), 'DD'), TO_CHAR(V_DATES(6), 'DD'),
        TO_CHAR(V_DATES(7), 'DD'),
        V_IMSIN4W_ARR(1), V_IMSIN4W_ARR(2), V_IMSIN4W_ARR(3), V_IMSIN4W_ARR(4),
        V_IMSIN4W_ARR(5), V_IMSIN4W_ARR(6), V_IMSIN4W_ARR(7)
    );

    -- 9.5 이유 (SORT_NO=5)
    INSERT INTO TS_INS_WEEK_SUB (
        MASTER_SEQ, FARM_NO, GUBUN, SUB_GUBUN, SORT_NO, CODE_1,
        STR_1, STR_2, STR_3, STR_4, STR_5, STR_6, STR_7,
        CNT_1, CNT_2, CNT_3, CNT_4, CNT_5, CNT_6, CNT_7
    ) VALUES (
        P_MASTER_SEQ, P_FARM_NO, 'SCHEDULE', 'CAL', 5, 'EU',
        TO_CHAR(V_DATES(1), 'DD'), TO_CHAR(V_DATES(2), 'DD'), TO_CHAR(V_DATES(3), 'DD'),
        TO_CHAR(V_DATES(4), 'DD'), TO_CHAR(V_DATES(5), 'DD'), TO_CHAR(V_DATES(6), 'DD'),
        TO_CHAR(V_DATES(7), 'DD'),
        V_EU_ARR(1), V_EU_ARR(2), V_EU_ARR(3), V_EU_ARR(4),
        V_EU_ARR(5), V_EU_ARR(6), V_EU_ARR(7)
    );

    -- 9.6 백신 (SORT_NO=6)
    INSERT INTO TS_INS_WEEK_SUB (
        MASTER_SEQ, FARM_NO, GUBUN, SUB_GUBUN, SORT_NO, CODE_1,
        STR_1, STR_2, STR_3, STR_4, STR_5, STR_6, STR_7,
        CNT_1, CNT_2, CNT_3, CNT_4, CNT_5, CNT_6, CNT_7
    ) VALUES (
        P_MASTER_SEQ, P_FARM_NO, 'SCHEDULE', 'CAL', 6, 'VACCINE',
        TO_CHAR(V_DATES(1), 'DD'), TO_CHAR(V_DATES(2), 'DD'), TO_CHAR(V_DATES(3), 'DD'),
        TO_CHAR(V_DATES(4), 'DD'), TO_CHAR(V_DATES(5), 'DD'), TO_CHAR(V_DATES(6), 'DD'),
        TO_CHAR(V_DATES(7), 'DD'),
        V_VACCINE_ARR(1), V_VACCINE_ARR(2), V_VACCINE_ARR(3), V_VACCINE_ARR(4),
        V_VACCINE_ARR(5), V_VACCINE_ARR(6), V_VACCINE_ARR(7)
    );

    V_PROC_CNT := V_PROC_CNT + 6;

    -- ================================================
    -- 10. 팝업 상세 데이터 INSERT (GUBUN='SCHEDULE', SUB_GUBUN='GB/BM/EU/VACCINE')
    --    TB_PLAN_MODON 설정의 WK_NM(작업명)별로 그룹화하여 대상복수 + 요일별 분포 저장
    --    경과일은 TB_PLAN_MODON에 설정된 PASS_DAY 사용 (실제 경과일 아님)
    --    컬럼 매핑:
    --      - STR_1: 예정작업명 (WK_NM)
    --      - STR_2: 기준작업코드 (STD_CD) → API에서 코드명 변환
    --      - STR_3: 대상돈군코드 (MODON_STATUS_CD) → API에서 코드명 변환
    --      - STR_4: 경과일 (TB_PLAN_MODON.PASS_DAY || '일')
    --      - STR_5: 백신명 (ARTICLE_NM, 백신예정 시)
    --      - CNT_1: 대상복수 합계
    --      - CNT_2~CNT_8: 요일별 분포 (월~일)
    -- ================================================

    -- 10.1 교배예정 팝업 (GUBUN='SCHEDULE', SUB_GUBUN='GB')
    --     TB_PLAN_MODON 기준으로 LEFT JOIN하여 데이터 없어도 작업 정보 표시
    INSERT INTO TS_INS_WEEK_SUB (
        MASTER_SEQ, FARM_NO, GUBUN, SUB_GUBUN, SORT_NO,
        STR_1, STR_2, STR_3, STR_4, CNT_1,
        CNT_2, CNT_3, CNT_4, CNT_5, CNT_6, CNT_7, CNT_8
    )
    SELECT P_MASTER_SEQ, P_FARM_NO, 'SCHEDULE', 'GB', ROWNUM,
           WK_NM, STD_CD, MODON_STATUS_CD, PASS_DAY || '일', NVL(CNT, 0),
           NVL(D1, 0), NVL(D2, 0), NVL(D3, 0), NVL(D4, 0), NVL(D5, 0), NVL(D6, 0), NVL(D7, 0)
    FROM (
        SELECT P.WK_NM, P.STD_CD, P.MODON_STATUS_CD, P.PASS_DAY,
               S.CNT, S.D1, S.D2, S.D3, S.D4, S.D5, S.D6, S.D7
        FROM TB_PLAN_MODON P
        LEFT JOIN (
            SELECT WK_NM,
                   COUNT(*) CNT,
                   SUM(CASE WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) < V_DT_FROM THEN 1
                            WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) = V_DT_FROM THEN 1 ELSE 0 END) AS D1,
                   SUM(CASE WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) = V_DT_FROM + 1 THEN 1 ELSE 0 END) AS D2,
                   SUM(CASE WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) = V_DT_FROM + 2 THEN 1 ELSE 0 END) AS D3,
                   SUM(CASE WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) = V_DT_FROM + 3 THEN 1 ELSE 0 END) AS D4,
                   SUM(CASE WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) = V_DT_FROM + 4 THEN 1 ELSE 0 END) AS D5,
                   SUM(CASE WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) = V_DT_FROM + 5 THEN 1 ELSE 0 END) AS D6,
                   SUM(CASE WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) = V_DT_FROM + 6 THEN 1 ELSE 0 END) AS D7
            FROM TABLE(FN_MD_SCHEDULE_BSE_2020(
                P_FARM_NO, 'JOB-DAJANG', '150005', NULL,
                V_SDT, V_EDT, NULL, 'ko', 'yyyy-MM-dd', '-1', NULL
            ))
            GROUP BY WK_NM
        ) S ON P.WK_NM = S.WK_NM
        WHERE P.FARM_NO = P_FARM_NO
          AND P.JOB_GUBUN_CD = '150005'
          AND P.USE_YN = 'Y'
        ORDER BY P.WK_NM
    );

    V_PROC_CNT := V_PROC_CNT + SQL%ROWCOUNT;

    -- 10.2 분만예정 팝업 (GUBUN='SCHEDULE', SUB_GUBUN='BM')
    --     TB_PLAN_MODON 기준으로 LEFT JOIN하여 데이터 없어도 작업 정보 표시
    INSERT INTO TS_INS_WEEK_SUB (
        MASTER_SEQ, FARM_NO, GUBUN, SUB_GUBUN, SORT_NO,
        STR_1, STR_2, STR_3, STR_4, CNT_1,
        CNT_2, CNT_3, CNT_4, CNT_5, CNT_6, CNT_7, CNT_8
    )
    SELECT P_MASTER_SEQ, P_FARM_NO, 'SCHEDULE', 'BM', ROWNUM,
           WK_NM, STD_CD, MODON_STATUS_CD, PASS_DAY || '일', NVL(CNT, 0),
           NVL(D1, 0), NVL(D2, 0), NVL(D3, 0), NVL(D4, 0), NVL(D5, 0), NVL(D6, 0), NVL(D7, 0)
    FROM (
        SELECT P.WK_NM, P.STD_CD, P.MODON_STATUS_CD, P.PASS_DAY,
               S.CNT, S.D1, S.D2, S.D3, S.D4, S.D5, S.D6, S.D7
        FROM TB_PLAN_MODON P
        LEFT JOIN (
            SELECT WK_NM,
                   COUNT(*) CNT,
                   SUM(CASE WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) = V_DT_FROM THEN 1 ELSE 0 END) AS D1,
                   SUM(CASE WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) = V_DT_FROM + 1 THEN 1 ELSE 0 END) AS D2,
                   SUM(CASE WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) = V_DT_FROM + 2 THEN 1 ELSE 0 END) AS D3,
                   SUM(CASE WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) = V_DT_FROM + 3 THEN 1 ELSE 0 END) AS D4,
                   SUM(CASE WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) = V_DT_FROM + 4 THEN 1 ELSE 0 END) AS D5,
                   SUM(CASE WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) = V_DT_FROM + 5 THEN 1 ELSE 0 END) AS D6,
                   SUM(CASE WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) = V_DT_FROM + 6 THEN 1 ELSE 0 END) AS D7
            FROM TABLE(FN_MD_SCHEDULE_BSE_2020(
                P_FARM_NO, 'JOB-DAJANG', '150002', NULL,
                V_SDT, V_EDT, NULL, 'ko', 'yyyy-MM-dd', '-1', NULL
            ))
            GROUP BY WK_NM
        ) S ON P.WK_NM = S.WK_NM
        WHERE P.FARM_NO = P_FARM_NO
          AND P.JOB_GUBUN_CD = '150002'
          AND P.USE_YN = 'Y'
        ORDER BY P.WK_NM
    );

    V_PROC_CNT := V_PROC_CNT + SQL%ROWCOUNT;

    -- 10.3 이유예정 팝업 (GUBUN='SCHEDULE', SUB_GUBUN='EU')
    --     TB_PLAN_MODON 기준으로 LEFT JOIN하여 데이터 없어도 작업 정보 표시
    INSERT INTO TS_INS_WEEK_SUB (
        MASTER_SEQ, FARM_NO, GUBUN, SUB_GUBUN, SORT_NO,
        STR_1, STR_2, STR_3, STR_4, CNT_1,
        CNT_2, CNT_3, CNT_4, CNT_5, CNT_6, CNT_7, CNT_8
    )
    SELECT P_MASTER_SEQ, P_FARM_NO, 'SCHEDULE', 'EU', ROWNUM,
           WK_NM, STD_CD, MODON_STATUS_CD, PASS_DAY || '일', NVL(CNT, 0),
           NVL(D1, 0), NVL(D2, 0), NVL(D3, 0), NVL(D4, 0), NVL(D5, 0), NVL(D6, 0), NVL(D7, 0)
    FROM (
        SELECT P.WK_NM, P.STD_CD, P.MODON_STATUS_CD, P.PASS_DAY,
               S.CNT, S.D1, S.D2, S.D3, S.D4, S.D5, S.D6, S.D7
        FROM TB_PLAN_MODON P
        LEFT JOIN (
            SELECT WK_NM,
                   COUNT(*) CNT,
                   SUM(CASE WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) = V_DT_FROM THEN 1 ELSE 0 END) AS D1,
                   SUM(CASE WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) = V_DT_FROM + 1 THEN 1 ELSE 0 END) AS D2,
                   SUM(CASE WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) = V_DT_FROM + 2 THEN 1 ELSE 0 END) AS D3,
                   SUM(CASE WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) = V_DT_FROM + 3 THEN 1 ELSE 0 END) AS D4,
                   SUM(CASE WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) = V_DT_FROM + 4 THEN 1 ELSE 0 END) AS D5,
                   SUM(CASE WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) = V_DT_FROM + 5 THEN 1 ELSE 0 END) AS D6,
                   SUM(CASE WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) = V_DT_FROM + 6 THEN 1 ELSE 0 END) AS D7
            FROM TABLE(FN_MD_SCHEDULE_BSE_2020(
                P_FARM_NO, 'JOB-DAJANG', '150003', NULL,
                V_SDT, V_EDT, NULL, 'ko', 'yyyy-MM-dd', '-1', NULL
            ))
            GROUP BY WK_NM
        ) S ON P.WK_NM = S.WK_NM
        WHERE P.FARM_NO = P_FARM_NO
          AND P.JOB_GUBUN_CD = '150003'
          AND P.USE_YN = 'Y'
        ORDER BY P.WK_NM
    );

    V_PROC_CNT := V_PROC_CNT + SQL%ROWCOUNT;

    -- 10.4 백신예정 팝업 (GUBUN='SCHEDULE', SUB_GUBUN='VACCINE')
    --     TB_PLAN_MODON 기준으로 LEFT JOIN + ARTICLE_NM(백신명)
    INSERT INTO TS_INS_WEEK_SUB (
        MASTER_SEQ, FARM_NO, GUBUN, SUB_GUBUN, SORT_NO,
        STR_1, STR_2, STR_3, STR_4, STR_5, CNT_1,
        CNT_2, CNT_3, CNT_4, CNT_5, CNT_6, CNT_7, CNT_8
    )
    SELECT P_MASTER_SEQ, P_FARM_NO, 'SCHEDULE', 'VACCINE', ROWNUM,
           WK_NM, STD_CD, MODON_STATUS_CD, PASS_DAY || '일', ARTICLE_NM, NVL(CNT, 0),
           NVL(D1, 0), NVL(D2, 0), NVL(D3, 0), NVL(D4, 0), NVL(D5, 0), NVL(D6, 0), NVL(D7, 0)
    FROM (
        SELECT P.WK_NM, P.STD_CD, P.MODON_STATUS_CD, P.PASS_DAY,
               NVL(S.ARTICLE_NM, '-') AS ARTICLE_NM,
               S.CNT, S.D1, S.D2, S.D3, S.D4, S.D5, S.D6, S.D7
        FROM TB_PLAN_MODON P
        LEFT JOIN (
            SELECT WK_NM, ARTICLE_NM,
                   COUNT(*) CNT,
                   SUM(CASE WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) = V_DT_FROM THEN 1 ELSE 0 END) AS D1,
                   SUM(CASE WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) = V_DT_FROM + 1 THEN 1 ELSE 0 END) AS D2,
                   SUM(CASE WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) = V_DT_FROM + 2 THEN 1 ELSE 0 END) AS D3,
                   SUM(CASE WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) = V_DT_FROM + 3 THEN 1 ELSE 0 END) AS D4,
                   SUM(CASE WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) = V_DT_FROM + 4 THEN 1 ELSE 0 END) AS D5,
                   SUM(CASE WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) = V_DT_FROM + 5 THEN 1 ELSE 0 END) AS D6,
                   SUM(CASE WHEN TRUNC(TO_DATE(PASS_DT, 'YYYY-MM-DD')) = V_DT_FROM + 6 THEN 1 ELSE 0 END) AS D7
            FROM TABLE(FN_MD_SCHEDULE_BSE_2020(
                P_FARM_NO, 'JOB-DAJANG', '150004', NULL,
                V_SDT, V_EDT, NULL, 'ko', 'yyyy-MM-dd', '-1', NULL
            ))
            GROUP BY WK_NM, ARTICLE_NM
        ) S ON P.WK_NM = S.WK_NM
        WHERE P.FARM_NO = P_FARM_NO
          AND P.JOB_GUBUN_CD = '150004'
          AND P.USE_YN = 'Y'
        ORDER BY P.WK_NM
    );

    V_PROC_CNT := V_PROC_CNT + SQL%ROWCOUNT;

    -- ================================================
    -- 11. 작업 산출기준 HELP 정보 INSERT (GUBUN='SCHEDULE', SUB_GUBUN='HELP')
    --     TB_PLAN_MODON 설정 기반으로 작업명(경과일) 형태로 요약
    --     STR_1: 교배 산출기준 (예: "이유후교배(7일),사고후교배(0일)")
    --     STR_2: 분만 산출기준 (예: "분만예정(115일)")
    --     STR_3: 이유 산출기준 (예: "이유예정(21일)")
    --     STR_4: 백신 산출기준 (예: "분만전백신(-7일)")
    --     STR_5: 출하 산출기준 (산출식: "이유일+(기준출하일령-평균포유기간)")
    --     STR_6: 재발확인 산출기준 (고정: "교배일+21일/28일")
    -- ================================================
    INSERT INTO TS_INS_WEEK_SUB (
        MASTER_SEQ, FARM_NO, GUBUN, SUB_GUBUN, SORT_NO,
        STR_1, STR_2, STR_3, STR_4, STR_5, STR_6
    )
    SELECT P_MASTER_SEQ, P_FARM_NO, 'SCHEDULE', 'HELP', 1,
           -- STR_1: 교배 산출기준
           (SELECT LISTAGG(WK_NM || '(' || PASS_DAY || '일)', ',') WITHIN GROUP (ORDER BY WK_NM)
            FROM TB_PLAN_MODON WHERE FARM_NO = P_FARM_NO AND JOB_GUBUN_CD = '150005' AND USE_YN = 'Y'),
           -- STR_2: 분만 산출기준
           (SELECT LISTAGG(WK_NM || '(' || PASS_DAY || '일)', ',') WITHIN GROUP (ORDER BY WK_NM)
            FROM TB_PLAN_MODON WHERE FARM_NO = P_FARM_NO AND JOB_GUBUN_CD = '150002' AND USE_YN = 'Y'),
           -- STR_3: 이유 산출기준
           (SELECT LISTAGG(WK_NM || '(' || PASS_DAY || '일)', ',') WITHIN GROUP (ORDER BY WK_NM)
            FROM TB_PLAN_MODON WHERE FARM_NO = P_FARM_NO AND JOB_GUBUN_CD = '150003' AND USE_YN = 'Y'),
           -- STR_4: 백신 산출기준
           (SELECT LISTAGG(WK_NM || '(' || PASS_DAY || '일)', ',') WITHIN GROUP (ORDER BY WK_NM)
            FROM TB_PLAN_MODON WHERE FARM_NO = P_FARM_NO AND JOB_GUBUN_CD = '150004' AND USE_YN = 'Y'),
           -- STR_5: 출하 산출기준 (계산식) - ShipmentPopup 툴팁과 동일 형태
           '* 공식: (이유두수 × 이유후육성율)' || CHR(10) ||
           '* 이유일 = 출하예정일 - (기준출하일령 ' || V_SHIP_DAY || '일 - 평균포유기간 ' || V_WEAN_PERIOD || '일)' || CHR(10) ||
           '  (설정값: ' || V_SHIP_DAY || ' - ' || V_WEAN_PERIOD || ' = ' || V_SHIP_OFFSET || '일 전)' || CHR(10) ||
           '* 이유후육성율: ' || V_REARING_RATE || '% (' || V_RATE_FROM || '~' || V_RATE_TO || ' 평균, 기본 90%)',
           -- STR_6: 재발확인 산출기준 (고정)
           '(고정)교배후 3주(21일~27일), 4주(28일~35일) 대상모돈'
    FROM DUAL;

    V_PROC_CNT := V_PROC_CNT + 1;

    -- ================================================
    -- 12. TS_INS_WEEK 메인 테이블 UPDATE
    -- ================================================
    UPDATE TS_INS_WEEK
    SET THIS_GB_SUM = V_GB_SUM,
        THIS_IMSIN_SUM = V_IMSIN_SUM,
        THIS_BM_SUM = V_BM_SUM,
        THIS_EU_SUM = V_EU_SUM,
        THIS_VACCINE_SUM = V_VACCINE_SUM,
        THIS_SHIP_SUM = V_SHIP_SUM
    WHERE MASTER_SEQ = P_MASTER_SEQ
      AND FARM_NO = P_FARM_NO;

    COMMIT;
    SP_INS_COM_LOG_END(V_LOG_SEQ, V_PROC_CNT);

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        SP_INS_COM_LOG_ERROR(V_LOG_SEQ, SQLCODE, SQLERRM);
        RAISE;
END SP_INS_WEEK_SCHEDULE_POPUP;
/

-- 프로시저 확인
SELECT OBJECT_NAME, STATUS FROM USER_OBJECTS WHERE OBJECT_NAME = 'SP_INS_WEEK_SCHEDULE_POPUP';
