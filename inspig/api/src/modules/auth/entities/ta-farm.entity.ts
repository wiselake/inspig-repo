import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * TA_FARM: 농장 정보 테이블
 * 농장번호(FARM_NO)와 농장명(FARM_NM) 등을 관리
 */
@Entity({ name: 'TA_FARM' })
export class TaFarm {
  @PrimaryColumn({ name: 'FARM_NO', type: 'number' })
  farmNo: number;

  @Column({ name: 'FARM_NM', type: 'varchar2', length: 100, nullable: true })
  farmNm: string;

  @Column({ name: 'COMPANY_CD', type: 'number', default: 0 })
  companyCd: number;

  @Column({ name: 'SOLE_CD', type: 'number', default: 0 })
  soleCd: number;

  @Column({ name: 'AGENT_CD', type: 'number', default: 0 })
  agentCd: number;

  @Column({ name: 'COUNTRY_CODE', type: 'varchar2', length: 10, nullable: true })
  countryCode: string;

  @Column({ name: 'USE_YN', type: 'char', length: 1, default: 'Y' })
  useYn: string;
}
