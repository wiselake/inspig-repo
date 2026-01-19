import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { spawn } from 'child_process';
import * as path from 'path';
import { BATCH_SQL } from './sql/batch.sql';

/**
 * 수동 ETL 실행 서비스
 * 정기 배치는 inspig-etl에서 처리
 */
@Injectable()
export class BatchService {
    private readonly logger = new Logger(BatchService.name);
    private readonly ETL_PROJECT_PATH = process.env.ETL_PROJECT_PATH || 'C:\\Projects\\inspig-etl';

    constructor(private readonly dataSource: DataSource) { }

    /**
     * 특정 농장 수동 ETL 실행
     * @param farmNo 농장번호
     * @param dtFrom 시작일 (YYYYMMDD, 선택)
     * @param dtTo 종료일 (YYYYMMDD, 선택)
     */
    async runManualEtl(farmNo: number, dtFrom?: string, dtTo?: string): Promise<{ success: boolean; message: string; taskId?: string }> {
        this.logger.log(`[수동 ETL] 요청: 농장=${farmNo}, 기간=${dtFrom || 'auto'}~${dtTo || 'auto'}`);

        // 1. 농장 존재 여부 확인
        const farm = await this.dataSource.query(BATCH_SQL.checkFarmExists, { farmNo } as any);
        if (!farm || farm.length === 0) {
            throw new BadRequestException(`농장번호 ${farmNo}를 찾을 수 없습니다.`);
        }



        // 2. TS_INS_SERVICE MANUAL 등록 (없으면 생성, 있으면 MANUAL로 업데이트)
        await this.dataSource.query(BATCH_SQL.upsertManualService, { farmNo } as any);
        this.logger.log(`[수동 ETL] 서비스 등록 완료: 농장=${farmNo}, REG_TYPE=MANUAL`);

        // 3. Python ETL 비동기 실행
        const taskId = `manual_${farmNo}_${Date.now()}`;
        this.executePythonEtl(farmNo, dtFrom, dtTo, taskId);

        return {
            success: true,
            message: `ETL 작업이 시작되었습니다. 농장=${farmNo}`,
            taskId,
        };
    }

    /**
     * Python ETL 스크립트 실행 (비동기)
     */
    private executePythonEtl(farmNo: number, dtFrom?: string, dtTo?: string, taskId?: string): void {
        const pythonPath = process.env.PYTHON_PATH || 'python';
        const scriptPath = path.join(this.ETL_PROJECT_PATH, 'src', 'weekly', 'cli.py');

        // CLI 인자 구성
        const args = [scriptPath, '--farm-no', farmNo.toString(), '--manual'];
        if (dtFrom) args.push('--dt-from', dtFrom);
        if (dtTo) args.push('--dt-to', dtTo);

        this.logger.log(`[수동 ETL] Python 실행: ${pythonPath} ${args.join(' ')}`);

        const child = spawn(pythonPath, args, {
            cwd: this.ETL_PROJECT_PATH,
            env: { ...process.env },
            stdio: ['ignore', 'pipe', 'pipe'],
        });

        child.stdout.on('data', (data) => {
            this.logger.log(`[ETL:${taskId}] ${data.toString().trim()}`);
        });

        child.stderr.on('data', (data) => {
            this.logger.warn(`[ETL:${taskId}] ${data.toString().trim()}`);
        });

        child.on('close', (code) => {
            if (code === 0) {
                this.logger.log(`[ETL:${taskId}] 완료 (exit code: ${code})`);
            } else {
                this.logger.error(`[ETL:${taskId}] 실패 (exit code: ${code})`);
            }
        });

        child.on('error', (err) => {
            this.logger.error(`[ETL:${taskId}] 프로세스 오류: ${err.message}`);
        });
    }
}
