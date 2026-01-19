-- ============================================================
-- SP_INS_WEEK_GB_POPUP: 교배 팝업 데이터 추출 프로시저
--
-- 상세 문서: docs/db/ins/week/21.gb-popup.md
--
-- 데이터 구조:
--   - TS_INS_WEEK_SUB (GUBUN='GB', SUB_GUBUN='STAT'): 교배 요약 통계
--   - TS_INS_WEEK_SUB (GUBUN='GB', SUB_GUBUN='CHART'): 재귀일별 교배복수 차트
--
-- DB 컬럼 매핑 (GB):
--   - CNT_1: TOTAL_CNT (합계 실적)
--   - CNT_2: SAGO_CNT (교배도중 사고복수) - 다음작업(SEQ+1)이 사고(F)
--   - CNT_3: BUNMAN_CNT (교배도중 분만복수) - 다음작업(SEQ+1)이 분만(B)
--   - VAL_1: AVG_RETURN_DAY (평균 재귀발정일) - 1차교배만, 교배일-이전작업일
--   - VAL_2: AVG_FIRST_GB_DAY (평균 초교배일령) - 초교배만, 교배일-출생일
--   - CNT_4: FIRST_GB_CNT (초교배복수 실적) - SANCHA=0, GYOBAE_CNT=1
--   - CNT_5: SAGO_GB_CNT (재발교배복수 실적) - GYOBAE_CNT>1 (2차 이상 교배)
--   - CNT_6: JS_GB_CNT (정상교배복수 실적) - 초교배 제외, GYOBAE_CNT=1 (1차교배)
--   - CNT_7: FIRST_GB_PLAN (초교배 예정복수) - FN_MD_SCHEDULE_BSE_2020 (STATUS='010001')
--   - CNT_8: JS_GB_PLAN (정상교배 예정복수) - FN_MD_SCHEDULE_BSE_2020 (STATUS='010005')
--   - CNT_9: ACC_GB_CNT (연간 누적 교배복수)
--   (재발교배는 예정 없음)
--
-- DB 컬럼 매핑 (GB_CHART):
--   - CODE_1: 재귀일 구간 (~7, 10, 15, 20, 25, 30, 35, 40, 45, 50, 50↑)
--   - CNT_1: 해당 구간 교배복수
--   - SORT_NO: 정렬순서 (1~11)
--
-- [교배 유형 기준]
-- - 초교배: SANCHA=0 AND GYOBAE_CNT=1 (산차0, 첫 교배)
-- - 정상교배: 초교배 제외 AND GYOBAE_CNT=1 (경산돈 1차 교배)
-- - 재발교배: GYOBAE_CNT>1 (2차 이상 교배)
-- ============================================================

CREATE OR REPLACE PROCEDURE SP_INS_WEEK_GB_POPUP (
    P_MASTER_SEQ    IN  NUMBER,
    P_JOB_NM        IN  VARCHAR2,
    P_FARM_NO       IN  INTEGER,
    P_LOCALE        IN  VARCHAR2,
    P_DT_FROM       IN  VARCHAR2,
    P_DT_TO         IN  VARCHAR2
) AS
    V_LOG_SEQ       NUMBER;
    V_PROC_CNT      INTEGER := 0;

    -- 예정 복수 변수
    V_PLAN_HUBO     INTEGER := 0;
    V_PLAN_JS       INTEGER := 0;

    -- 날짜 포맷 변환용
    V_SDT           VARCHAR2(10);
    V_EDT           VARCHAR2(10);

    -- GB_STAT 집계용 변수
    V_TOTAL_CNT     INTEGER := 0;
    V_SAGO_CNT      INTEGER := 0;
    V_BUNMAN_CNT    INTEGER := 0;
    V_AVG_RETURN    NUMBER(10,2) := 0;
    V_AVG_FIRST_GB  NUMBER(10,2) := 0;
    V_FIRST_GB_CNT  INTEGER := 0;
    V_SAGO_GB_CNT   INTEGER := 0;
    V_JS_GB_CNT     INTEGER := 0;
    V_ACC_GB_CNT    INTEGER := 0;

BEGIN
    -- 로그 시작
    SP_INS_COM_LOG_START(P_MASTER_SEQ, P_JOB_NM, 'SP_INS_WEEK_GB_POPUP', P_FARM_NO, V_LOG_SEQ);

    -- 날짜 포맷 변환 (YYYYMMDD → yyyy-MM-dd)
    V_SDT := SUBSTR(P_DT_FROM, 1, 4) || '-' || SUBSTR(P_DT_FROM, 5, 2) || '-' || SUBSTR(P_DT_FROM, 7, 2);
    V_EDT := SUBSTR(P_DT_TO, 1, 4) || '-' || SUBSTR(P_DT_TO, 5, 2) || '-' || SUBSTR(P_DT_TO, 7, 2);

    -- ================================================
    -- 1. 예정 복수 조회 (FN_MD_SCHEDULE_BSE_2020)
    --    P_SCHEDULE_GB='150005' (교배예정)
    -- ================================================
    -- 초교배 예정 (후보돈: 010001)
    SELECT COUNT(*) INTO V_PLAN_HUBO
    FROM TABLE(FN_MD_SCHEDULE_BSE_2020(
        P_FARM_NO, 'JOB-DAJANG', '150005', '010001',
        V_SDT, V_EDT, NULL, 'ko', 'yyyy-MM-dd', '-1', NULL
    ));

    -- 정상교배 예정 (이유돈: 010005)
    SELECT COUNT(*) INTO V_PLAN_JS
    FROM TABLE(FN_MD_SCHEDULE_BSE_2020(
        P_FARM_NO, 'JOB-DAJANG', '150005', '010005',
        V_SDT, V_EDT, NULL, 'ko', 'yyyy-MM-dd', '-1', NULL
    ));

    -- ================================================
    -- 2. 연간 누적 교배복수 조회 (1/1 ~ 기준일)
    -- ================================================
    SELECT COUNT(*) INTO V_ACC_GB_CNT
    FROM TB_MODON_WK
    WHERE FARM_NO = P_FARM_NO
      AND WK_GUBUN = 'G'
      AND USE_YN = 'Y'
      AND WK_DT >= SUBSTR(P_DT_TO, 1, 4) || '0101'
      AND WK_DT <= P_DT_TO;

    -- ================================================
    -- 3. 기존 데이터 삭제
    -- ================================================
    DELETE FROM TS_INS_WEEK_SUB
    WHERE MASTER_SEQ = P_MASTER_SEQ
      AND FARM_NO = P_FARM_NO
      AND GUBUN = 'GB';

    -- ================================================
    -- 4. 교배 요약 통계 직접 집계 (GUBUN='GB')
    -- ================================================
    SELECT /*+ LEADING(A D B C) USE_NL(D B C) INDEX(A IX_TB_MODON_WK_01) */
        NVL(COUNT(*), 0),
        -- 교배도중 사고복수: 다음 작업(SEQ+1)이 사고(F)
        NVL(SUM(CASE WHEN C.WK_GUBUN = 'F' THEN 1 ELSE 0 END), 0),
        -- 교배도중 분만복수: 다음 작업(SEQ+1)이 분만(B)
        NVL(SUM(CASE WHEN C.WK_GUBUN = 'B' THEN 1 ELSE 0 END), 0),
        -- 평균 재귀발정일: 1차교배(GYOBAE_CNT=1)만, 교배일 - 이전작업일 (초교배 제외)
        NVL(ROUND(AVG(
            CASE WHEN A.GYOBAE_CNT = 1 AND B.WK_DT IS NOT NULL
                      AND NOT (A.SANCHA = 0 AND A.GYOBAE_CNT = 1)
                 THEN TO_DATE(A.WK_DT, 'YYYYMMDD') - TO_DATE(B.WK_DT, 'YYYYMMDD') END
        ), 1), 0),
        -- 평균 초교배일령: 초교배만 (SANCHA=0, GYOBAE_CNT=1), 교배일 - 출생일
        NVL(ROUND(AVG(
            CASE WHEN A.SANCHA = 0 AND A.GYOBAE_CNT = 1
                 THEN TO_DATE(A.WK_DT, 'YYYYMMDD') - D.BIRTH_DT END
        ), 1), 0),
        -- 초교배복수: SANCHA=0 AND GYOBAE_CNT=1
        NVL(SUM(CASE WHEN A.SANCHA = 0 AND A.GYOBAE_CNT = 1 THEN 1 ELSE 0 END), 0),
        -- 재발교배복수: GYOBAE_CNT>1 (2차 이상 교배)
        NVL(SUM(CASE WHEN A.GYOBAE_CNT > 1 THEN 1 ELSE 0 END), 0),
        -- 정상교배복수: GYOBAE_CNT=1 (초교배 포함)
        NVL(SUM(CASE WHEN A.GYOBAE_CNT = 1 THEN 1 ELSE 0 END), 0)
    INTO V_TOTAL_CNT, V_SAGO_CNT, V_BUNMAN_CNT, V_AVG_RETURN, V_AVG_FIRST_GB,
         V_FIRST_GB_CNT, V_SAGO_GB_CNT, V_JS_GB_CNT
    FROM TB_MODON_WK A
    LEFT OUTER JOIN TB_MODON_WK B  -- 이전 작업 (SEQ-1)
        ON B.FARM_NO = A.FARM_NO AND B.PIG_NO = A.PIG_NO
       AND B.SEQ = A.SEQ - 1 AND B.USE_YN = 'Y'
    LEFT OUTER JOIN TB_MODON_WK C  -- 다음 작업 (SEQ+1)
        ON C.FARM_NO = A.FARM_NO AND C.PIG_NO = A.PIG_NO
       AND C.SEQ = A.SEQ + 1 AND C.USE_YN = 'Y'
    INNER JOIN TB_MODON D
        ON D.FARM_NO = A.FARM_NO AND D.PIG_NO = A.PIG_NO AND D.USE_YN = 'Y'
    WHERE A.FARM_NO = P_FARM_NO
      AND A.WK_GUBUN = 'G'
      AND A.USE_YN = 'Y'
      AND A.WK_DT >= P_DT_FROM
      AND A.WK_DT <= P_DT_TO;

    -- ================================================
    -- 5. 요약 통계 INSERT (GUBUN='GB', SUB_GUBUN='STAT')
    -- ================================================
    INSERT INTO TS_INS_WEEK_SUB (
        MASTER_SEQ, FARM_NO, GUBUN, SUB_GUBUN, SORT_NO,
        CNT_1, CNT_2, CNT_3, VAL_1, VAL_2, CNT_4, CNT_5, CNT_6,
        CNT_7, CNT_8, CNT_9
    ) VALUES (
        P_MASTER_SEQ, P_FARM_NO, 'GB', 'STAT', 1,
        V_TOTAL_CNT,      -- CNT_1: 합계 (실적)
        V_SAGO_CNT,       -- CNT_2: 교배도중 사고복수
        V_BUNMAN_CNT,     -- CNT_3: 교배도중 분만복수
        V_AVG_RETURN,     -- VAL_1: 평균 재귀발정일
        V_AVG_FIRST_GB,   -- VAL_2: 평균 초교배일령
        V_FIRST_GB_CNT,   -- CNT_4: 초교배복수 (실적)
        V_SAGO_GB_CNT,    -- CNT_5: 재발교배복수 (실적)
        V_JS_GB_CNT,      -- CNT_6: 정상교배복수 (실적)
        V_PLAN_HUBO,      -- CNT_7: 초교배 예정복수
        V_PLAN_JS,        -- CNT_8: 정상교배 예정복수
        V_ACC_GB_CNT      -- CNT_9: 연간 누적 교배복수
    );

    V_PROC_CNT := 1;

    -- ================================================
    -- 6. 재귀일별 교배복수 차트 INSERT (GUBUN='GB', SUB_GUBUN='CHART')
    --    경산돈만 대상 (후보돈 제외)
    --    재귀일 = 교배일 - 마지막이유일
    --    구간: ~7, 10, 15, 20, 25, 30, 35, 40, 45, 50, 50↑
    -- ================================================
    INSERT INTO TS_INS_WEEK_SUB (
        MASTER_SEQ, FARM_NO, GUBUN, SUB_GUBUN, SORT_NO, CODE_1, CNT_1
    )
    SELECT
        P_MASTER_SEQ,
        P_FARM_NO,
        'GB',
        'CHART',
        SORT_NO,
        PERIOD,
        CNT
    FROM (
        SELECT
            CASE
                WHEN RETURN_DAY <= 7 THEN '~7'
                WHEN RETURN_DAY <= 10 THEN '10'
                WHEN RETURN_DAY <= 15 THEN '15'
                WHEN RETURN_DAY <= 20 THEN '20'
                WHEN RETURN_DAY <= 25 THEN '25'
                WHEN RETURN_DAY <= 30 THEN '30'
                WHEN RETURN_DAY <= 35 THEN '35'
                WHEN RETURN_DAY <= 40 THEN '40'
                WHEN RETURN_DAY <= 45 THEN '45'
                WHEN RETURN_DAY <= 50 THEN '50'
                ELSE '50↑'
            END AS PERIOD,
            CASE
                WHEN RETURN_DAY <= 7 THEN 1
                WHEN RETURN_DAY <= 10 THEN 2
                WHEN RETURN_DAY <= 15 THEN 3
                WHEN RETURN_DAY <= 20 THEN 4
                WHEN RETURN_DAY <= 25 THEN 5
                WHEN RETURN_DAY <= 30 THEN 6
                WHEN RETURN_DAY <= 35 THEN 7
                WHEN RETURN_DAY <= 40 THEN 8
                WHEN RETURN_DAY <= 45 THEN 9
                WHEN RETURN_DAY <= 50 THEN 10
                ELSE 11
            END AS SORT_NO,
            COUNT(*) AS CNT
        FROM (
            -- 재귀일 계산: 교배일 - 마지막이유일
            SELECT /*+ LEADING(A E) USE_NL(E) INDEX(A IX_TB_MODON_WK_01) */
                TO_DATE(A.WK_DT, 'YYYYMMDD') - TO_DATE(E.WK_DT, 'YYYYMMDD') AS RETURN_DAY
            FROM TB_MODON_WK A
            LEFT OUTER JOIN (
                -- 마지막 이유 작업 (이유 이력 중 가장 최근)
                SELECT FARM_NO, PIG_NO, WK_DT,
                       ROW_NUMBER() OVER (PARTITION BY FARM_NO, PIG_NO ORDER BY SEQ DESC) AS RN
                FROM TB_MODON_WK
                WHERE FARM_NO = P_FARM_NO AND WK_GUBUN = 'E' AND USE_YN = 'Y'
            ) E ON E.FARM_NO = A.FARM_NO AND E.PIG_NO = A.PIG_NO AND E.RN = 1
            WHERE A.FARM_NO = P_FARM_NO
              AND A.WK_GUBUN = 'G'
              AND A.USE_YN = 'Y'
              AND A.WK_DT >= P_DT_FROM
              AND A.WK_DT <= P_DT_TO
              AND NOT (A.SANCHA = 0 AND A.GYOBAE_CNT = 1)  -- 후보돈(초교배) 제외
              AND E.WK_DT IS NOT NULL  -- 이유 이력 있는 경우만
        )
        GROUP BY
            CASE
                WHEN RETURN_DAY <= 7 THEN '~7'
                WHEN RETURN_DAY <= 10 THEN '10'
                WHEN RETURN_DAY <= 15 THEN '15'
                WHEN RETURN_DAY <= 20 THEN '20'
                WHEN RETURN_DAY <= 25 THEN '25'
                WHEN RETURN_DAY <= 30 THEN '30'
                WHEN RETURN_DAY <= 35 THEN '35'
                WHEN RETURN_DAY <= 40 THEN '40'
                WHEN RETURN_DAY <= 45 THEN '45'
                WHEN RETURN_DAY <= 50 THEN '50'
                ELSE '50↑'
            END,
            CASE
                WHEN RETURN_DAY <= 7 THEN 1
                WHEN RETURN_DAY <= 10 THEN 2
                WHEN RETURN_DAY <= 15 THEN 3
                WHEN RETURN_DAY <= 20 THEN 4
                WHEN RETURN_DAY <= 25 THEN 5
                WHEN RETURN_DAY <= 30 THEN 6
                WHEN RETURN_DAY <= 35 THEN 7
                WHEN RETURN_DAY <= 40 THEN 8
                WHEN RETURN_DAY <= 45 THEN 9
                WHEN RETURN_DAY <= 50 THEN 10
                ELSE 11
            END
    )
    ORDER BY SORT_NO;

    V_PROC_CNT := V_PROC_CNT + SQL%ROWCOUNT;

    -- ================================================
    -- 7. TS_INS_WEEK 메인 테이블에 교배 집계 UPDATE
    -- ================================================
    UPDATE TS_INS_WEEK
    SET LAST_GB_CNT = V_TOTAL_CNT,
        LAST_GB_SUM = V_ACC_GB_CNT
    WHERE MASTER_SEQ = P_MASTER_SEQ
      AND FARM_NO = P_FARM_NO;

    COMMIT;
    SP_INS_COM_LOG_END(V_LOG_SEQ, V_PROC_CNT);

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        SP_INS_COM_LOG_ERROR(V_LOG_SEQ, SQLCODE, SQLERRM);
        RAISE;
END SP_INS_WEEK_GB_POPUP;
/

-- 프로시저 확인
SELECT OBJECT_NAME, STATUS FROM USER_OBJECTS WHERE OBJECT_NAME = 'SP_INS_WEEK_GB_POPUP';
