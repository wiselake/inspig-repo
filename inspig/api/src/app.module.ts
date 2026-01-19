import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Modules
import { WeeklyModule } from './modules/weekly';
import { AuthModule } from './modules/auth';
import { BatchModule } from './modules/batch';
import { ConfigModule as InsConfigModule } from './modules/config';

// Config
import configs from './config';

// Common
import { CustomTypeOrmLogger } from './common';

// Entities (모듈별로 분리되었지만 TypeORM에서 전역 등록용)
import { TsInsMaster, TsInsWeek, TsInsWeekSub } from './modules/weekly/entities';
import { TaMember, TaFarm, TsInsService } from './modules/auth/entities';

@Module({
  imports: [
    // 환경 설정
    ConfigModule.forRoot({
      isGlobal: true,
      load: configs,
    }),

    // 데이터베이스 설정
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'oracle',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        serviceName: configService.get<string>('database.serviceName'),
        entities: [TsInsMaster, TsInsWeek, TsInsWeekSub, TaMember, TaFarm, TsInsService],
        synchronize: false,
        logging: configService.get<string>('app.nodeEnv') !== 'production',
        logger:
          configService.get<string>('app.nodeEnv') !== 'production'
            ? new CustomTypeOrmLogger()
            : undefined,
      }),
    }),

    // Feature Modules
    WeeklyModule,
    AuthModule,
    BatchModule,
    InsConfigModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
