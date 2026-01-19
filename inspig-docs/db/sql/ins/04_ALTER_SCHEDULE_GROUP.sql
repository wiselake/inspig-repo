-- ============================================================
-- TS_INS_SERVICE / TS_INS_WEEK 스케줄 그룹 컬럼 추가
-- 실행일: 2026-01-12
-- 목적: 주간/월간/분기 리포트별 알림톡 발송 시간대 그룹 관리
--
-- 그룹별 스케줄:
--   AM7: ETL 02:00 → 알림톡 07:00 (기본값)
--   PM2: ETL 12:00 → 알림톡 14:00 (오후 2시)
--
-- 아키텍처:
--   1) TS_INS_SERVICE: 농장별 스케줄 그룹 설정 (주간/월간/분기별)
--   2) TS_INS_WEEK: ETL 실행 시점의 스케줄 그룹 스냅샷 저장
--      - ETL 시점과 알림톡 발송 시점 사이에 설정 변경되어도 정확한 발송 보장
-- ============================================================

-- ============================================================
-- Part 1: TS_INS_SERVICE (농장별 스케줄 설정)
-- ============================================================

-- 1-1. 리포트 유형별 SCHEDULE_GROUP 컬럼 추가
ALTER TABLE TS_INS_SERVICE ADD SCHEDULE_GROUP_WEEK VARCHAR2(10) DEFAULT 'AM7';
ALTER TABLE TS_INS_SERVICE ADD SCHEDULE_GROUP_MONTH VARCHAR2(10) DEFAULT 'AM7';
ALTER TABLE TS_INS_SERVICE ADD SCHEDULE_GROUP_QUARTER VARCHAR2(10) DEFAULT 'AM7';

-- 1-2. 코멘트 추가
COMMENT ON COLUMN TS_INS_SERVICE.SCHEDULE_GROUP_WEEK IS '주간리포트 알림톡 발송 시간대 그룹 (AM7:오전7시, PM2:오후2시)';
COMMENT ON COLUMN TS_INS_SERVICE.SCHEDULE_GROUP_MONTH IS '월간리포트 알림톡 발송 시간대 그룹 (AM7:오전7시, PM2:오후2시)';
COMMENT ON COLUMN TS_INS_SERVICE.SCHEDULE_GROUP_QUARTER IS '분기리포트 알림톡 발송 시간대 그룹 (AM7:오전7시, PM2:오후2시)';

-- ============================================================
-- Part 2: TS_INS_WEEK (ETL 실행 시 스냅샷)
-- ============================================================

-- 2-1. SCHEDULE_GROUP 컬럼 추가 (주간/월간/분기 공통)
ALTER TABLE TS_INS_WEEK ADD SCHEDULE_GROUP VARCHAR2(10) DEFAULT 'AM7';

-- 2-2. 코멘트 추가
COMMENT ON COLUMN TS_INS_WEEK.SCHEDULE_GROUP IS 'ETL 실행 시점의 알림톡 발송 시간대 그룹 (AM7:오전7시, PM2:오후2시)';

-- ============================================================
-- Part 3: 확인 쿼리
-- ============================================================

-- 3-1. TS_INS_SERVICE 스케줄 그룹 설정 확인
SELECT FARM_NO, INSPIG_YN,
       SCHEDULE_GROUP_WEEK, SCHEDULE_GROUP_MONTH, SCHEDULE_GROUP_QUARTER,
       INSPIG_FROM_DT, INSPIG_TO_DT
FROM TS_INS_SERVICE
WHERE USE_YN = 'Y';

-- 3-2. TS_INS_WEEK 스케줄 그룹 저장 확인
SELECT FARM_NO, REPORT_YEAR, REPORT_WEEK_NO, SCHEDULE_GROUP, STATUS_CD
FROM TS_INS_WEEK
WHERE REPORT_YEAR = TO_NUMBER(TO_CHAR(SYSDATE, 'IYYY'))
ORDER BY FARM_NO, REPORT_WEEK_NO DESC;
