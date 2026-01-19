-- ============================================================
-- SP_INS_WEEK_MAIN: 주간 리포트 메인 프로시저 (병렬 처리 버전)
--
-- 상세 문서: docs/db/ins/week/00.process.md
--
-- 시간 원칙:
--   - 저장: SYSDATE (서버시간/UTC)
--   - WK_DT 비교: SF_GET_LOCALE_VW_DATE_2022(LOCALE, SYSDATE) (다국가 로케일)
--     * KOR: 한국 +09:00
--     * VNM: 베트남 +07:00
--
-- 병렬 처리:
--   - DBMS_JOB 사용 (Oracle 19c)
--   - 농장별 독립 트랜잭션으로 처리
--   - 오류 발생 시 해당 농장만 ERROR, 나머지는 계속 진행
-- ============================================================

-- ============================================================
-- 1. SP_INS_WEEK_FARM_PROCESS: 단일 농장 처리 프로시저
--    병렬 실행에서 호출되는 개별 농장 처리 프로시저
-- ============================================================
CREATE OR REPLACE PROCEDURE SP_INS_WEEK_FARM_PROCESS (
    /*
    ================================================================
    SP_INS_WEEK_FARM_PROCESS: 단일 농장 처리 프로시저
    ================================================================
    - 용도: 병렬 실행에서 호출되는 농장별 처리
    - 특징: 오류 발생 시 TS_INS_JOB_LOG에 기록 후 RAISE 없이 종료
            (다른 농장 처리 계속 진행)

    재실행 대비 (오류농장 수동 재처리 시):
      - TS_INS_WEEK_SUB: 동일 PK(MASTER_SEQ, FARM_NO) 삭제 후 재생성
      - TS_INS_WEEK: MERGE로 존재시 상태/집계값 초기화, 없으면 INSERT
    ================================================================
    */
    P_MASTER_SEQ      IN  NUMBER,
    P_JOB_NM          IN  VARCHAR2,
    P_DAY_GB          IN  VARCHAR2,       -- 기간구분 (WEEK, MON, QT)
    P_FARM_NO         IN  NUMBER,
    P_DT_FROM         IN  VARCHAR2,       -- YYYYMMDD
    P_DT_TO           IN  VARCHAR2,       -- YYYYMMDD
    P_NATIONAL_PRICE  IN  NUMBER DEFAULT 0  -- 전국 탕박 평균 단가 (SP_INS_WEEK_MAIN에서 1회 계산 후 전달)
) AS
    V_LOCALE        VARCHAR2(10);
    V_ERR_CODE      NUMBER;
    V_ERR_MSG       VARCHAR2(4000);
    V_YEAR          NUMBER(4);
    V_WEEK_NO       NUMBER(2);
BEGIN
    -- 농장 로케일 조회
    SELECT NVL(COUNTRY_CODE, 'KOR') INTO V_LOCALE
    FROM TA_FARM
    WHERE FARM_NO = P_FARM_NO;

    -- 주차 정보 조회 (TS_INS_MASTER에서)
    SELECT REPORT_YEAR, REPORT_WEEK_NO
    INTO V_YEAR, V_WEEK_NO
    FROM TS_INS_MASTER
    WHERE SEQ = P_MASTER_SEQ;

    -- ================================================
    -- 기존 데이터 처리 (재실행 대비)
    -- ================================================

    -- 1. TS_INS_WEEK_SUB: 동일 PK 존재시 삭제 후 재생성
    DELETE FROM TS_INS_WEEK_SUB
    WHERE MASTER_SEQ = P_MASTER_SEQ
      AND FARM_NO = P_FARM_NO;

    -- 2. TS_INS_WEEK: MERGE (상태 초기화, 오류농장 재처리 대비)
    MERGE INTO TS_INS_WEEK TGT
    USING (
        SELECT P_MASTER_SEQ AS MASTER_SEQ,
               P_FARM_NO AS FARM_NO
        FROM DUAL
    ) SRC
    ON (TGT.MASTER_SEQ = SRC.MASTER_SEQ AND TGT.FARM_NO = SRC.FARM_NO)
    WHEN MATCHED THEN
        UPDATE SET
            STATUS_CD = 'RUNNING',
            -- 모돈 현황 초기화
            MODON_REG_CNT = 0,
            MODON_REG_CHG = 0,
            MODON_SANGSI_CNT = 0,
            MODON_SANGSI_CHG = 0,
            -- 관리대상 모돈 초기화
            ALERT_TOTAL = 0,
            ALERT_HUBO = 0,
            ALERT_EU_MI = 0,
            ALERT_SG_MI = 0,
            ALERT_BM_DELAY = 0,
            ALERT_EU_DELAY = 0,
            -- 지난주 교배 초기화
            LAST_GB_CNT = 0,
            LAST_GB_SUM = 0,
            -- 지난주 분만 초기화
            LAST_BM_CNT = 0,
            LAST_BM_TOTAL = 0,
            LAST_BM_LIVE = 0,
            LAST_BM_DEAD = 0,
            LAST_BM_MUMMY = 0,
            LAST_BM_SUM_CNT = 0,
            LAST_BM_SUM_TOTAL = 0,
            LAST_BM_SUM_LIVE = 0,
            LAST_BM_AVG_TOTAL = 0,
            LAST_BM_AVG_LIVE = 0,
            LAST_BM_SUM_AVG_TOTAL = 0,
            LAST_BM_SUM_AVG_LIVE = 0,
            LAST_BM_CHG_TOTAL = 0,
            LAST_BM_CHG_LIVE = 0,
            -- 지난주 이유 초기화
            LAST_EU_CNT = 0,
            LAST_EU_JD_CNT = 0,
            LAST_EU_AVG_JD = 0,
            LAST_EU_AVG_KG = 0,
            LAST_EU_SUM_CNT = 0,
            LAST_EU_SUM_JD = 0,
            LAST_EU_SUM_AVG_JD = 0,
            LAST_EU_CHG_JD = 0,
            LAST_EU_CHG_KG = 0,
            -- 지난주 임신사고 초기화
            LAST_SG_CNT = 0,
            LAST_SG_SUM = 0,
            -- 지난주 도태폐사 초기화
            LAST_CL_CNT = 0,
            LAST_CL_SUM = 0,
            -- 지난주 출하 초기화
            LAST_SH_CNT = 0,
            LAST_SH_AVG_KG = 0,
            LAST_SH_SUM = 0,
            LAST_SH_AVG_SUM = 0,
            -- 금주 예정 초기화
            THIS_GB_SUM = 0,
            THIS_IMSIN_SUM = 0,
            THIS_BM_SUM = 0,
            THIS_EU_SUM = 0,
            THIS_VACCINE_SUM = 0,
            THIS_SHIP_SUM = 0,
            -- KPI 초기화
            KPI_PSY = 0,
            KPI_DELAY_DAY = 0,
            PSY_X = 0,
            PSY_Y = 0,
            PSY_ZONE = NULL
    WHEN NOT MATCHED THEN
        INSERT (
            MASTER_SEQ, FARM_NO, REPORT_YEAR, REPORT_WEEK_NO,
            DT_FROM, DT_TO, STATUS_CD
        ) VALUES (
            P_MASTER_SEQ, P_FARM_NO, V_YEAR, V_WEEK_NO,
            P_DT_FROM, P_DT_TO, 'RUNNING'
        );

    COMMIT;

    -- ================================================
    -- 각 프로시저 호출
    -- ================================================

    -- 농장 설정값 저장 (프론트엔드 info-note 표시용)
    SP_INS_WEEK_CONFIG(P_MASTER_SEQ, P_JOB_NM, P_FARM_NO, V_LOCALE);

    -- 관리대상 모돈 팝업
    SP_INS_WEEK_ALERT_POPUP(P_MASTER_SEQ, P_JOB_NM, P_FARM_NO, V_LOCALE, P_DT_FROM, P_DT_TO);

    -- 모돈현황 팝업 (산차별 × 상태별 교차표)
    SP_INS_WEEK_MODON_POPUP(P_MASTER_SEQ, P_JOB_NM, P_FARM_NO, V_LOCALE, TO_DATE(P_DT_TO, 'YYYYMMDD'));

    -- 교배 팝업 (GB_LIST, GB_STAT, GB_CHART)
    SP_INS_WEEK_GB_POPUP(P_MASTER_SEQ, P_JOB_NM, P_FARM_NO, V_LOCALE, P_DT_FROM, P_DT_TO);

    -- 분만 팝업 (BM_LIST, BM_STAT)
    SP_INS_WEEK_BM_POPUP(P_MASTER_SEQ, P_JOB_NM, P_FARM_NO, V_LOCALE, P_DT_FROM, P_DT_TO);

    -- 이유 팝업 (EU_LIST, EU_STAT)
    SP_INS_WEEK_EU_POPUP(P_MASTER_SEQ, P_JOB_NM, P_FARM_NO, V_LOCALE, P_DT_FROM, P_DT_TO);

    -- 임신사고 팝업 (SG, SG_CHART)
    SP_INS_WEEK_SG_POPUP(P_MASTER_SEQ, P_JOB_NM, P_FARM_NO, V_LOCALE, P_DT_FROM, P_DT_TO);

    -- 도태폐사 팝업 (DOPE_STAT, DOPE_LIST, DOPE_CHART)
    SP_INS_WEEK_DOPE_POPUP(P_MASTER_SEQ, P_JOB_NM, P_FARM_NO, V_LOCALE, P_DT_FROM, P_DT_TO);

    -- 출하 팝업 (SHIP_STAT, SHIP_ROW, SHIP_CHART, SHIP_SCATTER)
    -- ★ 주의: SP_INS_WEEK_SHIP_POPUP 프로시저의 파라미터가 변경되었으므로(P_NATIONAL_PRICE 추가),
    --          반드시 41_SP_INS_WEEK_SHIP_POPUP.sql을 먼저 실행(컴파일)해야 합니다.
    SP_INS_WEEK_SHIP_POPUP(P_MASTER_SEQ, P_JOB_NM, P_FARM_NO, V_LOCALE, P_DT_FROM, P_DT_TO, P_NATIONAL_PRICE);

    -- 금주 작업예정 (SCHEDULE, SCHEDULE_CAL)
    -- ★ 주의: 금주 날짜 계산을 위해 P_DT_FROM, P_DT_TO를 금주 범위로 변환해야 함
    DECLARE
        V_THIS_DT_FROM  VARCHAR2(8);
        V_THIS_DT_TO    VARCHAR2(8);
    BEGIN
        -- 금주 범위 계산: 지난주 일요일(P_DT_TO) + 1 ~ + 7
        V_THIS_DT_FROM := TO_CHAR(TO_DATE(P_DT_TO, 'YYYYMMDD') + 1, 'YYYYMMDD');  -- 금주 월요일
        V_THIS_DT_TO := TO_CHAR(TO_DATE(P_DT_TO, 'YYYYMMDD') + 7, 'YYYYMMDD');    -- 금주 일요일
        SP_INS_WEEK_SCHEDULE_POPUP(P_MASTER_SEQ, P_JOB_NM, P_FARM_NO, V_LOCALE, V_THIS_DT_FROM, V_THIS_DT_TO);
    END;

    -- 농장 상태 업데이트 (COMPLETE) + 공유 토큰 생성 + 만료일 설정 (7일)
    -- STANDARD_HASH 사용 (Oracle 12c+, 권한 불필요)
    -- RAW → VARCHAR2 변환: RAWTOHEX 사용
    UPDATE TS_INS_WEEK
    SET STATUS_CD = 'COMPLETE',
        SHARE_TOKEN = LOWER(RAWTOHEX(STANDARD_HASH(
            P_MASTER_SEQ || '-' || P_FARM_NO || '-' || TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS') || '-' || DBMS_RANDOM.STRING('X', 16),
            'SHA256'
        ))),
        TOKEN_EXPIRE_DT = TO_CHAR(SYSDATE + 7, 'YYYYMMDD')  -- 토큰 유효기간: 7일
    WHERE MASTER_SEQ = P_MASTER_SEQ AND FARM_NO = P_FARM_NO;
    COMMIT;

EXCEPTION
    WHEN OTHERS THEN
        V_ERR_CODE := SQLCODE;
        V_ERR_MSG := SUBSTR(SQLERRM, 1, 4000);

        -- 농장 상태 업데이트 (ERROR)
        UPDATE TS_INS_WEEK
        SET STATUS_CD = 'ERROR'
        WHERE MASTER_SEQ = P_MASTER_SEQ AND FARM_NO = P_FARM_NO;

        -- TS_INS_JOB_LOG에 오류 직접 기록 (오류 상세의 유일 저장소)
        INSERT INTO TS_INS_JOB_LOG (
            SEQ, MASTER_SEQ, FARM_NO, JOB_NM, PROC_NM,
            DAY_GB, REPORT_YEAR, REPORT_WEEK_NO,
            STATUS_CD, ERROR_CD, ERROR_MSG,
            LOG_INS_DT, START_DT, END_DT
        ) VALUES (
            SEQ_TS_INS_JOB_LOG.NEXTVAL,
            P_MASTER_SEQ,
            P_FARM_NO,
            P_JOB_NM,
            'SP_INS_WEEK_FARM_PROCESS',
            P_DAY_GB,
            V_YEAR,
            V_WEEK_NO,
            'ERROR',
            V_ERR_CODE,
            V_ERR_MSG,
            SYSDATE,
            SYSDATE,
            SYSDATE
        );
        COMMIT;

        -- RAISE 하지 않음 (다른 농장 처리 계속)
        DBMS_OUTPUT.PUT_LINE('오류 발생 - 농장 ' || P_FARM_NO || ': ' || V_ERR_MSG);
END SP_INS_WEEK_FARM_PROCESS;
/


-- ============================================================
-- 2. SP_INS_WEEK_MAIN: 주간 리포트 메인 프로시저 (병렬 처리)
--    DBMS_JOB 기반 병렬 처리 (Oracle 19c)
-- ============================================================
CREATE OR REPLACE PROCEDURE SP_INS_WEEK_MAIN (
    /*
    ================================================================
    SP_INS_WEEK_MAIN: 주간 리포트 생성 메인 프로시저 (병렬 처리)
    ================================================================
    - 용도: 주간 리포트 생성의 진입점 (DBMS_SCHEDULER JOB에서 호출)
    - 호출: JOB_INS_WEEKLY_REPORT (매주 월요일 02:00 KST)
    - 대상 테이블: TS_INS_MASTER, TS_INS_WEEK, TS_INS_WEEK_SUB

    스케줄 실행 제어:
      - 전체: TA_SYS_CONFIG.INS_SCHEDULE_YN = 'Y'
      - 농장별: TS_INS_SERVICE 테이블
        * INSPIG_YN = 'Y' (서비스 신청)
        * INSPIG_TO_DT IS NULL OR >= 오늘 (종료일 미경과)
        * INSPIG_STOP_DT IS NULL (중단되지 않음)

    병렬 처리:
      - DBMS_JOB 사용 (Oracle 19c)
      - P_PARALLEL_LEVEL: 동시 실행 농장 수 (기본 4)
      - 농장별 독립 트랜잭션

    테스트 모드 (P_TEST_MODE='Y'):
      - 금주 데이터 생성 (월요일 ~ 오늘)
      - 기존 시스템 데이터 비교 목적
      - P_TEST_FARMS: 테스트 대상 농장 (콤마 구분, NULL이면 전체)
      - 예시: EXEC SP_INS_WEEK_MAIN('WEEK', NULL, 4, 'Y', '1456,1387,4629,4440');

    실행 순서:
      0. TA_SYS_CONFIG.INS_SCHEDULE_YN 체크 → 'Y' 아니면 종료
      1. SP_INS_COM_LOG_CLEAR → 전일 로그 삭제
      1.5 중복 실행 체크 → 동일 기간 리포트 존재 시 종료
      2. TS_INS_MASTER 생성 → 마스터 레코드 INSERT
      3. TS_INS_WEEK 초기화 → 대상 농장별 레코드 생성
      4. 농장별 병렬 처리 (DBMS_JOB)
      5. 완료 대기 후 TS_INS_MASTER 상태 업데이트
    ================================================================
    */
    P_DAY_GB          IN  VARCHAR2 DEFAULT 'WEEK',    -- 기간구분: WEEK(주간), MON(월간), QT(분기)
    P_BASE_DT         IN  DATE DEFAULT NULL,          -- 기준일 (NULL=오늘)
    P_PARALLEL_LEVEL  IN  NUMBER DEFAULT 4,           -- 병렬 수준 (동시 실행 농장 수)
    P_TEST_MODE       IN  VARCHAR2 DEFAULT 'N',       -- 테스트모드: Y=금주(오늘포함), N=지난주(기본)
    P_SCHEDULE_GROUP  IN  VARCHAR2 DEFAULT NULL       -- 스케줄 그룹 (AM7, PM2, NULL=전체)
) AS
    V_JOB_NM        VARCHAR2(50) := 'JOB_INS_WEEKLY_REPORT';
    V_LOG_SEQ       NUMBER;
    V_MASTER_SEQ    NUMBER;
    V_BASE_DT       DATE;
    V_DT_FROM       VARCHAR2(8);        -- YYYYMMDD
    V_DT_TO         VARCHAR2(8);        -- YYYYMMDD
    V_YEAR          NUMBER(4);
    V_WEEK_NO       NUMBER(2);
    V_TARGET_CNT    INTEGER := 0;
    V_COMPLETE_CNT  INTEGER := 0;
    V_ERROR_CNT     INTEGER := 0;
    V_SCHEDULE_YN   VARCHAR2(1);
    V_EXIST_CNT     INTEGER := 0;
    V_TODAY         DATE;
    V_LOCALE        VARCHAR2(10);

    -- 병렬 처리 관련
    V_JOB_NO        NUMBER;
    V_RUNNING_CNT   INTEGER;
    V_WAIT_CNT      INTEGER := 0;
    V_MAX_WAIT      INTEGER := 600;  -- 최대 대기 시간 (초) = 10분

    -- 농장 목록 저장용
    TYPE T_FARM_LIST IS TABLE OF TS_INS_WEEK.FARM_NO%TYPE;
    V_FARMS         T_FARM_LIST := T_FARM_LIST();
    V_IDX           INTEGER := 1;

    -- 전국 탕박 평균 단가 (JOB당 1회 계산)
    V_NATIONAL_PRICE NUMBER := 0;

BEGIN
    -- 오늘 날짜 설정 (기본: 한국 로케일)
    V_LOCALE := 'KOR';
    V_TODAY := TRUNC(SF_GET_LOCALE_VW_DATE_2022(V_LOCALE, SYSDATE));

    -- ================================================
    -- 0. 스케줄 실행 여부 체크 (TA_SYS_CONFIG)
    -- ================================================
    SELECT NVL(INS_SCHEDULE_YN, 'N') INTO V_SCHEDULE_YN
    FROM TA_SYS_CONFIG
    WHERE ROWNUM = 1;

    IF V_SCHEDULE_YN != 'Y' THEN
        DBMS_OUTPUT.PUT_LINE('INS_SCHEDULE_YN = N : 스케줄 실행 중단');
        RETURN;
    END IF;

    -- ================================================
    -- 1. 전일 로그 삭제 (당일 로그만 유지)
    -- ================================================
    SP_INS_COM_LOG_CLEAR;

    -- 기준일 설정
    V_BASE_DT := NVL(P_BASE_DT, V_TODAY);

    -- 주차 계산 (ISO Week)
    V_YEAR := TO_NUMBER(TO_CHAR(V_BASE_DT, 'IYYY'));
    V_WEEK_NO := TO_NUMBER(TO_CHAR(V_BASE_DT, 'IW'));

    -- 기간 계산 (VARCHAR YYYYMMDD 형식으로 저장)
    IF P_TEST_MODE = 'Y' THEN
        -- 테스트 모드: 금주 (오늘 포함) - 기존 시스템 데이터 비교용
        V_DT_FROM := TO_CHAR(TRUNC(V_BASE_DT, 'IW'), 'YYYYMMDD');  -- 금주 월요일
        V_DT_TO := TO_CHAR(V_BASE_DT, 'YYYYMMDD');                  -- 오늘 (기준일)
    ELSE
        -- 운영 모드: 지난주 (기본)
        V_DT_TO := TO_CHAR(TRUNC(V_BASE_DT, 'IW') - 1, 'YYYYMMDD');  -- 지난주 일요일
        V_DT_FROM := TO_CHAR(TRUNC(V_BASE_DT, 'IW') - 7, 'YYYYMMDD'); -- 지난주 월요일
    END IF;

    -- ================================================
    -- 1.3 전국 탕박 평균 단가 계산 (JOB당 1회)
    --     조건: ABATTCD='057016'(전국), GRADE_CD='ST'(등외제외 전체), SKIN_YN='Y'(탕박)
    --     가중평균: SUM(두수 * 단가) / SUM(두수)
    -- ================================================
    SELECT NVL(ROUND(SUM(AUCTCNT * AUCTAMT) / NULLIF(SUM(AUCTCNT), 0)), 0)
    INTO V_NATIONAL_PRICE
    FROM TM_SISAE_DETAIL
    WHERE ABATTCD = '057016'
      AND START_DT BETWEEN V_DT_FROM AND V_DT_TO
      AND GRADE_CD = 'ST'
      AND SKIN_YN = 'Y'
      AND JUDGESEX_CD IS NULL
      AND TO_NUMBER(NVL(AUCTAMT, '0')) > 0;

    -- ================================================
    -- 1.5 중복 실행 체크 (동일 기간구분+년도+주차)
    -- ================================================
    SELECT COUNT(*) INTO V_EXIST_CNT
    FROM TS_INS_MASTER
    WHERE DAY_GB = P_DAY_GB
      AND REPORT_YEAR = V_YEAR
      AND REPORT_WEEK_NO = V_WEEK_NO;

    IF V_EXIST_CNT > 0 THEN
        DBMS_OUTPUT.PUT_LINE('이미 생성된 리포트 존재: ' || P_DAY_GB || ' ' || V_YEAR || '년 ' || V_WEEK_NO || '주차');
        RETURN;
    END IF;

    -- ================================================
    -- 2. TS_INS_MASTER 생성
    -- ================================================
    SELECT SEQ_TS_INS_MASTER.NEXTVAL INTO V_MASTER_SEQ FROM DUAL;

    INSERT INTO TS_INS_MASTER (
        SEQ, DAY_GB, INS_DT, REPORT_YEAR, REPORT_WEEK_NO,
        DT_FROM, DT_TO, STATUS_CD, START_DT
    ) VALUES (
        V_MASTER_SEQ, P_DAY_GB, TO_CHAR(V_BASE_DT, 'YYYYMMDD'),
        V_YEAR, V_WEEK_NO, V_DT_FROM, V_DT_TO, 'RUNNING', SYSDATE
    );
    COMMIT;

    -- 메인 로그 시작 (기간구분, 주차 정보 포함)
    SP_INS_COM_LOG_START(V_MASTER_SEQ, V_JOB_NM, 'SP_INS_WEEK_MAIN', NULL, V_LOG_SEQ, P_DAY_GB, V_YEAR, V_WEEK_NO);

    -- ================================================
    -- 3. 대상 농장 조회 및 TS_INS_WEEK 초기 생성
    --    P_SCHEDULE_GROUP 지정 시 해당 그룹 농장만 처리
    -- ================================================
    FOR farm_rec IN (
        SELECT DISTINCT F.FARM_NO, F.FARM_NM, F.PRINCIPAL_NM, F.SIGUN_CD,
               NVL(F.COUNTRY_CODE, 'KOR') AS LOCALE,
               NVL(S.SCHEDULE_GROUP_WEEK, 'AM7') AS SCHEDULE_GROUP_WEEK
        FROM TA_FARM F
        INNER JOIN TS_INS_SERVICE S ON F.FARM_NO = S.FARM_NO
        WHERE F.USE_YN = 'Y'
          AND S.INSPIG_YN = 'Y'
          AND S.USE_YN = 'Y'
          AND (S.INSPIG_TO_DT IS NULL OR S.INSPIG_TO_DT >= TO_CHAR(V_TODAY, 'YYYYMMDD'))
          AND (S.INSPIG_STOP_DT IS NULL OR S.INSPIG_STOP_DT > TO_CHAR(V_TODAY, 'YYYYMMDD'))
          -- 스케줄 그룹 필터링 (NULL이면 전체)
          AND (P_SCHEDULE_GROUP IS NULL OR NVL(S.SCHEDULE_GROUP_WEEK, 'AM7') = P_SCHEDULE_GROUP)
        ORDER BY F.FARM_NO
    ) LOOP
        V_TARGET_CNT := V_TARGET_CNT + 1;

        INSERT INTO TS_INS_WEEK (
            MASTER_SEQ, FARM_NO, REPORT_YEAR, REPORT_WEEK_NO,
            DT_FROM, DT_TO, FARM_NM, OWNER_NM, SIGUNGU_CD, STATUS_CD, SCHEDULE_GROUP
        ) VALUES (
            V_MASTER_SEQ, farm_rec.FARM_NO, V_YEAR, V_WEEK_NO,
            V_DT_FROM, V_DT_TO, farm_rec.FARM_NM, farm_rec.PRINCIPAL_NM,
            farm_rec.SIGUN_CD, 'READY', farm_rec.SCHEDULE_GROUP_WEEK
        );

        -- 농장 목록 저장
        V_FARMS.EXTEND;
        V_FARMS(V_FARMS.COUNT) := farm_rec.FARM_NO;
    END LOOP;
    COMMIT;

    -- MASTER 대상 농장수 업데이트
    UPDATE TS_INS_MASTER
    SET TARGET_CNT = V_TARGET_CNT
    WHERE SEQ = V_MASTER_SEQ;
    COMMIT;

    IF V_TARGET_CNT = 0 THEN
        DBMS_OUTPUT.PUT_LINE('대상 농장이 없습니다.');
        SP_INS_COM_LOG_END(V_LOG_SEQ, 0);
        RETURN;
    END IF;

    -- ================================================
    -- 4. 농장별 병렬 처리 (DBMS_JOB)
    -- ================================================
    V_IDX := 1;

    WHILE V_IDX <= V_FARMS.COUNT LOOP
        -- 현재 실행 중인 JOB 수 확인
        SELECT COUNT(*) INTO V_RUNNING_CNT
        FROM USER_JOBS
        WHERE WHAT LIKE '%SP_INS_WEEK_FARM_PROCESS%'
          AND WHAT LIKE '%' || V_MASTER_SEQ || '%';

        -- 병렬 수준 이하면 새 JOB 제출
        IF V_RUNNING_CNT < P_PARALLEL_LEVEL THEN
            DBMS_JOB.SUBMIT(
                job  => V_JOB_NO,
                what => 'BEGIN SP_INS_WEEK_FARM_PROCESS(' ||
                        V_MASTER_SEQ || ', ''' || V_JOB_NM || ''', ''' || P_DAY_GB || ''', ' ||
                        V_FARMS(V_IDX) || ', ''' || V_DT_FROM || ''', ''' || V_DT_TO || ''', ' ||
                        V_NATIONAL_PRICE || '); END;',
                next_date => SYSDATE
            );
            COMMIT;

            DBMS_OUTPUT.PUT_LINE('JOB 제출: 농장 ' || V_FARMS(V_IDX) || ' (JOB_NO=' || V_JOB_NO || ')');
            V_IDX := V_IDX + 1;
        ELSE
            -- 병렬 수준 초과 시 대기
            DBMS_LOCK.SLEEP(1);
        END IF;
    END LOOP;

    -- ================================================
    -- 5. 모든 JOB 완료 대기
    -- ================================================
    V_WAIT_CNT := 0;
    LOOP
        -- 아직 READY 또는 RUNNING 상태인 농장 수 확인
        SELECT COUNT(*) INTO V_RUNNING_CNT
        FROM TS_INS_WEEK
        WHERE MASTER_SEQ = V_MASTER_SEQ
          AND STATUS_CD IN ('READY', 'RUNNING');

        EXIT WHEN V_RUNNING_CNT = 0 OR V_WAIT_CNT >= V_MAX_WAIT;

        DBMS_LOCK.SLEEP(1);
        V_WAIT_CNT := V_WAIT_CNT + 1;
    END LOOP;

    -- 타임아웃 처리
    IF V_WAIT_CNT >= V_MAX_WAIT THEN
        -- RUNNING 상태로 남은 농장을 ERROR로 변경
        UPDATE TS_INS_WEEK
        SET STATUS_CD = 'ERROR'
        WHERE MASTER_SEQ = V_MASTER_SEQ
          AND STATUS_CD IN ('READY', 'RUNNING');
        COMMIT;

        DBMS_OUTPUT.PUT_LINE('타임아웃: ' || V_MAX_WAIT || '초 경과');
    END IF;

    -- ================================================
    -- 6. 결과 집계 및 MASTER 상태 업데이트
    -- ================================================
    SELECT COUNT(*) INTO V_COMPLETE_CNT
    FROM TS_INS_WEEK
    WHERE MASTER_SEQ = V_MASTER_SEQ AND STATUS_CD = 'COMPLETE';

    SELECT COUNT(*) INTO V_ERROR_CNT
    FROM TS_INS_WEEK
    WHERE MASTER_SEQ = V_MASTER_SEQ AND STATUS_CD = 'ERROR';

    UPDATE TS_INS_MASTER
    SET STATUS_CD = CASE WHEN V_ERROR_CNT = 0 THEN 'COMPLETE' ELSE 'ERROR' END,
        COMPLETE_CNT = V_COMPLETE_CNT,
        ERROR_CNT = V_ERROR_CNT,
        END_DT = SYSDATE,
        ELAPSED_SEC = ROUND((SYSDATE - START_DT) * 24 * 60 * 60)
    WHERE SEQ = V_MASTER_SEQ;
    COMMIT;

    -- 메인 로그 종료
    SP_INS_COM_LOG_END(V_LOG_SEQ, V_TARGET_CNT);

    DBMS_OUTPUT.PUT_LINE('SP_INS_WEEK_MAIN 완료: 대상=' || V_TARGET_CNT ||
                         ', 완료=' || V_COMPLETE_CNT || ', 오류=' || V_ERROR_CNT ||
                         ' (병렬 수준=' || P_PARALLEL_LEVEL || ')');

EXCEPTION
    WHEN OTHERS THEN
        -- MASTER 상태 업데이트 (ERROR)
        UPDATE TS_INS_MASTER
        SET STATUS_CD = 'ERROR',
            END_DT = SYSDATE,
            ELAPSED_SEC = ROUND((SYSDATE - START_DT) * 24 * 60 * 60)
        WHERE SEQ = V_MASTER_SEQ;
        COMMIT;

        SP_INS_COM_LOG_ERROR(V_LOG_SEQ, SQLCODE, SQLERRM);
        RAISE;
END SP_INS_WEEK_MAIN;
/


-- ============================================================
-- 3. SP_INS_WEEK_RETRY_ERROR: 오류 농장 재처리 프로시저
-- ============================================================
CREATE OR REPLACE PROCEDURE SP_INS_WEEK_RETRY_ERROR (
    /*
    ================================================================
    SP_INS_WEEK_RETRY_ERROR: 오류 농장 재처리 프로시저
    ================================================================
    - 용도: STATUS_CD='ERROR'인 농장만 재처리
    - 호출: 수동 또는 모니터링 시스템에서 호출

    사용 예시:
      -- 특정 MASTER_SEQ의 오류 농장 재처리
      EXEC SP_INS_WEEK_RETRY_ERROR(123);

      -- 특정 MASTER_SEQ의 특정 농장만 재처리
      EXEC SP_INS_WEEK_RETRY_ERROR(123, 1001);

      -- 병렬 수준 지정
      EXEC SP_INS_WEEK_RETRY_ERROR(123, NULL, 8);
    ================================================================
    */
    P_MASTER_SEQ      IN  NUMBER,                       -- 마스터 SEQ
    P_FARM_NO         IN  NUMBER DEFAULT NULL,          -- 특정 농장만 (NULL=전체 오류 농장)
    P_PARALLEL_LEVEL  IN  NUMBER DEFAULT 4              -- 병렬 수준
) AS
    V_JOB_NM        VARCHAR2(50) := 'JOB_INS_WEEKLY_REPORT';
    V_DAY_GB        VARCHAR2(10);
    V_DT_FROM       VARCHAR2(8);        -- YYYYMMDD
    V_DT_TO         VARCHAR2(8);        -- YYYYMMDD
    V_TARGET_CNT    INTEGER := 0;
    V_COMPLETE_CNT  INTEGER := 0;
    V_ERROR_CNT     INTEGER := 0;
    V_PREV_COMPLETE INTEGER := 0;
    V_PREV_ERROR    INTEGER := 0;

    -- 병렬 처리 관련
    V_JOB_NO        NUMBER;
    V_RUNNING_CNT   INTEGER;
    V_WAIT_CNT      INTEGER := 0;
    V_MAX_WAIT      INTEGER := 600;

    -- 농장 목록 저장용
    TYPE T_FARM_LIST IS TABLE OF TS_INS_WEEK.FARM_NO%TYPE;
    V_FARMS         T_FARM_LIST := T_FARM_LIST();
    V_IDX           INTEGER := 1;

    -- 전국 탕박 평균 단가 (재처리 시에도 1회 계산)
    V_NATIONAL_PRICE NUMBER := 0;

BEGIN
    -- 마스터 정보 조회
    SELECT DAY_GB, DT_FROM, DT_TO, NVL(COMPLETE_CNT, 0), NVL(ERROR_CNT, 0)
    INTO V_DAY_GB, V_DT_FROM, V_DT_TO, V_PREV_COMPLETE, V_PREV_ERROR
    FROM TS_INS_MASTER
    WHERE SEQ = P_MASTER_SEQ;

    -- 전국 탕박 평균 단가 계산 (JOB당 1회)
    SELECT NVL(ROUND(SUM(AUCTCNT * AUCTAMT) / NULLIF(SUM(AUCTCNT), 0)), 0)
    INTO V_NATIONAL_PRICE
    FROM TM_SISAE_DETAIL
    WHERE ABATTCD = '057016'
      AND START_DT BETWEEN V_DT_FROM AND V_DT_TO
      AND GRADE_CD = 'ST'
      AND SKIN_YN = 'Y'
      AND JUDGESEX_CD IS NULL
      AND TO_NUMBER(NVL(AUCTAMT, '0')) > 0;

    -- 오류 농장 목록 조회
    FOR farm_rec IN (
        SELECT FARM_NO
        FROM TS_INS_WEEK
        WHERE MASTER_SEQ = P_MASTER_SEQ
          AND STATUS_CD = 'ERROR'
          AND (P_FARM_NO IS NULL OR FARM_NO = P_FARM_NO)
        ORDER BY FARM_NO
    ) LOOP
        V_TARGET_CNT := V_TARGET_CNT + 1;
        V_FARMS.EXTEND;
        V_FARMS(V_FARMS.COUNT) := farm_rec.FARM_NO;
    END LOOP;

    IF V_TARGET_CNT = 0 THEN
        DBMS_OUTPUT.PUT_LINE('재처리 대상 농장이 없습니다. (MASTER_SEQ=' || P_MASTER_SEQ || ')');
        RETURN;
    END IF;

    DBMS_OUTPUT.PUT_LINE('========================================');
    DBMS_OUTPUT.PUT_LINE('오류 농장 재처리 시작');
    DBMS_OUTPUT.PUT_LINE('MASTER_SEQ: ' || P_MASTER_SEQ);
    DBMS_OUTPUT.PUT_LINE('재처리 대상: ' || V_TARGET_CNT || '개 농장');
    DBMS_OUTPUT.PUT_LINE('========================================');

    -- MASTER 상태 업데이트 (RETRY)
    UPDATE TS_INS_MASTER
    SET STATUS_CD = 'RETRY',
        START_DT = SYSDATE
    WHERE SEQ = P_MASTER_SEQ;
    COMMIT;

    -- 오류 농장 상태 초기화 (READY)
    UPDATE TS_INS_WEEK
    SET STATUS_CD = 'READY'
    WHERE MASTER_SEQ = P_MASTER_SEQ
      AND STATUS_CD = 'ERROR'
      AND (P_FARM_NO IS NULL OR FARM_NO = P_FARM_NO);
    COMMIT;

    -- ================================================
    -- 병렬 처리 (DBMS_JOB)
    -- ================================================
    V_IDX := 1;

    WHILE V_IDX <= V_FARMS.COUNT LOOP
        SELECT COUNT(*) INTO V_RUNNING_CNT
        FROM USER_JOBS
        WHERE WHAT LIKE '%SP_INS_WEEK_FARM_PROCESS%'
          AND WHAT LIKE '%' || P_MASTER_SEQ || '%';

        IF V_RUNNING_CNT < P_PARALLEL_LEVEL THEN
            DBMS_JOB.SUBMIT(
                job  => V_JOB_NO,
                what => 'BEGIN SP_INS_WEEK_FARM_PROCESS(' ||
                        P_MASTER_SEQ || ', ''' || V_JOB_NM || ''', ''' || V_DAY_GB || ''', ' ||
                        V_FARMS(V_IDX) || ', ''' || V_DT_FROM || ''', ''' || V_DT_TO || ''', ' ||
                        V_NATIONAL_PRICE || '); END;',
                next_date => SYSDATE
            );
            COMMIT;

            DBMS_OUTPUT.PUT_LINE('JOB 제출: 농장 ' || V_FARMS(V_IDX));
            V_IDX := V_IDX + 1;
        ELSE
            DBMS_LOCK.SLEEP(1);
        END IF;
    END LOOP;

    -- 완료 대기
    V_WAIT_CNT := 0;
    LOOP
        SELECT COUNT(*) INTO V_RUNNING_CNT
        FROM TS_INS_WEEK
        WHERE MASTER_SEQ = P_MASTER_SEQ
          AND STATUS_CD IN ('READY', 'RUNNING');

        EXIT WHEN V_RUNNING_CNT = 0 OR V_WAIT_CNT >= V_MAX_WAIT;

        DBMS_LOCK.SLEEP(1);
        V_WAIT_CNT := V_WAIT_CNT + 1;
    END LOOP;

    -- ================================================
    -- 결과 집계 및 MASTER 상태 업데이트
    -- ================================================
    SELECT COUNT(*) INTO V_COMPLETE_CNT
    FROM TS_INS_WEEK
    WHERE MASTER_SEQ = P_MASTER_SEQ AND STATUS_CD = 'COMPLETE';

    SELECT COUNT(*) INTO V_ERROR_CNT
    FROM TS_INS_WEEK
    WHERE MASTER_SEQ = P_MASTER_SEQ AND STATUS_CD = 'ERROR';

    UPDATE TS_INS_MASTER
    SET STATUS_CD = CASE WHEN V_ERROR_CNT = 0 THEN 'COMPLETE' ELSE 'ERROR' END,
        COMPLETE_CNT = V_COMPLETE_CNT,
        ERROR_CNT = V_ERROR_CNT,
        END_DT = SYSDATE,
        ELAPSED_SEC = ROUND((SYSDATE - START_DT) * 24 * 60 * 60)
    WHERE SEQ = P_MASTER_SEQ;
    COMMIT;

    DBMS_OUTPUT.PUT_LINE('========================================');
    DBMS_OUTPUT.PUT_LINE('재처리 완료');
    DBMS_OUTPUT.PUT_LINE('이전: 완료=' || V_PREV_COMPLETE || ', 오류=' || V_PREV_ERROR);
    DBMS_OUTPUT.PUT_LINE('현재: 완료=' || V_COMPLETE_CNT || ', 오류=' || V_ERROR_CNT);
    DBMS_OUTPUT.PUT_LINE('========================================');

EXCEPTION
    WHEN OTHERS THEN
        -- MASTER 상태 업데이트 (ERROR)
        UPDATE TS_INS_MASTER
        SET STATUS_CD = 'ERROR'
        WHERE SEQ = P_MASTER_SEQ;
        COMMIT;

        DBMS_OUTPUT.PUT_LINE('재처리 오류: ' || SQLERRM);
        RAISE;
END SP_INS_WEEK_RETRY_ERROR;
/


-- ============================================================
-- 프로시저 확인
-- ============================================================
SELECT OBJECT_NAME, OBJECT_TYPE, STATUS
FROM USER_OBJECTS
WHERE OBJECT_NAME IN ('SP_INS_WEEK_MAIN', 'SP_INS_WEEK_FARM_PROCESS', 'SP_INS_WEEK_RETRY_ERROR')
ORDER BY OBJECT_NAME;
