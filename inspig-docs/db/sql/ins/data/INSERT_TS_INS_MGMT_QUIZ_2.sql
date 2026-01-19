-- ============================================================
-- TS_INS_MGMT 피그플랜 퀴즈&정보 (QUIZ) 데이터 INSERT #2
-- 작성일: 2025-12-26
-- 설명: 한돈산업의 과제진단 2026년 목표
-- ============================================================

-- 한돈산업의 과제진단 2026년 목표 (첨부파일 있음)
INSERT INTO TS_INS_MGMT (
    SEQ, MGMT_TYPE, SORT_NO, TITLE, CONTENT,
    LINK_URL, LINK_TARGET, VIDEO_URL, POST_FROM, POST_TO, USE_YN, REG_DT
) VALUES (
    SEQ_TS_INS_MGMT.NEXTVAL,
    'QUIZ',
    2,
    '한돈산업의 과제진단 2026년 목표',
    NULL,                               -- CONTENT (첨부파일로 대체)
    NULL,                               -- LINK_URL
    NULL,                               -- LINK_TARGET
    NULL,                               -- VIDEO_URL
    TO_DATE('20251226', 'YYYYMMDD'),    -- POST_FROM
    TO_DATE('20260331', 'YYYYMMDD'),    -- POST_TO
    'Y',                                -- USE_YN
    SYSDATE                             -- REG_DT
);

COMMIT;

-- ============================================================
-- 방금 INSERT한 SEQ 확인 후 첨부파일 등록
-- ============================================================
-- 현재 SEQ 확인
SELECT SEQ, MGMT_TYPE, TITLE FROM TS_INS_MGMT
WHERE TITLE = '한돈산업의 과제진단 2026년 목표';

-- 첨부파일 등록 (SEQ 확인 후 REF_SEQ에 입력)
-- INSERT INTO TL_ATTACH_FILE_NEW (...) VALUES (..., 'TS_INS_MGMT', [위에서 확인한 SEQ], ...);
