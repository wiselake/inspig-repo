# DB 문서 구조

> inspig 주간/월간 리포트 DB 설계 문서

---

## 폴더 구조

```
docs/db/
├── README.md                         # 이 문서
├── ref/                              # 운영 DB 참조 (문서만)
│   ├── 01.table.md                   # 테이블 구조/코드 참조
│   ├── 02.view.md                    # 뷰 참조
│   └── 03.function.md                # 함수 참조
└── sql/                              # SQL 파일 (DB 적용 대상)
    ├── 00_SQL_GUIDE.md               # SQL 작성 가이드
    └── ins/                          # INS SQL
        ├── 01_SEQUENCE.sql           # 시퀀스
        ├── 02_TABLE.sql              # INS 테이블 DDL
        ├── 03_TABLE_ETC.sql          # 공통/ETC 테이블 DDL
        ├── 04_VIEW_INS_SERVICE_ACTIVE.sql  # 서비스 뷰
        └── 04_ALTER_SCHEDULE_GROUP.sql     # 스케줄 그룹 컬럼
```

---

## ETL 아키텍처

**현재 운영은 Python ETL (inspig-etl)로 수행됩니다.**

| 구분 | 소스 | 설명 |
|------|------|------|
| ETL 실행 | `inspig-etl/run_etl.py weekly` | 주간 리포트 생성 |
| 스케줄 | `inspig-etl/run_weekly.sh` | Crontab 실행 스크립트 |
| 오케스트레이터 | `inspig-etl/src/weekly/orchestrator.py` | 메인 로직 |
| 프로세서 | `inspig-etl/src/weekly/processors/` | 팝업별 처리 |

### 레거시 Oracle 프로시저 (참조용)

Oracle 프로시저/JOB은 Python ETL 작성 기준으로만 참조:
- 위치: `inspig-docs-shared/db/sql/ins/backup/`
- 상세: [inspig-etl/docs/db/ins/02_TABLE.md](../../inspig-etl/docs/db/ins/02_TABLE.md) 참조

---

## DB 적용 순서

### 1. 공통 객체

```bash
# 1. 시퀀스
sql/ins/01_SEQUENCE.sql

# 2. INS 테이블
sql/ins/02_TABLE.sql

# 3. 공통/ETC 테이블 (날씨, PSY 히트맵)
sql/ins/03_TABLE_ETC.sql

# 4. 서비스 활성 뷰
sql/ins/04_VIEW_INS_SERVICE_ACTIVE.sql

# 5. 스케줄 그룹 컬럼 (선택)
sql/ins/04_ALTER_SCHEDULE_GROUP.sql
```

---

## SQL 파일 번호 규칙

### ins/ 공통

| 번호 | 용도 |
|------|------|
| 01 | 시퀀스 |
| 02 | INS 테이블 |
| 03 | 공통/ETC 테이블 |
| 04 | 뷰, ALTER |

---

## 적용 확인

```sql
-- 테이블 확인
SELECT TABLE_NAME FROM USER_TABLES WHERE TABLE_NAME LIKE 'TS_INS%';

-- 뷰 확인
SELECT VIEW_NAME FROM USER_VIEWS WHERE VIEW_NAME LIKE 'VW_INS%';

-- 시퀀스 확인
SELECT SEQUENCE_NAME FROM USER_SEQUENCES WHERE SEQUENCE_NAME LIKE 'SEQ_TS_INS%';
```

---

## 참조 vs 적용

| 폴더 | 용도 | DB 적용 | 비고 |
|------|------|---------|------|
| ref/ | 운영 DB 참조 문서 | X | md 문서만 |
| sql/ins/ | INS 신규 객체 | O | SQL 파일 |

