-- ============================================================
-- TS_INS_SERVICE REG_TYPE 컬럼 추가
-- 실행일: 2024-12-22
-- 목적: 정기/수동 ETL 구분을 위한 등록유형 컬럼 추가
-- ============================================================

-- 1. REG_TYPE 컬럼 추가
ALTER TABLE TS_INS_SERVICE ADD REG_TYPE VARCHAR2(10) DEFAULT 'AUTO';

-- 2. 코멘트 추가
COMMENT ON COLUMN TS_INS_SERVICE.REG_TYPE IS '등록유형: AUTO(정기 스케줄 대상), MANUAL(수동 등록)';

-- 3. 기존 데이터 AUTO로 업데이트 (이미 DEFAULT 'AUTO'이므로 필요시에만)
-- UPDATE TS_INS_SERVICE SET REG_TYPE = 'AUTO' WHERE REG_TYPE IS NULL;

-- 4. 확인
SELECT FARM_NO, INSPIG_YN, REG_TYPE, USE_YN FROM TS_INS_SERVICE;
