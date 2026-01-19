-- ============================================================
-- TS_INS_MGMT 박사채널&정보(CHANNEL) 데이터 INSERT
-- 작성일: 2025-12-26
-- 설명: 독립 테이블 - 동영상 포함 학습자료
-- ============================================================

-- 동기화 레규메이트 급여(민근농장밴드에서 25.12.25)
INSERT INTO TS_INS_MGMT (
    SEQ, MGMT_TYPE, SORT_NO, TITLE, CONTENT,
    LINK_URL, LINK_TARGET, VIDEO_URL, POST_FROM, POST_TO, USE_YN, REG_DT
) VALUES (
    SEQ_TS_INS_MGMT.NEXTVAL,
    'CHANNEL',
    1,
    '동기화 레규메이트 급여(민근농장밴드에서 25.12.25)',
    '후보돈 동기화 레규메이트 급여
- 급여방법 : 사료에 혼합급여(18일간 연속)
- 급여량 : 후보돈 두당 사료 2kg/일 기준 20mg/두/일
- 1포(80g) 8두분량
- 급여시작 : 후보돈 선발직후부터 급여 또는 격리사로 이동후 바로 급여

* 레규메이트 급여 종료 3~7일 사이 발정유도를 위해 PG600 투여
  (가능하면 교배 예정일의 5~6일 이전에 투여를 권장합니다)',
    NULL,                           -- LINK_URL
    NULL,                           -- LINK_TARGET
    'https://pigplan.io/download/insitepig/video/KakaoTalk_20251226_122256595.mp4',  -- VIDEO_URL
    TO_DATE('20251226', 'YYYYMMDD'),  -- POST_FROM
    TO_DATE('20260331', 'YYYYMMDD'),  -- POST_TO
    'Y',                            -- USE_YN
    SYSDATE                         -- REG_DT
);

COMMIT;

-- ============================================================
-- 확인 쿼리
-- ============================================================
SELECT SEQ, MGMT_TYPE, SORT_NO, TITLE,
       SUBSTR(CONTENT, 1, 50) || '...' AS CONTENT_PREVIEW,
       VIDEO_URL,
       POST_FROM, POST_TO, USE_YN
FROM TS_INS_MGMT
WHERE MGMT_TYPE = 'CHANNEL'
ORDER BY SORT_NO;
