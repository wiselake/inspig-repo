-- ============================================================
-- TS_INS_MGMT 추천학습자료 데이터 INSERT
-- 작성일: 2025-12-26
-- 설명: 독립 테이블 - 외부 사이트 연결 학습자료
-- ============================================================

-- 1. 생산성 확보 포럼 기사
INSERT INTO TS_INS_MGMT (
    SEQ, MGMT_TYPE, SORT_NO, TITLE, CONTENT,
    LINK_URL, LINK_TARGET, POST_FROM, POST_TO, USE_YN, REG_DT
) VALUES (
    SEQ_TS_INS_MGMT.NEXTVAL,
    'RECOMMEND',
    1,
    '''생산성 확보'' 한목소리… 한돈산업 발전방안 포럼 성료',
    NULL,           -- CONTENT (외부 링크이므로 상세내용 불필요)
    'https://www.pignpork.com/news/articleView.html?idxno=17030',
    'DIRECT',                         -- 새 탭에서 직접 열기
    TO_DATE('20251226', 'YYYYMMDD'),  -- POST_FROM
    TO_DATE('20260331', 'YYYYMMDD'),  -- POST_TO
    'Y',                              -- USE_YN
    SYSDATE                           -- REG_DT
);

-- 2. ASF 방역 행정명령
INSERT INTO TS_INS_MGMT (
    SEQ, MGMT_TYPE, SORT_NO, TITLE, CONTENT,
    LINK_URL, LINK_TARGET, POST_FROM, POST_TO, USE_YN, REG_DT
) VALUES (
    SEQ_TS_INS_MGMT.NEXTVAL,
    'RECOMMEND',
    2,
    'ASF 방역을 위한 권역화 방역관리 관련 행정명령(개정)',
    NULL,           -- CONTENT (외부 링크이므로 상세내용 불필요)
    'https://www.pigpeople.net/news/article.html?no=18205',
    'DIRECT',                         -- 새 탭에서 직접 열기
    TO_DATE('20251226', 'YYYYMMDD'),  -- POST_FROM
    TO_DATE('20260331', 'YYYYMMDD'),  -- POST_TO
    'Y',                              -- USE_YN
    SYSDATE                           -- REG_DT
);

COMMIT;

-- ============================================================
-- 확인 쿼리
-- ============================================================
SELECT SEQ, MGMT_TYPE, SORT_NO, TITLE,
       LINK_URL, LINK_TARGET,
       POST_FROM, POST_TO, USE_YN
FROM TS_INS_MGMT
WHERE MGMT_TYPE = 'RECOMMEND'
ORDER BY SORT_NO;
