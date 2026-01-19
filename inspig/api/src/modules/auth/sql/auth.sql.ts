/**
 * 인증 관련 SQL 쿼리 모음
 * SQL ID 형식: 서비스.SQL파일.쿼리ID : 설명
 * 파라미터: named parameter (:paramName) - dataSource.query()에 객체로 전달
 */
export const AUTH_SQL = {
  /**
   * 로그인 (회원 조회)
   * @param memberId - 회원 ID
   * @param password - 비밀번호 (해시)
   */
  login: `
    /* auth.auth.login : 회원 로그인 조회 */
    SELECT
        M.MEMBER_ID,
        M.COMPANY_CD,
        M.SOLE_CD,
        M.AGENT_CD,
        M.FARM_NO,
        M.MEMBER_TYPE,
        M.MEMBER_TYPE_D,
        M.NAME,
        M.POSITION,
        M.EMAIL,
        M.HP_NUM,
        M.USE_YN
    FROM TA_MEMBER M
    WHERE M.MEMBER_ID = :memberId
      AND M.PASSWORD = :password
      AND M.USE_YN = 'Y'
  `,

  /**
   * 농장 정보 조회
   * @param farmNo - 농장번호
   */
  getFarm: `
    /* auth.auth.getFarm : 농장 정보 조회 */
    SELECT
        F.FARM_NO,
        F.FARM_NM,
        F.COMPANY_CD,
        F.SOLE_CD,
        F.AGENT_CD,
        F.COUNTRY_CODE,
        F.USE_YN
    FROM TA_FARM F
    WHERE F.FARM_NO = :farmNo
  `,

  /**
   * 서비스 정보 조회 (인사이트피그 서비스 여부 - 현재 유효한 최신 건)
   * VW_INS_SERVICE_ACTIVE View 사용
   * @param farmNo - 농장번호
   */
  getService: `
    /* auth.auth.getService : 서비스 권한 조회 (View 사용) */
    SELECT
        FARM_NO,
        INSPIG_YN,
        INSPIG_REG_DT,
        INSPIG_FROM_DT,
        INSPIG_TO_DT,
        INSPIG_STOP_DT,
        WEB_PAY_YN,
        SCHEDULE_GROUP_WEEK,
        SCHEDULE_GROUP_MONTH,
        SCHEDULE_GROUP_QUARTER,
        USE_YN
    FROM VW_INS_SERVICE_ACTIVE
    WHERE FARM_NO = :farmNo
  `,

  /**
   * 스케줄 그룹 업데이트
   * VW_INS_SERVICE_ACTIVE가 반환하는 INSPIG_REG_DT를 사용하여 정확한 행 업데이트
   * @param farmNo - 농장번호
   * @param inspigRegDt - 서비스 등록일 (PK)
   * @param scheduleGroupWeek - 주간 스케줄 그룹 (AM7/PM2)
   */
  updateScheduleGroup: `
    /* auth.auth.updateScheduleGroup : 스케줄 그룹 업데이트 */
    UPDATE TS_INS_SERVICE
    SET SCHEDULE_GROUP_WEEK = :scheduleGroupWeek,
        LOG_UPT_DT = SYSDATE
    WHERE FARM_NO = :farmNo
      AND INSPIG_REG_DT = :inspigRegDt
  `,

  /**
   * 마지막 로그인 일시 업데이트
   * @param memberId - 회원 ID
   */
  updateLastLogin: `
    /* auth.auth.updateLastLogin : 로그인 일시 갱신 */
    UPDATE TA_MEMBER M
    SET M.LAST_DT = TRUNC(SYSDATE)
    WHERE M.MEMBER_ID = :memberId
  `,

  /**
   * 회원 ID로 조회
   * @param memberId - 회원 ID
   */
  getMemberById: `
    /* auth.auth.getMemberById : 회원ID로 회원 조회 */
    SELECT
        M.MEMBER_ID,
        M.COMPANY_CD,
        M.SOLE_CD,
        M.AGENT_CD,
        M.FARM_NO,
        M.MEMBER_TYPE,
        M.MEMBER_TYPE_D,
        M.NAME,
        M.POSITION,
        M.EMAIL,
        M.HP_NUM,
        M.USE_YN
    FROM TA_MEMBER M
    WHERE M.MEMBER_ID = :memberId
      AND M.USE_YN = 'Y'
  `,

  /**
   * 농장번호로 회원 조회
   * @param farmNo - 농장번호
   */
  getMemberByFarmNo: `
    /* auth.auth.getMemberByFarmNo : 농장번호로 회원 조회 */
    SELECT
        M.MEMBER_ID,
        M.COMPANY_CD,
        M.SOLE_CD,
        M.AGENT_CD,
        M.FARM_NO,
        M.MEMBER_TYPE,
        M.MEMBER_TYPE_D,
        M.NAME,
        M.POSITION,
        M.EMAIL,
        M.HP_NUM,
        M.USE_YN
    FROM TA_MEMBER M
    WHERE M.FARM_NO = :farmNo
      AND M.USE_YN = 'Y'
  `,
};
