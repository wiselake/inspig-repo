-- ============================================================
-- SP_INS_WEEK_EU_POPUP: 이유 팝업 데이터 추출 프로시저
--
-- 상세 문서: docs/db/ins/week/23.eu-popup.md
--
-- 데이터 구조:
--   - TS_INS_WEEK_SUB (GUBUN='EU'): 이유 요약 통계
--
-- DB 컬럼 매핑 (EU):
--   - CNT_1: 이유복수 (실적)
--   - CNT_2: 총 이유두수 합계
--   - CNT_3: 실산 합계 (분만 기준)
--   - CNT_4: 포유기간 합계
--   - CNT_5: 이유복수 (예정)
--   - CNT_6: 포유자돈폐사 두수 (160001)
--   - CNT_7: 부분이유 두수 (160002)
--   - CNT_8: 양자전입 두수 (160003)
--   - CNT_9: 양자전출 두수 (160004)
--   - VAL_1: 이유두수 평균
--   - VAL_2: 평균체중 (가중평균)
--   - VAL_3: 이유육성율 (이유두수/실산 * 100)
--   - VAL_4: 평균 포유기간
--   - VAL_5: 포유개시 합계 (실산 - 폐사 + 양자전입 - 양자전출)
--   - STR_1: 총산 합계 (분만 기준, SILSAN+SASAN+MILA)
-- ============================================================

CREATE OR REPLACE PROCEDURE SP_INS_WEEK_EU_POPUP (
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
    V_PLAN_EU       INTEGER := 0;
    V_ACC_EU_CNT    INTEGER := 0;
    V_ACC_EU_JD     INTEGER := 0;
    V_ACC_AVG_JD    NUMBER(10,1) := 0;

    -- 집계 변수
    V_TOTAL_CNT     INTEGER := 0;
    V_SUM_EUDUSU    INTEGER := 0;
    V_SUM_CHONGSAN  INTEGER := 0;  -- 총산 합계 (분만 기준)
    V_SUM_SILSAN    INTEGER := 0;  -- 실산 합계 (분만 기준)
    V_SUM_POUGIGAN  INTEGER := 0;
    V_SUM_KG        NUMBER(10,2) := 0;
    V_SUM_POGAE     INTEGER := 0;  -- 포유개시 합계

    -- 자돈 증감 변수 (TB_MODON_JADON_TRANS)
    V_SUM_PS_DS     INTEGER := 0;  -- 포유자돈폐사 (160001) -
    V_SUM_BB_DS     INTEGER := 0;  -- 부분이유 (160002) -
    V_SUM_JI_DS     INTEGER := 0;  -- 양자전입 (160003) +
    V_SUM_JC_DS     INTEGER := 0;  -- 양자전출 (160004) -

    V_AVG_EUDUSU    NUMBER(10,1) := 0;
    V_AVG_KG        NUMBER(10,2) := 0;
    V_AVG_POUGIGAN  NUMBER(10,1) := 0;
    V_SURVIVAL_RATE NUMBER(10,1) := 0;
    V_CHG_JD        NUMBER(10,1) := 0;  -- 평균 이유두수 증감 (1년평균 대비)

    V_SDT           VARCHAR2(10);
    V_EDT           VARCHAR2(10);

BEGIN
    -- 로그 시작
    SP_INS_COM_LOG_START(P_MASTER_SEQ, P_JOB_NM, 'SP_INS_WEEK_EU_POPUP', P_FARM_NO, V_LOG_SEQ);

    V_SDT := SUBSTR(P_DT_FROM, 1, 4) || '-' || SUBSTR(P_DT_FROM, 5, 2) || '-' || SUBSTR(P_DT_FROM, 7, 2);
    V_EDT := SUBSTR(P_DT_TO, 1, 4) || '-' || SUBSTR(P_DT_TO, 5, 2) || '-' || SUBSTR(P_DT_TO, 7, 2);

    -- ================================================
    -- 1. 이유 예정 복수 조회 (FN_MD_SCHEDULE_BSE_2020)
    --    P_SCHEDULE_GB='150003' (이유예정)
    -- ================================================
    SELECT COUNT(*) INTO V_PLAN_EU
    FROM TABLE(FN_MD_SCHEDULE_BSE_2020(
        P_FARM_NO, 'JOB-DAJANG', '150003', NULL,
        V_SDT, V_EDT, NULL, 'ko', 'yyyy-MM-dd', '-1', NULL
    ));

    -- ================================================
    -- 2. 연간 누적 실적 조회 (1/1 ~ 기준일)
    -- ================================================
    SELECT /*+ INDEX(A IX_TB_MODON_WK_01) */
        COUNT(*),
        NVL(SUM(NVL(D.DUSU, 0) + NVL(D.DUSU_SU, 0)), 0),
        NVL(ROUND(AVG(NVL(D.DUSU, 0) + NVL(D.DUSU_SU, 0)), 1), 0)
    INTO V_ACC_EU_CNT, V_ACC_EU_JD, V_ACC_AVG_JD
    FROM TB_MODON_WK A
    INNER JOIN TB_EU D
        ON D.FARM_NO = A.FARM_NO AND D.PIG_NO = A.PIG_NO
       AND D.WK_DT = A.WK_DT AND D.WK_GUBUN = A.WK_GUBUN AND D.USE_YN = 'Y'
    WHERE A.FARM_NO = P_FARM_NO
      AND A.WK_GUBUN = 'E'
      AND A.USE_YN = 'Y'
      AND A.WK_DT >= SUBSTR(P_DT_TO, 1, 4) || '0101'
      AND A.WK_DT <= P_DT_TO;

    -- ================================================
    -- 3. 기존 데이터 삭제
    -- ================================================
    DELETE FROM TS_INS_WEEK_SUB
    WHERE MASTER_SEQ = P_MASTER_SEQ
      AND FARM_NO = P_FARM_NO
      AND GUBUN = 'EU';

    -- ================================================
    -- 4. 이유 요약 통계 직접 집계 (GUBUN='EU')
    --    자돈 증감 내역 포함 (TB_MODON_JADON_TRANS)
    --    대리모돈(DAERI_YN='Y') 처리: 다음 이유기록 전까지만 조회
    --
    --    ★ 성능 최적화: 스칼라 서브쿼리 11회 → WITH절 사전 집계로 변경
    --    WN (다음작업) JOIN 조건:
    --      - WN.WK_GUBUN = 'G' : 다음 교배일까지 조회
    --      - WN IS NULL AND DAERI_YN = 'N' : 오늘까지 조회
    --      - 그 외 (대리모돈 등) : 현재 이유일 - 1일까지 조회
    -- ================================================
    WITH
    -- 자돈 증감 내역 사전 집계 (SANCHA+WK_DT 기준)
    JADON_TRANS_AGG AS (
        SELECT /*+ INDEX(JT IX_TB_MODON_JADON_TRANS_01) */
               JT.FARM_NO, JT.PIG_NO, JT.SANCHA, JT.WK_DT,
               SUM(CASE WHEN JT.GUBUN_CD = '160001' THEN NVL(JT.DUSU,0)+NVL(JT.DUSU_SU,0) ELSE 0 END) AS PS_DS,
               SUM(CASE WHEN JT.GUBUN_CD = '160002' THEN NVL(JT.DUSU,0)+NVL(JT.DUSU_SU,0) ELSE 0 END) AS BB_DS,
               SUM(CASE WHEN JT.GUBUN_CD = '160003' THEN NVL(JT.DUSU,0)+NVL(JT.DUSU_SU,0) ELSE 0 END) AS JI_DS,
               SUM(CASE WHEN JT.GUBUN_CD = '160004' THEN NVL(JT.DUSU,0)+NVL(JT.DUSU_SU,0) ELSE 0 END) AS JC_DS
        FROM TB_MODON_JADON_TRANS JT
        WHERE JT.FARM_NO = P_FARM_NO
          AND JT.USE_YN = 'Y'
        GROUP BY JT.FARM_NO, JT.PIG_NO, JT.SANCHA, JT.WK_DT
    ),
    -- 포유개시용 사전 집계 (BUN_DT 기준)
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
    ),
    -- 다음 작업일 사전 계산 (스칼라 서브쿼리 제거)
    NEXT_WK AS (
        SELECT FARM_NO, PIG_NO, WK_DT AS CUR_WK_DT,
               MIN(NEXT_WK_DT) AS NEXT_WK_DT, MIN(NEXT_WK_GUBUN) KEEP (DENSE_RANK FIRST ORDER BY NEXT_WK_DT) AS NEXT_WK_GUBUN
        FROM (
            SELECT A.FARM_NO, A.PIG_NO, A.WK_DT,
                   B.WK_DT AS NEXT_WK_DT, B.WK_GUBUN AS NEXT_WK_GUBUN
            FROM TB_MODON_WK A
            INNER JOIN TB_MODON_WK B
                ON B.FARM_NO = A.FARM_NO AND B.PIG_NO = A.PIG_NO
               AND B.WK_DT > A.WK_DT AND B.USE_YN = 'Y'
            WHERE A.FARM_NO = P_FARM_NO
              AND A.WK_GUBUN = 'E'
              AND A.USE_YN = 'Y'
              AND A.WK_DT >= P_DT_FROM
              AND A.WK_DT <= P_DT_TO
        )
        GROUP BY FARM_NO, PIG_NO, WK_DT
    ),
    -- 기간별 자돈 증감 합계 (분만일~종료일)
    JADON_PERIOD_AGG AS (
        SELECT A.FARM_NO, A.PIG_NO, A.SANCHA, A.WK_DT AS EU_WK_DT, B.WK_DT AS BM_WK_DT,
               NVL(SUM(JT.PS_DS), 0) AS SUM_PS_DS,
               NVL(SUM(JT.BB_DS), 0) AS SUM_BB_DS,
               NVL(SUM(JT.JI_DS), 0) AS SUM_JI_DS,
               NVL(SUM(JT.JC_DS), 0) AS SUM_JC_DS
        FROM TB_MODON_WK A
        INNER JOIN TB_MODON_WK B
            ON B.FARM_NO = A.FARM_NO AND B.PIG_NO = A.PIG_NO
           AND B.SANCHA = A.SANCHA AND B.WK_GUBUN = 'B' AND B.USE_YN = 'Y'
        LEFT OUTER JOIN NEXT_WK NW
            ON NW.FARM_NO = A.FARM_NO AND NW.PIG_NO = A.PIG_NO AND NW.CUR_WK_DT = A.WK_DT
        LEFT OUTER JOIN JADON_TRANS_AGG JT
            ON JT.FARM_NO = A.FARM_NO AND JT.PIG_NO = A.PIG_NO AND JT.SANCHA = A.SANCHA
           AND JT.WK_DT >= B.WK_DT
           AND JT.WK_DT <= CASE WHEN NW.NEXT_WK_GUBUN = 'G' THEN NW.NEXT_WK_DT
                                WHEN NW.NEXT_WK_DT IS NULL AND A.DAERI_YN = 'N' THEN TO_CHAR(SYSDATE, 'YYYYMMDD')
                                ELSE TO_CHAR(TO_DATE(A.WK_DT, 'YYYYMMDD') - 1, 'YYYYMMDD') END
        WHERE A.FARM_NO = P_FARM_NO
          AND A.WK_GUBUN = 'E'
          AND A.USE_YN = 'Y'
          AND A.WK_DT >= P_DT_FROM
          AND A.WK_DT <= P_DT_TO
        GROUP BY A.FARM_NO, A.PIG_NO, A.SANCHA, A.WK_DT, B.WK_DT
    )
    SELECT /*+ LEADING(A D B E) USE_NL(D B E) INDEX(A IX_TB_MODON_WK_01) */
        COUNT(*),
        NVL(SUM(NVL(D.DUSU, 0) + NVL(D.DUSU_SU, 0)), 0),
        -- 분만 기준: 총산 (실산+사산+미라), 실산
        NVL(SUM(NVL(E.SILSAN, 0) + NVL(E.SASAN, 0) + NVL(E.MILA, 0)), 0),  -- 총산 합계
        NVL(SUM(NVL(E.SILSAN, 0)), 0),  -- 실산 합계
        NVL(SUM(TO_DATE(A.WK_DT, 'YYYYMMDD') - TO_DATE(B.WK_DT, 'YYYYMMDD')), 0),
        NVL(SUM(NVL(D.TOTAL_KG, 0)), 0),
        NVL(ROUND(AVG(NVL(D.DUSU, 0) + NVL(D.DUSU_SU, 0)), 1), 0),
        NVL(ROUND(AVG(TO_DATE(A.WK_DT, 'YYYYMMDD') - TO_DATE(B.WK_DT, 'YYYYMMDD')), 1), 0),
        -- 자돈 증감 내역 (WITH절 사전 집계 사용)
        NVL(SUM(PA.SUM_PS_DS), 0),  -- 포유자돈폐사
        NVL(SUM(PA.SUM_BB_DS), 0),  -- 부분이유
        NVL(SUM(PA.SUM_JI_DS), 0),  -- 양자전입
        NVL(SUM(PA.SUM_JC_DS), 0),  -- 양자전출
        -- 포유개시 합계 (실산 - 폐사 + 양자전입 - 양자전출) : BUN_DT=분만일 기준
        NVL(SUM(
            NVL(E.SILSAN, 0)
            - NVL(PO.PS_DS, 0)
            + NVL(PO.JI_DS, 0)
            - NVL(PO.JC_DS, 0)
        ), 0)
    INTO V_TOTAL_CNT, V_SUM_EUDUSU, V_SUM_CHONGSAN, V_SUM_SILSAN,
         V_SUM_POUGIGAN, V_SUM_KG, V_AVG_EUDUSU, V_AVG_POUGIGAN,
         V_SUM_PS_DS, V_SUM_BB_DS, V_SUM_JI_DS, V_SUM_JC_DS, V_SUM_POGAE
    FROM TB_MODON_WK A
    INNER JOIN TB_EU D
        ON D.FARM_NO = A.FARM_NO AND D.PIG_NO = A.PIG_NO
       AND D.WK_DT = A.WK_DT AND D.WK_GUBUN = A.WK_GUBUN AND D.USE_YN = 'Y'
    INNER JOIN TB_MODON_WK B
        ON B.FARM_NO = A.FARM_NO AND B.PIG_NO = A.PIG_NO
       AND B.SANCHA = A.SANCHA AND B.WK_GUBUN = 'B' AND B.USE_YN = 'Y'
    INNER JOIN TB_BUNMAN E
        ON E.FARM_NO = B.FARM_NO AND E.PIG_NO = B.PIG_NO
       AND E.WK_DT = B.WK_DT AND E.WK_GUBUN = B.WK_GUBUN AND E.USE_YN = 'Y'
    -- 자돈 증감 사전 집계 JOIN
    LEFT OUTER JOIN JADON_PERIOD_AGG PA
        ON PA.FARM_NO = A.FARM_NO AND PA.PIG_NO = A.PIG_NO
       AND PA.SANCHA = A.SANCHA AND PA.EU_WK_DT = A.WK_DT
    -- 포유개시용 사전 집계 JOIN
    LEFT OUTER JOIN JADON_POGAE_AGG PO
        ON PO.FARM_NO = A.FARM_NO AND PO.PIG_NO = A.PIG_NO AND PO.BUN_DT = B.WK_DT
    WHERE A.FARM_NO = P_FARM_NO
      AND A.WK_GUBUN = 'E'
      AND A.USE_YN = 'Y'
      AND A.WK_DT >= P_DT_FROM
      AND A.WK_DT <= P_DT_TO;

    -- 평균체중 계산 (TOTAL_KG / 이유복수)
    IF V_TOTAL_CNT > 0 THEN
        V_AVG_KG := ROUND(V_SUM_KG / V_TOTAL_CNT, 2);
    END IF;

    -- 이유육성율 계산 (이유두수 / 실산 * 100)
    IF V_SUM_SILSAN > 0 THEN
        V_SURVIVAL_RATE := ROUND(V_SUM_EUDUSU / V_SUM_SILSAN * 100, 1);
    END IF;

    -- 평균 이유두수 증감 계산 (지난주 평균 - 1년 평균)
    IF V_ACC_AVG_JD > 0 THEN
        V_CHG_JD := ROUND(V_AVG_EUDUSU - V_ACC_AVG_JD, 1);
    END IF;

    -- ================================================
    -- 5. 요약 통계 INSERT (GUBUN='EU')
    -- ================================================
    INSERT INTO TS_INS_WEEK_SUB (
        MASTER_SEQ, FARM_NO, GUBUN, SORT_NO,
        CNT_1, CNT_2, CNT_3, CNT_4, CNT_5,
        CNT_6, CNT_7, CNT_8, CNT_9,
        VAL_1, VAL_2, VAL_3, VAL_4, VAL_5,
        STR_1
    ) VALUES (
        P_MASTER_SEQ, P_FARM_NO, 'EU', 1,
        V_TOTAL_CNT,    -- CNT_1: 이유복수 (실적)
        V_SUM_EUDUSU,   -- CNT_2: 이유두수 합계
        V_SUM_SILSAN,   -- CNT_3: 실산 합계 (분만 기준)
        V_SUM_POUGIGAN, -- CNT_4: 포유기간 합계
        V_PLAN_EU,      -- CNT_5: 이유복수 (예정)
        V_SUM_PS_DS,    -- CNT_6: 포유자돈폐사 두수 (160001)
        V_SUM_BB_DS,    -- CNT_7: 부분이유 두수 (160002)
        V_SUM_JI_DS,    -- CNT_8: 양자전입 두수 (160003)
        V_SUM_JC_DS,    -- CNT_9: 양자전출 두수 (160004)
        V_AVG_EUDUSU,   -- VAL_1: 이유두수 평균
        V_AVG_KG,       -- VAL_2: 평균체중 (가중평균)
        V_SURVIVAL_RATE, -- VAL_3: 이유육성율 (이유두수/실산)
        V_AVG_POUGIGAN, -- VAL_4: 평균 포유기간
        V_SUM_POGAE,    -- VAL_5: 포유개시 합계
        TO_CHAR(V_SUM_CHONGSAN)  -- STR_1: 총산 합계 (분만 기준)
    );

    V_PROC_CNT := 1;

    -- ================================================
    -- 6. TS_INS_WEEK 메인 테이블 업데이트
    -- ================================================
    UPDATE TS_INS_WEEK
    SET LAST_EU_CNT = V_TOTAL_CNT,
        LAST_EU_JD_CNT = V_SUM_EUDUSU,
        LAST_EU_AVG_JD = V_AVG_EUDUSU,    -- 지난주 평균 이유두수
        LAST_EU_AVG_KG = V_AVG_KG,
        -- 누적 데이터
        LAST_EU_SUM_CNT = V_ACC_EU_CNT,
        LAST_EU_SUM_JD = V_ACC_EU_JD,
        LAST_EU_SUM_AVG_JD = V_ACC_AVG_JD,
        -- 증감 데이터
        LAST_EU_CHG_JD = V_CHG_JD         -- 평균 이유두수 증감 (1년평균 대비)
    WHERE MASTER_SEQ = P_MASTER_SEQ
      AND FARM_NO = P_FARM_NO;

    COMMIT;
    SP_INS_COM_LOG_END(V_LOG_SEQ, V_PROC_CNT);

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        SP_INS_COM_LOG_ERROR(V_LOG_SEQ, SQLCODE, SQLERRM);
        RAISE;
END SP_INS_WEEK_EU_POPUP;
/

-- 프로시저 확인
SELECT OBJECT_NAME, STATUS FROM USER_OBJECTS WHERE OBJECT_NAME = 'SP_INS_WEEK_EU_POPUP';
