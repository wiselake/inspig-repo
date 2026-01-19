import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SHARE_TOKEN_SQL } from './sql';
import { nowKst, parseExpireDateKst } from '../../common/utils';

/**
 * Named parameter를 TypeORM query에 전달하기 위한 헬퍼
 */
const params = (obj: Record<string, any>): any => obj;

/**
 * 보고서 타입
 * - weekly: 주간 보고서
 * - monthly: 월간 보고서 (예정)
 * - quarterly: 분기 보고서 (예정)
 */
export type ReportType = 'weekly' | 'monthly' | 'quarterly';

/**
 * 토큰 검증 결과
 */
export interface TokenValidationResult {
  valid: boolean;
  expired: boolean;
  reportType: ReportType;
  masterSeq?: number;
  farmNo?: number;
  farmNm?: string;
  message?: string;
}

/**
 * 공유 토큰 서비스
 * - 공유 토큰 검증, 생성, 조회 담당
 * - 주간/월간/분기 모든 보고서 타입 지원
 */
@Injectable()
export class ShareTokenService {
  private readonly logger = new Logger(ShareTokenService.name);

  constructor(private readonly dataSource: DataSource) { }

  /**
   * 공유 토큰 검증 (만료일 체크 포함)
   * @param shareToken 공유 토큰 (64자 SHA256 해시)
   * @param reportType 보고서 타입 (기본: weekly)
   * @returns TokenValidationResult
   */
  async validateShareToken(
    shareToken: string,
    reportType: ReportType = 'weekly',
  ): Promise<TokenValidationResult> {
    try {
      // 현재는 weekly만 지원, 추후 monthly/quarterly 추가
      if (reportType !== 'weekly') {
        return {
          valid: false,
          expired: false,
          reportType,
          message: `${reportType} 보고서는 아직 지원되지 않습니다.`,
        };
      }

      const results = await this.dataSource.query(SHARE_TOKEN_SQL.validateToken, params({ shareToken }));
      const week = results[0];

      if (!week) {
        return {
          valid: false,
          expired: false,
          reportType,
          message: '리포트를 찾을 수 없습니다.',
        };
      }

      // 만료일 체크 (한국 시간 기준)
      if (week.TOKEN_EXPIRE_DT) {
        const now = nowKst();
        const expireDate = parseExpireDateKst(week.TOKEN_EXPIRE_DT);
        if (now > expireDate) {
          return {
            valid: false,
            expired: true,
            reportType,
            masterSeq: week.MASTER_SEQ,
            farmNo: week.FARM_NO,
            farmNm: week.FARM_NM,
            message: '공유 링크가 만료되었습니다.',
          };
        }
      }

      return {
        valid: true,
        expired: false,
        reportType,
        masterSeq: week.MASTER_SEQ,
        farmNo: week.FARM_NO,
        farmNm: week.FARM_NM,
      };
    } catch (error) {
      this.logger.error('토큰 검증 실패', error.message);
      return {
        valid: false,
        expired: false,
        reportType,
        message: '토큰 검증 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 주간 보고서용 토큰 검증 (기존 호환성 유지)
   * @deprecated validateShareToken(token, 'weekly') 사용 권장
   */
  async validateWeeklyShareToken(shareToken: string): Promise<{
    valid: boolean;
    expired: boolean;
    week: any | null;
    message?: string;
  }> {
    try {
      const results = await this.dataSource.query(SHARE_TOKEN_SQL.validateToken, params({ shareToken }));
      const week = results[0];

      if (!week) {
        return { valid: false, expired: false, week: null, message: '리포트를 찾을 수 없습니다.' };
      }

      // 만료일 체크 (한국 시간 기준)
      if (week.TOKEN_EXPIRE_DT) {
        const now = nowKst();
        const expireDate = parseExpireDateKst(week.TOKEN_EXPIRE_DT);
        if (now > expireDate) {
          return { valid: false, expired: true, week, message: '공유 링크가 만료되었습니다.' };
        }
      }

      return { valid: true, expired: false, week };
    } catch (error) {
      this.logger.error('토큰 검증 실패', error.message);
      return { valid: false, expired: false, week: null, message: '토큰 검증 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 리포트의 공유 토큰 조회
   * @param masterSeq 마스터 SEQ
   * @param farmNo 농장번호
   * @param reportType 보고서 타입 (기본: weekly)
   */
  async getShareToken(
    masterSeq: number,
    farmNo: number,
    reportType: ReportType = 'weekly',
  ): Promise<string | null> {
    try {
      // 현재는 weekly만 지원
      if (reportType !== 'weekly') {
        this.logger.warn(`${reportType} 보고서는 아직 지원되지 않습니다.`);
        return null;
      }

      const results = await this.dataSource.query(SHARE_TOKEN_SQL.getTokenByReport, params({
        masterSeq,
        farmNo,
      }));
      return results[0]?.SHARE_TOKEN || null;
    } catch (error) {
      this.logger.error('토큰 조회 실패', error.message);
      return null;
    }
  }

  /**
   * 공유 토큰 생성/갱신
   * @param masterSeq 마스터 SEQ
   * @param farmNo 농장번호
   * @param reportType 보고서 타입 (기본: weekly)
   * @param expireDays 만료일 (기본 7일)
   */
  async generateShareToken(
    masterSeq: number,
    farmNo: number,
    reportType: ReportType = 'weekly',
    expireDays: number = 7,
  ): Promise<string | null> {
    try {
      // 현재는 weekly만 지원
      if (reportType !== 'weekly') {
        this.logger.warn(`${reportType} 보고서는 아직 지원되지 않습니다.`);
        return null;
      }

      await this.dataSource.query(SHARE_TOKEN_SQL.generateToken, params({ expireDays, masterSeq, farmNo }));

      // 생성된 토큰 조회
      const results = await this.dataSource.query(SHARE_TOKEN_SQL.getTokenByReport, params({
        masterSeq,
        farmNo,
      }));
      return results[0]?.SHARE_TOKEN || null;
    } catch (error) {
      this.logger.error('토큰 생성 실패', error.message);
      return null;
    }
  }
}
