import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeeklyController } from './weekly.controller';
import { WeeklyService } from './weekly.service';
import { TsInsMaster, TsInsWeek, TsInsWeekSub } from './entities';
import { AuthModule } from '../auth/auth.module';
import { ComModule } from '../com/com.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TsInsMaster, TsInsWeek, TsInsWeekSub]),
    AuthModule, // JwtModule 사용을 위해 import
    ComModule, // 코드 캐시 서비스 사용을 위해 import
  ],
  controllers: [WeeklyController],
  providers: [WeeklyService],
  exports: [WeeklyService],
})
export class WeeklyModule {}
