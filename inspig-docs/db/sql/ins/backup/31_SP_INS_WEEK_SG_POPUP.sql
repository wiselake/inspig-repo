-- ============================================================
-- SP_INS_WEEK_SG_POPUP: 임신사고 팝업 데이터 추출 프로시저
--
-- 상세 문서: docs/db/ins/week/31.sg-popup.md
--
-- 데이터 구조:
--   - TS_INS_WEEK_SUB (GUBUN='SG', SUB_GUBUN='STAT', SORT_NO=1): 지난주 원인별 사고복수 (1행)
--   - TS_INS_WEEK_SUB (GUBUN='SG', SUB_GUBUN='STAT', SORT_NO=2): 해당년도 원인별 사고복수 (1행)
--   - TS_INS_WEEK_SUB (GUBUN='SG', SUB_GUBUN='CHART'): 임신일별 사고복수 차트 (1행)
--
-- SAGO_GUBUN_NM 8개 유형 (CNT_1 ~ CNT_8):
--   CNT_1: 재발(050008)  CNT_2: 불임(050009)  CNT_3: 공태(050007)  CNT_4: 유산(050002)
--   CNT_5: 도태(050003)  CNT_6: 폐사(050004)  CNT_7: 임돈전출(050005)  CNT_8: 임돈판매(050006)
--
-- DB 컬럼 매핑 (SG - SORT_NO=1: 지난주, SORT_NO=2: 최근1개월):
--   - CNT_1~CNT_8: 사고구분별 사고복수
--   - VAL_1~VAL_8: 사고구분별 비율 (%)
--   - CNT_9: 당해년도 누계 (SORT_NO=2에만, sec-lastweek 카드용)
--   - VAL_9: 평균 경과일 (지난주/당해년도)
--
-- DB 컬럼 매핑 (SG_CHART - 임신일별 차트):
--   - CNT_1~CNT_8: 경과일 범위별 사고복수
--     (~7, 8~10, 11~15, 16~20, 21~35, 36~40, 41~45, 46~)
-- ============================================================

CREATE OR REPLACE PROCEDURE SP_INS_WEEK_SG_POPUP (
    P_MASTER_SEQ    IN  NUMBER,
    P_JOB_NM        IN  VARCHAR2,
    P_FARM_NO       IN  INTEGER,
    P_LOCALE        IN  VARCHAR2,
    P_DT_FROM       IN  VARCHAR2,
    P_DT_TO         IN  VARCHAR2
) AS
    V_LOG_SEQ       NUMBER;
    V_PROC_CNT      INTEGER := 0;

    -- 기간 변수
    V_MONTH_FROM    VARCHAR2(8);  -- 최근 1개월 시작일
    V_YEAR_FROM     VARCHAR2(8);  -- 당해년도 시작일 (1/1)

    -- 합계 (TS_INS_WEEK 업데이트용)
    V_WEEK_TOTAL        INTEGER := 0;
    V_YEAR_TOTAL        INTEGER := 0;  -- 당해년도 누계
    V_WEEK_AVG_GYUNGIL  NUMBER(10,1) := 0;  -- 지난주 평균 경과일
    V_YEAR_AVG_GYUNGIL  NUMBER(10,1) := 0;  -- 당해년도 평균 경과일

BEGIN
    -- 로그 시작
    SP_INS_COM_LOG_START(P_MASTER_SEQ, P_JOB_NM, 'SP_INS_WEEK_SG_POPUP', P_FARM_NO, V_LOG_SEQ);

    -- 최근 1개월 시작일 계산 (P_DT_FROM 기준 - 30일)
    V_MONTH_FROM := TO_CHAR(TO_DATE(P_DT_FROM, 'YYYYMMDD') - 30, 'YYYYMMDD');

    -- 당해년도 시작일 (1월 1일)
    V_YEAR_FROM := SUBSTR(P_DT_TO, 1, 4) || '0101';

    -- ================================================
    -- 1. 기존 데이터 삭제 (GUBUN='SG'만 삭제 - SUB_GUBUN 구분)
    -- ================================================
    DELETE FROM TS_INS_WEEK_SUB
    WHERE MASTER_SEQ = P_MASTER_SEQ
      AND FARM_NO = P_FARM_NO
      AND GUBUN = 'SG';

    -- ================================================
    -- 2. 지난주 원인별 사고복수 + 평균경과일 INSERT (GUBUN='SG', SUB_GUBUN='STAT', SORT_NO=1)
    --    한 번의 SQL로 8개 사고구분 동시 집계 + 비율 계산 + 평균경과일
    --    평균경과일: 임돈전출/판매 제외
    --    ★ 성능 최적화: 스칼라 서브쿼리 → WITH절 사전 집계로 변경
    -- ================================================
    INSERT INTO TS_INS_WEEK_SUB (
        MASTER_SEQ, FARM_NO, GUBUN, SUB_GUBUN, SORT_NO,
        CNT_1, CNT_2, CNT_3, CNT_4, CNT_5, CNT_6, CNT_7, CNT_8,
        VAL_1, VAL_2, VAL_3, VAL_4, VAL_5, VAL_6, VAL_7, VAL_8, VAL_9
    )
    WITH
    -- 마지막 교배일 사전 계산 (스칼라 서브쿼리 제거)
    LAST_GB AS (
        SELECT /*+ INDEX(WK IX_TB_MODON_WK_01) */
               WK.FARM_NO, WK.PIG_NO, WK.WK_DT AS SAGO_WK_DT,
               MAX(GB.WK_DT) AS LAST_GB_DT
        FROM TB_MODON_WK WK
        LEFT OUTER JOIN TB_MODON_WK GB
            ON GB.FARM_NO = WK.FARM_NO AND GB.PIG_NO = WK.PIG_NO
           AND GB.WK_GUBUN = 'G' AND GB.USE_YN = 'Y'
           AND GB.WK_DT < WK.WK_DT
        WHERE WK.FARM_NO = P_FARM_NO
          AND WK.WK_GUBUN = 'F'
          AND WK.USE_YN = 'Y'
          AND WK.WK_DT >= P_DT_FROM
          AND WK.WK_DT <= P_DT_TO
        GROUP BY WK.FARM_NO, WK.PIG_NO, WK.WK_DT
    )
    SELECT
        P_MASTER_SEQ, P_FARM_NO, 'SG', 'STAT', 1,
        CNT_1, CNT_2, CNT_3, CNT_4, CNT_5, CNT_6, CNT_7, CNT_8,
        CASE WHEN TOTAL_CNT > 0 THEN ROUND(CNT_1 / TOTAL_CNT * 100, 1) ELSE 0 END,
        CASE WHEN TOTAL_CNT > 0 THEN ROUND(CNT_2 / TOTAL_CNT * 100, 1) ELSE 0 END,
        CASE WHEN TOTAL_CNT > 0 THEN ROUND(CNT_3 / TOTAL_CNT * 100, 1) ELSE 0 END,
        CASE WHEN TOTAL_CNT > 0 THEN ROUND(CNT_4 / TOTAL_CNT * 100, 1) ELSE 0 END,
        CASE WHEN TOTAL_CNT > 0 THEN ROUND(CNT_5 / TOTAL_CNT * 100, 1) ELSE 0 END,
        CASE WHEN TOTAL_CNT > 0 THEN ROUND(CNT_6 / TOTAL_CNT * 100, 1) ELSE 0 END,
        CASE WHEN TOTAL_CNT > 0 THEN ROUND(CNT_7 / TOTAL_CNT * 100, 1) ELSE 0 END,
        CASE WHEN TOTAL_CNT > 0 THEN ROUND(CNT_8 / TOTAL_CNT * 100, 1) ELSE 0 END,
        AVG_GYUNGIL  -- VAL_9: 평균 경과일
    FROM (
        SELECT
            NVL(SUM(CASE WHEN S.SAGO_GUBUN_CD = '050008' THEN 1 ELSE 0 END), 0) AS CNT_1,  -- 재발
            NVL(SUM(CASE WHEN S.SAGO_GUBUN_CD = '050009' THEN 1 ELSE 0 END), 0) AS CNT_2,  -- 불임
            NVL(SUM(CASE WHEN S.SAGO_GUBUN_CD = '050007' THEN 1 ELSE 0 END), 0) AS CNT_3,  -- 공태
            NVL(SUM(CASE WHEN S.SAGO_GUBUN_CD = '050002' THEN 1 ELSE 0 END), 0) AS CNT_4,  -- 유산
            NVL(SUM(CASE WHEN S.SAGO_GUBUN_CD = '050003' THEN 1 ELSE 0 END), 0) AS CNT_5,  -- 도태
            NVL(SUM(CASE WHEN S.SAGO_GUBUN_CD = '050004' THEN 1 ELSE 0 END), 0) AS CNT_6,  -- 폐사
            NVL(SUM(CASE WHEN S.SAGO_GUBUN_CD = '050005' THEN 1 ELSE 0 END), 0) AS CNT_7,  -- 임돈전출
            NVL(SUM(CASE WHEN S.SAGO_GUBUN_CD = '050006' THEN 1 ELSE 0 END), 0) AS CNT_8,  -- 임돈판매
            NVL(COUNT(*), 0) AS TOTAL_CNT,
            -- 평균 경과일 (임돈전출/판매 제외) - WITH절 사전 집계 사용
            NVL(ROUND(AVG(
                CASE WHEN S.SAGO_GUBUN_CD NOT IN ('050005', '050006') THEN
                    TO_DATE(A.WK_DT, 'YYYYMMDD') - NVL(TO_DATE(LG.LAST_GB_DT, 'YYYYMMDD'), MD.LAST_WK_DT)
                END
            ), 1), 0) AS AVG_GYUNGIL
        FROM TB_MODON_WK A
        INNER JOIN TB_SAGO S
            ON S.FARM_NO = A.FARM_NO AND S.PIG_NO = A.PIG_NO
           AND S.WK_DT = A.WK_DT AND S.WK_GUBUN = A.WK_GUBUN AND S.USE_YN = 'Y'
        INNER JOIN TB_MODON MD
            ON MD.FARM_NO = A.FARM_NO AND MD.PIG_NO = A.PIG_NO
        LEFT OUTER JOIN LAST_GB LG
            ON LG.FARM_NO = A.FARM_NO AND LG.PIG_NO = A.PIG_NO AND LG.SAGO_WK_DT = A.WK_DT
        WHERE A.FARM_NO = P_FARM_NO
          AND A.WK_GUBUN = 'F'
          AND A.USE_YN = 'Y'
          AND A.WK_DT >= P_DT_FROM
          AND A.WK_DT <= P_DT_TO
    );
    V_PROC_CNT := V_PROC_CNT + 1;

    -- ================================================
    -- 3. 최근1개월 원인별 사고복수 + 당해년도 누계 + 평균경과일 INSERT (GUBUN='SG', SUB_GUBUN='STAT', SORT_NO=2)
    --    한 번의 SQL로 최근1개월(CNT_1~CNT_8) + 당해년도 누계(CNT_9) + 당해년도 평균경과일(VAL_9)
    --    ★ 성능 최적화: 스칼라 서브쿼리 → WITH절 사전 집계로 변경
    -- ================================================
    INSERT INTO TS_INS_WEEK_SUB (
        MASTER_SEQ, FARM_NO, GUBUN, SUB_GUBUN, SORT_NO,
        CNT_1, CNT_2, CNT_3, CNT_4, CNT_5, CNT_6, CNT_7, CNT_8, CNT_9,
        VAL_1, VAL_2, VAL_3, VAL_4, VAL_5, VAL_6, VAL_7, VAL_8, VAL_9
    )
    WITH
    -- 마지막 교배일 사전 계산 (스칼라 서브쿼리 제거) - 당해년도 범위
    LAST_GB AS (
        SELECT /*+ INDEX(WK IX_TB_MODON_WK_01) */
               WK.FARM_NO, WK.PIG_NO, WK.WK_DT AS SAGO_WK_DT,
               MAX(GB.WK_DT) AS LAST_GB_DT
        FROM TB_MODON_WK WK
        LEFT OUTER JOIN TB_MODON_WK GB
            ON GB.FARM_NO = WK.FARM_NO AND GB.PIG_NO = WK.PIG_NO
           AND GB.WK_GUBUN = 'G' AND GB.USE_YN = 'Y'
           AND GB.WK_DT < WK.WK_DT
        WHERE WK.FARM_NO = P_FARM_NO
          AND WK.WK_GUBUN = 'F'
          AND WK.USE_YN = 'Y'
          AND WK.WK_DT >= V_YEAR_FROM
          AND WK.WK_DT <= P_DT_TO
        GROUP BY WK.FARM_NO, WK.PIG_NO, WK.WK_DT
    )
    SELECT
        P_MASTER_SEQ, P_FARM_NO, 'SG', 'STAT', 2,
        CNT_1, CNT_2, CNT_3, CNT_4, CNT_5, CNT_6, CNT_7, CNT_8, CNT_9,
        CASE WHEN TOTAL_CNT > 0 THEN ROUND(CNT_1 / TOTAL_CNT * 100, 1) ELSE 0 END,
        CASE WHEN TOTAL_CNT > 0 THEN ROUND(CNT_2 / TOTAL_CNT * 100, 1) ELSE 0 END,
        CASE WHEN TOTAL_CNT > 0 THEN ROUND(CNT_3 / TOTAL_CNT * 100, 1) ELSE 0 END,
        CASE WHEN TOTAL_CNT > 0 THEN ROUND(CNT_4 / TOTAL_CNT * 100, 1) ELSE 0 END,
        CASE WHEN TOTAL_CNT > 0 THEN ROUND(CNT_5 / TOTAL_CNT * 100, 1) ELSE 0 END,
        CASE WHEN TOTAL_CNT > 0 THEN ROUND(CNT_6 / TOTAL_CNT * 100, 1) ELSE 0 END,
        CASE WHEN TOTAL_CNT > 0 THEN ROUND(CNT_7 / TOTAL_CNT * 100, 1) ELSE 0 END,
        CASE WHEN TOTAL_CNT > 0 THEN ROUND(CNT_8 / TOTAL_CNT * 100, 1) ELSE 0 END,
        AVG_GYUNGIL  -- VAL_9: 당해년도 평균 경과일
    FROM (
        SELECT
            -- 최근1개월 사고구분별 집계 (CNT_1~CNT_8)
            NVL(SUM(CASE WHEN A.WK_DT >= V_MONTH_FROM AND S.SAGO_GUBUN_CD = '050008' THEN 1 ELSE 0 END), 0) AS CNT_1,
            NVL(SUM(CASE WHEN A.WK_DT >= V_MONTH_FROM AND S.SAGO_GUBUN_CD = '050009' THEN 1 ELSE 0 END), 0) AS CNT_2,
            NVL(SUM(CASE WHEN A.WK_DT >= V_MONTH_FROM AND S.SAGO_GUBUN_CD = '050007' THEN 1 ELSE 0 END), 0) AS CNT_3,
            NVL(SUM(CASE WHEN A.WK_DT >= V_MONTH_FROM AND S.SAGO_GUBUN_CD = '050002' THEN 1 ELSE 0 END), 0) AS CNT_4,
            NVL(SUM(CASE WHEN A.WK_DT >= V_MONTH_FROM AND S.SAGO_GUBUN_CD = '050003' THEN 1 ELSE 0 END), 0) AS CNT_5,
            NVL(SUM(CASE WHEN A.WK_DT >= V_MONTH_FROM AND S.SAGO_GUBUN_CD = '050004' THEN 1 ELSE 0 END), 0) AS CNT_6,
            NVL(SUM(CASE WHEN A.WK_DT >= V_MONTH_FROM AND S.SAGO_GUBUN_CD = '050005' THEN 1 ELSE 0 END), 0) AS CNT_7,
            NVL(SUM(CASE WHEN A.WK_DT >= V_MONTH_FROM AND S.SAGO_GUBUN_CD = '050006' THEN 1 ELSE 0 END), 0) AS CNT_8,
            -- 당해년도 누계 (CNT_9) - 1/1 ~ 기준일
            NVL(COUNT(*), 0) AS CNT_9,
            -- 최근1개월 합계 (비율 계산용)
            NVL(SUM(CASE WHEN A.WK_DT >= V_MONTH_FROM THEN 1 ELSE 0 END), 0) AS TOTAL_CNT,
            -- 당해년도 평균 경과일 (임돈전출/판매 제외) - WITH절 사전 집계 사용
            NVL(ROUND(AVG(
                CASE WHEN S.SAGO_GUBUN_CD NOT IN ('050005', '050006') THEN
                    TO_DATE(A.WK_DT, 'YYYYMMDD') - NVL(TO_DATE(LG.LAST_GB_DT, 'YYYYMMDD'), MD.LAST_WK_DT)
                END
            ), 1), 0) AS AVG_GYUNGIL
        FROM TB_MODON_WK A
        INNER JOIN TB_SAGO S
            ON S.FARM_NO = A.FARM_NO AND S.PIG_NO = A.PIG_NO
           AND S.WK_DT = A.WK_DT AND S.WK_GUBUN = A.WK_GUBUN AND S.USE_YN = 'Y'
        INNER JOIN TB_MODON MD
            ON MD.FARM_NO = A.FARM_NO AND MD.PIG_NO = A.PIG_NO
        LEFT OUTER JOIN LAST_GB LG
            ON LG.FARM_NO = A.FARM_NO AND LG.PIG_NO = A.PIG_NO AND LG.SAGO_WK_DT = A.WK_DT
        WHERE A.FARM_NO = P_FARM_NO
          AND A.WK_GUBUN = 'F'
          AND A.USE_YN = 'Y'
          AND A.WK_DT >= V_YEAR_FROM  -- 당해년도부터 조회 (최근1개월은 CASE WHEN으로 필터)
          AND A.WK_DT <= P_DT_TO
    );
    V_PROC_CNT := V_PROC_CNT + 1;

    -- ================================================
    -- 4. 경과일별 사고복수 차트 INSERT (GUBUN='SG', SUB_GUBUN='CHART')
    --    임돈전출/판매 제외
    --    경과일 = 사고일 - 마지막 교배일 (사고 이전 가장 최근 교배)
    --    이전 교배 기록이 없으면 TB_MODON.LAST_WK_DT 사용
    --    ★ 성능 최적화: 스칼라 서브쿼리 → WITH절 사전 집계로 변경
    -- ================================================
    INSERT INTO TS_INS_WEEK_SUB (
        MASTER_SEQ, FARM_NO, GUBUN, SUB_GUBUN, SORT_NO,
        CNT_1, CNT_2, CNT_3, CNT_4, CNT_5, CNT_6, CNT_7, CNT_8
    )
    WITH
    -- 마지막 교배일 사전 계산 (스칼라 서브쿼리 제거)
    LAST_GB AS (
        SELECT /*+ INDEX(WK IX_TB_MODON_WK_01) */
               WK.FARM_NO, WK.PIG_NO, WK.WK_DT AS SAGO_WK_DT, WK.WK_DATE AS SAGO_WK_DATE,
               MAX(GB.WK_DATE) AS LAST_GB_DATE
        FROM TB_MODON_WK WK
        LEFT OUTER JOIN TB_MODON_WK GB
            ON GB.FARM_NO = WK.FARM_NO AND GB.PIG_NO = WK.PIG_NO
           AND GB.WK_GUBUN = 'G' AND GB.USE_YN = 'Y'
           AND GB.WK_DATE < WK.WK_DATE
        WHERE WK.FARM_NO = P_FARM_NO
          AND WK.WK_GUBUN = 'F'
          AND WK.USE_YN = 'Y'
          AND WK.WK_DT >= P_DT_FROM
          AND WK.WK_DT <= P_DT_TO
        GROUP BY WK.FARM_NO, WK.PIG_NO, WK.WK_DT, WK.WK_DATE
    )
    SELECT
        P_MASTER_SEQ, P_FARM_NO, 'SG', 'CHART', 1,
        NVL(SUM(CASE WHEN GYUNGIL <= 7 THEN 1 ELSE 0 END), 0),
        NVL(SUM(CASE WHEN GYUNGIL BETWEEN 8 AND 10 THEN 1 ELSE 0 END), 0),
        NVL(SUM(CASE WHEN GYUNGIL BETWEEN 11 AND 15 THEN 1 ELSE 0 END), 0),
        NVL(SUM(CASE WHEN GYUNGIL BETWEEN 16 AND 20 THEN 1 ELSE 0 END), 0),
        NVL(SUM(CASE WHEN GYUNGIL BETWEEN 21 AND 35 THEN 1 ELSE 0 END), 0),
        NVL(SUM(CASE WHEN GYUNGIL BETWEEN 36 AND 40 THEN 1 ELSE 0 END), 0),
        NVL(SUM(CASE WHEN GYUNGIL BETWEEN 41 AND 45 THEN 1 ELSE 0 END), 0),
        NVL(SUM(CASE WHEN GYUNGIL >= 46 THEN 1 ELSE 0 END), 0)
    FROM (
        SELECT
            LG.SAGO_WK_DATE - NVL(LG.LAST_GB_DATE, MD.LAST_WK_DT) AS GYUNGIL
        FROM LAST_GB LG
        INNER JOIN TB_SAGO S
            ON S.FARM_NO = LG.FARM_NO AND S.PIG_NO = LG.PIG_NO
           AND S.WK_DT = LG.SAGO_WK_DT AND S.WK_GUBUN = 'F' AND S.USE_YN = 'Y'
        INNER JOIN TB_MODON MD
            ON MD.FARM_NO = LG.FARM_NO AND MD.PIG_NO = LG.PIG_NO
        WHERE S.SAGO_GUBUN_CD NOT IN ('050005', '050006')
    ) SG
    WHERE SG.GYUNGIL IS NOT NULL;
    V_PROC_CNT := V_PROC_CNT + 1;

    -- ================================================
    -- 5. TS_INS_WEEK 메인 테이블 업데이트
    --    LAST_SG_CNT: 지난주 합계 (SORT_NO=1)
    --    LAST_SG_AVG_GYUNGIL: 지난주 평균 경과일 (SORT_NO=1의 VAL_9)
    --    LAST_SG_SUM: 당해년도 누계 (SORT_NO=2의 CNT_9)
    --    LAST_SG_SUM_AVG_GYUNGIL: 당해년도 평균 경과일 (SORT_NO=2의 VAL_9)
    -- ================================================
    SELECT
        NVL(SUM(CASE WHEN SORT_NO = 1 THEN CNT_1+CNT_2+CNT_3+CNT_4+CNT_5+CNT_6+CNT_7+CNT_8 ELSE 0 END), 0),
        NVL(MAX(CASE WHEN SORT_NO = 1 THEN VAL_9 ELSE 0 END), 0),  -- 지난주 평균 경과일
        NVL(MAX(CASE WHEN SORT_NO = 2 THEN CNT_9 ELSE 0 END), 0),  -- 당해년도 누계
        NVL(MAX(CASE WHEN SORT_NO = 2 THEN VAL_9 ELSE 0 END), 0)   -- 당해년도 평균 경과일
    INTO V_WEEK_TOTAL, V_WEEK_AVG_GYUNGIL, V_YEAR_TOTAL, V_YEAR_AVG_GYUNGIL
    FROM TS_INS_WEEK_SUB
    WHERE MASTER_SEQ = P_MASTER_SEQ
      AND FARM_NO = P_FARM_NO
      AND GUBUN = 'SG'
      AND SUB_GUBUN = 'STAT';

    UPDATE TS_INS_WEEK
    SET LAST_SG_CNT = V_WEEK_TOTAL,
        LAST_SG_AVG_GYUNGIL = V_WEEK_AVG_GYUNGIL,       -- 지난주 평균 경과일
        LAST_SG_SUM = V_YEAR_TOTAL,                     -- 당해년도 누계
        LAST_SG_SUM_AVG_GYUNGIL = V_YEAR_AVG_GYUNGIL    -- 당해년도 평균 경과일
    WHERE MASTER_SEQ = P_MASTER_SEQ
      AND FARM_NO = P_FARM_NO;

    COMMIT;
    SP_INS_COM_LOG_END(V_LOG_SEQ, V_PROC_CNT);

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        SP_INS_COM_LOG_ERROR(V_LOG_SEQ, SQLCODE, SQLERRM);
        RAISE;
END SP_INS_WEEK_SG_POPUP;
/

-- 프로시저 확인
SELECT OBJECT_NAME, STATUS FROM USER_OBJECTS WHERE OBJECT_NAME = 'SP_INS_WEEK_SG_POPUP';
