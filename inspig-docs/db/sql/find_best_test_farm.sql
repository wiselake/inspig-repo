-- ============================================================
-- 테스트 농가로 사용할 수 있는 데이터가 풍부한 농장 찾기
--
-- 조건:
-- 1. TS_INS_WEEK의 각 필드에 0이 아닌 값이 가장 많은 농장
-- 2. TS_INS_WEEK_SUB의 데이터가 가장 많은 농장
-- 3. 최신 주차(2025년 52주차 또는 2026년 1주차) 기준
-- ============================================================

-- 1. 최신 MASTER_SEQ 확인
SELECT SEQ, DAY_GB, REPORT_YEAR, REPORT_WEEK_NO, DT_FROM, DT_TO, STATUS_CD, TARGET_CNT, COMPLETE_CNT
FROM TS_INS_MASTER
WHERE DAY_GB = 'WEEK'
  AND STATUS_CD = 'COMPLETE'
ORDER BY REPORT_YEAR DESC, REPORT_WEEK_NO DESC
FETCH FIRST 5 ROWS ONLY;

-- 2. TS_INS_WEEK: 필드별 0이 아닌 값 개수 기준으로 농장 순위
WITH latest_master AS (
    SELECT SEQ
    FROM TS_INS_MASTER
    WHERE DAY_GB = 'WEEK' AND STATUS_CD = 'COMPLETE'
    ORDER BY REPORT_YEAR DESC, REPORT_WEEK_NO DESC
    FETCH FIRST 1 ROW ONLY
),
farm_scores AS (
    SELECT
        W.FARM_NO,
        W.FARM_NM,
        W.REPORT_YEAR,
        W.REPORT_WEEK_NO,
        -- 모돈 현황 (6개)
        CASE WHEN NVL(W.MODON_REG_CNT, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.MODON_REG_CHG, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.MODON_SANGSI_CNT, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.MODON_SANGSI_CHG, 0) <> 0 THEN 1 ELSE 0 END AS modon_score,
        -- 관리대상 (6개)
        CASE WHEN NVL(W.ALERT_TOTAL, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.ALERT_HUBO, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.ALERT_EU_MI, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.ALERT_SG_MI, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.ALERT_BM_DELAY, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.ALERT_EU_DELAY, 0) <> 0 THEN 1 ELSE 0 END AS alert_score,
        -- 교배 (2개)
        CASE WHEN NVL(W.LAST_GB_CNT, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_GB_SUM, 0) <> 0 THEN 1 ELSE 0 END AS gb_score,
        -- 분만 (12개)
        CASE WHEN NVL(W.LAST_BM_CNT, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_BM_TOTAL, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_BM_LIVE, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_BM_DEAD, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_BM_MUMMY, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_BM_SUM_CNT, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_BM_SUM_TOTAL, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_BM_SUM_LIVE, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_BM_AVG_TOTAL, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_BM_AVG_LIVE, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_BM_SUM_AVG_TOTAL, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_BM_SUM_AVG_LIVE, 0) <> 0 THEN 1 ELSE 0 END AS bm_score,
        -- 이유 (9개)
        CASE WHEN NVL(W.LAST_EU_CNT, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_EU_JD_CNT, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_EU_AVG_JD, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_EU_AVG_KG, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_EU_SUM_CNT, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_EU_SUM_JD, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_EU_SUM_AVG_JD, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_EU_CHG_JD, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_EU_CHG_KG, 0) <> 0 THEN 1 ELSE 0 END AS eu_score,
        -- 사고 (4개)
        CASE WHEN NVL(W.LAST_SG_CNT, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_SG_AVG_GYUNGIL, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_SG_SUM, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_SG_SUM_AVG_GYUNGIL, 0) <> 0 THEN 1 ELSE 0 END AS sg_score,
        -- 도태 (2개)
        CASE WHEN NVL(W.LAST_CL_CNT, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_CL_SUM, 0) <> 0 THEN 1 ELSE 0 END AS cl_score,
        -- 출하 (4개)
        CASE WHEN NVL(W.LAST_SH_CNT, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_SH_AVG_KG, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_SH_SUM, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_SH_AVG_SUM, 0) <> 0 THEN 1 ELSE 0 END AS sh_score,
        -- 금주 예정 (6개)
        CASE WHEN NVL(W.THIS_GB_SUM, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.THIS_IMSIN_SUM, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.THIS_BM_SUM, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.THIS_EU_SUM, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.THIS_VACCINE_SUM, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.THIS_SHIP_SUM, 0) <> 0 THEN 1 ELSE 0 END AS this_score,
        -- KPI (2개)
        CASE WHEN NVL(W.KPI_PSY, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.KPI_DELAY_DAY, 0) <> 0 THEN 1 ELSE 0 END AS kpi_score,
        -- 모돈 수 (참고용)
        W.MODON_REG_CNT,
        W.MODON_SANGSI_CNT
    FROM TS_INS_WEEK W
    WHERE W.MASTER_SEQ = (SELECT SEQ FROM latest_master)
      AND W.STATUS_CD = 'COMPLETE'
)
SELECT
    FARM_NO,
    FARM_NM,
    REPORT_YEAR || '년 ' || REPORT_WEEK_NO || '주차' AS PERIOD,
    MODON_REG_CNT AS "등록모돈",
    MODON_SANGSI_CNT AS "상시모돈",
    modon_score AS "모돈(4)",
    alert_score AS "관리대상(6)",
    gb_score AS "교배(2)",
    bm_score AS "분만(12)",
    eu_score AS "이유(9)",
    sg_score AS "사고(4)",
    cl_score AS "도태(2)",
    sh_score AS "출하(4)",
    this_score AS "금주예정(6)",
    kpi_score AS "KPI(2)",
    (modon_score + alert_score + gb_score + bm_score + eu_score +
     sg_score + cl_score + sh_score + this_score + kpi_score) AS "총점(51)"
FROM farm_scores
ORDER BY
    (modon_score + alert_score + gb_score + bm_score + eu_score +
     sg_score + cl_score + sh_score + this_score + kpi_score) DESC,
    MODON_REG_CNT DESC
FETCH FIRST 20 ROWS ONLY;


-- 3. TS_INS_WEEK_SUB: 각 농장별 GUBUN별 데이터 건수
WITH latest_master AS (
    SELECT SEQ
    FROM TS_INS_MASTER
    WHERE DAY_GB = 'WEEK' AND STATUS_CD = 'COMPLETE'
    ORDER BY REPORT_YEAR DESC, REPORT_WEEK_NO DESC
    FETCH FIRST 1 ROW ONLY
)
SELECT
    S.FARM_NO,
    W.FARM_NM,
    W.MODON_REG_CNT AS "등록모돈",
    SUM(CASE WHEN S.GUBUN = 'MODON' THEN 1 ELSE 0 END) AS "MODON",
    SUM(CASE WHEN S.GUBUN = 'ALERT' THEN 1 ELSE 0 END) AS "ALERT",
    SUM(CASE WHEN S.GUBUN = 'GB' THEN 1 ELSE 0 END) AS "GB",
    SUM(CASE WHEN S.GUBUN = 'BM' THEN 1 ELSE 0 END) AS "BM",
    SUM(CASE WHEN S.GUBUN = 'EU' THEN 1 ELSE 0 END) AS "EU",
    SUM(CASE WHEN S.GUBUN = 'SG' THEN 1 ELSE 0 END) AS "SG",
    SUM(CASE WHEN S.GUBUN = 'DOPE' THEN 1 ELSE 0 END) AS "DOPE",
    SUM(CASE WHEN S.GUBUN = 'SHIP' THEN 1 ELSE 0 END) AS "SHIP",
    SUM(CASE WHEN S.GUBUN = 'SCHEDULE' THEN 1 ELSE 0 END) AS "SCHEDULE",
    COUNT(*) AS "총건수"
FROM TS_INS_WEEK_SUB S
INNER JOIN TS_INS_WEEK W ON S.MASTER_SEQ = W.MASTER_SEQ AND S.FARM_NO = W.FARM_NO
WHERE S.MASTER_SEQ = (SELECT SEQ FROM latest_master)
GROUP BY S.FARM_NO, W.FARM_NM, W.MODON_REG_CNT
ORDER BY COUNT(*) DESC, W.MODON_REG_CNT DESC
FETCH FIRST 20 ROWS ONLY;


-- 4. 종합 점수 (TS_INS_WEEK 점수 + TS_INS_WEEK_SUB 건수)
WITH latest_master AS (
    SELECT SEQ
    FROM TS_INS_MASTER
    WHERE DAY_GB = 'WEEK' AND STATUS_CD = 'COMPLETE'
    ORDER BY REPORT_YEAR DESC, REPORT_WEEK_NO DESC
    FETCH FIRST 1 ROW ONLY
),
week_scores AS (
    SELECT
        W.FARM_NO,
        W.FARM_NM,
        W.MODON_REG_CNT,
        -- 모든 필드 점수 합계
        CASE WHEN NVL(W.MODON_REG_CNT, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.MODON_SANGSI_CNT, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.ALERT_TOTAL, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_GB_CNT, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_BM_CNT, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_EU_CNT, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_SG_CNT, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_CL_CNT, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.LAST_SH_CNT, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.THIS_GB_SUM, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.THIS_BM_SUM, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.THIS_EU_SUM, 0) <> 0 THEN 1 ELSE 0 END +
        CASE WHEN NVL(W.KPI_PSY, 0) <> 0 THEN 1 ELSE 0 END AS week_score
    FROM TS_INS_WEEK W
    WHERE W.MASTER_SEQ = (SELECT SEQ FROM latest_master)
      AND W.STATUS_CD = 'COMPLETE'
),
sub_counts AS (
    SELECT
        FARM_NO,
        COUNT(*) AS sub_cnt,
        COUNT(DISTINCT GUBUN) AS gubun_cnt
    FROM TS_INS_WEEK_SUB
    WHERE MASTER_SEQ = (SELECT SEQ FROM latest_master)
    GROUP BY FARM_NO
)
SELECT
    W.FARM_NO,
    W.FARM_NM,
    W.MODON_REG_CNT AS "등록모돈",
    W.week_score AS "WEEK점수",
    NVL(S.sub_cnt, 0) AS "SUB건수",
    NVL(S.gubun_cnt, 0) AS "GUBUN종류",
    W.week_score + NVL(S.gubun_cnt, 0) * 2 AS "종합점수"
FROM week_scores W
LEFT JOIN sub_counts S ON W.FARM_NO = S.FARM_NO
ORDER BY W.week_score + NVL(S.gubun_cnt, 0) * 2 DESC, W.MODON_REG_CNT DESC
FETCH FIRST 10 ROWS ONLY;


-- 5. 추천 테스트 농가 상세 정보 (상위 3개 농장)
-- 위 쿼리 실행 후 FARM_NO를 확인하고 아래 쿼리의 IN 절에 입력
/*
SELECT
    FARM_NO,
    FARM_NM,
    REPORT_YEAR,
    REPORT_WEEK_NO,
    DT_FROM,
    DT_TO,
    MODON_REG_CNT,
    MODON_SANGSI_CNT,
    ALERT_TOTAL,
    LAST_GB_CNT,
    LAST_BM_CNT,
    LAST_BM_TOTAL,
    LAST_BM_LIVE,
    LAST_EU_CNT,
    LAST_EU_JD_CNT,
    LAST_SG_CNT,
    LAST_CL_CNT,
    LAST_SH_CNT,
    THIS_GB_SUM,
    THIS_BM_SUM,
    THIS_EU_SUM,
    KPI_PSY,
    SHARE_TOKEN
FROM TS_INS_WEEK
WHERE MASTER_SEQ = (
    SELECT SEQ FROM TS_INS_MASTER
    WHERE DAY_GB = 'WEEK' AND STATUS_CD = 'COMPLETE'
    ORDER BY REPORT_YEAR DESC, REPORT_WEEK_NO DESC
    FETCH FIRST 1 ROW ONLY
)
AND FARM_NO IN (여기에_상위3개_FARM_NO_입력)
ORDER BY FARM_NO;
*/
