-- ============================================================
-- 공통 로그 프로시저 (SP_INS_COM_*)
-- TS_INS_JOB_LOG 테이블에 프로시저 실행 로그 기록
--
-- 시간 원칙:
--   - 저장(LOG_INS_DT, START_DT, END_DT): SYSDATE (서버시간/UTC)
--   - 비교(WK_DT와 비교 등): SF_GET_LOCALE_VW_DATE_2022 (다국가 로케일)
--   - 조회: 애플리케이션에서 로케일 변환
--
-- 날짜 비교 함수 (다국가 지원, 기존 시스템 함수):
--   SF_GET_LOCALE_VW_DATE_2022(LOCALE, IN_DATE)
--     - 'KOR': 한국 +09:00
--     - 'VNM': 베트남 +07:00
--   예시: TRUNC(SF_GET_LOCALE_VW_DATE_2022('KOR', SYSDATE))
-- ============================================================

-- ============================================================
-- 1. SP_INS_COM_LOG_START: 로그 시작 기록
-- ============================================================
CREATE OR REPLACE PROCEDURE SP_INS_COM_LOG_START (
    /*
    ================================================================
    SP_INS_COM_LOG_START: 프로시저 실행 로그 시작 기록
    ================================================================
    - 용도: 프로시저 시작 시 TS_INS_JOB_LOG에 RUNNING 상태로 기록
    - 호출: 각 SP_INS_WEEK_* 프로시저 시작부
    - 대상 테이블: TS_INS_JOB_LOG
    - 대시보드 모니터링: DAY_GB, REPORT_YEAR, REPORT_WEEK_NO로 조회
    ================================================================
    */
    P_MASTER_SEQ    IN  NUMBER,         -- 마스터 시퀀스 (FK → TS_INS_MASTER)
    P_JOB_NM        IN  VARCHAR2,       -- JOB명 (예: JOB_INS_WEEKLY_REPORT)
    P_PROC_NM       IN  VARCHAR2,       -- 프로시저명 (예: SP_INS_WEEK_MAIN)
    P_FARM_NO       IN  INTEGER DEFAULT NULL,  -- 농장번호 (선택)
    P_LOG_SEQ       OUT NUMBER,         -- 생성된 로그 시퀀스 (반환값)
    P_DAY_GB        IN  VARCHAR2 DEFAULT NULL, -- 기간구분 (WEEK, MON, QT)
    P_REPORT_YEAR   IN  NUMBER DEFAULT NULL,   -- 리포트 년도 (선택)
    P_REPORT_WEEK_NO IN NUMBER DEFAULT NULL    -- 리포트 주차/월/분기 (선택)
) AS
BEGIN
    SELECT SEQ_TS_INS_JOB_LOG.NEXTVAL INTO P_LOG_SEQ FROM DUAL;

    INSERT INTO TS_INS_JOB_LOG (
        SEQ, MASTER_SEQ, JOB_NM, PROC_NM, FARM_NO,
        DAY_GB, REPORT_YEAR, REPORT_WEEK_NO,
        STATUS_CD, START_DT
    ) VALUES (
        P_LOG_SEQ, P_MASTER_SEQ, P_JOB_NM, P_PROC_NM, P_FARM_NO,
        P_DAY_GB, P_REPORT_YEAR, P_REPORT_WEEK_NO,
        'RUNNING', SYSDATE
    );

    COMMIT;
END SP_INS_COM_LOG_START;
/

-- ============================================================
-- 2. SP_INS_COM_LOG_END: 로그 종료 (성공)
-- ============================================================
CREATE OR REPLACE PROCEDURE SP_INS_COM_LOG_END (
    /*
    ================================================================
    SP_INS_COM_LOG_END: 프로시저 정상 완료 로그 기록
    ================================================================
    - 용도: 프로시저 정상 완료 시 SUCCESS 상태로 업데이트
    - 호출: 각 SP_INS_WEEK_* 프로시저 정상 종료부
    - 대상 테이블: TS_INS_JOB_LOG
    - 기록 항목: 종료시간, 소요시간(ms), 처리건수
    ================================================================
    */
    P_LOG_SEQ       IN  NUMBER,         -- 로그 시퀀스 (SP_INS_COM_LOG_START에서 반환)
    P_PROC_CNT      IN  INTEGER DEFAULT 0  -- 처리 건수
) AS
    V_START_DT DATE;
BEGIN
    SELECT START_DT INTO V_START_DT
    FROM TS_INS_JOB_LOG
    WHERE SEQ = P_LOG_SEQ;

    UPDATE TS_INS_JOB_LOG
    SET STATUS_CD = 'SUCCESS',
        END_DT = SYSDATE,
        ELAPSED_MS = ROUND((SYSDATE - V_START_DT) * 24 * 60 * 60 * 1000),
        PROC_CNT = P_PROC_CNT
    WHERE SEQ = P_LOG_SEQ;

    COMMIT;
END SP_INS_COM_LOG_END;
/

-- ============================================================
-- 3. SP_INS_COM_LOG_ERROR: 로그 종료 (오류)
-- ============================================================
CREATE OR REPLACE PROCEDURE SP_INS_COM_LOG_ERROR (
    /*
    ================================================================
    SP_INS_COM_LOG_ERROR: 프로시저 오류 발생 로그 기록
    ================================================================
    - 용도: 프로시저 예외 발생 시 ERROR 상태로 업데이트
    - 호출: 각 SP_INS_WEEK_* 프로시저 EXCEPTION 블록
    - 대상 테이블: TS_INS_JOB_LOG
    - 기록 항목: 종료시간, 소요시간(ms), 오류코드, 오류메시지
    ================================================================
    */
    P_LOG_SEQ       IN  NUMBER,         -- 로그 시퀀스
    P_ERROR_CD      IN  VARCHAR2,       -- 오류 코드 (SQLCODE)
    P_ERROR_MSG     IN  VARCHAR2        -- 오류 메시지 (SQLERRM)
) AS
    V_START_DT DATE;
BEGIN
    SELECT START_DT INTO V_START_DT
    FROM TS_INS_JOB_LOG
    WHERE SEQ = P_LOG_SEQ;

    UPDATE TS_INS_JOB_LOG
    SET STATUS_CD = 'ERROR',
        END_DT = SYSDATE,
        ELAPSED_MS = ROUND((SYSDATE - V_START_DT) * 24 * 60 * 60 * 1000),
        ERROR_CD = P_ERROR_CD,
        ERROR_MSG = SUBSTR(P_ERROR_MSG, 1, 4000)
    WHERE SEQ = P_LOG_SEQ;

    COMMIT;
END SP_INS_COM_LOG_ERROR;
/

-- ============================================================
-- 4. SP_INS_COM_LOG_CLEAR: 6개월 이전 로그 삭제
-- ============================================================
CREATE OR REPLACE PROCEDURE SP_INS_COM_LOG_CLEAR AS
    /*
    ================================================================
    SP_INS_COM_LOG_CLEAR: 6개월 이전 로그 삭제
    ================================================================
    - 용도: TS_INS_JOB_LOG 테이블에서 6개월 이전 로그 삭제
    - 호출: SP_INS_WEEK_MAIN 시작부 (JOB 실행 전)
    - 대상 테이블: TS_INS_JOB_LOG
    - 보관 기준: 최근 6개월 로그 유지
    - 대상 리포트: 주간(WEEK), 월간(MON), 분기(QT) 모두 포함
    ================================================================
    */
    V_DEL_CNT INTEGER;
BEGIN
    -- 6개월 이전 로그 삭제
    DELETE FROM TS_INS_JOB_LOG
    WHERE START_DT < ADD_MONTHS(TRUNC(SYSDATE), -6);

    V_DEL_CNT := SQL%ROWCOUNT;
    COMMIT;

    IF V_DEL_CNT > 0 THEN
        DBMS_OUTPUT.PUT_LINE('TS_INS_JOB_LOG 삭제: ' || V_DEL_CNT || '건 (6개월 이전)');
    END IF;
END SP_INS_COM_LOG_CLEAR;
/

-- 프로시저 확인
SELECT OBJECT_NAME, OBJECT_TYPE, STATUS
FROM USER_OBJECTS
WHERE OBJECT_NAME LIKE 'SP_INS_COM%'
ORDER BY OBJECT_TYPE, OBJECT_NAME;
