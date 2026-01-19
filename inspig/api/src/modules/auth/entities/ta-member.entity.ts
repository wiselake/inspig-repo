import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * TA_MEMBER: 회원 정보 테이블
 * 로그인 시 FARM_NO를 세션에 저장하여 사용
 */
@Entity({ name: 'TA_MEMBER' })
export class TaMember {
  @PrimaryColumn({ name: 'MEMBER_ID', type: 'varchar2', length: 40 })
  memberId: string;

  @Column({ name: 'COMPANY_CD', type: 'number', default: 0 })
  companyCd: number;

  @Column({ name: 'SOLE_CD', type: 'number', default: 0 })
  soleCd: number;

  @Column({ name: 'AGENT_CD', type: 'number', default: 0 })
  agentCd: number;

  @Column({ name: 'FARM_NO', type: 'number', nullable: true })
  farmNo: number;

  @Column({ name: 'MEMBER_TYPE', type: 'varchar2', length: 6, nullable: true })
  memberType: string;

  @Column({ name: 'MEMBER_TYPE_D', type: 'varchar2', length: 6, nullable: true })
  memberTypeD: string;

  @Column({ name: 'NAME', type: 'varchar2', length: 40, nullable: true })
  name: string;

  @Column({ name: 'POSITION', type: 'varchar2', length: 200, nullable: true })
  position: string;

  @Column({ name: 'EMAIL', type: 'varchar2', length: 100, nullable: true })
  email: string;

  @Column({ name: 'PASSWORD', type: 'varchar2', length: 100, nullable: true })
  password: string;

  @Column({ name: 'HP_NUM', type: 'varchar2', length: 20, nullable: true })
  hpNum: string;

  @Column({ name: 'HP_ID', type: 'varchar2', length: 200, nullable: true })
  hpId: string;

  @Column({ name: 'LAST_DT', type: 'date', nullable: true })
  lastDt: Date;

  @Column({ name: 'BIGO', type: 'varchar2', length: 200, nullable: true })
  bigo: string;

  @Column({ name: 'USER_OK_CD', type: 'varchar2', length: 20, nullable: true })
  userOkCd: string;

  @Column({ name: 'USE_YN', type: 'char', length: 1, default: 'Y' })
  useYn: string;

  @Column({ name: 'LOG_INS_DT', type: 'date', nullable: true })
  logInsDt: Date;

  @Column({ name: 'LOG_INS_ID', type: 'varchar2', length: 40, nullable: true })
  logInsId: string;

  @Column({ name: 'LOG_UPT_DT', type: 'date', nullable: true })
  logUptDt: Date;

  @Column({ name: 'LOG_UPT_ID', type: 'varchar2', length: 40, nullable: true })
  logUptId: string;

  @Column({ name: 'LOGINKEY', type: 'varchar2', length: 2000, nullable: true })
  loginKey: string;

  @Column({ name: 'DEPARTMENT', type: 'varchar2', length: 200, nullable: true })
  department: string;

  @Column({ name: 'AUTHORITY_NO', type: 'number', nullable: true })
  authorityNo: number;

  @Column({ name: 'LOGOUT_DT', type: 'date', nullable: true })
  logoutDt: Date;

  @Column({ name: 'PASSHINT_CD', type: 'varchar2', length: 6, nullable: true })
  passhintCd: string;

  @Column({ name: 'PASSHINT_VAL', type: 'varchar2', length: 100, nullable: true })
  passhintVal: string;

  @Column({ name: 'MGN_FARM_AUTHORITH', type: 'number', nullable: true })
  mgnFarmAuthorith: number;

  @Column({ name: 'LASTCON_FARM_NO', type: 'varchar2', length: 50, nullable: true })
  lastconFarmNo: string;

  @Column({ name: 'LASTJOB_FARM_NO', type: 'varchar2', length: 20, nullable: true })
  lastjobFarmNo: string;

  @Column({ name: 'CLOUD_YN', type: 'varchar2', length: 1, nullable: true })
  cloudYn: string;
}
