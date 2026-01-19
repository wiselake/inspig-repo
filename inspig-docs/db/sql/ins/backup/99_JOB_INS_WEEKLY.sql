-- ============================================================
-- JOB_INS_WEEKLY_REPORT: 주간 리포트 스케줄러 JOB
-- 매주 월요일 02:00 (KST, Asia/Seoul) SP_INS_WEEK_MAIN 프로시저 자동 실행
--
-- Oracle 19c:
--   - start_date에 타임존(+09:00) 포함하여 KST 기준 스케줄 설정
-- ============================================================

-- 기존 JOB 삭제 (있는 경우)
BEGIN
    DBMS_SCHEDULER.DROP_JOB(job_name => 'JOB_INS_WEEKLY_REPORT', force => TRUE);
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

-- ============================================================
-- JOB 생성 (Oracle 19c)
-- ============================================================
BEGIN
    DBMS_SCHEDULER.CREATE_JOB (
        job_name        => 'JOB_INS_WEEKLY_REPORT',
        job_type        => 'STORED_PROCEDURE',
        job_action      => 'SP_INS_WEEK_MAIN',
        number_of_arguments => 2,
        -- 한국시간(KST) 기준: 다음 월요일 02:00 KST로 시작
        -- NEXT_DAY 숫자 사용: 1=일, 2=월, 3=화, 4=수, 5=목, 6=금, 7=토
        start_date      => TO_TIMESTAMP_TZ(
                               TO_CHAR(TRUNC(SYSDATE, 'IW') + 7, 'YYYY-MM-DD') || ' 02:00:00 +09:00',
                               'YYYY-MM-DD HH24:MI:SS TZH:TZM'
                           ),
        repeat_interval => 'FREQ=WEEKLY; BYDAY=MON; BYHOUR=2; BYMINUTE=0; BYSECOND=0',
        enabled         => FALSE,
        comments        => '주간 리포트 생성 (매주 월요일 02:00 KST)'
    );

    -- 파라미터 설정
    -- P_DAY_GB: WEEK (주간), MON (월간), QT (분기)
    DBMS_SCHEDULER.SET_JOB_ARGUMENT_VALUE(
        job_name          => 'JOB_INS_WEEKLY_REPORT',
        argument_position => 1,
        argument_value    => 'WEEK'
    );

    -- P_BASE_DT: 기준일 (NULL = 현재일)
    DBMS_SCHEDULER.SET_JOB_ARGUMENT_VALUE(
        job_name          => 'JOB_INS_WEEKLY_REPORT',
        argument_position => 2,
        argument_value    => NULL
    );

    -- JOB 활성화
    DBMS_SCHEDULER.ENABLE('JOB_INS_WEEKLY_REPORT');
END;
/

-- ============================================================
-- JOB 확인
-- ============================================================
SELECT JOB_NAME, JOB_TYPE, STATE, ENABLED,
       NEXT_RUN_DATE,
       CAST(NEXT_RUN_DATE AT TIME ZONE 'Asia/Seoul' AS TIMESTAMP WITH TIME ZONE) AS NEXT_RUN_KST,
       COMMENTS
FROM USER_SCHEDULER_JOBS
WHERE JOB_NAME = 'JOB_INS_WEEKLY_REPORT';

-- ============================================================
-- JOB 관리 명령어 (참고용)
-- ============================================================

/*
-- 테스트 모드로 실행 (금주 데이터, 오늘 포함)
EXEC SP_INS_WEEK_MAIN('WEEK', NULL, 4, 'Y');

-- 특정 기준일로 테스트
EXEC SP_INS_WEEK_MAIN('WEEK', SYSDATE, 4, 'Y');

*/

/*
-- JOB 즉시 실행 (테스트용)
BEGIN
    DBMS_SCHEDULER.RUN_JOB('JOB_INS_WEEKLY_REPORT');
END;
/

-- JOB 비활성화
BEGIN
    DBMS_SCHEDULER.DISABLE('JOB_INS_WEEKLY_REPORT');
END;
/

-- JOB 활성화
BEGIN
    DBMS_SCHEDULER.ENABLE('JOB_INS_WEEKLY_REPORT');
END;
/

-- JOB 실행 이력 조회 (한국시간으로 변환)
SELECT JOB_NAME, STATUS,
       CAST(ACTUAL_START_DATE AT TIME ZONE 'Asia/Seoul' AS TIMESTAMP WITH TIME ZONE) AS START_KST,
       RUN_DURATION, ERROR#, ADDITIONAL_INFO
FROM USER_SCHEDULER_JOB_RUN_DETAILS
WHERE JOB_NAME = 'JOB_INS_WEEKLY_REPORT'
ORDER BY ACTUAL_START_DATE DESC
FETCH FIRST 10 ROWS ONLY;

-- 현재 DB 타임존 확인
SELECT DBTIMEZONE, SESSIONTIMEZONE FROM DUAL;

-- 현재 한국시간 확인
SELECT SYSTIMESTAMP AT TIME ZONE 'Asia/Seoul' AS CURRENT_KST FROM DUAL;
*/
