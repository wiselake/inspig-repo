import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 주간 보고서 목록 조회 요청 DTO
 */
export class ReportListQueryDto {
  @Type(() => Number)
  @IsNumber()
  farmNo: number;

  @IsOptional()
  @IsString()
  from?: string; // YYYYMMDD

  @IsOptional()
  @IsString()
  to?: string; // YYYYMMDD
}

/**
 * 주간 보고서 목록 응답 DTO
 */
export class ReportListItemDto {
  id: string;
  masterSeq: number;
  year: number;
  weekNo: number;
  period: {
    from: Date;
    to: Date;
  };
  statusCd: string;
  createdAt: Date;
}

/**
 * 주간 보고서 상세 조회 파라미터 DTO
 */
export class ReportDetailParamsDto {
  @Type(() => Number)
  @IsNumber()
  masterSeq: number;

  @Type(() => Number)
  @IsNumber()
  farmNo: number;
}

/**
 * 팝업 데이터 조회 파라미터 DTO
 */
export class PopupDataParamsDto {
  @IsString()
  type: string;

  @Type(() => Number)
  @IsNumber()
  masterSeq: number;

  @Type(() => Number)
  @IsNumber()
  farmNo: number;
}
