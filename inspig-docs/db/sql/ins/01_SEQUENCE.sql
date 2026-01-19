-- ============================================================
-- 시퀀스 생성 스크립트
-- 인사이트피그플랜(inspig) 통계 테이블용 시퀀스
--
-- 실행 순서: 테이블 생성 전에 먼저 실행
-- 대상 Oracle: 19c
-- ============================================================

-- ============================================================
-- 1. SEQ_TS_INS_MASTER: 리포트 마스터 시퀀스
--    대상 테이블: TS_INS_MASTER.SEQ
-- ============================================================
BEGIN
    EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_TS_INS_MASTER';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

CREATE SEQUENCE SEQ_TS_INS_MASTER
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9999999999
    NOCACHE
    NOCYCLE;

-- ============================================================
-- 2. SEQ_TS_INS_JOB_LOG: 스케줄러 로그 시퀀스
--    대상 테이블: TS_INS_JOB_LOG.SEQ
-- ============================================================
BEGIN
    EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_TS_INS_JOB_LOG';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

CREATE SEQUENCE SEQ_TS_INS_JOB_LOG
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9999999999
    NOCACHE
    NOCYCLE;

-- ============================================================
-- 3. SEQ_TM_WEATHER: 날씨 테이블 시퀀스
--    대상 테이블: TM_WEATHER.SEQ
-- ============================================================
BEGIN
    EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_TM_WEATHER';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

CREATE SEQUENCE SEQ_TM_WEATHER
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9999999999
    NOCACHE
    NOCYCLE;

-- ============================================================
-- 시퀀스 확인
-- ============================================================
SELECT SEQUENCE_NAME, MIN_VALUE, MAX_VALUE, INCREMENT_BY, LAST_NUMBER
FROM USER_SEQUENCES
WHERE SEQUENCE_NAME IN ('SEQ_TS_INS_MASTER', 'SEQ_TS_INS_JOB_LOG', 'SEQ_TM_WEATHER')
ORDER BY SEQUENCE_NAME;

