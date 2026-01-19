import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { TsInsMaster } from './ts-ins-master.entity';
import { TsInsWeekSub } from './ts-ins-week-sub.entity';

/**
 * TS_INS_WEEK: 주간 리포트 테이블
 * 농장별 주간 리포트 요약 데이터
 */
@Entity({ name: 'TS_INS_WEEK' })
export class TsInsWeek {
  @PrimaryColumn({ name: 'MASTER_SEQ', type: 'number' })
  masterSeq: number;

  @PrimaryColumn({ name: 'FARM_NO', type: 'number' })
  farmNo: number;

  // 기간 정보
  @Column({ name: 'REPORT_YEAR', type: 'number', precision: 4, nullable: true })
  reportYear: number;

  @Column({
    name: 'REPORT_WEEK_NO',
    type: 'number',
    precision: 2,
    nullable: true,
  })
  reportWeekNo: number;

  @Column({ name: 'DT_FROM', type: 'varchar2', length: 8, nullable: true })
  dtFrom: string; // YYYYMMDD

  @Column({ name: 'DT_TO', type: 'varchar2', length: 8, nullable: true })
  dtTo: string; // YYYYMMDD

  // 헤더 정보
  @Column({ name: 'FARM_NM', type: 'varchar2', length: 100, nullable: true })
  farmNm: string;

  @Column({ name: 'OWNER_NM', type: 'varchar2', length: 50, nullable: true })
  ownerNm: string;

  @Column({ name: 'SIGUNGU_CD', type: 'varchar2', length: 10, nullable: true })
  sigunguCd: string;

  // 모돈 현황
  @Column({ name: 'MODON_REG_CNT', type: 'number', default: 0 })
  modonRegCnt: number;

  @Column({ name: 'MODON_SANGSI_CNT', type: 'number', default: 0 })
  modonSangsiCnt: number;

  @Column({ name: 'MODON_REG_CHG', type: 'number', default: 0 })
  modonRegChg: number;  // 현재모돈 전주대비 증감

  @Column({ name: 'MODON_SANGSI_CHG', type: 'number', default: 0 })
  modonSangsiChg: number;  // 상시모돈 전주대비 증감

  // 관리대상 모돈 요약
  @Column({ name: 'ALERT_TOTAL', type: 'number', default: 0 })
  alertTotal: number;

  @Column({ name: 'ALERT_HUBO', type: 'number', default: 0 })
  alertHubo: number;

  @Column({ name: 'ALERT_EU_MI', type: 'number', default: 0 })
  alertEuMi: number;

  @Column({ name: 'ALERT_SG_MI', type: 'number', default: 0 })
  alertSgMi: number;

  @Column({ name: 'ALERT_BM_DELAY', type: 'number', default: 0 })
  alertBmDelay: number;

  @Column({ name: 'ALERT_EU_DELAY', type: 'number', default: 0 })
  alertEuDelay: number;

  // 지난주 교배 실적
  @Column({ name: 'LAST_GB_CNT', type: 'number', default: 0 })
  lastGbCnt: number;

  @Column({ name: 'LAST_GB_SUM', type: 'number', default: 0 })
  lastGbSum: number;

  // 지난주 분만 실적
  @Column({ name: 'LAST_BM_CNT', type: 'number', default: 0 })
  lastBmCnt: number;

  @Column({ name: 'LAST_BM_TOTAL', type: 'number', default: 0 })
  lastBmTotal: number;

  @Column({ name: 'LAST_BM_LIVE', type: 'number', default: 0 })
  lastBmLive: number;

  @Column({ name: 'LAST_BM_DEAD', type: 'number', default: 0 })
  lastBmDead: number;

  @Column({ name: 'LAST_BM_MUMMY', type: 'number', default: 0 })
  lastBmMummy: number;

  @Column({ name: 'LAST_BM_SUM_CNT', type: 'number', default: 0 })
  lastBmSumCnt: number;

  @Column({ name: 'LAST_BM_SUM_TOTAL', type: 'number', default: 0 })
  lastBmSumTotal: number;

  @Column({ name: 'LAST_BM_SUM_LIVE', type: 'number', default: 0 })
  lastBmSumLive: number;

  @Column({ name: 'LAST_BM_AVG_TOTAL', type: 'number', precision: 5, scale: 1, default: 0 })
  lastBmAvgTotal: number;

  @Column({ name: 'LAST_BM_AVG_LIVE', type: 'number', precision: 5, scale: 1, default: 0 })
  lastBmAvgLive: number;

  @Column({ name: 'LAST_BM_SUM_AVG_TOTAL', type: 'number', precision: 5, scale: 1, default: 0 })
  lastBmSumAvgTotal: number;

  @Column({ name: 'LAST_BM_SUM_AVG_LIVE', type: 'number', precision: 5, scale: 1, default: 0 })
  lastBmSumAvgLive: number;

  @Column({ name: 'LAST_BM_CHG_TOTAL', type: 'number', precision: 5, scale: 1, default: 0 })
  lastBmChgTotal: number;

  @Column({ name: 'LAST_BM_CHG_LIVE', type: 'number', precision: 5, scale: 1, default: 0 })
  lastBmChgLive: number;

  // 지난주 이유 실적
  @Column({ name: 'LAST_EU_CNT', type: 'number', default: 0 })
  lastEuCnt: number;

  @Column({ name: 'LAST_EU_JD_CNT', type: 'number', default: 0 })
  lastEuJdCnt: number;

  @Column({ name: 'LAST_EU_AVG_JD', type: 'number', precision: 5, scale: 1, default: 0 })
  lastEuAvgJd: number;  // 지난주 평균 이유두수

  @Column({ name: 'LAST_EU_AVG_KG', type: 'number', precision: 5, scale: 1, default: 0 })
  lastEuAvgKg: number;

  @Column({ name: 'LAST_EU_SUM_CNT', type: 'number', default: 0 })
  lastEuSumCnt: number;

  @Column({ name: 'LAST_EU_SUM_JD', type: 'number', default: 0 })
  lastEuSumJd: number;

  @Column({ name: 'LAST_EU_SUM_AVG_JD', type: 'number', precision: 5, scale: 1, default: 0 })
  lastEuSumAvgJd: number;

  @Column({ name: 'LAST_EU_CHG_JD', type: 'number', precision: 5, scale: 1, default: 0 })
  lastEuChgJd: number;  // 평균 이유두수 증감 (1년평균 대비)

  @Column({ name: 'LAST_EU_CHG_KG', type: 'number', precision: 5, scale: 1, default: 0 })
  lastEuChgKg: number;

  // 지난주 임신사고
  @Column({ name: 'LAST_SG_CNT', type: 'number', default: 0 })
  lastSgCnt: number;

  @Column({ name: 'LAST_SG_AVG_GYUNGIL', type: 'number', precision: 5, scale: 1, default: 0 })
  lastSgAvgGyungil: number;  // 지난주 평균 경과일

  @Column({ name: 'LAST_SG_SUM', type: 'number', default: 0 })
  lastSgSum: number;

  @Column({ name: 'LAST_SG_SUM_AVG_GYUNGIL', type: 'number', precision: 5, scale: 1, default: 0 })
  lastSgSumAvgGyungil: number;  // 당해년도 평균 경과일

  // 지난주 도태폐사
  @Column({ name: 'LAST_CL_CNT', type: 'number', default: 0 })
  lastClCnt: number;

  @Column({ name: 'LAST_CL_SUM', type: 'number', default: 0 })
  lastClSum: number;

  // 지난주 출하 실적
  @Column({ name: 'LAST_SH_CNT', type: 'number', default: 0 })
  lastShCnt: number;

  @Column({ name: 'LAST_SH_AVG_KG', type: 'number', precision: 5, scale: 1, default: 0 })
  lastShAvgKg: number;

  @Column({ name: 'LAST_SH_SUM', type: 'number', default: 0 })
  lastShSum: number;

  @Column({ name: 'LAST_SH_AVG_SUM', type: 'number', precision: 5, scale: 1, default: 0 })
  lastShAvgSum: number;

  // 금주 예정 요약
  @Column({ name: 'THIS_GB_SUM', type: 'number', default: 0 })
  thisGbSum: number;

  @Column({ name: 'THIS_IMSIN_SUM', type: 'number', default: 0 })
  thisImsinSum: number;

  @Column({ name: 'THIS_BM_SUM', type: 'number', default: 0 })
  thisBmSum: number;

  @Column({ name: 'THIS_EU_SUM', type: 'number', default: 0 })
  thisEuSum: number;

  @Column({ name: 'THIS_VACCINE_SUM', type: 'number', default: 0 })
  thisVaccineSum: number;

  @Column({ name: 'THIS_SHIP_SUM', type: 'number', default: 0 })
  thisShipSum: number;

  // KPI 요약
  @Column({ name: 'KPI_PSY', type: 'number', precision: 5, scale: 1, default: 0 })
  kpiPsy: number;

  @Column({ name: 'KPI_DELAY_DAY', type: 'number', default: 0 })
  kpiDelayDay: number;

  // PSY 히트맵
  @Column({ name: 'PSY_X', type: 'number', default: 0 })
  psyX: number;

  @Column({ name: 'PSY_Y', type: 'number', default: 0 })
  psyY: number;

  @Column({ name: 'PSY_ZONE', type: 'varchar2', length: 10, nullable: true })
  psyZone: string;

  // 상태
  @Column({ name: 'STATUS_CD', type: 'varchar2', length: 10, default: 'READY' })
  statusCd: string;

  // 공유 토큰 (외부 URL 공유용)
  @Column({ name: 'SHARE_TOKEN', type: 'varchar2', length: 64, nullable: true })
  shareToken: string;

  @Column({ name: 'TOKEN_EXPIRE_DT', type: 'varchar2', length: 8, nullable: true })
  tokenExpireDt: string; // YYYYMMDD

  @Column({ name: 'LOG_INS_DT', type: 'date', default: () => 'SYSDATE' })
  logInsDt: Date;

  // Relations
  @ManyToOne(() => TsInsMaster, (master) => master.weeks)
  @JoinColumn({ name: 'MASTER_SEQ' })
  master: TsInsMaster;

  @OneToMany(() => TsInsWeekSub, (sub) => sub.week)
  subs: TsInsWeekSub[];
}
