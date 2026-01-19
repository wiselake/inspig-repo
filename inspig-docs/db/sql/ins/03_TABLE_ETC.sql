-- ============================================================
-- 공통/ETC 테이블 DDL 스크립트
-- INS 및 공통으로 사용되는 부가 테이블
--
-- 실행 순서: 02_TABLE.sql 실행 후 실행
-- 대상 Oracle: 19c
-- ============================================================

-- ============================================================
-- 2. TS_PSY_DELAY_HEATMAP: PSY 히트맵 테이블
--    - 농장별 PSY/입력지연일 분포 히트맵
--    - 전체 농장 대시보드 및 비교 분석용
-- ============================================================
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE TS_PSY_DELAY_HEATMAP CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

CREATE TABLE TS_PSY_DELAY_HEATMAP (
    MASTER_SEQ      NUMBER NOT NULL,                    -- FK → TS_INS_MASTER.SEQ
    X_POS           INTEGER NOT NULL,                   -- X좌표 (0~3: 입력지연일 구간)
    Y_POS           INTEGER NOT NULL,                   -- Y좌표 (0~3: PSY 구간)
    ZONE_CD         VARCHAR2(10),                       -- 구간코드 (1A~4D)
    FARM_CNT        INTEGER DEFAULT 0,                  -- 해당 구간 농장수
    LOG_INS_DT      DATE DEFAULT SYSDATE,              -- 생성일 (UTC)

    CONSTRAINT PK_TS_PSY_DELAY_HEATMAP PRIMARY KEY (MASTER_SEQ, X_POS, Y_POS),
    CONSTRAINT FK_TS_PSY_DELAY_HEATMAP FOREIGN KEY (MASTER_SEQ)
        REFERENCES TS_INS_MASTER(SEQ) ON DELETE CASCADE
)
TABLESPACE PIGXE_DATA;

COMMENT ON TABLE TS_PSY_DELAY_HEATMAP IS 'PSY 히트맵 테이블';
COMMENT ON COLUMN TS_PSY_DELAY_HEATMAP.MASTER_SEQ IS '마스터 일련번호 (FK)';
COMMENT ON COLUMN TS_PSY_DELAY_HEATMAP.X_POS IS 'X좌표 (0~3: 입력지연일 구간)';
COMMENT ON COLUMN TS_PSY_DELAY_HEATMAP.Y_POS IS 'Y좌표 (0~3: PSY 구간)';
COMMENT ON COLUMN TS_PSY_DELAY_HEATMAP.ZONE_CD IS '구간코드 (1A~4D)';
COMMENT ON COLUMN TS_PSY_DELAY_HEATMAP.FARM_CNT IS '해당 구간 농장수';

