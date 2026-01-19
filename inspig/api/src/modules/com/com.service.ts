import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { COM_SQL } from './sql/com.sql';

/**
 * pig3.1 API Base URL
 * - localhost: http://localhost:8070
 * - production: https://www.pigplan.io
 */
const PIG31_API_URL = process.env.PIG31_API_URL || 'http://localhost:8070';

/**
 * 코드 캐시 키 생성 (CNAME용)
 * @param pcode 부모코드 (예: '031' 도폐사원인)
 * @param code 코드값 (예: '031038')
 * @param lang 언어코드 (예: 'ko')
 */
const cacheKey = (pcode: string, code: string, lang: string) => `${pcode}:${code}:${lang}`;

/**
 * CVALUE 캐시 키 생성 (941/942 언어변환용)
 */
const cvalueKey = (pcode: string, code: string, lang: string) => `V:${pcode}:${code}:${lang}`;

/**
 * HELP_MSG 캐시 키 생성 (031~035 생산성 통계코드 툴팁용)
 */
const helpMsgKey = (pcode: string, code: string, lang: string) => `H:${pcode}:${code}:${lang}`;

/**
 * Named parameter를 TypeORM query에 전달하기 위한 헬퍼
 */
const params = (obj: Record<string, unknown>): any => obj;

/**
 * 공통 서비스 (코드 캐싱)
 *
 * 애플리케이션 시작 시 TC_CODE_JOHAP, TC_CODE_SYS 테이블을 메모리에 로딩
 * - 별도 DB 조회 없이 즉시 코드명 조회 가능
 * - getCodeName(pcode, code, lang) → '호흡기 질환'
 *
 * 주요 PCODE:
 * - TC_CODE_JOHAP:
 *   - '031': 도폐사원인 (OUT_REASON_CD)
 *   - '041': 품종
 * - TC_CODE_SYS:
 *   - '01': 모돈상태 (STATUS_CD)
 *   - '08': 도폐사구분 (OUT_GUBUN_CD)
 *
 * 환경변수:
 *   - DEFAULT_LANG: 기본 언어코드 (ko/en/vi, 기본값: 'ko')
 */
@Injectable()
export class ComService implements OnModuleInit {
  private readonly logger = new Logger(ComService.name);

  // 캐시 저장소: Map<'PCODE:CODE:LANG', 'CNAME'>
  private codeJohapCache = new Map<string, string>();
  private codeSysCache = new Map<string, string>();

  // CVALUE 캐시 저장소: Map<'V:PCODE:CODE:LANG', 'CVALUE'> (941/942 언어변환용)
  private codeSysCvalueCache = new Map<string, string>();

  // HELP_MSG 캐시 저장소: Map<'H:PCODE:CODE:LANG', 'HELP_MSG'> (031~035 생산성 통계코드 툴팁용)
  private codeSysHelpMsgCache = new Map<string, string>();

  // 농장별 언어 캐시: Map<farmNo, langCode>
  private farmLangCache = new Map<number, string>();

  // 캐시 로딩 완료 여부
  private isLoaded = false;

  // 기본 언어 설정 (환경변수 DEFAULT_LANG, 기본값 'ko')
  private readonly defaultLang: string;

  constructor(private readonly dataSource: DataSource) {
    this.defaultLang = process.env.DEFAULT_LANG || 'ko';
  }

  /**
   * 모듈 초기화 시 코드 테이블 로딩
   */
  async onModuleInit() {
    await this.loadAllCodes();
  }

  /**
   * 코드 테이블 전체 로딩 (TC_CODE_JOHAP + TC_CODE_SYS)
   */
  async loadAllCodes(): Promise<void> {
    const startTime = Date.now();
    this.logger.log('코드 테이블 캐싱 시작...');

    try {
      // 병렬 로딩
      await Promise.all([this.loadCodeJohap(), this.loadCodeSys()]);

      this.isLoaded = true;
      const elapsed = Date.now() - startTime;
      this.logger.log(
        `코드 테이블 캐싱 완료 (${elapsed}ms) - JOHAP: ${this.codeJohapCache.size}건, SYS: ${this.codeSysCache.size}건`,
      );
    } catch (error) {
      this.logger.error('코드 테이블 캐싱 실패', error.message);
      // 캐싱 실패해도 서비스는 계속 (fallback: 개별 DB 조회)
    }
  }

  /**
   * TC_CODE_JOHAP 로딩
   */
  private async loadCodeJohap(): Promise<void> {
    const results = await this.dataSource.query(COM_SQL.getAllCodeJohap);
    this.codeJohapCache.clear();

    for (const row of results) {
      const key = cacheKey(row.PCODE, row.CODE, row.LANGUAGE_CD);
      this.codeJohapCache.set(key, row.CNAME);
    }
  }

  /**
   * TC_CODE_SYS 로딩 (CNAME + CVALUE + HELP_MSG)
   */
  private async loadCodeSys(): Promise<void> {
    const results = await this.dataSource.query(COM_SQL.getAllCodeSys);
    this.codeSysCache.clear();
    this.codeSysCvalueCache.clear();
    this.codeSysHelpMsgCache.clear();

    for (const row of results) {
      const key = cacheKey(row.PCODE, row.CODE, row.LANGUAGE_CD);
      this.codeSysCache.set(key, row.CNAME);

      // CVALUE도 캐싱 (941/942 언어변환용)
      if (row.CVALUE) {
        const vkey = cvalueKey(row.PCODE, row.CODE, row.LANGUAGE_CD);
        this.codeSysCvalueCache.set(vkey, row.CVALUE);
      }

      // HELP_MSG도 캐싱 (031~035 생산성 통계코드 툴팁용)
      if (row.HELP_MSG) {
        const hkey = helpMsgKey(row.PCODE, row.CODE, row.LANGUAGE_CD);
        this.codeSysHelpMsgCache.set(hkey, row.HELP_MSG);
      }
    }
  }

  /**
   * 캐시 리로드 (수동 갱신용)
   */
  async reloadCache(): Promise<void> {
    await this.loadAllCodes();
  }

  /**
   * 기본 언어코드 조회
   */
  getDefaultLang(): string {
    return this.defaultLang;
  }

  /**
   * TC_CODE_JOHAP 코드명 조회
   * @param pcode 부모코드 (예: '031')
   * @param code 코드값 (예: '031038')
   * @param lang 언어코드 (생략 시 환경변수 DEFAULT_LANG 사용)
   * @returns 코드명 또는 null
   */
  getCodeJohapName(pcode: string, code: string, lang?: string): string | null {
    const key = cacheKey(pcode, code, lang || this.defaultLang);
    return this.codeJohapCache.get(key) || null;
  }

  /**
   * TC_CODE_SYS 코드명 조회
   * @param pcode 부모코드 (예: '01')
   * @param code 코드값 (예: '010001')
   * @param lang 언어코드 (생략 시 환경변수 DEFAULT_LANG 사용)
   * @returns 코드명 또는 null
   */
  getCodeSysName(pcode: string, code: string, lang?: string): string | null {
    const key = cacheKey(pcode, code, lang || this.defaultLang);
    return this.codeSysCache.get(key) || null;
  }

  /**
   * 여러 코드를 한번에 코드명으로 변환 (TC_CODE_JOHAP)
   * @param pcode 부모코드
   * @param codes 코드값 배열
   * @param lang 언어코드 (생략 시 환경변수 DEFAULT_LANG 사용)
   * @returns Map<코드, 코드명>
   */
  getCodeJohapNames(pcode: string, codes: string[], lang?: string): Map<string, string> {
    const result = new Map<string, string>();
    const useLang = lang || this.defaultLang;
    for (const code of codes) {
      const name = this.getCodeJohapName(pcode, code, useLang);
      if (name) {
        result.set(code, name);
      }
    }
    return result;
  }

  /**
   * 여러 코드를 한번에 코드명으로 변환 (TC_CODE_SYS)
   * @param pcode 부모코드
   * @param codes 코드값 배열
   * @param lang 언어코드 (생략 시 환경변수 DEFAULT_LANG 사용)
   * @returns Map<코드, 코드명>
   */
  getCodeSysNames(pcode: string, codes: string[], lang?: string): Map<string, string> {
    const result = new Map<string, string>();
    const useLang = lang || this.defaultLang;
    for (const code of codes) {
      const name = this.getCodeSysName(pcode, code, useLang);
      if (name) {
        result.set(code, name);
      }
    }
    return result;
  }

  /**
   * TC_CODE_SYS CVALUE 조회 (941/942 언어변환용)
   * @param pcode 부모코드 (예: '941', '942')
   * @param code 코드값 (예: 'KOR', '01')
   * @param lang 언어코드 (생략 시 'ko' - 941/942는 언어와 무관)
   * @returns CVALUE 또는 null
   */
  getCodeSysCvalue(pcode: string, code: string, lang: string = 'ko'): string | null {
    const key = cvalueKey(pcode, code, lang);
    return this.codeSysCvalueCache.get(key) || null;
  }

  /**
   * TC_CODE_SYS HELP_MSG 조회 (031~035 생산성 통계코드 툴팁용)
   * @param pcode 부모코드 (예: '031', '032', '033', '034', '035')
   * @param code 코드값 (예: '035001')
   * @param lang 언어코드 (생략 시 환경변수 DEFAULT_LANG 사용)
   * @returns HELP_MSG (JSON 문자열) 또는 null
   *
   * @example
   * // 035001의 툴팁 조회
   * const helpMsg = comService.getCodeSysHelpMsg('035', '035001', 'ko');
   * // => '{"tooltip":"후보돈을 제외한 총 웅돈수"}'
   */
  getCodeSysHelpMsg(pcode: string, code: string, lang?: string): string | null {
    const key = helpMsgKey(pcode, code, lang || this.defaultLang);
    return this.codeSysHelpMsgCache.get(key) || null;
  }

  /**
   * TC_CODE_SYS HELP_MSG에서 tooltip 추출 (031~035 생산성 통계코드용)
   * @param pcode 부모코드 (예: '035')
   * @param code 코드값 (예: '035001')
   * @param lang 언어코드 (생략 시 환경변수 DEFAULT_LANG 사용)
   * @returns tooltip 문자열 또는 null
   *
   * @example
   * const tooltip = comService.getCodeSysTooltip('035', '035001', 'ko');
   * // => '후보돈을 제외한 총 웅돈수'
   */
  getCodeSysTooltip(pcode: string, code: string, lang?: string): string | null {
    const helpMsg = this.getCodeSysHelpMsg(pcode, code, lang);
    if (!helpMsg) return null;

    try {
      const parsed = JSON.parse(helpMsg);
      return parsed.tooltip || null;
    } catch {
      return null;
    }
  }

  /**
   * COUNTRY_CODE를 언어코드로 변환
   * 변환 체인: COUNTRY_CODE → 941 CVALUE → 942 CVALUE → 언어코드
   * @param countryCode 국가코드 (예: 'KOR', 'VNM', 'USA')
   * @returns 언어코드 (ko/en/vi) 또는 기본값 'ko'
   */
  convertCountryToLang(countryCode: string | null): string {
    const country = countryCode || 'KOR';

    // 941: COUNTRY_CODE → 언어그룹코드 (CVALUE)
    const langGroupCode = this.getCodeSysCvalue('941', country);
    if (!langGroupCode) {
      this.logger.warn(`언어그룹 조회 실패: COUNTRY_CODE=${country}`);
      return this.defaultLang;
    }

    // 942: 언어그룹코드 → 언어코드 (CVALUE)
    const langCode = this.getCodeSysCvalue('942', langGroupCode);
    if (!langCode) {
      this.logger.warn(`언어코드 조회 실패: 942.${langGroupCode}`);
      return this.defaultLang;
    }

    return langCode;
  }

  /**
   * 농장번호로 언어코드 조회 (캐시 우선)
   * @param farmNo 농장번호
   * @returns 언어코드 (ko/en/vi)
   */
  async getFarmLangCode(farmNo: number): Promise<string> {
    // 캐시 확인
    const cached = this.farmLangCache.get(farmNo);
    if (cached) {
      return cached;
    }

    // DB 조회 (941 → 942 체인)
    try {
      const results = await this.dataSource.query(COM_SQL.getFarmLangCode, params({ farmNo }));
      const langCode = results?.[0]?.LANG_CD || this.defaultLang;

      // 캐시 저장
      this.farmLangCache.set(farmNo, langCode);
      return langCode;
    } catch (error) {
      this.logger.error(`농장 언어코드 조회 실패: farmNo=${farmNo}`, error.message);
      return this.defaultLang;
    }
  }

  /**
   * 농장 언어 캐시 클리어 (농장정보 변경 시)
   */
  clearFarmLangCache(farmNo?: number): void {
    if (farmNo) {
      this.farmLangCache.delete(farmNo);
    } else {
      this.farmLangCache.clear();
    }
  }

  /**
   * Accept-Language 헤더에서 지원 언어코드 추출
   * @param acceptLanguage Accept-Language 헤더값 (예: "ko-KR,ko;q=0.9,en;q=0.8")
   * @returns 지원 언어코드 (ko/en/vi) 또는 기본값
   */
  parseAcceptLanguage(acceptLanguage: string | undefined): string {
    if (!acceptLanguage) {
      return this.defaultLang;
    }

    // 지원 언어 목록
    const supportedLangs = ['ko', 'en', 'vi'];

    // Accept-Language 파싱: "ko-KR,ko;q=0.9,en;q=0.8" → [{lang: 'ko-kr', q: 1}, ...]
    const parsed = acceptLanguage
      .split(',')
      .map((part) => {
        const [lang, qPart] = part.trim().split(';');
        const q = qPart ? parseFloat(qPart.replace('q=', '')) : 1;
        return { lang: lang.toLowerCase(), q };
      })
      .sort((a, b) => b.q - a.q);

    // 가장 높은 우선순위의 지원 언어 찾기
    for (const { lang } of parsed) {
      // ko-KR → ko
      const shortLang = lang.split('-')[0];
      if (supportedLangs.includes(shortLang)) {
        return shortLang;
      }
    }

    return this.defaultLang;
  }

  /**
   * 캐시 로딩 상태 확인
   */
  isCacheLoaded(): boolean {
    return this.isLoaded;
  }

  /**
   * 캐시 통계
   */
  getCacheStats(): { johap: number; sys: number; sysCvalue: number; sysHelpMsg: number; farmLang: number; loaded: boolean } {
    return {
      johap: this.codeJohapCache.size,
      sys: this.codeSysCache.size,
      sysCvalue: this.codeSysCvalueCache.size,
      sysHelpMsg: this.codeSysHelpMsgCache.size,
      farmLang: this.farmLangCache.size,
      loaded: this.isLoaded,
    };
  }

  /**
   * 공통코드 조회 (기존 메서드 유지)
   * @param grpCd 그룹코드
   */
  async getCodeList(grpCd: string): Promise<any[]> {
    const result = await this.dataSource.query(COM_SQL.getCodeList, [grpCd]);
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 농장 기본값 설정 (pig3.1 API 호출)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * 농장 기본값 조회 (주간보고서 작업예정 산정용)
   * - pig3.1 API 호출: /officers/api/ins/getFarmConfig.json
   *
   * @param farmNo 농장번호
   * @returns 농장 기본값 + 모돈 작업설정 (TB_PLAN_MODON) + inspig 설정 (TS_INS_CONF)
   */
  async getFarmConfig(farmNo: number): Promise<{
    farmConfig: Record<string, { code: string; name: string; value: number }>;
    planModon: Record<string, { seq: number; name: string; targetSow: string; elapsedDays: number }[]>;
    insConf: Record<string, { method: string; tasks: number[] }>;
  }> {
    const emptyResult = {
      farmConfig: {},
      planModon: { mating: [], farrowing: [], pregnancy: [], weaning: [], vaccine: [] },
      insConf: {
        mating: { method: 'farm', tasks: [] },
        farrowing: { method: 'farm', tasks: [] },
        pregnancy: { method: 'farm', tasks: [] },
        weaning: { method: 'farm', tasks: [] },
        vaccine: { method: 'modon', tasks: [] },
      },
    };

    try {
      const response = await fetch(`${PIG31_API_URL}/officers/api/ins/getFarmConfig.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmNo }),
      });

      if (!response.ok) {
        this.logger.error(`pig3.1 API 호출 실패: status=${response.status}`);
        return emptyResult;
      }

      const data = await response.json();

      if (!data.result) {
        this.logger.error(`pig3.1 API 응답 오류: ${data.msg}`);
        return emptyResult;
      }

      return {
        farmConfig: data.farmConfig || {},
        planModon: data.planModon || emptyResult.planModon,
        insConf: data.insConf || emptyResult.insConf,
      };
    } catch (error) {
      this.logger.error(`농장 기본값 조회 실패 (pig3.1 API): farmNo=${farmNo}`, error.message);
      return emptyResult;
    }
  }

  /**
   * 주간보고서 작업예정 설정 저장
   * - pig3.1 API 호출: /officers/api/ins/saveWeeklyConfig.json
   *
   * @param farmNo 농장번호
   * @param settings 작업예정 설정 (mating, farrowing, pregnancy, weaning, vaccine)
   */
  async saveWeeklyScheduleSettings(
    farmNo: number,
    settings: Record<string, { method: string; tasks: number[] }>,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${PIG31_API_URL}/officers/api/ins/saveWeeklyConfig.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmNo, settings }),
      });

      if (!response.ok) {
        this.logger.error(`pig3.1 API 호출 실패: status=${response.status}`);
        return { success: false, message: `API 호출 실패: ${response.status}` };
      }

      const data = await response.json();

      if (!data.result) {
        return { success: false, message: data.msg || '저장 실패' };
      }

      return { success: true, message: data.msg };
    } catch (error) {
      this.logger.error(`주간보고서 설정 저장 실패 (pig3.1 API): farmNo=${farmNo}`, error.message);
      return { success: false, message: error.message };
    }
  }
}
