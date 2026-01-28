# ETL 시퀀스 정의

> InsightPig ETL 통계 테이블용 시퀀스

---

## 시퀀스 목록

| 시퀀스명 | 대상 테이블 | 설명 |
|----------|-------------|------|
| SEQ_TS_INS_MASTER | TS_INS_MASTER.SEQ | 리포트 마스터 시퀀스 |
| SEQ_TS_INS_JOB_LOG | TS_INS_JOB_LOG.SEQ | 스케줄러 로그 시퀀스 |
| SEQ_TM_WEATHER | TM_WEATHER.SEQ | 날씨 테이블 시퀀스 |
| SEQ_TS_PRODUCTIVITY | TS_PRODUCTIVITY.SEQ | 생산성 데이터 시퀀스 |

---

## DDL 스크립트

```sql
-- ============================================================
-- 1. SEQ_TS_INS_MASTER: 리포트 마스터 시퀀스
-- ============================================================
CREATE SEQUENCE SEQ_TS_INS_MASTER
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9999999999
    NOCACHE
    NOCYCLE;

-- ============================================================
-- 2. SEQ_TS_INS_JOB_LOG: 스케줄러 로그 시퀀스
-- ============================================================
CREATE SEQUENCE SEQ_TS_INS_JOB_LOG
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9999999999
    NOCACHE
    NOCYCLE;

-- ============================================================
-- 3. SEQ_TM_WEATHER: 날씨 테이블 시퀀스
-- ============================================================
CREATE SEQUENCE SEQ_TM_WEATHER
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9999999999
    NOCACHE
    NOCYCLE;

-- ============================================================
-- 4. SEQ_TS_PRODUCTIVITY: 생산성 데이터 시퀀스
-- ============================================================
CREATE SEQUENCE SEQ_TS_PRODUCTIVITY
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9999999999
    NOCACHE
    NOCYCLE;
```

---

## 시퀀스 확인 쿼리

```sql
SELECT SEQUENCE_NAME, MIN_VALUE, MAX_VALUE, INCREMENT_BY, LAST_NUMBER
FROM USER_SEQUENCES
WHERE SEQUENCE_NAME IN (
    'SEQ_TS_INS_MASTER',
    'SEQ_TS_INS_JOB_LOG',
    'SEQ_TM_WEATHER',
    'SEQ_TS_PRODUCTIVITY'
)
ORDER BY SEQUENCE_NAME;
```

---

## Python ETL에서 사용

```python
# 시퀀스에서 다음 값 가져오기
def get_next_seq(cursor, seq_name: str) -> int:
    cursor.execute(f"SELECT {seq_name}.NEXTVAL FROM DUAL")
    return cursor.fetchone()[0]

# 사용 예시
master_seq = get_next_seq(cursor, 'SEQ_TS_INS_MASTER')
job_log_seq = get_next_seq(cursor, 'SEQ_TS_INS_JOB_LOG')
weather_seq = get_next_seq(cursor, 'SEQ_TM_WEATHER')
productivity_seq = get_next_seq(cursor, 'SEQ_TS_PRODUCTIVITY')
```

---

## 관련 문서

- [02_WEEKLY_REPORT.md](./02_WEEKLY_REPORT.md) - 주간 리포트 ETL
- [06_PRODUCTIVITY_COLLECT.md](./06_PRODUCTIVITY_COLLECT.md) - 생산성 데이터 수집
- [07_WEATHER_COLLECT.md](./07_WEATHER_COLLECT.md) - 기상 데이터 수집
