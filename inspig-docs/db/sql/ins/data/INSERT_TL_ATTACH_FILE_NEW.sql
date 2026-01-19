-- ============================================================
-- TL_ATTACH_FILE_NEW 첨부파일 데이터 INSERT
-- 작성일: 2025-12-26
-- 설명: TS_INS_MGMT 관리포인트 첨부파일
-- ============================================================

-- [주의] REF_SEQ는 TS_INS_MGMT.SEQ 값을 확인 후 입력해야 함
-- SELECT SEQ FROM TS_INS_MGMT WHERE TITLE = '한돈산업의 과제진단 2026년 목표';

-- 한돈산업과제와26년목표(안기홍월간한돈25.12월호).pdf
INSERT INTO TL_ATTACH_FILE_NEW (
    FILE_SEQ,
    REF_TABLE,
    REF_SEQ,
    REF_TYPE,
    FILE_NM,
    FILE_ORGNL_NM,
    FILE_PATH,
    FILE_URL,
    FILE_SIZE,
    FILE_EXT,
    MIME_TYPE,
    SORT_NO,
    REG_DT
) VALUES (
    SEQ_TL_ATTACH_FILE_NEW.NEXTVAL,
    'TS_INS_MGMT',                      -- 참조 테이블
    (SELECT SEQ FROM TS_INS_MGMT WHERE TITLE = '한돈산업의 과제진단 2026년 목표' AND ROWNUM = 1),  -- 참조 SEQ
    'ATTACH',                           -- 첨부파일
    '20251226-001.pdf',                 -- 저장 파일명
    '한돈산업과제와26년목표(안기홍월간한돈25.12월호).pdf',  -- 원본 파일명
    '/download/insitepig/file/',        -- 저장 경로
    'https://pigplan.io/download/insitepig/file/20251226-001.pdf',  -- 다운로드 URL
    1279590,                            -- 파일 크기 (1.22MB)
    'pdf',                              -- 확장자
    'application/pdf',                  -- MIME 타입
    1,                                  -- 정렬순서
    SYSDATE
);

COMMIT;

-- ============================================================
-- 확인 쿼리
-- ============================================================
-- TS_INS_MGMT 데이터 확인
SELECT M.SEQ, M.MGMT_TYPE, M.TITLE,
       (SELECT COUNT(*) FROM TL_ATTACH_FILE_NEW F
        WHERE F.REF_TABLE = 'TS_INS_MGMT' AND F.REF_SEQ = M.SEQ AND F.USE_YN = 'Y') AS FILE_CNT
FROM TS_INS_MGMT M
WHERE M.MGMT_TYPE IN ('QUIZ', 'HIGHLIGHT')
ORDER BY M.MGMT_TYPE, M.SORT_NO;

-- 첨부파일 확인
SELECT F.FILE_SEQ, F.REF_TABLE, F.REF_SEQ, F.FILE_ORGNL_NM, F.FILE_URL
FROM TL_ATTACH_FILE_NEW F
WHERE F.REF_TABLE = 'TS_INS_MGMT'
ORDER BY F.REF_SEQ, F.SORT_NO;
