-- ============================================================
-- SP_INS_WEEK_ALERT_POPUP: 관리대상 모돈 추출 프로시저 (통합 버전)
--
-- 상세 문서: docs/db/ins/week/12.alert-popup.md
--
-- 최적화:
--   - 5개 개별 쿼리 → 단일 WITH절 통합 쿼리로 변경
--   - 20개 변수 → INSERT SELECT로 직접 INSERT
--   - LAST_WK CTE를 공통으로 1회만 실행
-- ============================================================

CREATE OR REPLACE PROCEDURE SP_INS_WEEK_ALERT_POPUP (
    P_MASTER_SEQ    IN  NUMBER,
    P_JOB_NM        IN  VARCHAR2,
    P_FARM_NO       IN  INTEGER,
    P_LOCALE        IN  VARCHAR2,
    P_DT_FROM       IN  VARCHAR2,
    P_DT_TO         IN  VARCHAR2
) AS
    V_LOG_SEQ       NUMBER;
    V_PROC_CNT      INTEGER := 0;
    V_BASE_DT       DATE := TO_DATE(P_DT_TO, 'YYYYMMDD');

    -- 농장 설정값 (SP_INS_WEEK_CONFIG에서 저장한 값 조회)
    V_FIRST_GB_DAY  NUMBER := 240;  -- 후보돈초교배일령 (140007) → CONFIG.CNT_4
    V_AVG_RETURN    NUMBER := 7;    -- 평균재귀일 (140008) → CONFIG.CNT_5
    V_PREG_PERIOD   NUMBER := 115;  -- 평균임신기간 (140002) → CONFIG.CNT_1
    V_WEAN_PERIOD   NUMBER := 21;   -- 평균포유기간 (140003) → CONFIG.CNT_2

BEGIN
    SP_INS_COM_LOG_START(P_MASTER_SEQ, P_JOB_NM, 'SP_INS_WEEK_ALERT_POPUP', P_FARM_NO, V_LOG_SEQ);

    -- ================================================
    -- 농장 설정값 조회 (SP_INS_WEEK_CONFIG에서 저장한 값)
    -- ★ TC_CODE_SYS/TC_FARM_CONFIG 직접 조회 제거
    --    → TS_INS_WEEK_SUB (GUBUN='CONFIG')에서 조회
    -- ================================================
    BEGIN
        SELECT NVL(CNT_1, 115),  -- 평균임신기간
               NVL(CNT_2, 21),   -- 평균포유기간
               NVL(CNT_4, 240),  -- 후보돈초교배일령
               NVL(CNT_5, 7)     -- 평균재귀일
        INTO V_PREG_PERIOD, V_WEAN_PERIOD, V_FIRST_GB_DAY, V_AVG_RETURN
        FROM TS_INS_WEEK_SUB
        WHERE MASTER_SEQ = P_MASTER_SEQ
          AND FARM_NO = P_FARM_NO
          AND GUBUN = 'CONFIG';
    EXCEPTION
        WHEN OTHERS THEN NULL;  -- 기본값 유지
    END;

    -- 기존 데이터 삭제 (재실행 대비)
    DELETE FROM TS_INS_WEEK_SUB
    WHERE MASTER_SEQ = P_MASTER_SEQ AND FARM_NO = P_FARM_NO AND GUBUN = 'ALERT';

    -- ================================================
    -- 통합 쿼리: 5개 유형 × 4개 구간을 한 번에 집계 후 INSERT
    -- ★ 성능 최적화:
    --   1. NOT EXISTS → LEFT JOIN + IS NULL 변경
    --   2. TO_DATE(WK_DT) 가공 제거 → WK_DATE(DATE 타입) 컬럼 활용
    --   3. 스칼라 서브쿼리 제거 → GROUP BY 집계로 변경
    -- ================================================
    INSERT INTO TS_INS_WEEK_SUB (
        MASTER_SEQ, FARM_NO, GUBUN, SORT_NO, CODE_1,
        CNT_1, CNT_2, CNT_3, CNT_4, CNT_5
    )
    WITH
    -- 공통: 최종 작업 SEQ (1회만 조회) + WK_DATE(DATE) 컬럼 추가
    LAST_WK AS (
        SELECT /*+ INDEX(WK IX_TB_MODON_WK_01) */
               FARM_NO, PIG_NO, MAX(SEQ) AS MSEQ
        FROM TB_MODON_WK
        WHERE FARM_NO = P_FARM_NO AND USE_YN = 'Y'
        GROUP BY FARM_NO, PIG_NO
    ),
    -- 작업이력 없는 모돈 목록 (NOT EXISTS → LEFT JOIN + IS NULL 변환)
    NO_WK_MODON AS (
        SELECT MD.FARM_NO, MD.PIG_NO
        FROM TB_MODON MD
        LEFT OUTER JOIN (
            SELECT DISTINCT FARM_NO, PIG_NO FROM TB_MODON_WK WHERE FARM_NO = P_FARM_NO AND USE_YN = 'Y'
        ) WK ON WK.FARM_NO = MD.FARM_NO AND WK.PIG_NO = MD.PIG_NO
        WHERE MD.FARM_NO = P_FARM_NO
          AND MD.USE_YN = 'Y'
          AND MD.OUT_DT = TO_DATE('9999-12-31', 'YYYY-MM-DD')
          AND WK.PIG_NO IS NULL
    ),
    -- 1) 미교배 후보돈
    --    조건1: STATUS_CD='010001' (후보돈) AND 작업이력 없음
    --    조건2: STATUS_CD='010002' (임신돈) AND IN_SANCHA=0 AND IN_GYOBAE_CNT=1 AND 작업이력 없음
    HUBO AS (
        SELECT (V_BASE_DT - MD.BIRTH_DT) - V_FIRST_GB_DAY AS DELAY_DAYS
        FROM TB_MODON MD
        INNER JOIN NO_WK_MODON NW ON NW.FARM_NO = MD.FARM_NO AND NW.PIG_NO = MD.PIG_NO
        WHERE MD.IN_DT < V_BASE_DT + 1
          AND (V_BASE_DT - MD.BIRTH_DT) - V_FIRST_GB_DAY >= 0
          AND (
              MD.STATUS_CD = '010001'  -- 후보돈
              OR (MD.STATUS_CD = '010002' AND MD.IN_SANCHA = 0 AND MD.IN_GYOBAE_CNT = 1)  -- 전입 임신돈 (초교배)
          )
    ),
    -- 2) 이유후 미교배 (작업이력 + 전입돈)
    EU_MI AS (
        SELECT (V_BASE_DT - WK.WK_DATE) - V_AVG_RETURN + 1 AS DELAY_DAYS
        FROM TB_MODON MD
        JOIN LAST_WK LW ON LW.FARM_NO = MD.FARM_NO AND LW.PIG_NO = MD.PIG_NO
        JOIN TB_MODON_WK WK ON WK.FARM_NO = LW.FARM_NO AND WK.PIG_NO = LW.PIG_NO AND WK.SEQ = LW.MSEQ
        WHERE MD.FARM_NO = P_FARM_NO
          AND MD.OUT_DT = TO_DATE('9999-12-31', 'YYYY-MM-DD') AND MD.USE_YN = 'Y'
          AND WK.WK_GUBUN = 'E' AND WK.DAERI_YN = 'N'
          AND (V_BASE_DT - WK.WK_DATE) + 1 >= V_AVG_RETURN
        UNION ALL
        SELECT (V_BASE_DT - MD.LAST_WK_DT) - V_AVG_RETURN AS DELAY_DAYS
        FROM TB_MODON MD
        INNER JOIN NO_WK_MODON NW ON NW.FARM_NO = MD.FARM_NO AND NW.PIG_NO = MD.PIG_NO
        WHERE MD.STATUS_CD = '010005'
          AND MD.IN_DT < V_BASE_DT + 1
          AND (V_BASE_DT - MD.LAST_WK_DT) - V_AVG_RETURN >= 0
    ),
    -- 3) 사고후 미교배 (작업이력 + 전입돈)
    SG_MI AS (
        SELECT (V_BASE_DT - WK.WK_DATE) AS DELAY_DAYS
        FROM TB_MODON MD
        JOIN LAST_WK LW ON LW.FARM_NO = MD.FARM_NO AND LW.PIG_NO = MD.PIG_NO
        JOIN TB_MODON_WK WK ON WK.FARM_NO = LW.FARM_NO AND WK.PIG_NO = LW.PIG_NO AND WK.SEQ = LW.MSEQ
        WHERE MD.FARM_NO = P_FARM_NO
          AND MD.OUT_DT = TO_DATE('9999-12-31', 'YYYY-MM-DD') AND MD.USE_YN = 'Y'
          AND WK.WK_GUBUN = 'F'
          AND (V_BASE_DT - WK.WK_DATE) >= 0
        UNION ALL
        SELECT (V_BASE_DT - MD.LAST_WK_DT) AS DELAY_DAYS
        FROM TB_MODON MD
        INNER JOIN NO_WK_MODON NW ON NW.FARM_NO = MD.FARM_NO AND NW.PIG_NO = MD.PIG_NO
        WHERE MD.STATUS_CD IN ('010006', '010007')
          AND MD.IN_DT < V_BASE_DT + 1
          AND (V_BASE_DT - MD.LAST_WK_DT) >= 0
    ),
    -- 4) 분만지연 (최종 교배) - WK_DATE 컬럼 활용
    BM_DELAY AS (
        SELECT (V_BASE_DT - WK.WK_DATE) - V_PREG_PERIOD AS DELAY_DAYS
        FROM TB_MODON MD
        JOIN LAST_WK LW ON LW.FARM_NO = MD.FARM_NO AND LW.PIG_NO = MD.PIG_NO
        JOIN TB_MODON_WK WK ON WK.FARM_NO = LW.FARM_NO AND WK.PIG_NO = LW.PIG_NO AND WK.SEQ = LW.MSEQ
        WHERE MD.FARM_NO = P_FARM_NO
          AND MD.OUT_DT = TO_DATE('9999-12-31', 'YYYY-MM-DD') AND MD.USE_YN = 'Y'
          AND WK.WK_GUBUN = 'G'
          AND (V_BASE_DT - WK.WK_DATE) - V_PREG_PERIOD >= 0
    ),
    -- 5) 이유지연 (최종 분만) - WK_DATE 컬럼 활용
    EU_DELAY AS (
        SELECT (V_BASE_DT - WK.WK_DATE) - V_WEAN_PERIOD AS DELAY_DAYS
        FROM TB_MODON MD
        JOIN LAST_WK LW ON LW.FARM_NO = MD.FARM_NO AND LW.PIG_NO = MD.PIG_NO
        JOIN TB_MODON_WK WK ON WK.FARM_NO = LW.FARM_NO AND WK.PIG_NO = LW.PIG_NO AND WK.SEQ = LW.MSEQ
        WHERE MD.FARM_NO = P_FARM_NO
          AND MD.OUT_DT = TO_DATE('9999-12-31', 'YYYY-MM-DD') AND MD.USE_YN = 'Y'
          AND WK.WK_GUBUN = 'B'
          AND (V_BASE_DT - WK.WK_DATE) - V_WEAN_PERIOD >= 0
    ),
    -- 5개 유형 통합 + 구간 분류 (스칼라 서브쿼리 제거)
    ALL_DELAYS AS (
        SELECT 'HUBO' AS TYPE_CD, DELAY_DAYS FROM HUBO
        UNION ALL
        SELECT 'EU_MI', DELAY_DAYS FROM EU_MI
        UNION ALL
        SELECT 'SG_MI', DELAY_DAYS FROM SG_MI
        UNION ALL
        SELECT 'BM_DELAY', DELAY_DAYS FROM BM_DELAY
        UNION ALL
        SELECT 'EU_DELAY', DELAY_DAYS FROM EU_DELAY
    ),
    -- 구간 정의
    PERIODS AS (
        SELECT 1 AS SORT_NO, '~3'   AS PERIOD, 0 AS MIN_DAY, 3    AS MAX_DAY FROM DUAL UNION ALL
        SELECT 2, '4~7',  4, 7    FROM DUAL UNION ALL
        SELECT 3, '8~14', 8, 14   FROM DUAL UNION ALL
        SELECT 4, '14~',  15, 9999 FROM DUAL
    )
    -- 최종 집계 (GROUP BY 활용)
    SELECT
        P_MASTER_SEQ, P_FARM_NO, 'ALERT', P.SORT_NO, P.PERIOD,
        NVL(SUM(CASE WHEN AD.TYPE_CD = 'HUBO' THEN 1 END), 0),
        NVL(SUM(CASE WHEN AD.TYPE_CD = 'EU_MI' THEN 1 END), 0),
        NVL(SUM(CASE WHEN AD.TYPE_CD = 'SG_MI' THEN 1 END), 0),
        NVL(SUM(CASE WHEN AD.TYPE_CD = 'BM_DELAY' THEN 1 END), 0),
        NVL(SUM(CASE WHEN AD.TYPE_CD = 'EU_DELAY' THEN 1 END), 0)
    FROM PERIODS P
    LEFT OUTER JOIN ALL_DELAYS AD
        ON AD.DELAY_DAYS >= P.MIN_DAY AND AD.DELAY_DAYS <= P.MAX_DAY
    GROUP BY P.SORT_NO, P.PERIOD
    ORDER BY P.SORT_NO;

    V_PROC_CNT := SQL%ROWCOUNT;

    -- TS_INS_WEEK 요약 업데이트 (서브쿼리로 합계 계산)
    UPDATE TS_INS_WEEK W
    SET (ALERT_TOTAL, ALERT_HUBO, ALERT_EU_MI, ALERT_SG_MI, ALERT_BM_DELAY, ALERT_EU_DELAY) = (
        SELECT NVL(SUM(CNT_1 + CNT_2 + CNT_3 + CNT_4 + CNT_5), 0),
               NVL(SUM(CNT_1), 0), NVL(SUM(CNT_2), 0), NVL(SUM(CNT_3), 0),
               NVL(SUM(CNT_4), 0), NVL(SUM(CNT_5), 0)
        FROM TS_INS_WEEK_SUB S
        WHERE S.MASTER_SEQ = P_MASTER_SEQ AND S.FARM_NO = P_FARM_NO AND S.GUBUN = 'ALERT'
    )
    WHERE W.MASTER_SEQ = P_MASTER_SEQ AND W.FARM_NO = P_FARM_NO;

    COMMIT;
    SP_INS_COM_LOG_END(V_LOG_SEQ, V_PROC_CNT);

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        SP_INS_COM_LOG_ERROR(V_LOG_SEQ, SQLCODE, SQLERRM);
        RAISE;
END SP_INS_WEEK_ALERT_POPUP;
/

-- 프로시저 확인
SELECT OBJECT_NAME, STATUS FROM USER_OBJECTS WHERE OBJECT_NAME = 'SP_INS_WEEK_ALERT_POPUP';
