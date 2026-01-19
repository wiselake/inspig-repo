import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Headers,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto';

/**
 * 인증 API 컨트롤러
 * @route /api/auth
 */
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 로그인
   * POST /api/auth/login
   */
  @Post('login')
  async login(@Body() loginDto: LoginRequestDto) {
    const result = await this.authService.login(
      loginDto.memberId,
      loginDto.password,
    );
    return {
      success: true,
      data: result,
    };
  }

  /**
   * 토큰 검증 및 사용자 정보 조회
   * GET /api/auth/me
   */
  @Get('me')
  async getMe(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('인증 토큰이 필요합니다.');
    }

    const token = authHeader.substring(7);
    const payload = await this.authService.validateToken(token);

    return {
      success: true,
      data: {
        memberId: payload.memberId,
        name: payload.name,
        farmNo: payload.farmNo,
        farmNm: payload.farmNm,
        memberType: payload.memberType,
      },
    };
  }

  /**
   * 서비스 정보 조회
   * GET /api/auth/service
   */
  @Get('service')
  async getService(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('인증 토큰이 필요합니다.');
    }

    const token = authHeader.substring(7);
    const payload = await this.authService.validateToken(token);

    const service = await this.authService.getServiceByFarmNo(payload.farmNo);
    if (!service) {
      return {
        success: true,
        data: null,
      };
    }

    return {
      success: true,
      data: {
        farmNo: service.FARM_NO,
        inspigYn: service.INSPIG_YN,
        inspigFromDt: service.INSPIG_FROM_DT,
        inspigToDt: service.INSPIG_TO_DT,
        scheduleGroupWeek: service.SCHEDULE_GROUP_WEEK || 'AM7',
        scheduleGroupMonth: service.SCHEDULE_GROUP_MONTH || 'AM7',
        scheduleGroupQuarter: service.SCHEDULE_GROUP_QUARTER || 'AM7',
        useYn: service.USE_YN,
      },
    };
  }

  /**
   * 스케줄 그룹 업데이트
   * PUT /api/auth/service/schedule-group
   */
  @Put('service/schedule-group')
  async updateScheduleGroup(
    @Headers('authorization') authHeader: string,
    @Body() body: { scheduleGroupWeek: string },
  ) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('인증 토큰이 필요합니다.');
    }

    const token = authHeader.substring(7);
    const payload = await this.authService.validateToken(token);

    // 스케줄 그룹 유효성 검증
    if (!body.scheduleGroupWeek || !['AM7', 'PM2'].includes(body.scheduleGroupWeek)) {
      throw new BadRequestException('유효하지 않은 스케줄 그룹입니다. (AM7 또는 PM2)');
    }

    const success = await this.authService.updateScheduleGroup(
      payload.farmNo,
      body.scheduleGroupWeek,
    );

    if (!success) {
      throw new BadRequestException('서비스가 유효하지 않아 스케줄 그룹을 변경할 수 없습니다.');
    }

    return {
      success: true,
      message: '스케줄 그룹이 변경되었습니다.',
    };
  }

  /**
   * 토큰 갱신
   * POST /api/auth/refresh
   */
  @Post('refresh')
  async refresh(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('인증 토큰이 필요합니다.');
    }

    const token = authHeader.substring(7);
    const payload = await this.authService.validateToken(token);

    // 사용자 정보를 다시 조회하여 최신 정보로 토큰 재발급
    const member = await this.authService.getMemberById(payload.memberId);
    if (!member) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    const result = await this.authService.login(member.memberId, member.password);
    return {
      success: true,
      data: result,
    };
  }
}
