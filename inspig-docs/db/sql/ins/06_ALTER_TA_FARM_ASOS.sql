-- ============================================================
-- TA_FARM 테이블 ASOS 관측소 매핑 컬럼 (이미 적용됨)
-- ASOS 일자료 수집 시 농장별 관측소 캐싱용
--
-- 용도:
--   - 매번 Haversine 계산 없이 캐싱된 관측소ID 사용
--   - ASOS 수집 시 중복 격자 제거 후 관측소별 1회 호출
--
-- 주의사항:
--   - 이 DDL은 TA_FARM 테이블에 이미 적용되어 있음
--   - WEATHER_NX, WEATHER_NY 컬럼은 나중에 삭제 예정 (WEATHER_NX_N, WEATHER_NY_N 사용)
-- ============================================================

-- 1. TA_FARM ASOS 관련 컬럼 (이미 존재)
-- ASOS_STN_ID     INTEGER              -- ASOS 관측소 지점번호 (FK → TM_WEATHER_ASOS)
-- ASOS_STN_NM     VARCHAR2(50 BYTE)    -- ASOS 관측소명 (조회 편의용)
-- ASOS_DIST_KM    NUMBER(6,2)          -- 농장에서 관측소까지 거리 (km)

-- 2. 인덱스 (이미 존재)
-- IDX_TA_FARM_01 ON TA_FARM(ASOS_STN_ID)

-- ============================================================
-- 초기 데이터 업데이트 (Python ETL에서 실행)
-- Haversine 공식으로 가장 가까운 관측소 계산 후 UPDATE
-- weather_etl.py --update-asos 옵션으로 실행
-- ============================================================

-- 확인 쿼리: ASOS 매핑된 농장
SELECT
    FARM_NO,
    FARM_NM,
    WEATHER_NX_N,
    WEATHER_NY_N,
    ASOS_STN_ID,
    ASOS_STN_NM,
    ASOS_DIST_KM
FROM TA_FARM
WHERE USE_YN = 'Y'
  AND ASOS_STN_ID IS NOT NULL
ORDER BY FARM_NO
FETCH FIRST 10 ROWS ONLY;

-- 확인 쿼리: ASOS 매핑 필요한 농장
SELECT COUNT(*) AS NEED_MAPPING_CNT
FROM TA_FARM
WHERE USE_YN = 'Y'
  AND MAP_X_N IS NOT NULL
  AND MAP_Y_N IS NOT NULL
  AND ASOS_STN_ID IS NULL;

-- ============================================================
-- 향후 삭제 예정 컬럼 (deprecate)
-- WEATHER_NX, WEATHER_NY -> WEATHER_NX_N, WEATHER_NY_N 사용
-- ============================================================
-- ALTER TABLE TA_FARM DROP COLUMN WEATHER_NX;
-- ALTER TABLE TA_FARM DROP COLUMN WEATHER_NY;
