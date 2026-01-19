import { Controller, Get, Post, Param, Body, NotFoundException, BadRequestException } from '@nestjs/common';
import { ComService } from '../com/com.service';

/**
 * 주간보고서 설정 저장 요청 DTO
 */
interface SaveWeeklySettingsDto {
  mating?: { method: string; tasks: number[] };
  farrowing?: { method: string; tasks: number[] };
  pregnancy?: { method: string; tasks: number[] };
  weaning?: { method: string; tasks: number[] };
  vaccine?: { method: string; tasks: number[] };
}

/**
 * 설정 API 컨트롤러
 * - 농장 기본값 조회
 * - 모돈 작업설정 조회/저장
 *
 * @route /api/config
 */
@Controller('api/config')
export class ConfigController {
  constructor(private readonly comService: ComService) {}

  /**
   * 농장 기본값 및 모돈 작업설정 조회
   * GET /api/config/farm/:farmNo
   */
  @Get('farm/:farmNo')
  async getFarmConfig(@Param('farmNo') farmNo: string) {
    const farmNoNum = parseInt(farmNo, 10);
    if (!farmNoNum) {
      throw new NotFoundException('farmNo is required');
    }

    const data = await this.comService.getFarmConfig(farmNoNum);

    return {
      success: true,
      data,
    };
  }

  /**
   * 주간보고서 작업예정 설정 저장
   * POST /api/config/farm/:farmNo/weekly
   *
   * 요청 형식:
   * {
   *   mating: { method: "farm" | "modon", tasks: [1, 2, 3] },
   *   farrowing: { method: "farm" | "modon", tasks: [4, 5] },
   *   ...
   * }
   */
  @Post('farm/:farmNo/weekly')
  async saveWeeklySettings(
    @Param('farmNo') farmNo: string,
    @Body() body: SaveWeeklySettingsDto,
  ) {
    const farmNoNum = parseInt(farmNo, 10);
    if (!farmNoNum) {
      throw new NotFoundException('farmNo is required');
    }

    // 모돈 작업설정 선택 시 tasks가 비어있어도 저장 허용
    // TB_PLAN_MODON에 해당 작업이 없는 경우 빈 배열로 저장됨

    const result = await this.comService.saveWeeklyScheduleSettings(
      farmNoNum,
      body as Record<string, { method: string; tasks: number[] }>,
    );

    if (!result.success) {
      throw new BadRequestException(result.message || '저장에 실패했습니다.');
    }

    return {
      success: true,
      message: '저장되었습니다.',
    };
  }
}
