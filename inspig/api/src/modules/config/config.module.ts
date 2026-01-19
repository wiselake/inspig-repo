import { Module } from '@nestjs/common';
import { ConfigController } from './config.controller';
import { ComModule } from '../com/com.module';

/**
 * 설정 모듈
 * - 농장 기본값 설정
 * - 주간보고서 작업예정 산정 설정
 */
@Module({
  imports: [ComModule],
  controllers: [ConfigController],
})
export class ConfigModule {}
