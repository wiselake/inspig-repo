-- ============================================================
-- TL_ATTACH_FILE_NEW: 범용 파일 첨부 테이블
-- 작성일: 2025-12-26
-- 설명: 여러 테이블에서 공용으로 사용하는 파일 첨부 관리
--       REF_TABLE + REF_SEQ로 어느 테이블의 어느 레코드인지 식별
--       (기존 TL_ATTACH_FILE과 충돌 방지를 위해 _NEW 접미사 사용)
-- ============================================================

-- 기존 테이블 삭제 (필요시)
/*
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE TL_ATTACH_FILE_NEW CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_TL_ATTACH_FILE_NEW';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/
*/

-- ============================================================
-- 테이블 생성
-- ============================================================
CREATE TABLE TL_ATTACH_FILE_NEW (
    FILE_SEQ        NUMBER NOT NULL,                    -- 파일 일련번호 (PK)

    -- 참조 정보 (어느 테이블의 어느 레코드?)
    REF_TABLE       VARCHAR2(50) NOT NULL,              -- 참조 테이블명 (TS_INS_MGMT, TS_BOARD 등)
    REF_SEQ         NUMBER NOT NULL,                    -- 참조 테이블의 PK (SEQ)
    REF_TYPE        VARCHAR2(20) DEFAULT 'ATTACH',      -- 파일 유형 (ATTACH:첨부, IMAGE:이미지, VIDEO:동영상)

    -- 파일 정보
    FILE_NM         VARCHAR2(200) NOT NULL,             -- 저장 파일명 (UUID 등 서버에 저장된 이름)
    FILE_ORGNL_NM   VARCHAR2(200) NOT NULL,             -- 원본 파일명 (사용자가 업로드한 이름)
    FILE_PATH       VARCHAR2(500),                      -- 저장 경로 (/upload/mgmt/2025/12/)
    FILE_URL        VARCHAR2(500),                      -- 접근 URL (https://pigplan.io/download/...)
    FILE_SIZE       NUMBER DEFAULT 0,                   -- 파일 크기 (bytes)
    FILE_EXT        VARCHAR2(20),                       -- 파일 확장자 (pdf, docx, jpg 등)
    MIME_TYPE       VARCHAR2(100),                      -- MIME 타입 (application/pdf 등)

    -- 정렬 및 관리
    SORT_NO         INTEGER DEFAULT 0,                  -- 정렬순서
    DOWN_CNT        NUMBER DEFAULT 0,                   -- 다운로드 횟수
    USE_YN          CHAR(1) DEFAULT 'Y',                -- 사용여부

    -- 등록/수정 정보
    REG_ID          VARCHAR2(40),                       -- 등록자 ID
    REG_DT          DATE DEFAULT SYSDATE,               -- 등록일시
    UPD_ID          VARCHAR2(40),                       -- 수정자 ID
    UPD_DT          DATE,                               -- 수정일시

    CONSTRAINT PK_TL_ATTACH_FILE_NEW PRIMARY KEY (FILE_SEQ)
)
TABLESPACE PIGXE_DATA;

-- ============================================================
-- 시퀀스 생성
-- ============================================================
CREATE SEQUENCE SEQ_TL_ATTACH_FILE_NEW START WITH 1 INCREMENT BY 1 NOCACHE;

-- ============================================================
-- 인덱스 생성
-- ============================================================
-- 참조 테이블 + 참조 SEQ로 조회 (가장 많이 사용)
CREATE INDEX IDX_TL_ATTACH_FILE_NEW_01 ON TL_ATTACH_FILE_NEW(REF_TABLE, REF_SEQ, USE_YN) TABLESPACE PIGXE_IDX;

-- 참조 테이블별 조회
CREATE INDEX IDX_TL_ATTACH_FILE_NEW_02 ON TL_ATTACH_FILE_NEW(REF_TABLE, REG_DT) TABLESPACE PIGXE_IDX;

-- ============================================================
-- 코멘트
-- ============================================================
COMMENT ON TABLE TL_ATTACH_FILE_NEW IS '범용 파일 첨부 테이블 - 여러 테이블에서 공용 사용';

COMMENT ON COLUMN TL_ATTACH_FILE_NEW.FILE_SEQ IS '파일 일련번호 (PK)';
COMMENT ON COLUMN TL_ATTACH_FILE_NEW.REF_TABLE IS '참조 테이블명 (TS_INS_MGMT, TS_BOARD 등)';
COMMENT ON COLUMN TL_ATTACH_FILE_NEW.REF_SEQ IS '참조 테이블의 PK';
COMMENT ON COLUMN TL_ATTACH_FILE_NEW.REF_TYPE IS '파일 유형 (ATTACH:첨부, IMAGE:이미지, VIDEO:동영상)';
COMMENT ON COLUMN TL_ATTACH_FILE_NEW.FILE_NM IS '저장 파일명 (서버에 저장된 이름)';
COMMENT ON COLUMN TL_ATTACH_FILE_NEW.FILE_ORGNL_NM IS '원본 파일명 (사용자가 업로드한 이름)';
COMMENT ON COLUMN TL_ATTACH_FILE_NEW.FILE_PATH IS '저장 경로';
COMMENT ON COLUMN TL_ATTACH_FILE_NEW.FILE_URL IS '접근 URL';
COMMENT ON COLUMN TL_ATTACH_FILE_NEW.FILE_SIZE IS '파일 크기 (bytes)';
COMMENT ON COLUMN TL_ATTACH_FILE_NEW.FILE_EXT IS '파일 확장자';
COMMENT ON COLUMN TL_ATTACH_FILE_NEW.MIME_TYPE IS 'MIME 타입';
COMMENT ON COLUMN TL_ATTACH_FILE_NEW.SORT_NO IS '정렬순서';
COMMENT ON COLUMN TL_ATTACH_FILE_NEW.DOWN_CNT IS '다운로드 횟수';
COMMENT ON COLUMN TL_ATTACH_FILE_NEW.USE_YN IS '사용여부 (Y/N)';
COMMENT ON COLUMN TL_ATTACH_FILE_NEW.REG_ID IS '등록자 ID';
COMMENT ON COLUMN TL_ATTACH_FILE_NEW.REG_DT IS '등록일시';
COMMENT ON COLUMN TL_ATTACH_FILE_NEW.UPD_ID IS '수정자 ID';
COMMENT ON COLUMN TL_ATTACH_FILE_NEW.UPD_DT IS '수정일시';

-- ============================================================
-- 샘플 데이터 (TS_INS_MGMT SEQ=6에 첨부파일 추가)
-- ============================================================
/*
INSERT INTO TL_ATTACH_FILE_NEW (
    FILE_SEQ, REF_TABLE, REF_SEQ, REF_TYPE,
    FILE_NM, FILE_ORGNL_NM, FILE_PATH, FILE_URL,
    FILE_SIZE, FILE_EXT, MIME_TYPE, SORT_NO
) VALUES (
    SEQ_TL_ATTACH_FILE_NEW.NEXTVAL,
    'TS_INS_MGMT',           -- 관리포인트 테이블
    6,                        -- TS_INS_MGMT.SEQ = 6 (동기화 레규메이트 급여)
    'ATTACH',                 -- 첨부파일
    'regulmate_guide_20251226.pdf',                    -- 저장 파일명
    '레규메이트 급여 가이드.pdf',                        -- 원본 파일명
    '/upload/mgmt/2025/12/',                           -- 저장 경로
    'https://pigplan.io/download/insitepig/attach/regulmate_guide_20251226.pdf',
    1024000,                  -- 1MB
    'pdf',
    'application/pdf',
    1
);
COMMIT;
*/

-- ============================================================
-- 조회 쿼리 예시
-- ============================================================
-- TS_INS_MGMT SEQ=6의 첨부파일 조회
/*
SELECT F.FILE_SEQ, F.FILE_ORGNL_NM, F.FILE_URL, F.FILE_SIZE, F.FILE_EXT
FROM TL_ATTACH_FILE_NEW F
WHERE F.REF_TABLE = 'TS_INS_MGMT'
  AND F.REF_SEQ = 6
  AND F.USE_YN = 'Y'
ORDER BY F.SORT_NO;
*/

-- ============================================================
-- 테이블 생성 확인
-- ============================================================
SELECT TABLE_NAME, NUM_ROWS
FROM USER_TABLES
WHERE TABLE_NAME = 'TL_ATTACH_FILE_NEW';

SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH, NULLABLE
FROM USER_TAB_COLUMNS
WHERE TABLE_NAME = 'TL_ATTACH_FILE_NEW'
ORDER BY COLUMN_ID;
