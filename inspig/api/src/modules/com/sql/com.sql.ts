/**
 * 공통 SQL 쿼리
 * - 시스템 전반에서 공유되는 코드성 데이터 조회
 * - 특정 도메인에 종속되지 않는 공통 조회
 */
export const COM_SQL = {
  /**
   * 공통코드 조회
   * @param grpCd 그룹코드
   */
  getCodeList: `
    /* com.com.getCodeList : 공통코드 조회 */
    SELECT
        C.CD,
        C.CD_NM,
        C.CD_DESC,
        C.SORT_NO
    FROM TS_CODE C
    WHERE C.GRP_CD = :grpCd
      AND C.USE_YN = 'Y'
    ORDER BY C.SORT_NO
  `,

  /**
   * TC_CODE_JOHAP 조회 (캐싱용 - ETL/WEB에서 사용하는 PCODE만)
   * - 농장별 코드성 데이터 (품종, 도폐사원인 등)
   *
   * 사용 PCODE:
   *   - '031': 도폐사원인 (OUT_REASON_CD)
   *   - '041': 품종
   *
   * @returns PCODE, CODE, CNAME, LANGUAGE_CD
   */
  getAllCodeJohap: `
    /* com.com.getAllCodeJohap : 조합코드 조회 (ETL/WEB 사용분) */
    SELECT
        PCODE,
        CODE,
        CNAME,
        LANGUAGE_CD
    FROM TC_CODE_JOHAP
    WHERE USE_YN = 'Y'
      AND PCODE IN ('031', '041')
    ORDER BY PCODE, SORT_NO
  `,

  /**
   * TC_CODE_SYS 조회 (캐싱용 - ETL/WEB에서 사용하는 PCODE만)
   * - 시스템 코드성 데이터 (모돈상태, 작업구분 등)
   * - HELP_MSG: 툴팁 정보 (JSON 형식, 생산성 통계코드 031~035 등에서 사용)
   *
   * 사용 PCODE:
   *   - '01': 모돈상태 (STATUS_CD) - 019999(전체모돈) 포함
   *   - '02': 기준작업코드 (STD_CD) - 029999(전체) 포함
   *   - '08': 도폐사구분 (OUT_GUBUN_CD)
   *   - '031'~'035': 생산성 통계코드 (교배/분만/이유/번식주기/농장회전율)
   *   - '941': 국가코드 → 언어그룹코드
   *   - '942': 언어그룹코드 → 언어코드
   *
   * @returns PCODE, CODE, CNAME, CVALUE, HELP_MSG, LANGUAGE_CD
   */
  getAllCodeSys: `
    /* com.com.getAllCodeSys : 시스템코드 조회 (ETL/WEB 사용분) */
    SELECT
        PCODE,
        CODE,
        CNAME,
        CVALUE,
        HELP_MSG,
        LANGUAGE_CD
    FROM TC_CODE_SYS
    WHERE (USE_YN = 'Y' AND PCODE IN ('01', '02', '08', '031', '032', '033', '034', '035', '941', '942'))
       OR CODE IN ('019999', '029999')
    ORDER BY PCODE, SORT_NO
  `,

  /**
   * 농장 언어코드 조회
   * TA_FARM.COUNTRY_CODE → 941 → 942 → 언어코드
   * @param farmNo - 농장번호
   * @returns LANG_CD (ko/en/vi)
   */
  getFarmLangCode: `
    /* com.com.getFarmLangCode : 농장 언어코드 조회 */
    SELECT C2.CVALUE AS LANG_CD
    FROM TA_FARM F
    INNER JOIN TC_CODE_SYS C1
        ON C1.PCODE = '941'
        AND C1.CODE = NVL(F.COUNTRY_CODE, 'KOR')
        AND C1.LANGUAGE_CD = 'ko'
    INNER JOIN TC_CODE_SYS C2
        ON C2.PCODE = '942'
        AND C2.CODE = C1.CVALUE
        AND C2.LANGUAGE_CD = 'ko'
    WHERE F.FARM_NO = :farmNo
  `,

  // ─────────────────────────────────────────────────────────────────────────────
  // 경락가격 실시간 조회 (TM_SISAE_DETAIL)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * 경락가격 통계 조회 (평균/최고/최저)
   * - 전국 탕박 등외제외 평균단가
   * @param dtFrom - 시작일 (YY.MM.DD)
   * @param dtTo - 종료일 (YY.MM.DD)
   */
  getAuctionPriceStats: `
    /* com.com.getAuctionPriceStats : 경락가격 통계 (평균/최고/최저) */
    SELECT
        NVL(ROUND(SUM(AUCTCNT * AUCTAMT) / NULLIF(SUM(AUCTCNT), 0)), 0) AS AVG_PRICE,
        NVL(MAX(AUCTAMT), 0) AS MAX_PRICE,
        NVL(MIN(CASE WHEN AUCTAMT > 0 THEN AUCTAMT END), 0) AS MIN_PRICE,
        :dtFrom || ' ~ ' || :dtTo AS PERIOD
    FROM TM_SISAE_DETAIL
    WHERE ABATTCD = '057016'
      AND START_DT BETWEEN TO_CHAR(TO_DATE(:dtFrom, 'YY.MM.DD'), 'YYYYMMDD')
                       AND TO_CHAR(TO_DATE(:dtTo, 'YY.MM.DD'), 'YYYYMMDD')
      AND GRADE_CD = 'ST'
      AND SKIN_YN = 'Y'
      AND JUDGESEX_CD IS NULL
      AND TO_NUMBER(NVL(AUCTAMT, '0')) > 0
  `,

  /**
   * 경락가격 등급별 일별 조회 (팝업 차트용)
   * - 전국 탕박 (제주제외)
   * - 등급별: 1+, 1, 2, 등외, 등외제외(ST), 평균(T)
   * @param dtFrom - 시작일 (YY.MM.DD)
   * @param dtTo - 종료일 (YY.MM.DD)
   */
  getAuctionPriceByGrade: `
    /* com.com.getAuctionPriceByGrade : 경락가격 등급별 일별 조회 */
    SELECT
        START_DT,
        TO_CHAR(TO_DATE(START_DT, 'YYYYMMDD'), 'MM.DD') AS DT_DISPLAY,
        GRADE_CD,
        ROUND(AUCTAMT) AS PRICE
    FROM TM_SISAE_DETAIL
    WHERE ABATTCD = '057016'
      AND START_DT BETWEEN TO_CHAR(TO_DATE(:dtFrom, 'YY.MM.DD'), 'YYYYMMDD')
                       AND TO_CHAR(TO_DATE(:dtTo, 'YY.MM.DD'), 'YYYYMMDD')
      AND GRADE_CD IN ('029068', '029069', '029070', '029076', 'ST', 'T')
      AND SKIN_YN = 'Y'
      AND JUDGESEX_CD IS NULL
      AND TO_NUMBER(NVL(AUCTAMT, '0')) > 0
    ORDER BY START_DT,
             CASE WHEN GRADE_CD = '029068' THEN 1000
                  WHEN GRADE_CD = '029069' THEN 2000
                  WHEN GRADE_CD = '029070' THEN 3000
                  WHEN GRADE_CD = '029076' THEN 4000
                  WHEN GRADE_CD = 'ST' THEN 5000
                  WHEN GRADE_CD = 'T' THEN 9100
                  ELSE 10
             END
  `,

  // ─────────────────────────────────────────────────────────────────────────────
  // 농장 기본값 설정 (TC_FARM_CONFIG)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * 농장 기본값 조회 (주간보고서 작업예정 산정용)
   * - TC_CODE_SYS: 시스템 기본값
   * - TC_FARM_CONFIG: 농장별 설정값 (없으면 시스템 기본값 사용)
   *
   * 설정 코드:
   * - 140002: 평균임신기간 (기본 115일)
   * - 140003: 평균포유기간 (기본 21일)
   * - 140005: 기준출하일령 (기본 180일)
   * - 140007: 후보돈초교배일령 (기본 240일)
   * - 140008: 평균재귀일 (기본 7일)
   *
   * @param farmNo - 농장번호
   * @returns CODE, CNAME, CVALUE, SORT_NO
   */
  getFarmConfig: `
    /* com.com.getFarmConfig : 농장 기본값 조회 */
    SELECT
        TA1.CODE,
        TA1.CNAME,
        NVL(TA2.CVALUE, TA1.ORIGIN_VALUE) AS CVALUE,
        TA1.SORT_NO
    FROM (
        SELECT T1.CODE, T1.CNAME, T1.CVALUE AS ORIGIN_VALUE, T1.SORT_NO
        FROM TC_CODE_SYS T1
        WHERE T1.PCODE = '14'
          AND T1.CODE IN ('140002', '140003', '140005', '140007', '140008')
          AND T1.LANGUAGE_CD = 'ko'
          AND T1.USE_YN = 'Y'
    ) TA1
    LEFT OUTER JOIN TC_FARM_CONFIG TA2
        ON TA1.CODE = TA2.CODE
       AND TA2.FARM_NO = :farmNo
       AND TA2.USE_YN = 'Y'
    ORDER BY TA1.SORT_NO
  `,

  /**
   * 모돈 작업설정 조회 (주간보고서 작업예정 산정용)
   * - TB_PLAN_MODON: 피그플랜 예정작업 설정
   *
   * 예정작업 유형 (JOB_GUBUN_CD):
   * - 150001: 임신감정(진단)
   * - 150002: 분만
   * - 150003: 이유
   * - 150005: 교배
   * - 150004: 백신
   *
   * @param farmNo - 농장번호
   * @returns SEQ, JOB_GUBUN_CD, WK_NM, MODON_STATUS_CD, PASS_DAY
   */
  getPlanModon: `
    /* com.com.getPlanModon : 모돈 작업설정 조회 */
    SELECT
        SEQ,
        JOB_GUBUN_CD,
        WK_NM,
        MODON_STATUS_CD,
        PASS_DAY
    FROM TB_PLAN_MODON
    WHERE FARM_NO = :farmNo
      AND USE_YN = 'Y'
    ORDER BY JOB_GUBUN_CD, SEQ
  `,

  /**
   * 인사이트피그 설정 조회 (TS_INS_CONF)
   * - 주간보고서 작업예정 산정 방식 설정
   *
   * @param farmNo - 농장번호
   * @returns WEEK_TW_GY, WEEK_TW_BM, WEEK_TW_IM, WEEK_TW_EU, WEEK_TW_VC (JSON)
   */
  getInsConf: `
    /* com.com.getInsConf : 인사이트피그 설정 조회 */
    SELECT
        WEEK_TW_GY,
        WEEK_TW_BM,
        WEEK_TW_IM,
        WEEK_TW_EU,
        WEEK_TW_VC
    FROM TS_INS_CONF
    WHERE FARM_NO = :farmNo
  `,

  /**
   * 인사이트피그 설정 존재 여부 확인
   */
  checkInsConf: `
    /* com.com.checkInsConf : 인사이트피그 설정 존재 확인 */
    SELECT COUNT(*) AS CNT FROM TS_INS_CONF WHERE FARM_NO = :farmNo
  `,

  /**
   * 인사이트피그 설정 신규 등록
   */
  insertInsConf: `
    /* com.com.insertInsConf : 인사이트피그 설정 신규 등록 */
    INSERT INTO TS_INS_CONF (FARM_NO, LOG_INS_DT)
    VALUES (:farmNo, SYSDATE)
  `,

  /**
   * 주간보고서 작업예정 설정 저장 (MERGE)
   * - 동적으로 컬럼 지정하여 UPDATE
   */
  updateInsConfWeekly: `
    /* com.com.updateInsConfWeekly : 주간보고서 작업예정 설정 저장 */
    UPDATE TS_INS_CONF
    SET WEEK_TW_GY = :weekTwGy,
        WEEK_TW_BM = :weekTwBm,
        WEEK_TW_IM = :weekTwIm,
        WEEK_TW_EU = :weekTwEu,
        WEEK_TW_VC = :weekTwVc,
        LOG_UPT_DT = SYSDATE
    WHERE FARM_NO = :farmNo
  `,
};
