-- ============================================================
-- SP_INS_WEEK_DOPE_POPUP: 도태폐사 팝업 데이터 추출 프로시저
--
-- 상세 문서: docs/db/ins/week/32.culling-popup.md
--
-- 데이터 구조:
--   - TS_INS_WEEK_SUB (GUBUN='DOPE', SUB_GUBUN='STAT', SORT_NO=1): 지난주 유형별 통계 (1행)
--   - TS_INS_WEEK_SUB (GUBUN='DOPE', SUB_GUBUN='STAT', SORT_NO=2): 최근1개월 + 당해년도 누계 (1행)
--   - TS_INS_WEEK_SUB (GUBUN='DOPE', SUB_GUBUN='LIST', SORT_NO=1,2,...): 원인별 15개씩 피벗 (병합)
--       - STR_1~STR_15: 원인코드(OUT_REASON_CD)
--       - CNT_1~CNT_15: 지난주 두수
--       - VAL_1~VAL_15: 최근1개월 두수
--       - 프론트에서 TC_CODE_JOHAP(PCODE='031')으로 코드명 조회
--   - TS_INS_WEEK_SUB (GUBUN='DOPE', SUB_GUBUN='CHART'): 상태별 차트 (1행)
--
-- OUT_GUBUN_CD 4개 유형 (PCODE='08'):
--   CNT_1: 도태(080001)  CNT_2: 폐사(080002)  CNT_3: 전출(080003)  CNT_4: 판매(080004)
--
-- STATUS_CODE 7개 상태 (PCODE='01'):
--   CNT_1: 후보돈(010001)   CNT_2: 임신돈(010002)   CNT_3: 포유돈(010003)
--   CNT_4: 대리모돈(010004) CNT_5: 이유모돈(010005) CNT_6: 재발돈(010006)
--   CNT_7: 유산돈(010007)
-- ============================================================

CREATE OR REPLACE PROCEDURE SP_INS_WEEK_DOPE_POPUP (
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
    V_WEEK_TOTAL    INTEGER := 0;  -- 지난주 도폐사 합계 (도태+폐사만)
    V_YEAR_TOTAL    INTEGER := 0;  -- 당해년도 누계 (도태+폐사만)

BEGIN
    -- 로그 시작
    SP_INS_COM_LOG_START(P_MASTER_SEQ, P_JOB_NM, 'SP_INS_WEEK_DOPE_POPUP', P_FARM_NO, V_LOG_SEQ);

    -- 최근 1개월 시작일 계산 (P_DT_FROM 기준 - 30일)
    V_MONTH_FROM := TO_CHAR(TO_DATE(P_DT_FROM, 'YYYYMMDD') - 30, 'YYYYMMDD');

    -- 당해년도 시작일 (1월 1일)
    V_YEAR_FROM := SUBSTR(P_DT_TO, 1, 4) || '0101';

    -- ================================================
    -- 0. 주요 집계 변수 미리 계산
    --    V_WEEK_TOTAL: 지난주 도태+폐사 합계 (TS_INS_WEEK.LAST_CL_CNT)
    --    V_YEAR_TOTAL: 당해년도 도태+폐사 누계 (TS_INS_WEEK.LAST_CL_SUM)
    -- ================================================
    SELECT
        NVL(SUM(CASE WHEN OUT_DT >= TO_DATE(P_DT_FROM, 'YYYYMMDD') THEN 1 ELSE 0 END), 0),
        NVL(COUNT(*), 0)
    INTO V_WEEK_TOTAL, V_YEAR_TOTAL
    FROM TB_MODON
    WHERE FARM_NO = P_FARM_NO
      AND USE_YN = 'Y'
      AND OUT_DT >= TO_DATE(V_YEAR_FROM, 'YYYYMMDD')  -- 당해년도 1월 1일부터 조회
      AND OUT_DT < TO_DATE(P_DT_TO, 'YYYYMMDD') + 1
      AND OUT_GUBUN_CD IS NOT NULL;

    -- ================================================
    -- 1. 기존 데이터 삭제 (GUBUN='DOPE'만 삭제 - SUB_GUBUN으로 구분)
    -- ================================================
    DELETE FROM TS_INS_WEEK_SUB
    WHERE MASTER_SEQ = P_MASTER_SEQ
      AND FARM_NO = P_FARM_NO
      AND GUBUN = 'DOPE';

    -- ================================================
    -- 2. 유형별 통계 INSERT (GUBUN='DOPE', SUB_GUBUN='STAT')
    --    SORT_NO=1: 지난주 (P_DT_FROM ~ P_DT_TO)
    --    SORT_NO=2: 최근1개월 (V_MONTH_FROM ~ P_DT_TO) + 당해년도 누계(CNT_5)
    --    ★ 데이터 없어도 0으로 INSERT (DUAL 기준 LEFT JOIN)
    -- ================================================
    INSERT INTO TS_INS_WEEK_SUB (
        MASTER_SEQ, FARM_NO, GUBUN, SUB_GUBUN, SORT_NO,
        CNT_1, CNT_2, CNT_3, CNT_4, CNT_5,
        VAL_1, VAL_2, VAL_3, VAL_4
    )
    SELECT
        P_MASTER_SEQ, P_FARM_NO, 'DOPE', 'STAT', B.SORT_NO,
        NVL(D.CNT_1, 0), NVL(D.CNT_2, 0), NVL(D.CNT_3, 0), NVL(D.CNT_4, 0),
        CASE WHEN B.SORT_NO = 2 THEN V_YEAR_TOTAL ELSE NULL END AS CNT_5,
        CASE WHEN NVL(D.TOTAL_CNT, 0) > 0 THEN ROUND(NVL(D.CNT_1, 0) / D.TOTAL_CNT * 100, 1) ELSE 0 END,
        CASE WHEN NVL(D.TOTAL_CNT, 0) > 0 THEN ROUND(NVL(D.CNT_2, 0) / D.TOTAL_CNT * 100, 1) ELSE 0 END,
        CASE WHEN NVL(D.TOTAL_CNT, 0) > 0 THEN ROUND(NVL(D.CNT_3, 0) / D.TOTAL_CNT * 100, 1) ELSE 0 END,
        CASE WHEN NVL(D.TOTAL_CNT, 0) > 0 THEN ROUND(NVL(D.CNT_4, 0) / D.TOTAL_CNT * 100, 1) ELSE 0 END
    FROM (SELECT 1 AS SORT_NO FROM DUAL UNION ALL SELECT 2 AS SORT_NO FROM DUAL) B
    LEFT JOIN (
        -- SORT_NO=1: 지난주만, SORT_NO=2: 최근1개월 전체
        SELECT 1 AS SORT_NO,
               SUM(CASE WHEN OUT_GUBUN_CD = '080001' THEN 1 ELSE 0 END) AS CNT_1,
               SUM(CASE WHEN OUT_GUBUN_CD = '080002' THEN 1 ELSE 0 END) AS CNT_2,
               SUM(CASE WHEN OUT_GUBUN_CD = '080003' THEN 1 ELSE 0 END) AS CNT_3,
               SUM(CASE WHEN OUT_GUBUN_CD = '080004' THEN 1 ELSE 0 END) AS CNT_4,
               COUNT(*) AS TOTAL_CNT
        FROM TB_MODON MD
        WHERE MD.FARM_NO = P_FARM_NO
          AND MD.USE_YN = 'Y'
          AND MD.OUT_DT >= TO_DATE(P_DT_FROM, 'YYYYMMDD')
          AND MD.OUT_DT < TO_DATE(P_DT_TO, 'YYYYMMDD') + 1
          AND MD.OUT_GUBUN_CD IS NOT NULL
        UNION ALL
        SELECT 2 AS SORT_NO,
               SUM(CASE WHEN OUT_GUBUN_CD = '080001' THEN 1 ELSE 0 END) AS CNT_1,
               SUM(CASE WHEN OUT_GUBUN_CD = '080002' THEN 1 ELSE 0 END) AS CNT_2,
               SUM(CASE WHEN OUT_GUBUN_CD = '080003' THEN 1 ELSE 0 END) AS CNT_3,
               SUM(CASE WHEN OUT_GUBUN_CD = '080004' THEN 1 ELSE 0 END) AS CNT_4,
               COUNT(*) AS TOTAL_CNT
        FROM TB_MODON MD
        WHERE MD.FARM_NO = P_FARM_NO
          AND MD.USE_YN = 'Y'
          AND MD.OUT_DT >= TO_DATE(V_MONTH_FROM, 'YYYYMMDD')
          AND MD.OUT_DT < TO_DATE(P_DT_TO, 'YYYYMMDD') + 1
          AND MD.OUT_GUBUN_CD IS NOT NULL
    ) D ON B.SORT_NO = D.SORT_NO;
    V_PROC_CNT := V_PROC_CNT + SQL%ROWCOUNT;

    -- ================================================
    -- 4. 원인별 테이블 INSERT (GUBUN='DOPE', SUB_GUBUN='LIST', SORT_NO=1,2,...)
    --    지난주+최근1개월 원인코드를 병합하여 15개씩 피벗 저장
    --    STR_1~STR_15: 원인코드(OUT_REASON_CD)
    --    CNT_1~CNT_15: 지난주 두수
    --    VAL_1~VAL_15: 최근1개월 두수
    --    정렬: 최근1개월 두수 내림차순
    -- ================================================
    INSERT INTO TS_INS_WEEK_SUB (
        MASTER_SEQ, FARM_NO, GUBUN, SUB_GUBUN, SORT_NO,
        STR_1, STR_2, STR_3, STR_4, STR_5, STR_6, STR_7, STR_8, STR_9, STR_10, STR_11, STR_12, STR_13, STR_14, STR_15,
        CNT_1, CNT_2, CNT_3, CNT_4, CNT_5, CNT_6, CNT_7, CNT_8, CNT_9, CNT_10, CNT_11, CNT_12, CNT_13, CNT_14, CNT_15,
        VAL_1, VAL_2, VAL_3, VAL_4, VAL_5, VAL_6, VAL_7, VAL_8, VAL_9, VAL_10, VAL_11, VAL_12, VAL_13, VAL_14, VAL_15
    )
    SELECT
        P_MASTER_SEQ, P_FARM_NO,
        'DOPE', 'LIST',  -- GUBUN='DOPE', SUB_GUBUN='LIST'
        GRP_NO,  -- SORT_NO = 1, 2, ...
        -- STR_1~STR_15: 원인코드
        MAX(CASE WHEN MOD_RN = 1 THEN REASON_CD END),
        MAX(CASE WHEN MOD_RN = 2 THEN REASON_CD END),
        MAX(CASE WHEN MOD_RN = 3 THEN REASON_CD END),
        MAX(CASE WHEN MOD_RN = 4 THEN REASON_CD END),
        MAX(CASE WHEN MOD_RN = 5 THEN REASON_CD END),
        MAX(CASE WHEN MOD_RN = 6 THEN REASON_CD END),
        MAX(CASE WHEN MOD_RN = 7 THEN REASON_CD END),
        MAX(CASE WHEN MOD_RN = 8 THEN REASON_CD END),
        MAX(CASE WHEN MOD_RN = 9 THEN REASON_CD END),
        MAX(CASE WHEN MOD_RN = 10 THEN REASON_CD END),
        MAX(CASE WHEN MOD_RN = 11 THEN REASON_CD END),
        MAX(CASE WHEN MOD_RN = 12 THEN REASON_CD END),
        MAX(CASE WHEN MOD_RN = 13 THEN REASON_CD END),
        MAX(CASE WHEN MOD_RN = 14 THEN REASON_CD END),
        MAX(CASE WHEN MOD_RN = 15 THEN REASON_CD END),
        -- CNT_1~CNT_15: 지난주 두수
        NVL(MAX(CASE WHEN MOD_RN = 1 THEN LAST_WEEK END), 0),
        NVL(MAX(CASE WHEN MOD_RN = 2 THEN LAST_WEEK END), 0),
        NVL(MAX(CASE WHEN MOD_RN = 3 THEN LAST_WEEK END), 0),
        NVL(MAX(CASE WHEN MOD_RN = 4 THEN LAST_WEEK END), 0),
        NVL(MAX(CASE WHEN MOD_RN = 5 THEN LAST_WEEK END), 0),
        NVL(MAX(CASE WHEN MOD_RN = 6 THEN LAST_WEEK END), 0),
        NVL(MAX(CASE WHEN MOD_RN = 7 THEN LAST_WEEK END), 0),
        NVL(MAX(CASE WHEN MOD_RN = 8 THEN LAST_WEEK END), 0),
        NVL(MAX(CASE WHEN MOD_RN = 9 THEN LAST_WEEK END), 0),
        NVL(MAX(CASE WHEN MOD_RN = 10 THEN LAST_WEEK END), 0),
        NVL(MAX(CASE WHEN MOD_RN = 11 THEN LAST_WEEK END), 0),
        NVL(MAX(CASE WHEN MOD_RN = 12 THEN LAST_WEEK END), 0),
        NVL(MAX(CASE WHEN MOD_RN = 13 THEN LAST_WEEK END), 0),
        NVL(MAX(CASE WHEN MOD_RN = 14 THEN LAST_WEEK END), 0),
        NVL(MAX(CASE WHEN MOD_RN = 15 THEN LAST_WEEK END), 0),
        -- VAL_1~VAL_15: 최근1개월 두수
        NVL(MAX(CASE WHEN MOD_RN = 1 THEN LAST_MONTH END), 0),
        NVL(MAX(CASE WHEN MOD_RN = 2 THEN LAST_MONTH END), 0),
        NVL(MAX(CASE WHEN MOD_RN = 3 THEN LAST_MONTH END), 0),
        NVL(MAX(CASE WHEN MOD_RN = 4 THEN LAST_MONTH END), 0),
        NVL(MAX(CASE WHEN MOD_RN = 5 THEN LAST_MONTH END), 0),
        NVL(MAX(CASE WHEN MOD_RN = 6 THEN LAST_MONTH END), 0),
        NVL(MAX(CASE WHEN MOD_RN = 7 THEN LAST_MONTH END), 0),
        NVL(MAX(CASE WHEN MOD_RN = 8 THEN LAST_MONTH END), 0),
        NVL(MAX(CASE WHEN MOD_RN = 9 THEN LAST_MONTH END), 0),
        NVL(MAX(CASE WHEN MOD_RN = 10 THEN LAST_MONTH END), 0),
        NVL(MAX(CASE WHEN MOD_RN = 11 THEN LAST_MONTH END), 0),
        NVL(MAX(CASE WHEN MOD_RN = 12 THEN LAST_MONTH END), 0),
        NVL(MAX(CASE WHEN MOD_RN = 13 THEN LAST_MONTH END), 0),
        NVL(MAX(CASE WHEN MOD_RN = 14 THEN LAST_MONTH END), 0),
        NVL(MAX(CASE WHEN MOD_RN = 15 THEN LAST_MONTH END), 0)
    FROM (
        SELECT
            REASON_CD, LAST_WEEK, LAST_MONTH,
            CEIL(RN / 15) AS GRP_NO,
            MOD(RN - 1, 15) + 1 AS MOD_RN
        FROM (
            SELECT
                REASON_CD, LAST_WEEK, LAST_MONTH,
                -- 031001(기타)는 항상 마지막에 표시
                ROW_NUMBER() OVER(ORDER BY CASE WHEN REASON_CD = '031001' THEN 1 ELSE 0 END, LAST_MONTH DESC, LAST_WEEK DESC, REASON_CD) AS RN
            FROM (
                -- 지난주+최근1개월 원인코드 병합 (FULL OUTER JOIN 효과)
                -- OUT_REASON_CD가 NULL이면 '031001'(기타)로 치환
                SELECT
                    NVL(MD.OUT_REASON_CD, '031001') AS REASON_CD,
                    SUM(CASE WHEN MD.OUT_DT >= TO_DATE(P_DT_FROM, 'YYYYMMDD') AND MD.OUT_DT < TO_DATE(P_DT_TO, 'YYYYMMDD') + 1 THEN 1 ELSE 0 END) AS LAST_WEEK,
                    SUM(CASE WHEN MD.OUT_DT >= TO_DATE(V_MONTH_FROM, 'YYYYMMDD') AND MD.OUT_DT < TO_DATE(P_DT_TO, 'YYYYMMDD') + 1 THEN 1 ELSE 0 END) AS LAST_MONTH
                FROM TB_MODON MD
                WHERE MD.FARM_NO = P_FARM_NO
                  AND MD.USE_YN = 'Y'
                  AND MD.OUT_DT >= TO_DATE(V_MONTH_FROM, 'YYYYMMDD')
                  AND MD.OUT_DT < TO_DATE(P_DT_TO, 'YYYYMMDD') + 1
                  AND MD.OUT_GUBUN_CD IS NOT NULL
                GROUP BY NVL(MD.OUT_REASON_CD, '031001')
            )
        )
    )
    GROUP BY GRP_NO;
    V_PROC_CNT := V_PROC_CNT + SQL%ROWCOUNT;

    -- ================================================
    -- 5. 상태별 차트 INSERT (GUBUN='DOPE', SUB_GUBUN='CHART')
    --    STATUS_CODE (PCODE='01') 기준 - 값이 없어도 0으로 표시
    --    지난주 기간 (P_DT_FROM ~ P_DT_TO)
    --    STR_1~STR_6: 상태코드 (프론트에서 TC_CODE_SYS(PCODE='01')로 코드명 조회)
    --    CNT_1~CNT_6: 상태별 두수
    --    ★ 데이터 없어도 0으로 INSERT (DUAL 기준 LEFT JOIN)
    -- ================================================
    INSERT INTO TS_INS_WEEK_SUB (
        MASTER_SEQ, FARM_NO, GUBUN, SUB_GUBUN, SORT_NO,
        STR_1, STR_2, STR_3, STR_4, STR_5, STR_6, STR_7,
        CNT_1, CNT_2, CNT_3, CNT_4, CNT_5, CNT_6, CNT_7
    )
    SELECT
        P_MASTER_SEQ, P_FARM_NO, 'DOPE', 'CHART', 1,
        '010001', '010002', '010003', '010004', '010005', '010006', '010007',
        NVL(D.CNT_1, 0), NVL(D.CNT_2, 0), NVL(D.CNT_3, 0),
        NVL(D.CNT_4, 0), NVL(D.CNT_5, 0), NVL(D.CNT_6, 0), NVL(D.CNT_7, 0)
    FROM DUAL
    LEFT JOIN (
        SELECT
            SUM(CASE WHEN STATUS_CD = '010001' THEN 1 ELSE 0 END) AS CNT_1,  -- 후보돈
            SUM(CASE WHEN STATUS_CD = '010002' THEN 1 ELSE 0 END) AS CNT_2,  -- 임신돈
            SUM(CASE WHEN STATUS_CD = '010003' THEN 1 ELSE 0 END) AS CNT_3,  -- 포유돈
            SUM(CASE WHEN STATUS_CD = '010004' THEN 1 ELSE 0 END) AS CNT_4,  -- 대리모돈
            SUM(CASE WHEN STATUS_CD = '010005' THEN 1 ELSE 0 END) AS CNT_5,  -- 이유모돈
            SUM(CASE WHEN STATUS_CD = '010006' THEN 1 ELSE 0 END) AS CNT_6,   -- 재발돈
            SUM(CASE WHEN STATUS_CD = '010007' THEN 1 ELSE 0 END) AS CNT_7   -- 유산돈
        FROM (
            SELECT
                CASE
                    WHEN WK.PIG_NO IS NULL THEN
                        -- 작업이력 없는 모돈: TB_MODON.STATUS_CD 사용
                        CASE
                            WHEN TM.IN_SANCHA = 0 AND TM.IN_GYOBAE_CNT = 0
                            THEN '010001'    -- 산차=0, 교배차수=0이면 후보돈
                            ELSE NVL(TM.STATUS_CD, '010001')
                        END
                    ELSE
                        -- 작업이력 있는 모돈: SF_GET_MODONGB_STATUS 함수로 상태 결정
                        SF_GET_MODONGB_STATUS('CD', WK.WK_GUBUN, WK.SAGO_GUBUN_CD,
                            TO_DATE('99991231', 'YYYYMMDD'), TM.STATUS_CD, WK.DAERI_YN, '')
                END AS STATUS_CD
            FROM TB_MODON TM
            LEFT OUTER JOIN (
                -- 마지막 작업정보 추출 (도폐사 작업 제외)
                SELECT WK.FARM_NO, WK.PIG_NO, WK.WK_GUBUN, WK.SAGO_GUBUN_CD, WK.DAERI_YN
                FROM (
                    SELECT FARM_NO, PIG_NO, MAX(SEQ) AS MAX_SEQ
                    FROM TB_MODON_WK
                    WHERE FARM_NO = P_FARM_NO
                      AND USE_YN = 'Y'
                      AND WK_GUBUN <> 'Z'
                    GROUP BY FARM_NO, PIG_NO
                ) MK
                INNER JOIN TB_MODON_WK WK
                    ON WK.FARM_NO = MK.FARM_NO
                   AND WK.PIG_NO = MK.PIG_NO
                   AND WK.SEQ = MK.MAX_SEQ
                   AND WK.USE_YN = 'Y'
            ) WK ON WK.FARM_NO = TM.FARM_NO AND WK.PIG_NO = TM.PIG_NO
            WHERE TM.FARM_NO = P_FARM_NO
              AND TM.USE_YN = 'Y'
              AND TM.OUT_DT >= TO_DATE(P_DT_FROM, 'YYYYMMDD')
              AND TM.OUT_DT < TO_DATE(P_DT_TO, 'YYYYMMDD') + 1
              AND TM.OUT_GUBUN_CD IS NOT NULL
        )
    ) D ON 1=1;
    V_PROC_CNT := V_PROC_CNT + 1;

    -- ================================================
    -- 6. TS_INS_WEEK 메인 테이블 업데이트
    --    LAST_CL_CNT: 지난주 도폐사 합계 (V_WEEK_TOTAL)
    --    LAST_CL_SUM: 당해년도 도폐사 누계 (V_YEAR_TOTAL)
    -- ================================================
    UPDATE TS_INS_WEEK
    SET LAST_CL_CNT = V_WEEK_TOTAL,
        LAST_CL_SUM = V_YEAR_TOTAL
    WHERE MASTER_SEQ = P_MASTER_SEQ
      AND FARM_NO = P_FARM_NO;

    COMMIT;
    SP_INS_COM_LOG_END(V_LOG_SEQ, V_PROC_CNT);

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        SP_INS_COM_LOG_ERROR(V_LOG_SEQ, SQLCODE, SQLERRM);
        RAISE;
END SP_INS_WEEK_DOPE_POPUP;
/

-- 프로시저 확인
SELECT OBJECT_NAME, STATUS FROM USER_OBJECTS WHERE OBJECT_NAME = 'SP_INS_WEEK_DOPE_POPUP';
