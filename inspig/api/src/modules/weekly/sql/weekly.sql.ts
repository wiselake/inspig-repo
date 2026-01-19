/**
 * 주간 보고서 SQL 쿼리 모음
 * SQL ID 형식: 서비스.SQL파일.쿼리ID : 설명
 * 파라미터: named parameter (:paramName) - dataSource.query()에 객체로 전달
 */
export const WEEKLY_SQL = {
  /**
   * 주간 보고서 목록 조회 (기본)
   * @param farmNo - 농장번호
   */
  getReportList: `
    /* weekly.weekly.getReportList : 보고서 목록 조회 */
    SELECT
        M.SEQ,
        M.REPORT_YEAR,
        M.REPORT_WEEK_NO,
        TO_CHAR(TO_DATE(M.DT_FROM, 'YYYYMMDD'), 'YY.MM.DD') AS DT_FROM,
        TO_CHAR(TO_DATE(M.DT_TO, 'YYYYMMDD'), 'YY.MM.DD') AS DT_TO,
        M.DT_FROM AS DT_FROM_RAW,
        M.DT_TO AS DT_TO_RAW,
        M.STATUS_CD,
        TO_CHAR(SF_GET_LOCALE_VW_DATE_2022('KOR', M.LOG_INS_DT), 'YYYY.MM.DD') AS LOG_INS_DT,
        W.SHARE_TOKEN,
        W.FARM_NM
    FROM TS_INS_MASTER M
    INNER JOIN TS_INS_WEEK W ON W.MASTER_SEQ = M.SEQ
    WHERE W.FARM_NO = :farmNo
      AND M.DAY_GB = 'WEEK'
      AND M.STATUS_CD = 'COMPLETE'
    ORDER BY M.REPORT_YEAR DESC, M.REPORT_WEEK_NO DESC
  `,

  /**
   * 주간 보고서 목록 조회 (기간 필터)
   * @param farmNo - 농장번호
   * @param dtFrom - 시작일 (YYYYMMDD)
   * @param dtTo - 종료일 (YYYYMMDD)
   */
  getReportListWithPeriod: `
    /* weekly.weekly.getReportListWithPeriod : 보고서 목록 조회 (기간) */
    SELECT
        M.SEQ,
        M.REPORT_YEAR,
        M.REPORT_WEEK_NO,
        TO_CHAR(TO_DATE(M.DT_FROM, 'YYYYMMDD'), 'YY.MM.DD') AS DT_FROM,
        TO_CHAR(TO_DATE(M.DT_TO, 'YYYYMMDD'), 'YY.MM.DD') AS DT_TO,
        M.DT_FROM AS DT_FROM_RAW,
        M.DT_TO AS DT_TO_RAW,
        M.STATUS_CD,
        TO_CHAR(SF_GET_LOCALE_VW_DATE_2022('KOR', M.LOG_INS_DT), 'YYYY.MM.DD') AS LOG_INS_DT,
        W.SHARE_TOKEN,
        W.FARM_NM
    FROM TS_INS_MASTER M
    INNER JOIN TS_INS_WEEK W ON W.MASTER_SEQ = M.SEQ
    WHERE W.FARM_NO = :farmNo
      AND M.DAY_GB = 'WEEK'
      AND M.STATUS_CD = 'COMPLETE'
      AND TO_CHAR(SF_GET_LOCALE_DATE_2020('KOR', M.INS_DT), 'YYYYMMDD') >= :dtFrom
      AND TO_CHAR(SF_GET_LOCALE_DATE_2020('KOR', M.INS_DT), 'YYYYMMDD') <= :dtTo
    ORDER BY M.REPORT_YEAR DESC, M.REPORT_WEEK_NO DESC
  `,

  /**
   * 주간 보고서 상세 조회
   * @param masterSeq - 마스터 SEQ
   * @param farmNo - 농장번호
   */
  getReportDetail: `
    /* weekly.weekly.getReportDetail : 보고서 상세 조회 */
    SELECT
        W.MASTER_SEQ,
        W.FARM_NO,
        W.FARM_NM,
        W.OWNER_NM,
        W.STATUS_CD,
        W.SHARE_TOKEN,
        TO_CHAR(TO_DATE(W.TOKEN_EXPIRE_DT, 'YYYYMMDD'), 'YY.MM.DD') AS TOKEN_EXPIRE_DT,
        W.REPORT_YEAR,
        W.REPORT_WEEK_NO,
        TO_CHAR(TO_DATE(W.DT_FROM, 'YYYYMMDD'), 'YY.MM.DD') AS DT_FROM,
        TO_CHAR(TO_DATE(W.DT_TO, 'YYYYMMDD'), 'YY.MM.DD') AS DT_TO,
        W.DT_FROM AS DT_FROM_RAW,
        W.DT_TO AS DT_TO_RAW,
        W.ALERT_TOTAL,
        W.ALERT_HUBO,
        W.ALERT_EU_MI,
        W.ALERT_SG_MI,
        W.ALERT_BM_DELAY,
        W.ALERT_EU_DELAY,
        W.MODON_REG_CNT,
        W.MODON_SANGSI_CNT,
        W.MODON_REG_CHG,
        W.MODON_SANGSI_CHG,
        W.LAST_GB_CNT,
        W.LAST_GB_SUM,
        W.LAST_BM_CNT,
        W.LAST_BM_TOTAL,
        W.LAST_BM_LIVE,
        W.LAST_BM_DEAD,
        W.LAST_BM_MUMMY,
        W.LAST_BM_SUM_CNT,
        W.LAST_BM_SUM_TOTAL,
        W.LAST_BM_SUM_LIVE,
        W.LAST_BM_AVG_TOTAL,
        W.LAST_BM_AVG_LIVE,
        W.LAST_BM_SUM_AVG_TOTAL,
        W.LAST_BM_SUM_AVG_LIVE,
        W.LAST_BM_CHG_TOTAL,
        W.LAST_BM_CHG_LIVE,
        W.LAST_EU_CNT,
        W.LAST_EU_JD_CNT,
        W.LAST_EU_AVG_JD,
        W.LAST_EU_AVG_KG,
        W.LAST_EU_SUM_CNT,
        W.LAST_EU_SUM_JD,
        W.LAST_EU_SUM_AVG_JD,
        W.LAST_EU_CHG_JD,
        W.LAST_EU_CHG_KG,
        W.LAST_SG_CNT,
        W.LAST_SG_AVG_GYUNGIL,
        W.LAST_SG_SUM,
        W.LAST_SG_SUM_AVG_GYUNGIL,
        W.LAST_CL_CNT,
        W.LAST_CL_SUM,
        W.LAST_SH_CNT,
        W.LAST_SH_AVG_KG,
        W.LAST_SH_SUM,
        W.LAST_SH_AVG_SUM,
        W.THIS_GB_SUM,
        W.THIS_IMSIN_SUM,
        W.THIS_BM_SUM,
        W.THIS_EU_SUM,
        W.THIS_VACCINE_SUM,
        W.THIS_SHIP_SUM,
        W.KPI_PSY,
        W.KPI_DELAY_DAY,
        W.PSY_X,
        W.PSY_Y,
        W.PSY_ZONE,
        TO_CHAR(SF_GET_LOCALE_VW_DATE_2022('KOR', M.LOG_INS_DT), 'YYYY.MM.DD') AS LOG_INS_DT
    FROM TS_INS_WEEK W
    INNER JOIN TS_INS_MASTER M ON M.SEQ = W.MASTER_SEQ
    WHERE W.MASTER_SEQ = :masterSeq
      AND W.FARM_NO = :farmNo
  `,

  /**
   * 주간 보고서 상세 서브 데이터
   * @param masterSeq - 마스터 SEQ
   * @param farmNo - 농장번호
   */
  getReportSub: `
    /* weekly.weekly.getReportSub : 보고서 서브 데이터 조회 */
    SELECT
        S.MASTER_SEQ,
        S.FARM_NO,
        S.GUBUN,
        S.SUB_GUBUN,
        S.SORT_NO,
        S.CODE_1, S.CODE_2,
        S.CNT_1, S.CNT_2, S.CNT_3, S.CNT_4, S.CNT_5,
        S.CNT_6, S.CNT_7, S.CNT_8, S.CNT_9, S.CNT_10,
        S.CNT_11, S.CNT_12, S.CNT_13, S.CNT_14, S.CNT_15,
        S.VAL_1, S.VAL_2, S.VAL_3, S.VAL_4, S.VAL_5,
        S.VAL_6, S.VAL_7, S.VAL_8, S.VAL_9, S.VAL_10,
        S.VAL_11, S.VAL_12, S.VAL_13, S.VAL_14, S.VAL_15,
        S.STR_1, S.STR_2, S.STR_3, S.STR_4, S.STR_5,
        S.STR_6, S.STR_7, S.STR_8, S.STR_9, S.STR_10,
        S.STR_11, S.STR_12, S.STR_13, S.STR_14, S.STR_15
    FROM TS_INS_WEEK_SUB S
    WHERE S.MASTER_SEQ = :masterSeq
      AND S.FARM_NO = :farmNo
    ORDER BY S.GUBUN ASC, S.SUB_GUBUN ASC, S.SORT_NO ASC
  `,

  /**
   * 팝업 서브 데이터 조회 (단일 GUBUN)
   * @param masterSeq - 마스터 SEQ
   * @param farmNo - 농장번호
   * @param gubun - GUBUN 값
   */
  getPopupSub: `
    /* weekly.weekly.getPopupSub : 팝업 서브 데이터 조회 */
    SELECT
        S.MASTER_SEQ,
        S.FARM_NO,
        S.GUBUN,
        S.SUB_GUBUN,
        S.SORT_NO,
        S.CODE_1, S.CODE_2,
        S.CNT_1, S.CNT_2, S.CNT_3, S.CNT_4, S.CNT_5,
        S.CNT_6, S.CNT_7, S.CNT_8, S.CNT_9, S.CNT_10,
        S.CNT_11, S.CNT_12, S.CNT_13, S.CNT_14, S.CNT_15,
        S.VAL_1, S.VAL_2, S.VAL_3, S.VAL_4, S.VAL_5,
        S.VAL_6, S.VAL_7, S.VAL_8, S.VAL_9, S.VAL_10,
        S.VAL_11, S.VAL_12, S.VAL_13, S.VAL_14, S.VAL_15,
        S.STR_1, S.STR_2, S.STR_3, S.STR_4, S.STR_5,
        S.STR_6, S.STR_7, S.STR_8, S.STR_9, S.STR_10,
        S.STR_11, S.STR_12, S.STR_13, S.STR_14, S.STR_15
    FROM TS_INS_WEEK_SUB S
    WHERE S.MASTER_SEQ = :masterSeq
      AND S.FARM_NO = :farmNo
      AND S.GUBUN = :gubun
    ORDER BY S.SUB_GUBUN ASC, S.SORT_NO ASC
  `,

  /**
   * 팝업 서브 데이터 조회 (LIKE 검색 - 스케줄용)
   * @param masterSeq - 마스터 SEQ
   * @param farmNo - 농장번호
   * @param gubun - GUBUN 패턴 (예: 'SCHEDULE_%')
   */
  getPopupSubLike: `
    /* weekly.weekly.getPopupSubLike : 팝업 서브 데이터 LIKE 조회 */
    SELECT
        S.MASTER_SEQ,
        S.FARM_NO,
        S.GUBUN,
        S.SUB_GUBUN,
        S.SORT_NO,
        S.CODE_1, S.CODE_2,
        S.CNT_1, S.CNT_2, S.CNT_3, S.CNT_4, S.CNT_5,
        S.CNT_6, S.CNT_7, S.CNT_8, S.CNT_9, S.CNT_10,
        S.CNT_11, S.CNT_12, S.CNT_13, S.CNT_14, S.CNT_15,
        S.VAL_1, S.VAL_2, S.VAL_3, S.VAL_4, S.VAL_5,
        S.VAL_6, S.VAL_7, S.VAL_8, S.VAL_9, S.VAL_10,
        S.VAL_11, S.VAL_12, S.VAL_13, S.VAL_14, S.VAL_15,
        S.STR_1, S.STR_2, S.STR_3, S.STR_4, S.STR_5,
        S.STR_6, S.STR_7, S.STR_8, S.STR_9, S.STR_10,
        S.STR_11, S.STR_12, S.STR_13, S.STR_14, S.STR_15
    FROM TS_INS_WEEK_SUB S
    WHERE S.MASTER_SEQ = :masterSeq
      AND S.FARM_NO = :farmNo
      AND S.GUBUN LIKE :gubun
    ORDER BY S.GUBUN ASC, S.SUB_GUBUN ASC, S.SORT_NO ASC
  `,

  /**
   * 도폐사 원인코드명 조회
   * @param codes - 원인코드 목록 (콤마 구분, 예: '031038,031035,031073')
   * @param lang - 언어코드 (ko/en/vi)
   */
  getReasonCodeNames: `
    /* weekly.weekly.getReasonCodeNames : 도폐사 원인코드명 조회 */
    SELECT CODE, CNAME
    FROM TC_CODE_JOHAP
    WHERE PCODE = '031'
      AND LANGUAGE_CD = :lang
      AND CODE IN (SELECT REGEXP_SUBSTR(:codes, '[^,]+', 1, LEVEL)
                   FROM DUAL
                   CONNECT BY REGEXP_SUBSTR(:codes, '[^,]+', 1, LEVEL) IS NOT NULL)
  `,

  /**
   * 예정돈 조회 (FN_MD_SCHEDULE_BSE_2020)
   * - 지난주 실적 각 팝업의 예정 표시
   * - 금주 실적 요일별 건수 셋팅
   * @param farmNo - 농장번호
   * @param reportGb - 리포트구분 (JOB-DAJANG: 작업예정돈 대장, JOB-CALENDAR: 달력)
   * @param scheduleGb - 예정구분 (150001:임신진단, 150002:분만, 150003:이유, 150004:백신, 150005:교배, 150004:백신2)
   * @param statusCode - 모돈상태 (NULL=전체)
   * @param dtFrom - 시작일 (yyyy-MM-dd)
   * @param dtTo - 종료일 (yyyy-MM-dd)
   * @param lang - 언어 (ko/en/vi)
   * @param seq - 예정작업 SEQ (-1=전체, 콤마구분)
   * @param sancha - 산차범위 (FROM,TO 형식, NULL=전체)
   */
  getScheduleList: `
    /* weekly.weekly.getScheduleList : 예정돈 조회 */
    SELECT
        FARM_NO,
        PIG_NO,
        FARM_PIG_NO,
        IGAK_NO,
        WK_NM,
        AUTO_GRP,
        LOC_NM,
        SANCHA,
        GYOBAE_CNT,
        LAST_WK_DT,
        PASS_DAY,
        PASS_DT,
        LAST_WK_NM,
        LAST_WK_GUBUN,
        LAST_WK_GUBUN_CD,
        ARTICLE_NM,
        HCODE,
        DAERI_YN
    FROM TABLE(FN_MD_SCHEDULE_BSE_2020(
        :farmNo,
        :reportGb,
        :scheduleGb,
        :statusCode,
        :dtFrom,
        :dtTo,
        NULL,
        :lang,
        'yyyy-MM-dd',
        :seq,
        :sancha
    ))
  `,

  /**
   * 예정돈 건수 조회
   * @param farmNo - 농장번호
   * @param reportGb - 리포트구분
   * @param scheduleGb - 예정구분
   * @param statusCode - 모돈상태
   * @param dtFrom - 시작일
   * @param dtTo - 종료일
   * @param lang - 언어
   * @param seq - 예정작업 SEQ
   * @param sancha - 산차범위
   */
  getScheduleCount: `
    /* weekly.weekly.getScheduleCount : 예정돈 건수 조회 */
    SELECT COUNT(*) AS CNT
    FROM TABLE(FN_MD_SCHEDULE_BSE_2020(
        :farmNo,
        :reportGb,
        :scheduleGb,
        :statusCode,
        :dtFrom,
        :dtTo,
        NULL,
        :lang,
        'yyyy-MM-dd',
        :seq,
        :sancha
    ))
  `,

  /**
   * TS_PRODUCTIVITY 조회 (주간/월간/분기 공통)
   * @param farmNo - 농장번호
   * @param statYear - 통계년도 (YYYY)
   * @param period - 기간구분 (W:주간, M:월간, Q:분기)
   * @param periodNo - 기간차수 (W:1~53, M:1~12, Q:1~4)
   * @param pcode - PCODE (NULL이면 전체, '031','032','033','034','035')
   */
  getProductivity: `
    /* weekly.weekly.getProductivity : 생산성 데이터 조회 */
    SELECT
        P.FARM_NO,
        P.PCODE,
        P.STAT_YEAR,
        P.PERIOD,
        P.PERIOD_NO,
        P.STAT_DATE,
        P.C001, P.C002, P.C003, P.C004, P.C005,
        P.C006, P.C007, P.C008, P.C009, P.C010,
        P.C011, P.C012, P.C013, P.C014, P.C015,
        P.C016, P.C017, P.C018, P.C019, P.C020,
        P.C021, P.C022, P.C023, P.C024, P.C025,
        P.C026, P.C027, P.C028, P.C029, P.C030,
        P.C031, P.C032, P.C033, P.C034, P.C035,
        P.C036, P.C037, P.C038, P.C039, P.C040,
        P.C041, P.C042, P.C043
    FROM TS_PRODUCTIVITY P
    WHERE P.FARM_NO = :farmNo
      AND P.STAT_YEAR = :statYear
      AND P.PERIOD = :period
      AND P.PERIOD_NO = :periodNo
      AND (:pcode IS NULL OR P.PCODE = :pcode)
    ORDER BY P.PCODE
  `,

  // getProductivitySangsi 제거됨 (방식 2 적용)
  // - 상시모돈 데이터: ETL에서 TS_PRODUCTIVITY → TS_INS_WEEK.MODON_SANGSI_CNT 업데이트
  // - 웹에서는 TS_INS_WEEK.MODON_SANGSI_CNT에서 직접 읽어옴 (getReportDetail 쿼리)

  /**
   * 관리포인트 리스트 조회 (TS_INS_MGMT) - CONTENT 제외
   * TS_INS_MGMT는 독립 테이블
   * MGMT_TYPE: QUIZ(퀴즈), CHANNEL(박사채널&정보), PORK-NEWS(한돈&업계소식)
   * 조회 조건:
   *   - POST_FROM <= 현재일 (미도래 게시물 제외)
   *   - 게시기간(POST_FROM~POST_TO)이 주간보고서 기간과 겹치면 표시
   * 모바일 메모리 부담 경감을 위해 CONTENT는 상세 조회 시에만 조회
   */
  getMgmtList: `
    /* weekly.weekly.getMgmtList : 관리포인트 리스트 조회 (CONTENT 제외) */
    SELECT
        SEQ,
        MGMT_TYPE,
        SORT_NO,
        TITLE,
        LINK_URL,
        LINK_TARGET,
        VIDEO_URL,
        TO_CHAR(POST_FROM, 'YYYYMMDD') AS POST_FROM,
        TO_CHAR(POST_TO, 'YYYYMMDD') AS POST_TO
    FROM TS_INS_MGMT
    WHERE NVL(USE_YN, 'Y') = 'Y'
      AND (POST_FROM IS NULL OR POST_FROM <= TRUNC(SYSDATE + 9/24))  /* 미도래 게시물 제외 (KST 기준) */
    ORDER BY
        CASE MGMT_TYPE
            WHEN 'QUIZ' THEN 1
            WHEN 'CHANNEL' THEN 2
            WHEN 'PORK-NEWS' THEN 3
            ELSE 9
        END,
        POST_FROM DESC NULLS LAST,
        SORT_NO
  `,

  /**
   * 관리포인트 상세 조회 (단건) - CONTENT 포함
   * @param seq - 관리포인트 SEQ
   */
  getMgmtDetail: `
    /* weekly.weekly.getMgmtDetail : 관리포인트 상세 조회 */
    SELECT
        SEQ,
        MGMT_TYPE,
        SORT_NO,
        TITLE,
        CONTENT,
        NVL(CONTENT_TYPE, 'TEXT') AS CONTENT_TYPE,
        LINK_URL,
        LINK_TARGET,
        VIDEO_URL,
        TO_CHAR(POST_FROM, 'YYYYMMDD') AS POST_FROM,
        TO_CHAR(POST_TO, 'YYYYMMDD') AS POST_TO
    FROM TS_INS_MGMT
    WHERE SEQ = :seq
      AND NVL(USE_YN, 'Y') = 'Y'
  `,

  /**
   * 첨부파일 조회 (TL_ATTACH_FILE_NEW)
   * @param refTable - 참조 테이블명 (TS_INS_MGMT 등)
   * @param refSeq - 참조 테이블의 PK
   */
  getAttachFiles: `
    /* weekly.weekly.getAttachFiles : 첨부파일 조회 */
    SELECT
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
        DOWN_CNT
    FROM TL_ATTACH_FILE_NEW
    WHERE REF_TABLE = :refTable
      AND REF_SEQ = :refSeq
      AND NVL(USE_YN, 'Y') = 'Y'
    ORDER BY SORT_NO
  `,

  /**
   * 첨부파일 다운로드 카운트 증가
   * @param fileSeq - 파일 일련번호
   */
  updateDownloadCount: `
    /* weekly.weekly.updateDownloadCount : 다운로드 카운트 증가 */
    UPDATE TL_ATTACH_FILE_NEW
    SET DOWN_CNT = NVL(DOWN_CNT, 0) + 1,
        UPD_DT = SYSDATE
    WHERE FILE_SEQ = :fileSeq
  `,

  /**
   * 농장 격자 좌표 조회
   * @param farmNo - 농장번호
   */
  getFarmWeatherGrid: `
    /* weekly.weekly.getFarmWeatherGrid : 농장 격자 좌표 조회 */
    SELECT
        FARM_NO,
        WEATHER_NX_N AS NX,
        WEATHER_NY_N AS NY,
        ADDR1 AS REGION
    FROM TA_FARM
    WHERE FARM_NO = :farmNo
      AND WEATHER_NX_N IS NOT NULL
      AND WEATHER_NY_N IS NOT NULL
  `,

  /**
   * 일별 날씨 조회 (TM_WEATHER)
   * @param nx - 격자 X
   * @param ny - 격자 Y
   * @param dtFrom - 시작일 (YYYYMMDD)
   * @param dtTo - 종료일 (YYYYMMDD)
   */
  getWeatherDaily: `
    /* weekly.weekly.getWeatherDaily : 일별 날씨 조회 */
    SELECT
        WK_DATE,
        NX,
        NY,
        WEATHER_CD,
        WEATHER_NM,
        TEMP_AVG,
        TEMP_HIGH,
        TEMP_LOW,
        RAIN_PROB,
        RAIN_AMT,
        HUMIDITY,
        WIND_SPEED,
        SKY_CD,
        IS_FORECAST
    FROM TM_WEATHER
    WHERE NX = :nx
      AND NY = :ny
      AND WK_DATE BETWEEN :dtFrom AND :dtTo
    ORDER BY WK_DATE
  `,

  /**
   * 시간별 날씨 조회 (TM_WEATHER_HOURLY)
   * @param nx - 격자 X
   * @param ny - 격자 Y
   * @param wkDate - 조회일 (YYYYMMDD)
   */
  getWeatherHourly: `
    /* weekly.weekly.getWeatherHourly : 시간별 날씨 조회 */
    SELECT
        WK_DATE,
        WK_TIME,
        NX,
        NY,
        WEATHER_CD,
        WEATHER_NM,
        TEMP,
        RAIN_PROB,
        RAIN_AMT,
        HUMIDITY,
        WIND_SPEED,
        SKY_CD,
        PTY_CD
    FROM TM_WEATHER_HOURLY
    WHERE NX = :nx
      AND NY = :ny
      AND WK_DATE = :wkDate
    ORDER BY WK_TIME
  `,

  /**
   * 오늘 날씨 조회 (extra.weather 카드용)
   * @param nx - 격자 X
   * @param ny - 격자 Y
   */
  getWeatherToday: `
    /* weekly.weekly.getWeatherToday : 오늘 날씨 조회 */
    SELECT
        WK_DATE,
        WEATHER_CD,
        WEATHER_NM,
        TEMP_AVG,
        TEMP_HIGH,
        TEMP_LOW,
        RAIN_PROB,
        SKY_CD
    FROM TM_WEATHER
    WHERE NX = :nx
      AND NY = :ny
      AND WK_DATE = TO_CHAR(SYSDATE + 9/24, 'YYYYMMDD')  /* UTC→KST 변환 */
  `,

  /**
   * 현재 시간 날씨 조회 (cardWeather용 - 가장 가까운 시간대)
   * @param nx - 격자 X
   * @param ny - 격자 Y
   */
  getWeatherCurrent: `
    /* weekly.weekly.getWeatherCurrent : 현재 시간 날씨 조회 */
    SELECT *
    FROM (
        SELECT
            WK_DATE,
            WK_TIME,
            WEATHER_CD,
            WEATHER_NM,
            TEMP,
            RAIN_PROB,
            SKY_CD,
            PTY_CD
        FROM TM_WEATHER_HOURLY
        WHERE NX = :nx
          AND NY = :ny
          AND WK_DATE = TO_CHAR(SYSDATE + 9/24, 'YYYYMMDD')  /* UTC→KST 변환 */
          AND WK_TIME <= TO_CHAR(SYSDATE + 9/24, 'HH24') || '00'  /* 현재 시간 이하 */
        ORDER BY WK_TIME DESC
    )
    WHERE ROWNUM = 1
  `,
};
