/**
 * 수동 ETL 실행 관련 SQL 쿼리 모음
 * 정기 배치는 inspig-etl에서 처리
 * TS_INS_SERVICE PK: FARM_NO + INSPIG_REG_DT (이력 관리)
 * 주의: DB가 UTC이므로 SYSDATE + 9/24로 KST 변환
 */
export const BATCH_SQL = {
  /**
   * 농장 존재 여부 확인
   */
  checkFarmExists: `
    /* batch.batch.checkFarmExists : 농장 존재 여부 확인 */
    SELECT FARM_NO, FARM_NM FROM TA_FARM WHERE FARM_NO = :farmNo AND USE_YN = 'Y'
  `,

  /**
   * TS_INS_SERVICE 조회 (현재 유효한 최신 건)
   * VW_INS_SERVICE_ACTIVE View 사용
   */
  getServiceInfo: `
    /* batch.batch.getServiceInfo : 서비스 정보 조회 (View 사용) */
    SELECT FARM_NO, INSPIG_YN, REG_TYPE, USE_YN, INSPIG_REG_DT,
           INSPIG_FROM_DT, INSPIG_TO_DT, INSPIG_STOP_DT
    FROM VW_INS_SERVICE_ACTIVE
    WHERE FARM_NO = :farmNo
  `,

  /**
   * TS_INS_SERVICE MANUAL 등록 (신규 INSERT)
   * PK: FARM_NO + INSPIG_REG_DT - 항상 새로운 이력 생성
   * MANUAL 등록은 항상 신규 레코드로 INSERT (오늘 KST 날짜로 INSPIG_REG_DT 생성)
   * INSPIG_FROM_DT: 오늘, INSPIG_TO_DT: 1년 후, INSPIG_STOP_DT: '99991231' (기본값)
   */
  upsertManualService: `
    /* batch.batch.upsertManualService : 수동 서비스 등록 (신규 이력) */
    MERGE INTO TS_INS_SERVICE S
    USING (SELECT :farmNo AS FARM_NO, TO_CHAR(SYSDATE + 9/24, 'YYYYMMDD') AS INSPIG_REG_DT FROM DUAL) D
    ON (S.FARM_NO = D.FARM_NO AND S.INSPIG_REG_DT = D.INSPIG_REG_DT)
    WHEN MATCHED THEN
        UPDATE SET INSPIG_YN = 'Y', REG_TYPE = 'MANUAL', USE_YN = 'Y', LOG_UPT_DT = SYSDATE
    WHEN NOT MATCHED THEN
        INSERT (FARM_NO, INSPIG_YN, INSPIG_REG_DT, INSPIG_FROM_DT, INSPIG_TO_DT, INSPIG_STOP_DT, REG_TYPE, USE_YN, LOG_INS_DT)
        VALUES (:farmNo, 'Y', TO_CHAR(SYSDATE + 9/24, 'YYYYMMDD'),
                TO_CHAR(SYSDATE + 9/24, 'YYYYMMDD'),
                TO_CHAR(ADD_MONTHS(SYSDATE + 9/24, 12), 'YYYYMMDD'),
                '99991231', 'MANUAL', 'Y', SYSDATE)
  `,



};
