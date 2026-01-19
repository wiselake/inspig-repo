import { Controller, Post, Body, Logger } from '@nestjs/common';
import { BatchService } from './batch.service';

/**
 * 수동 ETL 실행 컨트롤러
 * 정기 배치는 inspig-etl에서 처리 (crontab)
 */
@Controller('batch')
export class BatchController {
    private readonly logger = new Logger(BatchController.name);

    constructor(private readonly batchService: BatchService) { }

    /**
     * 특정 농장 ETL 수동 실행
     * POST /batch/manual
     *
     * @body farmNo - 농장번호 (필수)
     * @body dtFrom - 시작일 YYYYMMDD (선택, 없으면 자동 계산)
     * @body dtTo - 종료일 YYYYMMDD (선택, 없으면 자동 계산)
     *
     * @example
     * { "farmNo": 12345 }
     * { "farmNo": 12345, "dtFrom": "20251215", "dtTo": "20251221" }
     */
    @Post('manual')
    async runManualEtl(
        @Body('farmNo') farmNo: number,
        @Body('dtFrom') dtFrom?: string,
        @Body('dtTo') dtTo?: string,
    ) {
        this.logger.log(`수동 ETL 요청: 농장=${farmNo}, 기간=${dtFrom || 'auto'}~${dtTo || 'auto'}`);

        if (!farmNo) {
            return {
                success: false,
                message: 'farmNo는 필수입니다.',
            };
        }

        return await this.batchService.runManualEtl(farmNo, dtFrom, dtTo);
    }
}
