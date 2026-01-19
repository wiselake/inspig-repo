import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * TS_INS_SERVICE: 인사이트피그플랜 서비스 신청 테이블
 * 서비스 사용권한 체크용
 * PK: FARM_NO + INSPIG_REG_DT (이력 관리 - 농장별 복수 구독 이력)
 */
@Entity({ name: 'TS_INS_SERVICE' })
export class TsInsService {
  @PrimaryColumn({ name: 'FARM_NO', type: 'number' })
  farmNo: number;

  /** 등록일자 (PK의 일부 - 이력 관리용) */
  @PrimaryColumn({ name: 'INSPIG_REG_DT', type: 'varchar2', length: 8 })
  inspigRegDt: string; // YYYYMMDD

  @Column({ name: 'INSPIG_YN', type: 'varchar2', length: 1, default: 'N' })
  inspigYn: string;

  @Column({ name: 'INSPIG_FROM_DT', type: 'varchar2', length: 8, nullable: true })
  inspigFromDt: string; // YYYYMMDD

  @Column({ name: 'INSPIG_TO_DT', type: 'varchar2', length: 8, nullable: true })
  inspigToDt: string; // YYYYMMDD

  @Column({ name: 'INSPIG_STOP_DT', type: 'varchar2', length: 8, nullable: true })
  inspigStopDt: string; // YYYYMMDD

  @Column({ name: 'WEB_PAY_YN', type: 'varchar2', length: 1, nullable: true })
  webPayYn: string;

  @Column({ name: 'USE_YN', type: 'varchar2', length: 1, default: 'Y' })
  useYn: string;
}
