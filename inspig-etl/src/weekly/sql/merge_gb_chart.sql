-- GB/CHART 데이터 마이그레이션: 8 ROW → 1 ROW
-- 기존 형식: SORT_NO=1~8, CODE_1=레이블, CNT_1=값
-- 신규 형식: SORT_NO=1, CNT_1~CNT_8=값

-- 1. 기존 8개 ROW를 1개 ROW로 MERGE
MERGE INTO TS_INS_WEEK_SUB tgt
USING (
    SELECT
        MASTER_SEQ,
        FARM_NO,
        'GB' AS GUBUN,
        'CHART' AS SUB_GUBUN,
        1 AS SORT_NO,
        MAX(CASE WHEN SORT_NO = 1 THEN CNT_1 ELSE 0 END) AS CNT_1,  -- ~3일
        MAX(CASE WHEN SORT_NO = 2 THEN CNT_1 ELSE 0 END) AS CNT_2,  -- 4일
        MAX(CASE WHEN SORT_NO = 3 THEN CNT_1 ELSE 0 END) AS CNT_3,  -- 5일
        MAX(CASE WHEN SORT_NO = 4 THEN CNT_1 ELSE 0 END) AS CNT_4,  -- 6일
        MAX(CASE WHEN SORT_NO = 5 THEN CNT_1 ELSE 0 END) AS CNT_5,  -- 7일
        MAX(CASE WHEN SORT_NO = 6 THEN CNT_1 ELSE 0 END) AS CNT_6,  -- 8일
        MAX(CASE WHEN SORT_NO = 7 THEN CNT_1 ELSE 0 END) AS CNT_7,  -- 9일
        MAX(CASE WHEN SORT_NO = 8 THEN CNT_1 ELSE 0 END) AS CNT_8   -- 10일↑
    FROM TS_INS_WEEK_SUB
    WHERE GUBUN = 'GB' AND SUB_GUBUN = 'CHART'
      AND SORT_NO BETWEEN 1 AND 8
    GROUP BY MASTER_SEQ, FARM_NO
) src
ON (
    tgt.MASTER_SEQ = src.MASTER_SEQ
    AND tgt.FARM_NO = src.FARM_NO
    AND tgt.GUBUN = src.GUBUN
    AND tgt.SUB_GUBUN = src.SUB_GUBUN
    AND tgt.SORT_NO = src.SORT_NO
)
WHEN MATCHED THEN
    UPDATE SET
        tgt.CNT_1 = src.CNT_1,
        tgt.CNT_2 = src.CNT_2,
        tgt.CNT_3 = src.CNT_3,
        tgt.CNT_4 = src.CNT_4,
        tgt.CNT_5 = src.CNT_5,
        tgt.CNT_6 = src.CNT_6,
        tgt.CNT_7 = src.CNT_7,
        tgt.CNT_8 = src.CNT_8,
        tgt.CODE_1 = NULL,
        tgt.CODE_2 = NULL
WHEN NOT MATCHED THEN
    INSERT (
        MASTER_SEQ, FARM_NO, GUBUN, SUB_GUBUN, SORT_NO,
        CNT_1, CNT_2, CNT_3, CNT_4, CNT_5, CNT_6, CNT_7, CNT_8
    ) VALUES (
        src.MASTER_SEQ, src.FARM_NO, src.GUBUN, src.SUB_GUBUN, src.SORT_NO,
        src.CNT_1, src.CNT_2, src.CNT_3, src.CNT_4, src.CNT_5, src.CNT_6, src.CNT_7, src.CNT_8
    );

-- 2. 기존 SORT_NO=2~8 ROW 삭제
DELETE FROM TS_INS_WEEK_SUB
WHERE GUBUN = 'GB' AND SUB_GUBUN = 'CHART' AND SORT_NO > 1;

COMMIT;

-- 검증 쿼리: CHART 데이터가 1 ROW로 정리되었는지 확인
SELECT MASTER_SEQ, FARM_NO, SORT_NO, CNT_1, CNT_2, CNT_3, CNT_4, CNT_5, CNT_6, CNT_7, CNT_8
FROM TS_INS_WEEK_SUB
WHERE GUBUN = 'GB' AND SUB_GUBUN = 'CHART'
ORDER BY MASTER_SEQ, FARM_NO;
