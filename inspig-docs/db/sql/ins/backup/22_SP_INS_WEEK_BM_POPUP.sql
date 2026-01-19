-- ============================================================
-- SP_INS_WEEK_BM_POPUP: 분만 팝업 데이터 추출 프로시저
--
-- 상세 문서: docs/db/ins/week/22.bm-popup.md (예정)
--
-- 데이터 구조:
--   - TS_INS_WEEK_SUB (GUBUN='BM'): 분만 요약 통계
--
-- DB 컬럼 매핑 (BM):
--   - CNT_1: 분만복수 (실적)
--   - CNT_2: 총산 합계
--   - CNT_3: 실산 합계
--   - CNT_4: 사산 합계
--   - CNT_5: 미라 합계
--   - CNT_6: 포유개시 합계
--   - CNT_7: 분만복수 (예정)
--   - VAL_1: 총산 평균
--   - VAL_2: 실산 평균
--   - VAL_3: 사산 평균
--   - VAL_4: 미라 평균
--   - VAL_5: 포유개시 평균
-- ============================================================

CREATE OR REPLACE PROCEDURE SP_INS_WEEK_BM_POPUP (
    P_MASTER_SEQ    IN  NUMBER,
    P_JOB_NM        IN  VARCHAR2,
    P_FARM_NO       IN  INTEGER,
    P_LOCALE        IN  VARCHAR2,
    P_DT_FROM       IN  VARCHAR2,
    P_DT_TO         IN  VARCHAR2
) AS
    V_LOG_SEQ       NUMBER;
    V_PROC_CNT      INTEGER := 0;

    -- 예정/누적 변수
    V_PLAN_BM       INTEGER := 0;
    V_ACC_BM_CNT    INTEGER := 0;
    V_ACC_TOTAL     INTEGER := 0;
    V_ACC_LIVE      INTEGER := 0;
    V_ACC_AVG_TOTAL NUMBER(10,1) := 0;
    V_ACC_AVG_LIVE  NUMBER(10,1) := 0;

    -- 집계 변수
    V_TOTAL_CNT     INTEGER := 0;
    V_SUM_TOTAL     INTEGER := 0;
    V_SUM_LIVE      INTEGER := 0;
    V_SUM_DEAD      INTEGER := 0;
    V_SUM_MUMMY     INTEGER := 0;
    V_SUM_POGAE     INTEGER := 0;

    V_AVG_TOTAL     NUMBER(10,1) := 0;
    V_AVG_LIVE      NUMBER(10,1) := 0;
    V_AVG_DEAD      NUMBER(10,1) := 0;
    V_AVG_MUMMY     NUMBER(10,1) := 0;
    V_AVG_POGAE     NUMBER(10,1) := 0;

    V_SDT           VARCHAR2(10);
    V_EDT           VARCHAR2(10);

BEGIN
    -- 로그 시작
    SP_INS_COM_LOG_START(P_MASTER_SEQ, P_JOB_NM, 'SP_INS_WEEK_BM_POPUP', P_FARM_NO, V_LOG_SEQ);

    V_SDT := SUBSTR(P_DT_FROM, 1, 4) || '-' || SUBSTR(P_DT_FROM, 5, 2) || '-' || SUBSTR(P_DT_FROM, 7, 2);
    V_EDT := SUBSTR(P_DT_TO, 1, 4) || '-' || SUBSTR(P_DT_TO, 5, 2) || '-' || SUBSTR(P_DT_TO, 7, 2);

    -- ================================================
    -- 1. 분만 예정 복수 조회 (FN_MD_SCHEDULE_BSE_2020)
    --    P_SCHEDULE_GB='150002' (분만예정)
    -- ================================================
    SELECT COUNT(*) INTO V_PLAN_BM
    FROM TABLE(FN_MD_SCHEDULE_BSE_2020(
        P_FARM_NO, 'JOB-DAJANG', '150002', NULL,
        V_SDT, V_EDT, NULL, 'ko', 'yyyy-MM-dd', '-1', NULL
    ));

    -- ================================================
    -- 2. 연간 누적 실적 조회 (1/1 ~ 기준일)
    -- ================================================
    SELECT
        COUNT(*),
        NVL(SUM(NVL(B.SILSAN,0) + NVL(B.SASAN,0) + NVL(B.MILA,0)), 0),
        NVL(SUM(B.SILSAN), 0),
        NVL(ROUND(AVG(NVL(B.SILSAN,0) + NVL(B.SASAN,0) + NVL(B.MILA,0)), 1), 0),
        NVL(ROUND(AVG(B.SILSAN), 1), 0)
    INTO V_ACC_BM_CNT, V_ACC_TOTAL, V_ACC_LIVE, V_ACC_AVG_TOTAL, V_ACC_AVG_LIVE
    FROM TB_MODON_WK A
    INNER JOIN TB_BUNMAN B
        ON B.FARM_NO = A.FARM_NO AND B.PIG_NO = A.PIG_NO
       AND B.WK_DT = A.WK_DT AND B.WK_GUBUN = A.WK_GUBUN AND B.USE_YN = 'Y'
    WHERE A.FARM_NO = P_FARM_NO
      AND A.WK_GUBUN = 'B'
      AND A.USE_YN = 'Y'
      AND A.WK_DT >= SUBSTR(P_DT_TO, 1, 4) || '0101'
      AND A.WK_DT <= P_DT_TO;

    -- ================================================
    -- 3. 기존 데이터 삭제
    -- ================================================
    DELETE FROM TS_INS_WEEK_SUB
    WHERE MASTER_SEQ = P_MASTER_SEQ
      AND FARM_NO = P_FARM_NO
      AND GUBUN = 'BM';

    -- ================================================
    -- 4. 분만 요약 통계 직접 집계 (GUBUN='BM')
    --    ★ 성능 최적화: 스칼라 서브쿼리 6회 → WITH절 사전 집계로 변경
    -- ================================================
    WITH
    -- 포유개시용 자돈 증감 사전 집계 (BUN_DT 기준)
    JADON_POGAE_AGG AS (
        SELECT /*+ INDEX(JT IX_TB_MODON_JADON_TRANS_01) */
               JT.FARM_NO, JT.PIG_NO, JT.BUN_DT,
               SUM(CASE WHEN JT.GUBUN_CD = '160001' THEN NVL(JT.DUSU,0)+NVL(JT.DUSU_SU,0) ELSE 0 END) AS PS_DS,
               SUM(CASE WHEN JT.GUBUN_CD = '160003' THEN NVL(JT.DUSU,0)+NVL(JT.DUSU_SU,0) ELSE 0 END) AS JI_DS,
               SUM(CASE WHEN JT.GUBUN_CD = '160004' THEN NVL(JT.DUSU,0)+NVL(JT.DUSU_SU,0) ELSE 0 END) AS JC_DS
        FROM TB_MODON_JADON_TRANS JT
        WHERE JT.FARM_NO = P_FARM_NO
          AND JT.USE_YN = 'Y'
        GROUP BY JT.FARM_NO, JT.PIG_NO, JT.BUN_DT
    )
    SELECT /*+ LEADING(A B) USE_NL(B) INDEX(A IX_TB_MODON_WK_01) */
        COUNT(*),
        NVL(SUM(NVL(B.SILSAN,0) + NVL(B.SASAN,0) + NVL(B.MILA,0)), 0),
        NVL(SUM(NVL(B.SILSAN, 0)), 0),
        NVL(SUM(NVL(B.SASAN, 0)), 0),
        NVL(SUM(NVL(B.MILA, 0)), 0),
        -- 포유개시 합계: SUM(SILSAN - 폐사 + 양자전입 - 양자전출) - WITH절 사전 집계 사용
        NVL(SUM(
            NVL(B.SILSAN, 0)
            - NVL(PO.PS_DS, 0)
            + NVL(PO.JI_DS, 0)
            - NVL(PO.JC_DS, 0)
        ), 0),
        NVL(ROUND(AVG(NVL(B.SILSAN,0) + NVL(B.SASAN,0) + NVL(B.MILA,0)), 1), 0),
        NVL(ROUND(AVG(NVL(B.SILSAN, 0)), 1), 0),
        NVL(ROUND(AVG(NVL(B.SASAN, 0)), 1), 0),
        NVL(ROUND(AVG(NVL(B.MILA, 0)), 1), 0),
        -- 포유개시 평균 - WITH절 사전 집계 사용
        NVL(ROUND(AVG(
            NVL(B.SILSAN, 0)
            - NVL(PO.PS_DS, 0)
            + NVL(PO.JI_DS, 0)
            - NVL(PO.JC_DS, 0)
        ), 1), 0)
    INTO V_TOTAL_CNT, V_SUM_TOTAL, V_SUM_LIVE, V_SUM_DEAD, V_SUM_MUMMY, V_SUM_POGAE,
         V_AVG_TOTAL, V_AVG_LIVE, V_AVG_DEAD, V_AVG_MUMMY, V_AVG_POGAE
    FROM TB_MODON_WK A
    INNER JOIN TB_BUNMAN B
        ON B.FARM_NO = A.FARM_NO AND B.PIG_NO = A.PIG_NO
       AND B.WK_DT = A.WK_DT AND B.WK_GUBUN = A.WK_GUBUN AND B.USE_YN = 'Y'
    -- 포유개시용 사전 집계 JOIN
    LEFT OUTER JOIN JADON_POGAE_AGG PO
        ON PO.FARM_NO = A.FARM_NO AND PO.PIG_NO = A.PIG_NO AND PO.BUN_DT = A.WK_DT
    WHERE A.FARM_NO = P_FARM_NO
      AND A.WK_GUBUN = 'B'
      AND A.USE_YN = 'Y'
      AND A.WK_DT >= P_DT_FROM
      AND A.WK_DT <= P_DT_TO;

    -- ================================================
    -- 5. 요약 통계 INSERT (GUBUN='BM')
    -- ================================================
    INSERT INTO TS_INS_WEEK_SUB (
        MASTER_SEQ, FARM_NO, GUBUN, SORT_NO,
        CNT_1, CNT_2, CNT_3, CNT_4, CNT_5, CNT_6, CNT_7,
        VAL_1, VAL_2, VAL_3, VAL_4, VAL_5
    ) VALUES (
        P_MASTER_SEQ, P_FARM_NO, 'BM', 1,
        V_TOTAL_CNT,    -- CNT_1: 분만복수 (실적)
        V_SUM_TOTAL,    -- CNT_2: 총산 합계
        V_SUM_LIVE,     -- CNT_3: 실산 합계
        V_SUM_DEAD,     -- CNT_4: 사산 합계
        V_SUM_MUMMY,    -- CNT_5: 미라 합계
        V_SUM_POGAE,    -- CNT_6: 포유개시 합계
        V_PLAN_BM,      -- CNT_7: 분만복수 (예정)
        V_AVG_TOTAL,    -- VAL_1: 총산 평균
        V_AVG_LIVE,     -- VAL_2: 실산 평균
        V_AVG_DEAD,     -- VAL_3: 사산 평균
        V_AVG_MUMMY,    -- VAL_4: 미라 평균
        V_AVG_POGAE     -- VAL_5: 포유개시 평균
    );

    V_PROC_CNT := 1;

    -- ================================================
    -- 6. TS_INS_WEEK 메인 테이블 업데이트
    -- ================================================
    UPDATE TS_INS_WEEK
    SET LAST_BM_CNT = V_TOTAL_CNT,
        LAST_BM_TOTAL = V_SUM_TOTAL,
        LAST_BM_LIVE = V_SUM_LIVE,
        LAST_BM_DEAD = V_SUM_DEAD,
        LAST_BM_MUMMY = V_SUM_MUMMY,
        LAST_BM_AVG_TOTAL = V_AVG_TOTAL,
        LAST_BM_AVG_LIVE = V_AVG_LIVE,
        -- 누적 데이터
        LAST_BM_SUM_CNT = V_ACC_BM_CNT,
        LAST_BM_SUM_TOTAL = V_ACC_TOTAL,
        LAST_BM_SUM_LIVE = V_ACC_LIVE,
        LAST_BM_SUM_AVG_TOTAL = V_ACC_AVG_TOTAL,
        LAST_BM_SUM_AVG_LIVE = V_ACC_AVG_LIVE
    WHERE MASTER_SEQ = P_MASTER_SEQ
      AND FARM_NO = P_FARM_NO;

    COMMIT;
    SP_INS_COM_LOG_END(V_LOG_SEQ, V_PROC_CNT);

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        SP_INS_COM_LOG_ERROR(V_LOG_SEQ, SQLCODE, SQLERRM);
        RAISE;
END SP_INS_WEEK_BM_POPUP;
/

-- 프로시저 확인
SELECT OBJECT_NAME, STATUS FROM USER_OBJECTS WHERE OBJECT_NAME = 'SP_INS_WEEK_BM_POPUP';
