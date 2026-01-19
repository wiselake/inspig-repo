/**
 * 공유 토큰 관련 SQL 쿼리 모음
 * 
 * 역할: 토큰 검증 및 PK(MASTER_SEQ, FARM_NO) 추출만 담당
 * 리포트 상세 조회는 weekly.sql.ts의 getReportDetail 사용
 * 
 * SQL ID 형식: 서비스.SQL파일.쿼리ID : 설명
 * 파라미터: named parameter (:paramName) - dataSource.query()에 객체로 전달
 */
export const SHARE_TOKEN_SQL = {
  /**
   * 토큰 검증 및 PK 추출 (만료일 포함)
   * @param shareToken - 공유 토큰 (64자 SHA256)
   * @returns MASTER_SEQ, FARM_NO, TOKEN_EXPIRE_DT, STATUS_CD
   */
  validateToken: `
    /* auth.share-token.validateToken : 토큰 검증 및 PK 추출 */
    SELECT
        W.MASTER_SEQ,
        W.FARM_NO,
        W.SHARE_TOKEN,
        W.TOKEN_EXPIRE_DT,
        W.STATUS_CD
    FROM TS_INS_WEEK W
    WHERE W.SHARE_TOKEN = :shareToken
      AND W.STATUS_CD = 'COMPLETE'
  `,

  /**
   * 토큰 생성 (SHA256 해시)
   * @param expireDays - 만료일 (일수, 기본 7일)
   * @param masterSeq - 마스터 SEQ
   * @param farmNo - 농장번호
   */
  generateToken: `
    /* auth.share-token.generateToken : 공유 토큰 생성 */
    UPDATE TS_INS_WEEK W
    SET W.SHARE_TOKEN = STANDARD_HASH(
          W.FARM_NO || '-' || W.MASTER_SEQ || '-' || TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS'),
          'SHA256'
        ),
        W.TOKEN_EXPIRE_DT = TO_CHAR(SYSDATE + 9/24 + :expireDays, 'YYYYMMDD')  /* KST 기준 */
    WHERE W.MASTER_SEQ = :masterSeq
      AND W.FARM_NO = :farmNo
  `,

  /**
   * 리포트의 기존 토큰 조회
   * @param masterSeq - 마스터 SEQ
   * @param farmNo - 농장번호
   */
  getTokenByReport: `
    /* auth.share-token.getTokenByReport : 기존 토큰 조회 */
    SELECT
        W.SHARE_TOKEN,
        W.TOKEN_EXPIRE_DT
    FROM TS_INS_WEEK W
    WHERE W.MASTER_SEQ = :masterSeq
      AND W.FARM_NO = :farmNo
  `,
};
