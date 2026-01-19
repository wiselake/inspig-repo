import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { TaMember } from './entities';
import { JwtPayload, LoginResponseDto } from './dto';
import { AUTH_SQL } from './sql';
import { ComService } from '../com/com.service';
import { todayKst } from '../../common/utils';

/**
 * Named parameter를 TypeORM query에 전달하기 위한 헬퍼
 */
const params = (obj: Record<string, any>): any => obj;

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly comService: ComService,
  ) { }

  /**
   * 로그인 처리
   * 1. 아이디/비밀번호 체크
   * 2. FARM_NO가 부여된 회원인지 체크
   * 3. TS_INS_SERVICE에서 서비스 사용권한 체크
   */
  async login(memberId: string, password: string): Promise<LoginResponseDto> {
    // 1단계: 아이디/비밀번호 체크
    const members = await this.dataSource.query(AUTH_SQL.login, params({ memberId, password }));
    const member = members[0];

    if (!member) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    // 2단계: 농장코드 부여 여부 체크
    if (!member.FARM_NO || member.FARM_NO === 0) {
      throw new ForbiddenException('농장이 등록되지 않은 계정입니다. 관리자에게 문의하세요.');
    }

    // 3단계: 서비스 사용권한 체크
    // SQL에서 유효 조건 체크 (INSPIG_YN='Y', USE_YN='Y', 기간 유효, 최신 건)
    const services = await this.dataSource.query(AUTH_SQL.getService, params({ farmNo: member.FARM_NO }));
    const service = services[0];

    if (!service) {
      // 현재 유효한 서비스가 없음 (미등록, 만료, 중지 등)
      throw new ForbiddenException('인사이트피그 서비스가 유효하지 않습니다. (미등록/만료/중지) 관리자에게 문의하세요.');
    }

    // SQL에서 이미 유효한 최신 건만 조회되므로 추가 검증은 불필요하나 방어적으로 유지
    // 날짜 포맷팅 헬퍼 (YYYYMMDD → YYYY-MM-DD)
    const formatDate = (dt: string) => dt ? `${dt.slice(0, 4)}-${dt.slice(4, 6)}-${dt.slice(6, 8)}` : '';
    const fromDt = service.INSPIG_FROM_DT || '';
    const toDt = service.INSPIG_TO_DT || '99991231';

    // 4단계: 농장명 및 언어코드 조회
    const farms = await this.dataSource.query(AUTH_SQL.getFarm, params({ farmNo: member.FARM_NO }));
    const farm = farms[0];
    const farmNm = farm?.FARM_NM || '';

    // COUNTRY_CODE → 941 → 942 → 언어코드 변환
    const lang = this.comService.convertCountryToLang(farm?.COUNTRY_CODE);

    // JWT 페이로드 생성
    const payload: JwtPayload = {
      memberId: member.MEMBER_ID,
      farmNo: member.FARM_NO,
      farmNm,
      name: member.NAME,
      memberType: member.MEMBER_TYPE,
      lang,
    };

    // 마지막 접속일 업데이트
    await this.dataSource.query(AUTH_SQL.updateLastLogin, params({ memberId }));

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        memberId: member.MEMBER_ID,
        name: member.NAME,
        farmNo: member.FARM_NO,
        farmNm,
        memberType: member.MEMBER_TYPE,
        email: member.EMAIL,
        lang,
      },
    };
  }

  /**
   * 토큰 검증 및 사용자 정보 반환
   */
  async validateToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }

  /**
   * 회원 정보 조회 (farmNo 기준)
   */
  async getMemberByFarmNo(farmNo: number): Promise<TaMember | null> {
    const members = await this.dataSource.query(AUTH_SQL.getMemberByFarmNo, params({ farmNo }));
    return members[0] ? this.mapToMember(members[0]) : null;
  }

  /**
   * 회원 ID로 조회
   */
  async getMemberById(memberId: string): Promise<TaMember | null> {
    const members = await this.dataSource.query(AUTH_SQL.getMemberById, params({ memberId }));
    return members[0] ? this.mapToMember(members[0]) : null;
  }

  /**
   * 서비스 권한 조회
   */
  async getServiceByFarmNo(farmNo: number): Promise<any | null> {
    const services = await this.dataSource.query(AUTH_SQL.getService, params({ farmNo }));
    return services[0] || null;
  }

  /**
   * 스케줄 그룹 업데이트
   * @param farmNo 농장번호
   * @param scheduleGroupWeek 주간 스케줄 그룹 (AM7/PM2)
   * @returns 업데이트 성공 여부
   */
  async updateScheduleGroup(farmNo: number, scheduleGroupWeek: string): Promise<boolean> {
    // 먼저 유효한 서비스가 있는지 확인
    const service = await this.getServiceByFarmNo(farmNo);
    if (!service) {
      return false;
    }

    // 스케줄 그룹 유효성 검증
    if (!['AM7', 'PM2'].includes(scheduleGroupWeek)) {
      return false;
    }

    // 업데이트 실행
    await this.dataSource.query(AUTH_SQL.updateScheduleGroup, params({
      farmNo,
      inspigRegDt: service.INSPIG_REG_DT,
      scheduleGroupWeek,
    }));

    return true;
  }

  /**
   * Raw SQL 결과를 TaMember 형식으로 매핑
   */
  private mapToMember(row: any): TaMember {
    const member = new TaMember();
    member.memberId = row.MEMBER_ID;
    member.companyCd = row.COMPANY_CD;
    member.soleCd = row.SOLE_CD;
    member.agentCd = row.AGENT_CD;
    member.farmNo = row.FARM_NO;
    member.memberType = row.MEMBER_TYPE;
    member.memberTypeD = row.MEMBER_TYPE_D;
    member.name = row.NAME;
    member.position = row.POSITION;
    member.email = row.EMAIL;
    member.hpNum = row.HP_NUM;
    member.useYn = row.USE_YN;
    return member;
  }
}
