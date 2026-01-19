-- ============================================================
-- SP_INS_WEEK_MODON_POPUP: 모돈현황 팝업 데이터 추출 프로시저
--
-- 상세 문서: docs/db/ins/week/01.modon-popup.md
--
-- 시간 원칙:
--   - 저장: SYSDATE (서버시간/UTC)
--   - 기준일: P_DT_TO (전주 일요일 = 리포트 종료일)
--
-- 데이터 구조:
--   - 원본 SQL: 상태별(행) × 산차별(열)
--   - 저장 구조: 산차별(행) × 상태별(열) (x,y축 피벗)
--   - TS_INS_WEEK_SUB (GUBUN='MODON')
--
-- DB 컬럼 매핑:
--   - CODE1: 산차 (후보돈, 0산, 1산, ..., 8산↑)
--   - CNT1: 후보 (STATUS_CD='010001')
--   - CNT2: 임신 (STATUS_CD='010002')
--   - CNT3: 포유 (STATUS_CD='010003','010004')
--   - CNT4: 이유모 (STATUS_CD='010005')
--   - CNT5: 사고 (STATUS_CD='010006','010007')
--   - CNT6: 증감 (전주 대비, 별도 계산)
--
-- 성능 최적화:
--   - VW_MODON_DATE_2020_MAX_WK 뷰 대신 인라인 쿼리 사용
--   - TB_MODON (드라이빙 테이블) LEFT JOIN TB_MODON_WK
--   - 기준일 직접 파라미터로 전달 (SYS_CONTEXT 미사용)
-- ============================================================

CREATE OR REPLACE PROCEDURE SP_INS_WEEK_MODON_POPUP (
    /*
    ================================================================
    SP_INS_WEEK_MODON_POPUP: 모돈현황 팝업 데이터 추출 프로시저
    ================================================================
    - 용도: 산차별 × 상태별 모돈 현황 교차표 데이터 생성
    - 호출: SP_INS_WEEK_FARM_PROCESS에서 농장별 순차 호출
    - 대상 테이블: TS_INS_WEEK_SUB (GUBUN='MODON')

    산차 구분:
      - 후보돈: SANCHA=0 AND STATUS_CD='010001' (작업이력 없음)
      - 0산~7산: 해당 산차
      - 8산↑: SANCHA >= 8

    상태 구분:
      - 후보 (010001): 미교배 후보돈
      - 임신 (010002): 임신돈
      - 포유 (010003, 010004): 포유돈 + 대리모돈
      - 이유모 (010005): 이유모돈
      - 사고 (010006, 010007): 재발돈 + 유산돈 (임신사고)

    테이블 구조:
      - TB_MODON: 모돈 마스터 (드라이빙 테이블, 상대적 소량)
      - TB_MODON_WK: 모돈 작업이력 (대량 데이터)
    ================================================================
    */
    P_MASTER_SEQ    IN  NUMBER,         -- 마스터 시퀀스 (FK → TS_INS_MASTER)
    P_JOB_NM        IN  VARCHAR2,       -- JOB명
    P_FARM_NO       IN  INTEGER,        -- 농장번호
    P_LOCALE        IN  VARCHAR2,       -- 로케일 (KOR, VNM)
    P_DT_TO         IN  DATE            -- 리포트 종료일 (전주 일요일) = 기준일
) AS
    V_LOG_SEQ       NUMBER;
    V_PROC_CNT      INTEGER := 0;
    V_BASE_DT       DATE;               -- 기준일
    V_BASE_DT_STR   VARCHAR2(8);        -- 기준일 문자열 (YYYYMMDD)
    V_TOTAL_CNT     INTEGER := 0;       -- 현재모돈 합계두수 (후보돈 제외)
    V_SANGSI_CNT    NUMBER(10,2) := 0;  -- 상시모돈 (TS_PRODUCTIVITY.C001, 소수점 2자리)
    V_PREV_MASTER   NUMBER;             -- 이전 주차 MASTER_SEQ
    V_PREV_TOTAL    INTEGER := 0;       -- 이전 주차 현재모돈 합계두수
    V_PREV_SANGSI   NUMBER(10,2) := 0;  -- 이전 주차 상시모돈 (소수점 2자리)
    V_REPORT_YEAR   NUMBER(4);          -- 리포트 년도
    V_REPORT_WEEK   NUMBER(2);          -- 리포트 주차
    V_HAS_PREV_DATA BOOLEAN := FALSE;   -- 이전 주차 데이터 존재 여부

BEGIN
    -- 로그 시작
    SP_INS_COM_LOG_START(P_MASTER_SEQ, P_JOB_NM, 'SP_INS_WEEK_MODON_POPUP', P_FARM_NO, V_LOG_SEQ);

    -- 기준일 설정
    V_BASE_DT := TRUNC(P_DT_TO);
    V_BASE_DT_STR := TO_CHAR(V_BASE_DT, 'YYYYMMDD');

    -- ================================================
    -- 기존 데이터 삭제 (재실행 대비)
    -- ================================================
    DELETE FROM TS_INS_WEEK_SUB
    WHERE MASTER_SEQ = P_MASTER_SEQ
      AND FARM_NO = P_FARM_NO
      AND GUBUN = 'MODON';

    -- ================================================
    -- 산차별 × 상태별 교차표 데이터 INSERT
    -- 원본 SQL의 x,y축을 피벗하여 산차별(행)로 저장
    --
    -- 최적화 전략:
    --   1. TB_MODON을 드라이빙 테이블로 사용 (농장별 모돈 수 < 작업이력 수)
    --   2. TB_MODON_WK는 기준일 이전 마지막 작업만 추출
    --   3. SF_GET_MODONGB_STATUS 함수로 상태코드 결정
    -- ================================================
    INSERT INTO TS_INS_WEEK_SUB (
        MASTER_SEQ, FARM_NO, GUBUN, SORT_NO, CODE_1,
        CNT_1, CNT_2, CNT_3, CNT_4, CNT_5, CNT_6
    )
    SELECT
        P_MASTER_SEQ,
        P_FARM_NO,
        'MODON',
        RN AS SORT_NO,
        PARITY AS CODE_1,
        NVL(HUBO, 0) AS CNT_1,      -- 후보
        NVL(IMSIN, 0) AS CNT_2,     -- 임신
        NVL(POYU, 0) AS CNT_3,      -- 포유
        NVL(EUMO, 0) AS CNT_4,      -- 이유모
        NVL(SAGO, 0) AS CNT_5,      -- 사고
        0 AS CNT_6                   -- 증감 (추후 계산)
    FROM (
        SELECT
            PARITY,
            SUM(CASE WHEN STATUS_CD = '010001' THEN 1 ELSE 0 END) AS HUBO,
            SUM(CASE WHEN STATUS_CD = '010002' THEN 1 ELSE 0 END) AS IMSIN,
            SUM(CASE WHEN STATUS_CD IN ('010003', '010004') THEN 1 ELSE 0 END) AS POYU,
            SUM(CASE WHEN STATUS_CD = '010005' THEN 1 ELSE 0 END) AS EUMO,
            SUM(CASE WHEN STATUS_CD IN ('010006', '010007') THEN 1 ELSE 0 END) AS SAGO,
            -- 정렬 순서
            DECODE(PARITY,
                '후보돈', 1,
                '0산', 2,
                '1산', 3,
                '2산', 4,
                '3산', 5,
                '4산', 6,
                '5산', 7,
                '6산', 8,
                '7산', 9,
                '8산↑', 10
            ) AS RN
        FROM (
            -- ================================================
            -- 2차 인라인 뷰: 산차 구분 (STATUS_CD 기반)
            -- 후보돈: 산차=0 AND 상태='010001' (후보)
            -- ================================================
            SELECT
                CASE
                    WHEN SANCHA = 0 AND STATUS_CD = '010001' THEN '후보돈'
                    WHEN SANCHA = 0 THEN '0산'
                    WHEN SANCHA = 1 THEN '1산'
                    WHEN SANCHA = 2 THEN '2산'
                    WHEN SANCHA = 3 THEN '3산'
                    WHEN SANCHA = 4 THEN '4산'
                    WHEN SANCHA = 5 THEN '5산'
                    WHEN SANCHA = 6 THEN '6산'
                    WHEN SANCHA = 7 THEN '7산'
                    WHEN SANCHA >= 8 THEN '8산↑'
                END AS PARITY,
                STATUS_CD
            FROM (
                -- ================================================
                -- 1차 인라인 뷰: 모돈별 산차/상태 데이터
                -- TB_MODON (드라이빙) LEFT JOIN TB_MODON_WK (마지막 작업)
                -- ================================================
                SELECT
                    -- 산차: 작업이력 있으면 WK.SANCHA, 없으면 전입산차
                    NVL(WK.SANCHA, TM.IN_SANCHA) AS SANCHA,
                    -- 상태코드 결정
                    CASE
                        WHEN WK.PIG_NO IS NULL THEN
                            -- 작업이력 없는 전입 모돈
                            CASE
                                WHEN TM.IN_SANCHA = 0
                                     AND TM.IN_GYOBAE_CNT = 1
                                     AND TM.STATUS_CD = '010002'
                                THEN '010001'    -- 임신돈이지만 산차=0, 교배차수=1이면 후보돈
                                ELSE NVL(TM.STATUS_CD, '010001')
                            END
                        ELSE
                            -- 작업이력 있는 모돈: SF_GET_MODONGB_STATUS로 상태 결정
                            SF_GET_MODONGB_STATUS(
                                'CD',
                                WK.WK_GUBUN,
                                WK.SAGO_GUBUN_CD,
                                TO_DATE('99991231', 'YYYYMMDD'),  -- 살아있는 모돈만 대상
                                TM.STATUS_CD,
                                WK.DAERI_YN,
                                ''
                            )
                    END AS STATUS_CD
                FROM TB_MODON TM
                LEFT OUTER JOIN (
                    -- 마지막 작업정보 추출 (기준일 이전)
                    SELECT /*+ INDEX(WK IDX_MODON_WK_03) */
                           WK.FARM_NO,
                           WK.PIG_NO,
                           WK.WK_GUBUN,
                           WK.SANCHA,
                           WK.GYOBAE_CNT,
                           WK.SAGO_GUBUN_CD,
                           WK.DAERI_YN,
                           WK.SEQ
                    FROM (
                        SELECT FARM_NO, PIG_NO, MAX(SEQ) AS MAX_SEQ
                        FROM TB_MODON_WK
                        WHERE FARM_NO = P_FARM_NO
                          AND WK_DT <= V_BASE_DT_STR
                          AND USE_YN = 'Y'
                        GROUP BY FARM_NO, PIG_NO
                    ) MK
                    INNER JOIN TB_MODON_WK WK
                        ON WK.FARM_NO = MK.FARM_NO
                       AND WK.PIG_NO = MK.PIG_NO
                       AND WK.SEQ = MK.MAX_SEQ
                       AND WK.USE_YN = 'Y'
                ) WK
                ON TM.FARM_NO = WK.FARM_NO
               AND TM.PIG_NO = WK.PIG_NO
                WHERE TM.FARM_NO = P_FARM_NO
                  AND TM.USE_YN = 'Y'
                  AND TM.IN_DT <= V_BASE_DT           -- 기준일 이전 입식
                  AND TM.OUT_DT > V_BASE_DT           -- 기준일 현재 살아있음
            )  -- 1차 인라인 뷰 종료
        )  -- 2차 인라인 뷰 종료
        WHERE PARITY IS NOT NULL
        GROUP BY PARITY
    )
    ORDER BY RN;

    V_PROC_CNT := SQL%ROWCOUNT;

    -- ================================================
    -- 데이터가 없는 산차도 기본 행 생성 (프론트엔드 요구사항)
    -- ================================================
    MERGE INTO TS_INS_WEEK_SUB TGT
    USING (
        SELECT P_MASTER_SEQ AS MASTER_SEQ,
               P_FARM_NO AS FARM_NO,
               'MODON' AS GUBUN,
               PARITY,
               RN AS SORT_NO
        FROM (
            SELECT '후보돈' AS PARITY, 1 AS RN FROM DUAL UNION ALL
            SELECT '0산', 2 FROM DUAL UNION ALL
            SELECT '1산', 3 FROM DUAL UNION ALL
            SELECT '2산', 4 FROM DUAL UNION ALL
            SELECT '3산', 5 FROM DUAL UNION ALL
            SELECT '4산', 6 FROM DUAL UNION ALL
            SELECT '5산', 7 FROM DUAL UNION ALL
            SELECT '6산', 8 FROM DUAL UNION ALL
            SELECT '7산', 9 FROM DUAL UNION ALL
            SELECT '8산↑', 10 FROM DUAL
        )
    ) SRC
    ON (TGT.MASTER_SEQ = SRC.MASTER_SEQ
        AND TGT.FARM_NO = SRC.FARM_NO
        AND TGT.GUBUN = SRC.GUBUN
        AND TGT.CODE_1 = SRC.PARITY)
    WHEN NOT MATCHED THEN
        INSERT (MASTER_SEQ, FARM_NO, GUBUN, SORT_NO, CODE_1,
                CNT_1, CNT_2, CNT_3, CNT_4, CNT_5, CNT_6)
        VALUES (SRC.MASTER_SEQ, SRC.FARM_NO, SRC.GUBUN, SRC.SORT_NO, SRC.PARITY,
                0, 0, 0, 0, 0, 0);

    V_PROC_CNT := V_PROC_CNT + SQL%ROWCOUNT;

    -- ================================================
    -- 현재모돈 합계두수 계산 (후보돈 제외, 0산~8산↑ 범위)
    -- 주의: 후보돈은 미교배 상태이므로 현재모돈 두수에서 제외
    -- ================================================
    SELECT NVL(SUM(CNT_1 + CNT_2 + CNT_3 + CNT_4 + CNT_5), 0)
    INTO V_TOTAL_CNT
    FROM TS_INS_WEEK_SUB
    WHERE MASTER_SEQ = P_MASTER_SEQ
      AND FARM_NO = P_FARM_NO
      AND GUBUN = 'MODON'
      AND CODE_1 <> '후보돈';  -- 후보돈 제외

    -- ================================================
    -- 상시모돈: TS_PRODUCTIVITY에서 조회 (PCODE='035', C001)
    -- 방식 2: ETL에서 수집한 생산성 API 데이터 사용
    -- ================================================
    -- 리포트 년도/주차 조회
    SELECT REPORT_YEAR, REPORT_WEEK_NO
    INTO V_REPORT_YEAR, V_REPORT_WEEK
    FROM TS_INS_WEEK
    WHERE MASTER_SEQ = P_MASTER_SEQ
      AND FARM_NO = P_FARM_NO;

    -- TS_PRODUCTIVITY에서 상시모돈 조회 (PCODE='035', C001=상시모돈수)
    BEGIN
        SELECT NVL(C001, 0)
        INTO V_SANGSI_CNT
        FROM TS_PRODUCTIVITY
        WHERE FARM_NO = P_FARM_NO
          AND PCODE = '035'
          AND STAT_YEAR = V_REPORT_YEAR
          AND PERIOD = 'W'
          AND PERIOD_NO = V_REPORT_WEEK;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            -- TS_PRODUCTIVITY 데이터 없으면 기존 방식 (MODON SUB 합계)
            SELECT NVL(SUM(CNT_1 + CNT_2 + CNT_3 + CNT_4 + CNT_5), 0)
            INTO V_SANGSI_CNT
            FROM TS_INS_WEEK_SUB
            WHERE MASTER_SEQ = P_MASTER_SEQ
              AND FARM_NO = P_FARM_NO
              AND GUBUN = 'MODON';
    END;

    -- ================================================
    -- 이전 주차 데이터 조회 및 증감(CNT_6) 계산
    -- ================================================
    BEGIN
        -- 이전 주차 MASTER_SEQ 조회
        SELECT SEQ INTO V_PREV_MASTER
        FROM (
            SELECT SEQ
            FROM TS_INS_MASTER
            WHERE DAY_GB = 'WEEK'
              AND SEQ < P_MASTER_SEQ
              AND STATUS_CD = 'COMPLETE'
            ORDER BY SEQ DESC
        )
        WHERE ROWNUM = 1;

        -- 이전 주차 데이터 존재
        V_HAS_PREV_DATA := TRUE;

        -- 이전 주차 산차별 합계로 증감 계산하여 UPDATE
        UPDATE TS_INS_WEEK_SUB CUR
        SET CNT_6 = (
            SELECT NVL(
                (CUR.CNT_1 + CUR.CNT_2 + CUR.CNT_3 + CUR.CNT_4 + CUR.CNT_5) -
                (PRV.CNT_1 + PRV.CNT_2 + PRV.CNT_3 + PRV.CNT_4 + PRV.CNT_5),
                CUR.CNT_1 + CUR.CNT_2 + CUR.CNT_3 + CUR.CNT_4 + CUR.CNT_5
            )
            FROM TS_INS_WEEK_SUB PRV
            WHERE PRV.MASTER_SEQ = V_PREV_MASTER
              AND PRV.FARM_NO = P_FARM_NO
              AND PRV.GUBUN = 'MODON'
              AND PRV.CODE_1 = CUR.CODE_1
        )
        WHERE CUR.MASTER_SEQ = P_MASTER_SEQ
          AND CUR.FARM_NO = P_FARM_NO
          AND CUR.GUBUN = 'MODON';

        -- 이전 주차 합계두수 조회 (TS_INS_WEEK에서)
        SELECT NVL(MODON_REG_CNT, 0), NVL(MODON_SANGSI_CNT, 0)
        INTO V_PREV_TOTAL, V_PREV_SANGSI
        FROM TS_INS_WEEK
        WHERE MASTER_SEQ = V_PREV_MASTER
          AND FARM_NO = P_FARM_NO;

    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            -- 이전 주차 데이터 없음 (첫 번째 주)
            -- CNT_6 = NULL (증감 표시 안함), V_HAS_PREV_DATA = FALSE
            NULL;
    END;

    -- ================================================
    -- TS_INS_WEEK 테이블에 모돈 합계두수 UPDATE
    -- 이전 주차 데이터가 없으면 증감값은 NULL (표시 안함)
    -- ================================================
    IF V_HAS_PREV_DATA THEN
        UPDATE TS_INS_WEEK
        SET MODON_REG_CNT = V_TOTAL_CNT,
            MODON_REG_CHG = V_TOTAL_CNT - V_PREV_TOTAL,
            MODON_SANGSI_CNT = V_SANGSI_CNT,
            MODON_SANGSI_CHG = V_SANGSI_CNT - V_PREV_SANGSI
        WHERE MASTER_SEQ = P_MASTER_SEQ
          AND FARM_NO = P_FARM_NO;
    ELSE
        UPDATE TS_INS_WEEK
        SET MODON_REG_CNT = V_TOTAL_CNT,
            MODON_REG_CHG = NULL,
            MODON_SANGSI_CNT = V_SANGSI_CNT,
            MODON_SANGSI_CHG = NULL
        WHERE MASTER_SEQ = P_MASTER_SEQ
          AND FARM_NO = P_FARM_NO;
    END IF;

    COMMIT;

    -- 로그 종료 (성공)
    SP_INS_COM_LOG_END(V_LOG_SEQ, V_PROC_CNT);

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        SP_INS_COM_LOG_ERROR(V_LOG_SEQ, SQLCODE, SQLERRM);
        RAISE;
END SP_INS_WEEK_MODON_POPUP;
/

-- 프로시저 확인
SELECT OBJECT_NAME, STATUS FROM USER_OBJECTS WHERE OBJECT_NAME = 'SP_INS_WEEK_MODON_POPUP';
