import { Logger as TypeOrmLogger, QueryRunner } from 'typeorm';

// SQL ID 카운터 (전역)
let sqlIdCounter = 0;

export class CustomTypeOrmLogger implements TypeOrmLogger {
  private formatSql(query: string, parameters?: any[] | Record<string, any>): string {
    let formattedQuery = query;

    // 큰따옴표 제거 ("m"."SEQ" -> m.SEQ)
    formattedQuery = formattedQuery.replace(/"([^"]+)"/g, '$1');

    // 파라미터를 실제 값으로 치환
    if (parameters) {
      if (Array.isArray(parameters)) {
        // 위치 기반 파라미터 (배열): :1, :2, :3...
        parameters.forEach((param, index) => {
          const placeholder = `:${index + 1}`;
          const value = typeof param === 'string' ? `'${param}'` : param;
          formattedQuery = formattedQuery.replace(placeholder, String(value));
        });
      } else if (typeof parameters === 'object') {
        // Named parameter (객체): :farmNo, :masterSeq...
        Object.entries(parameters).forEach(([key, param]) => {
          const placeholder = new RegExp(`:${key}\\b`, 'g');
          const value = typeof param === 'string' ? `'${param}'` : param;
          formattedQuery = formattedQuery.replace(placeholder, String(value));
        });
      }
    }

    // SQL 키워드 앞에서 줄바꿈
    formattedQuery = formattedQuery
      .replace(/\bSELECT\b/gi, '\n  SELECT')
      .replace(/\bFROM\b/gi, '\n  FROM')
      .replace(/\bWHERE\b/gi, '\n  WHERE')
      .replace(/\bAND\b/gi, '\n    AND')
      .replace(/\bINNER JOIN\b/gi, '\n  INNER JOIN')
      .replace(/\bLEFT JOIN\b/gi, '\n  LEFT JOIN')
      .replace(/\bORDER BY\b/gi, '\n  ORDER BY')
      .replace(/\bGROUP BY\b/gi, '\n  GROUP BY')
      .replace(/\bFETCH\b/gi, '\n  FETCH')
      .replace(/\bUPDATE\b/gi, '\n  UPDATE')
      .replace(/\bSET\b/gi, '\n  SET');

    return formattedQuery;
  }

  /**
   * SQL 쿼리에서 SQL ID 주석 추출
   * 형식: 서비스.SQL파일.쿼리ID : 설명
   */
  private extractSqlComment(query: string): string | null {
    // /* weekly.weekly.getReportList : 보고서 목록 조회 */ 형태의 주석 추출
    // [^*]+ 대신 [\s\S]+? 사용하여 모든 문자 매칭 (비탐욕적)
    const match = query.match(/\/\*\s*([\s\S]+?)\s*\*\//);
    if (match) {
      const comment = match[1].trim();
      // SQL ID 형식 검증: 서비스.SQL파일.쿼리ID : 설명 패턴인지 확인
      if (comment.includes('.') && comment.includes(':')) {
        return comment;
      }
    }
    return null;
  }

  /**
   * SQL 쿼리 유형 추출 (SELECT, UPDATE, INSERT, DELETE 등)
   */
  private getQueryType(query: string): string {
    const trimmed = query.trim().toUpperCase();
    if (trimmed.startsWith('SELECT')) return 'SELECT';
    if (trimmed.startsWith('UPDATE')) return 'UPDATE';
    if (trimmed.startsWith('INSERT')) return 'INSERT';
    if (trimmed.startsWith('DELETE')) return 'DELETE';
    return 'QUERY';
  }

  /**
   * SQL ID 생성
   * - 쿼리 내 주석이 있으면 그것 사용
   * - 없으면 쿼리 유형으로 표시 (Repository 기본 쿼리용)
   */
  private buildSqlId(query: string): string {
    // 1. SQL 쿼리 내 주석 추출
    const sqlComment = this.extractSqlComment(query);
    if (sqlComment) {
      return sqlComment;
    }

    // 2. 쿼리 유형으로 fallback (findOne, find 등 Repository 기본 메서드)
    return `TypeORM.${this.getQueryType(query)}`;
  }

  logQuery(query: string, parameters?: any[], _queryRunner?: QueryRunner): void {
    const timestamp = new Date().toLocaleTimeString('ko-KR');
    const sqlId = this.buildSqlId(query);

    // SQL ID 카운터 증가
    sqlIdCounter++;

    console.log('\n\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
    console.log(`\x1b[33m[${timestamp}] SQL #${sqlIdCounter}\x1b[0m`);
    console.log(`\x1b[90m/* ${sqlId} */\x1b[0m`);
    console.log('\x1b[32m' + this.formatSql(query, parameters) + '\x1b[0m');
    console.log('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n');
  }

  logQueryError(error: string | Error, query: string, parameters?: any[], _queryRunner?: QueryRunner): void {
    const sqlId = this.buildSqlId(query);

    console.log('\n\x1b[31m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
    console.log(`\x1b[31m[SQL Error]\x1b[0m`);
    console.log(`\x1b[90m/* ${sqlId} */\x1b[0m`);
    console.log('\x1b[31m' + this.formatSql(query, parameters) + '\x1b[0m');
    console.log('\x1b[31mError: ' + error + '\x1b[0m');
    console.log('\x1b[31m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n');
  }

  logQuerySlow(time: number, query: string, parameters?: any[], _queryRunner?: QueryRunner): void {
    const sqlId = this.buildSqlId(query);

    console.log('\n\x1b[35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
    console.log(`\x1b[35m[Slow Query ${time}ms]\x1b[0m`);
    console.log(`\x1b[90m/* ${sqlId} */\x1b[0m`);
    console.log('\x1b[35m' + this.formatSql(query, parameters) + '\x1b[0m');
    console.log('\x1b[35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n');
  }

  logSchemaBuild(_message: string, _queryRunner?: QueryRunner): void {}
  logMigration(_message: string, _queryRunner?: QueryRunner): void {}
  log(_level: 'log' | 'info' | 'warn', _message: any, _queryRunner?: QueryRunner): void {}
}
