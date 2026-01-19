import { Module } from '@nestjs/common';
import { ComService } from './com.service';

/**
 * 공통 모듈
 * - 시스템 전반에서 공유되는 공통 기능 제공
 * - 코드성 데이터, 공통 조회 등
 */
@Module({
  providers: [ComService],
  exports: [ComService],
})
export class ComModule {}
