# 아키텍처 검토: 지난주 예정복수 산출 방식 변경

## 요약

**사용자 질문**: "지난주의 예정복수는 지난주의 금주 작업예정 두수와 동일하지 않나?"

**결론**: 맞습니다. 논리적으로 N주차의 "지난주 예정"은 (N-1)주차의 "금주 예정"과 동일해야 합니다.

**현재 문제**: 현재 mating.py, farrowing.py, weaning.py는 지난주 실적 리포트 생성 시점에 예정 복수를 직접 재계산합니다. 이로 인해 (N-1)주차에 생성된 schedule.py의 "금주 예정"과 N주차에 재계산한 "지난주 예정"이 다를 수 있습니다.

---

## 현재 상황 분석

### 1. 현재 데이터 흐름

```
[N주차 리포트 생성]
├── mating.py: 교배 실적 + 예정 복수 직접 계산
│   └── _get_plan_counts() → plan_hubo, plan_js 산출
│   └── _insert_stat() → CNT_7: plan_hubo, CNT_8: plan_js 저장
│
├── farrowing.py: 분만 실적 + 예정 복수 직접 계산
│   └── _get_plan_count() → plan_bm 산출
│   └── _insert_stat() → CNT_7: plan_bm 저장
│
├── weaning.py: 이유 실적 + 예정 복수 직접 계산
│   └── _get_plan_count() → plan_eu 산출
│   └── _insert_stat() → CNT_7: plan_eu 저장
│
└── schedule.py: 금주 예정 데이터 생성
    └── _update_week() → THIS_GB_SUM, THIS_BM_SUM, THIS_EU_SUM 저장
```

### 2. 현재 테이블 구조

**TS_INS_WEEK (메인 테이블)**
| 컬럼명 | 설명 | 저장 시점 |
|--------|------|----------|
| THIS_GB_SUM | 금주 교배예정 | schedule.py |
| THIS_BM_SUM | 금주 분만예정 | schedule.py |
| THIS_EU_SUM | 금주 이유예정 | schedule.py |
| THIS_IMSIN_SUM | 금주 임신감정예정 | schedule.py |
| LAST_GB_CNT | 지난주 교배실적 | mating.py |
| LAST_BM_SUM_CNT | 지난주 분만실적 | farrowing.py |
| LAST_EU_SUM_CNT | 지난주 이유실적 | weaning.py |

**TS_INS_WEEK_SUB (GUBUN='GB', SUB_GUBUN='STAT')**
| 컬럼명 | 설명 |
|--------|------|
| CNT_7 | 초교배예정 (plan_hubo) |
| CNT_8 | 정상교배예정 (plan_js) |

### 3. 문제점

1. **예정 복수 재계산 불일치**: 지난주 리포트 생성 시점과 이번주 리포트 생성 시점에 모돈 상태가 달라질 수 있음
   - 예: 지난주에 이유 예정이었던 모돈이 폐사했다면, 지난주 리포트의 "금주 예정"과 이번주 리포트의 "지난주 예정"이 다름

2. **일관성 문제**: 같은 주차에 대해 다른 숫자가 나올 수 있음

---

## 제안 방식

### 핵심 아이디어

> **N주차의 "지난주 예정복수"는 (N-1)주차의 "금주 작업예정"에서 가져온다.**

이미 schedule.py에서 `THIS_GB_SUM`, `THIS_BM_SUM`, `THIS_EU_SUM`을 TS_INS_WEEK에 저장하고 있으므로, 이 값을 활용합니다.

### 변경 대상

1. **mating.py**: 예정 복수 산출 로직 변경
2. **farrowing.py**: 예정 복수 산출 로직 변경
3. **weaning.py**: 예정 복수 산출 로직 변경

### 현재 데이터 저장 구조 (코드 분석 결과)

**schedule.py `_insert_summary()` (739-782행)**:
```
TS_INS_WEEK_SUB (GUBUN='SCHEDULE', SUB_GUBUN='-')
├── CNT_1: gb_sum (교배예정 합계)  ← 초교배/정상교배 분리 안 됨
├── CNT_2: imsin_sum (임신감정)
├── CNT_3: bm_sum (분만예정)
├── CNT_4: eu_sum (이유예정)
├── CNT_5: vaccine_sum (백신예정)
├── CNT_6: ship_sum (출하예정)
└── CNT_7: week_num (주차번호)
```

**schedule.py `_update_week()` (1142-1163행)**:
```
TS_INS_WEEK
├── THIS_GB_SUM: 교배예정 합계
├── THIS_BM_SUM: 분만예정 합계
├── THIS_EU_SUM: 이유예정 합계
├── THIS_IMSIN_SUM: 임신감정 합계
├── THIS_VACCINE_SUM: 백신예정 합계
└── THIS_SHIP_SUM: 출하예정 합계
```

### 핵심 이슈: 교배 예정의 초교배/정상교배 분리

**mating.py는 초교배(plan_hubo)와 정상교배(plan_js)를 분리하여 저장합니다:**
```
TS_INS_WEEK_SUB (GUBUN='GB', SUB_GUBUN='STAT')
├── CNT_7: plan_hubo (초교배예정)
└── CNT_8: plan_js (정상교배예정)
```

**그러나 schedule.py는 교배예정 합계(gb_sum)만 저장합니다:**
- `THIS_GB_SUM`에는 초교배+정상교배 합계만 저장
- 초교배/정상교배 분리 데이터 없음

### 해결 방안

> ⚠️ **운영 제약사항**: 현재 운영 중인 시스템이므로 다음 사항을 준수해야 합니다.
> - DB 컬럼 추가 금지
> - 기존 저장 구조 변경 금지
> - ETL 변경 시 inspig 프론트엔드도 함께 수정 필요
> - **데이터 증가 최소화**: 새로운 레코드 추가 금지 (기존 데이터 활용)

#### ~~Option A: schedule.py에서 초교배/정상교배 분리 저장~~ (제외)

~~**schedule.py 수정**:~~
~~1. `_get_schedule_counts()`에서 후보돈(010001)/이유돈(010005) 분리 집계~~
~~2. `_insert_summary()`에서 초교배/정상교배 분리 저장 추가~~
~~3. `_update_week()`에서 `THIS_GB_HUBO_SUM`, `THIS_GB_JS_SUM` 추가 (DB 컬럼 추가 필요)~~

❌ **제외 사유**: DB 컬럼 추가 필요, 운영 중 스키마 변경 위험

#### Option B: 팝업 상세에서 조회 (현재 구조 활용) ✅ 채택

schedule.py `_insert_popup_details()`는 이미 교배예정 팝업 상세를 저장합니다:
```
TS_INS_WEEK_SUB (GUBUN='SCHEDULE', SUB_GUBUN='GB')
├── SORT_NO=1, CODE_1='후보돈', CNT_1=초교배예정
├── SORT_NO=2, CODE_1='이유돈', CNT_1=이유후교배예정
├── SORT_NO=3, CODE_1='사고후교배', CNT_1=사고후교배예정
└── ...
```

이 데이터를 합산하면 초교배/정상교배를 분리할 수 있습니다:
- 초교배예정 = 후보돈 CNT_1 합계
- 정상교배예정 = 이유돈 + 사고돈 CNT_1 합계

---

## 구현 계획

> ✅ **데이터 증가 없음**: 이 구현은 기존 데이터를 **조회만** 합니다.
> - 새로운 테이블/컬럼 추가 없음
> - 새로운 레코드 INSERT 없음
> - 기존에 schedule.py가 저장한 `TS_INS_WEEK`, `TS_INS_WEEK_SUB` 데이터 재활용

### Phase 1: 이전 주차 데이터 조회 로직 구현 (mating.py, farrowing.py, weaning.py)

각 프로세서에서 `_get_plan_from_prev_week()` 메소드 추가 (조회 전용):

```python
def _get_plan_from_prev_week(self) -> tuple:
    """이전 주차 금주예정에서 지난주 예정 조회

    Returns:
        mating.py: (plan_hubo, plan_js, hint)
        farrowing.py: (plan_bm, hint)
        weaning.py: (plan_eu, hint)
    """
    # 현재 리포트의 year, week_no 조회
    sql_week = """
    SELECT YEAR, WEEK_NO FROM TS_INS_MASTER WHERE SEQ = :master_seq
    """
    week_info = self.fetch_one(sql_week, {'master_seq': self.master_seq})
    year, week_no = week_info[0], week_info[1]

    # 이전 주차 계산
    if week_no == 1:
        # 1주차면 이전년도 마지막 주차 조회 (52주 또는 53주)
        # DB에서 직접 이전년도의 최대 주차 조회
        prev_year = year - 1
        prev_week_no = self._get_last_week_of_year(prev_year)
    else:
        prev_year = year
        prev_week_no = week_no - 1

    # 이전 주차 금주예정 조회
    sql = """
    SELECT W.THIS_GB_SUM, H.STR_1
    FROM TS_INS_WEEK W
    INNER JOIN TS_INS_MASTER M ON M.SEQ = W.MASTER_SEQ
    LEFT JOIN TS_INS_WEEK_SUB H ON H.MASTER_SEQ = W.MASTER_SEQ
        AND H.FARM_NO = W.FARM_NO
        AND H.GUBUN = 'SCHEDULE' AND H.SUB_GUBUN = 'HELP'
    WHERE W.FARM_NO = :farm_no
      AND M.YEAR = :prev_year
      AND M.WEEK_NO = :prev_week_no
    """
    result = self.fetch_one(sql, {...})
    return result if result else None

def _get_last_week_of_year(self, year: int) -> int:
    """해당 연도의 마지막 ISO 주차 조회 (52 또는 53)

    방법 1: DB에서 해당 농장의 실제 데이터 조회
    방법 2: Python datetime으로 계산
    """
    # 방법 1: DB에서 해당 연도의 최대 주차 조회 (우선)
    sql = """
    SELECT MAX(WEEK_NO)
    FROM TS_INS_MASTER
    WHERE YEAR = :year
    """
    result = self.fetch_one(sql, {'year': year})
    if result and result[0]:
        return result[0]

    # 방법 2: Python으로 ISO week 계산 (Fallback)
    # 12월 28일은 항상 마지막 주차에 포함됨 (ISO 8601 규칙)
    from datetime import date
    dec_28 = date(year, 12, 28)
    return dec_28.isocalendar()[1]  # 52 또는 53 반환
```

**연도 전환 처리 상세**:
- ISO 8601 기준: 어떤 해는 52주, 어떤 해는 53주
- 예: 2020년 = 53주, 2021년 = 52주, 2025년 = 52주, 2026년 = 53주
- 12월 28일은 항상 그 해의 마지막 주차에 포함됨
- DB에서 실제 데이터를 먼저 조회하고, 없으면 Python으로 계산

### Phase 2: 교배 초교배/정상교배 분리 조회 + 힌트 정보 (mating.py)

**Option B 채택**: 이미 저장된 팝업 상세(SUB_GUBUN='GB')에서 조회

```python
def _get_plan_from_prev_week(self) -> tuple:
    """이전 주차 금주예정에서 교배 예정 조회 (초교배/정상교배 분리 + 힌트)

    Returns:
        (plan_hubo, plan_js, hint) 또는 None
    """
    # 1. 교배 예정 복수 조회 (SUB_GUBUN='GB')
    sql_plan = """
    SELECT
        SUM(CASE WHEN CODE_1 = '후보돈' THEN CNT_1 ELSE 0 END) AS HUBO_SUM,
        SUM(CASE WHEN CODE_1 IN ('이유돈', '사고후교배') THEN CNT_1 ELSE 0 END) AS JS_SUM
    FROM TS_INS_WEEK_SUB S
    INNER JOIN TS_INS_MASTER M ON M.SEQ = S.MASTER_SEQ
    WHERE S.FARM_NO = :farm_no
      AND S.GUBUN = 'SCHEDULE'
      AND S.SUB_GUBUN = 'GB'
      AND M.YEAR = :prev_year
      AND M.WEEK_NO = :prev_week_no
    """

    # 2. 힌트 정보 조회 (SUB_GUBUN='HELP', STR_1=교배예정 힌트)
    sql_hint = """
    SELECT STR_1
    FROM TS_INS_WEEK_SUB S
    INNER JOIN TS_INS_MASTER M ON M.SEQ = S.MASTER_SEQ
    WHERE S.FARM_NO = :farm_no
      AND S.GUBUN = 'SCHEDULE'
      AND S.SUB_GUBUN = 'HELP'
      AND M.YEAR = :prev_year
      AND M.WEEK_NO = :prev_week_no
    """

    plan_result = self.fetch_one(sql_plan, {...})
    hint_result = self.fetch_one(sql_hint, {...})

    if plan_result and (plan_result[0] is not None or plan_result[1] is not None):
        hint = hint_result[0] if hint_result else None
        return (plan_result[0] or 0, plan_result[1] or 0, hint)
    return None  # Fallback 필요
```

### Phase 2-1: 분만/이유 힌트 정보 조회

**schedule.py `SUB_GUBUN='HELP'` 저장 구조**:
| 컬럼 | 내용 |
|------|------|
| STR_1 | 교배예정 힌트 (mating) |
| STR_2 | 분만예정 힌트 (farrowing) |
| STR_3 | 이유예정 힌트 (weaning) |

```python
# farrowing.py
def _get_plan_from_prev_week(self) -> tuple:
    """Returns: (plan_bm, hint) 또는 None"""
    sql = """
    SELECT W.THIS_BM_SUM, H.STR_2
    FROM TS_INS_WEEK W
    INNER JOIN TS_INS_MASTER M ON M.SEQ = W.MASTER_SEQ
    LEFT JOIN TS_INS_WEEK_SUB H ON H.MASTER_SEQ = W.MASTER_SEQ
        AND H.FARM_NO = W.FARM_NO
        AND H.GUBUN = 'SCHEDULE' AND H.SUB_GUBUN = 'HELP'
    WHERE W.FARM_NO = :farm_no
      AND M.YEAR = :prev_year
      AND M.WEEK_NO = :prev_week_no
    """

# weaning.py
def _get_plan_from_prev_week(self) -> tuple:
    """Returns: (plan_eu, hint) 또는 None"""
    # 동일 패턴, STR_3 조회
```

### Phase 3: 분기 로직 (핵심)

**로직 정리**:
```
1. 2025년 3주까지 → 항상 settings?tab=weekly 설정 기준으로 직접 계산
2. 2025년 4주부터 → 이전 주차 데이터 조회 시도
   2-1. 이전 주차 데이터 있음 → 해당 데이터 사용 (예정복수 + 힌트)
   2-2. 이전 주차 데이터 없음 → settings?tab=weekly 설정 기준으로 직접 계산 (Fallback)
```

**예시**:
- 2025년 3주 리포트 생성 → 직접 계산 (기존 방식)
- 2025년 4주 리포트 생성 → 3주차 금주예정 조회 → 있으면 사용
- 2025년 5주 리포트 생성 (신규 농장, 첫 리포트) → 4주차 데이터 없음 → 직접 계산

```python
def _get_plan_counts(self, sdt: str, edt: str, dt_from: datetime, dt_to: datetime,
                     ins_conf: Dict[str, Any]) -> tuple:
    """예정 복수 조회 (분기 로직 적용)

    Returns:
        (plan_hubo, plan_js, hint) - 교배의 경우
        (plan_bm, hint) - 분만의 경우
        (plan_eu, hint) - 이유의 경우
    """
    # 1. 현재 주차 정보 조회
    year, week_no = self._get_current_week_info()

    # 2. 2025년 4주 이후인 경우, 이전 주차 데이터 조회 시도
    if (year > 2025) or (year == 2025 and week_no >= 4):
        prev_data = self._get_plan_from_prev_week()
        if prev_data is not None:
            self.logger.info(f"이전 주차 금주예정 사용: year={year}, week={week_no}")
            return prev_data  # (예정복수, 힌트) 반환

    # 3. Fallback: settings?tab=weekly 설정 기준으로 직접 계산
    self.logger.info(f"직접 계산 (Fallback): year={year}, week={week_no}")
    return self._calculate_plan_counts(sdt, edt, dt_from, dt_to, ins_conf)
```

**Fallback 케이스**:
- 2025년 3주 이전 (기존 방식 유지)
- 이전 주차 리포트 미생성 (신규 농장, 첫 리포트)
- 이전 주차 리포트 생성 후 삭제된 경우

### ~~Phase 4: schedule.py 개선~~ (제외)

~~향후 안정적인 데이터 조회를 위해 schedule.py에서 초교배/정상교배 분리 저장 추가:~~

❌ **운영 제약으로 제외** - 기존 데이터 구조 유지

~~```python~~
~~# _insert_summary() 또는 별도 메소드~~
~~def _insert_gb_detail(self, schedule_counts: Dict):~~
~~    """교배예정 초교배/정상교배 분리 저장"""~~
~~    ...~~
~~```~~

❌ **제외**: 운영 중 데이터 구조 변경 불가

---

## 수정 대상 파일 요약

> ⚠️ **ETL 변경 시 inspig 프론트엔드도 함께 수정 필요**

### inspig-etl (백엔드)

| 파일 | 수정 내용 | 영향도 |
|------|----------|--------|
| mating.py | `_get_plan_from_prev_week()` 추가, `_get_plan_counts()` 수정 | 중 |
| farrowing.py | `_get_plan_from_prev_week()` 추가, `_get_plan_count()` 수정 | 중 |
| weaning.py | `_get_plan_from_prev_week()` 추가, `_get_plan_count()` 수정 | 중 |
| modon.py | `_get_previous_data()` 주차 비교 로직 수정 (YEAR, WEEK_NO 기준) | 중 |
| base.py | `_get_current_week_info()`, `_get_last_week_of_year()` 헬퍼 추가 | 저 |
| ~~schedule.py~~ | ~~초교배/정상교배 분리 저장~~ | ❌ 제외 |

### inspig (프론트엔드) - 변경 없음

| 파일 | 변경 필요 여부 | 사유 |
|------|---------------|------|
| MatingPopup.tsx | 없음 | 기존 hint 필드 그대로 사용 |
| FarrowingPopup.tsx | 없음 | 기존 hint 필드 그대로 사용 |
| WeaningPopup.tsx | 없음 | 기존 hint 필드 그대로 사용 |

> ✅ **결론**: ETL 내부 로직만 변경, 데이터 구조 및 API 응답 형식 변경 없음 → 프론트엔드 수정 불필요

---

## 테스트 시나리오

| 시나리오 | 조건 | 예상 동작 |
|----------|------|----------|
| 1. 3주 이전 | 2025년 1~3주 | settings?tab=weekly 기준 직접 계산 |
| 2. 4주 정상 | 2025년 4주, 3주 데이터 존재 | 3주차 금주예정 사용 |
| 3. 4주 Fallback | 2025년 4주, 3주 데이터 없음 | settings?tab=weekly 기준 직접 계산 |
| 4. 신규 농장 | 2025년 5주 첫 리포트 | 4주 데이터 없음 → 직접 계산 |
| 5. 연도 전환 | 2026년 1주 | 2025년 52/53주차 조회 → 없으면 직접 계산 |
| 6. 힌트 확인 | 4주 이후, 이전 주차 존재 | 이전 주차 힌트(STR_1/2/3) 사용 |

---

## 결론

**사용자 질문에 대한 답변:**

> "지난주의 예정복수는 지난주의 금주 작업예정 두수와 동일하지 않나?"

**맞습니다.** 논리적으로 N주차의 "지난주 예정"은 (N-1)주차의 "금주 예정"과 동일해야 합니다.

**현재 구현의 문제점:**
1. mating.py, farrowing.py, weaning.py는 예정 복수를 매번 재계산
2. 재계산 시점에 모돈 상태가 달라지면 (N-1)주차 금주예정과 불일치 발생

**구현 가능 여부:**
1. 분만/이유 예정: `THIS_BM_SUM`, `THIS_EU_SUM` → 바로 사용 가능
2. 교배 예정:
   - 합계: `THIS_GB_SUM` → 바로 사용 가능
   - 초교배/정상교배 분리: `SUB_GUBUN='GB'` 팝업 상세에서 합산 조회 가능
3. **힌트 정보**: `SUB_GUBUN='HELP'`에서 조회 가능
   - STR_1: 교배예정 힌트
   - STR_2: 분만예정 힌트
   - STR_3: 이유예정 힌트

**권장 구현 방향:**
1. 이전 주차 데이터 조회 로직 추가 (mating.py, farrowing.py, weaning.py)
2. 교배 예정은 팝업 상세(SUB_GUBUN='GB')에서 초교배/정상교배 분리 조회
3. **힌트 정보도 함께 조회하여 저장** (이전 주차 산정 기준 스냅샷)
4. **분기 로직**:
   - 2025년 3주까지: settings?tab=weekly 설정 기준으로 직접 계산
   - 2025년 4주부터: 이전 주차 금주예정 조회 → 없으면 직접 계산 (Fallback)

---

## 추가 발견 이슈: modon.py 이전 주차 조회 로직

### 현재 문제점

`modon.py`의 `_get_previous_data()` 메소드에서 이전 주차 데이터를 조회할 때 **YEAR, WEEK_NO를 고려하지 않고 단순히 SEQ 순서로만 조회**합니다.

**현재 코드 (modon.py:269-280)**:
```python
sql = """
SELECT SEQ
FROM (
    SELECT SEQ
    FROM TS_INS_MASTER
    WHERE DAY_GB = 'WEEK'
      AND SEQ < :master_seq
      AND STATUS_CD = 'COMPLETE'
    ORDER BY SEQ DESC
)
WHERE ROWNUM = 1
"""
```

**문제 시나리오**:
- 2025년 5주차 리포트 (SEQ=100) 처리 중
- 2024년 52주차 리포트 (SEQ=99)가 존재
- 현재 로직: SEQ=99 (2024년 52주차)를 "이전 주차"로 선택
- 올바른 동작: 2025년 4주차를 "이전 주차"로 선택해야 함

### 올바른 조회 방식

**방법 1: YEAR, WEEK_NO 기준 정렬**
```python
sql = """
SELECT SEQ
FROM (
    SELECT SEQ
    FROM TS_INS_MASTER
    WHERE DAY_GB = 'WEEK'
      AND STATUS_CD = 'COMPLETE'
      AND (REPORT_YEAR < :year OR (REPORT_YEAR = :year AND REPORT_WEEK_NO < :week_no))
    ORDER BY REPORT_YEAR DESC, REPORT_WEEK_NO DESC
)
WHERE ROWNUM = 1
"""
```

**방법 2: 정확한 이전 주차 지정 (권장)**
```python
def _get_previous_data(self) -> Optional[Dict[str, Any]]:
    # 현재 주차 정보 조회
    year, week_no = self._get_current_week_info()

    # 이전 주차 계산
    if week_no == 1:
        prev_year = year - 1
        prev_week_no = self._get_last_week_of_year(prev_year)
    else:
        prev_year = year
        prev_week_no = week_no - 1

    # 정확한 이전 주차 조회
    sql = """
    SELECT SEQ
    FROM TS_INS_MASTER
    WHERE DAY_GB = 'WEEK'
      AND STATUS_CD = 'COMPLETE'
      AND REPORT_YEAR = :prev_year
      AND REPORT_WEEK_NO = :prev_week_no
    """
    result = self.fetch_one(sql, {
        'prev_year': prev_year,
        'prev_week_no': prev_week_no,
    })
    ...
```

### 영향받는 코드

| 파일 | 메소드 | 용도 |
|------|--------|------|
| modon.py | `_get_previous_data()` | 모돈 현황 이전 주차 대비 증감 계산 |

### 수정 방안

1. `modon.py`의 `_get_previous_data()` 메소드를 **YEAR, WEEK_NO 기준**으로 수정
2. `_get_current_week_info()` 헬퍼 메소드 추가 (base.py 또는 각 프로세서)
3. `_get_last_week_of_year()` 헬퍼 메소드 추가 (52/53주차 처리)

---

## ✅ 완료: HINT 컬럼 통합 (2026-01-20 구현 완료)

### 배경

사용자 질문: "HINT1... 컬럼 추가해서 관리하면 되는것 아닌가? 왜 따로 ROW가 생성되었나?"

### 구현 내용

**DB 테이블 변경**: `TS_INS_WEEK_SUB`에 HINT1, HINT2, HINT3 컬럼 추가 (VARCHAR2(500))

**ETL 수정**: 별도 HINT ROW INSERT → 기존 STAT ROW의 HINT1 컬럼 UPDATE

| Processor | GUBUN | 조건 | 저장 컬럼 |
|-----------|-------|------|----------|
| mating.py | GB | `SUB_GUBUN = 'STAT'` | HINT1 |
| farrowing.py | BM | `SORT_NO = 1` | HINT1 |
| weaning.py | EU | `SORT_NO = 1` | HINT1 |

**API 수정**: SQL 쿼리 및 매핑 함수에 HINT1, HINT2, HINT3 추가

### 수정된 파일 목록

**inspig-etl**:
| 파일 | 수정 내용 |
|------|----------|
| mating.py | `_insert_hint()`: UPDATE HINT1 WHERE GUBUN='GB' AND SUB_GUBUN='STAT' |
| farrowing.py | `_insert_hint()`: UPDATE HINT1 WHERE GUBUN='BM' AND SORT_NO=1 |
| weaning.py | `_insert_hint()`: UPDATE HINT1 WHERE GUBUN='EU' AND SORT_NO=1 |

**inspig (API)**:
| 파일 | 수정 내용 |
|------|----------|
| ts-ins-week-sub.entity.ts | hint1, hint2, hint3 컬럼 정의 추가 |
| weekly.sql.ts | getReportSub, getPopupSub, getPopupSubLike 쿼리에 HINT1, HINT2, HINT3 SELECT 추가 |
| weekly.service.ts | mapRowToWeekSub()에 hint1, hint2, hint3 매핑 추가 |

### 효과

- **주당 3 ROW 감소** (농장당) - 별도 HINT ROW 불필요
- 100개 농장 × 52주 = 연간 **15,600 ROW 감소**

---

## ETL 프로세서 HINT 필드 가이드

### TS_INS_WEEK_SUB 테이블 HINT 컬럼 구조

```sql
HINT1  VARCHAR2(500)  -- 예정 산출기준 설명 (주 힌트)
HINT2  VARCHAR2(500)  -- 보조 힌트 (예약)
HINT3  VARCHAR2(500)  -- 보조 힌트 (예약)
```

### HINT1 저장 패턴

HINT는 **기존 STAT ROW에 UPDATE**로 저장합니다. 별도 ROW를 INSERT하지 않습니다.

```python
def _insert_hint(self, ins_conf: Dict[str, Any]) -> None:
    """예정 산출기준 힌트 메시지를 STAT ROW의 HINT1 컬럼에 UPDATE

    Args:
        ins_conf: TS_INS_CONF 설정 (method, tasks, seq_filter)
    """
    if ins_conf['method'] is None:
        # 설정 없으면 힌트 저장 안 함
        return

    # 힌트 메시지 생성
    hint = self._build_hint_message(ins_conf)

    # UPDATE: 기존 STAT ROW의 HINT1 컬럼에 저장
    sql = """
    UPDATE TS_INS_WEEK_SUB
    SET HINT1 = :hint
    WHERE MASTER_SEQ = :master_seq
      AND FARM_NO = :farm_no
      AND GUBUN = :gubun
      AND <조건>  -- GUBUN별 조건 다름
    """
    self.execute(sql, {
        'master_seq': self.master_seq,
        'farm_no': self.farm_no,
        'hint': hint,
    })
```

### GUBUN별 UPDATE 조건

| GUBUN | 프로세서 | WHERE 조건 | 비고 |
|-------|---------|-----------|------|
| GB | mating.py | `SUB_GUBUN = 'STAT'` | 교배 요약 통계 ROW |
| BM | farrowing.py | `SORT_NO = 1` | 분만 요약 통계 ROW (SUB_GUBUN 없음) |
| EU | weaning.py | `SORT_NO = 1` | 이유 요약 통계 ROW (SUB_GUBUN 없음) |

### 힌트 메시지 형식

```
(농장 기본값)
· 임신모돈(평균임신기간) 116일

(모돈 작업설정)
· 분만예정 (교배일+114일)
· 이유예정 (분만일+21일)
```

- 첫 줄: 산출 방식 (`농장 기본값` 또는 `모돈 작업설정`)
- 이후 줄: 구체적인 산출 기준 (줄바꿈으로 구분)

### 새 프로세서 작성 시 체크리스트

1. **HINT ROW 생성 금지**: 별도 `SUB_GUBUN='HINT'` ROW를 INSERT하지 않음
2. **STAT ROW에 UPDATE**: 기존 요약 통계 ROW의 HINT1 컬럼에 UPDATE
3. **method 체크**: `ins_conf['method']`가 None이면 힌트 저장 생략
4. **줄바꿈 처리**: 힌트 메시지 내 줄바꿈은 `\n` 사용 (프론트엔드에서 `white-space: pre-line`으로 표시)

### API에서 HINT 조회

**weekly.service.ts** - transform 메소드에서 hint1 필드 매핑:

```typescript
// 예: transformFarrowingPopup()
return {
  planned,
  actual,
  rate,
  stats: { ... },
  // 힌트 메시지 - 예정 산출기준 설명
  hint: statSub?.hint1 || undefined,
};
```

### 프론트엔드 힌트 표시

힌트가 있으면 💡 아이콘 표시, 클릭 시 툴팁으로 내용 표시:

```tsx
{data.hint && (
  <span className="icon-circle clickable" onClick={() => setShowHintTooltip(!showHintTooltip)}>
    <FontAwesomeIcon icon={faLightbulb} />
  </span>
)}
```

---

## ✅ 완료: 이전 주차 예정복수 조회 로직 구현 (2026-01-20)

### 구현 내용 요약

PLAN_USE_PREV_WEEK_SCHEDULE.md 계획에 따라 모든 작업 완료됨.

### 수정된 파일 목록

| 파일 | 수정 내용 |
|------|----------|
| base.py | `_get_current_week_info()`, `_get_last_week_of_year()`, `_get_prev_week_info()`, `_get_prev_week_master_seq()` 헬퍼 추가 |
| modon.py | `_get_previous_data()` → YEAR/WEEK_NO 기준 조회로 변경 |
| mating.py | `_get_plan_from_prev_week()` 추가, `_get_plan_counts()` 분기 로직, `_insert_hint()` prev_hint 지원 |
| farrowing.py | `_get_plan_from_prev_week()` 추가, `_get_plan_count()` 분기 로직, `_insert_hint()` prev_hint 지원 |
| weaning.py | `_get_plan_from_prev_week()` 추가, `_get_plan_count()` 분기 로직, `_insert_hint()` prev_hint 지원 |

---

### 구현 완료 후 프로세스 흐름도

#### 1. 전체 ETL 흐름 (N주차 리포트 생성)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        N주차 주간 리포트 ETL 실행                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   mating.py     │      │  farrowing.py   │      │   weaning.py    │
│   (교배 팝업)    │      │   (분만 팝업)    │      │   (이유 팝업)    │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    _get_plan_counts() / _get_plan_count()                    │
│                      (이전 주차 우선 조회 - Fallback 직접 계산)                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │ _get_plan_from_prev_week()    │
                    │ (이전 주차 금주예정 조회)       │
                    └───────────────┬───────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
            ┌───────────────┐               ┌───────────────┐
            │ 데이터 있음   │               │ 데이터 없음   │
            │ (prev_data)   │               │ (None)        │
            └───────┬───────┘               └───────┬───────┘
                    │                               │
                    ▼                               ▼
        ┌───────────────────────┐     ┌───────────────────────────┐
        │ 이전 주차 금주예정    │     │ _calculate_plan_count()   │
        │ 사용 (+ 힌트)        │     │ (직접 계산 Fallback)      │
        │                       │     │ - 신규 농장               │
        │ • 교배: THIS_GB_SUM   │     │ - 첫 리포트               │
        │ • 분만: THIS_BM_SUM   │     │ - 이전 주차 없음          │
        │ • 이유: THIS_EU_SUM   │     └───────────────────────────┘
        └───────────────────────┘
```

#### 2. 이전 주차 조회 상세 흐름 (mating.py 예시)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    mating.py _get_plan_from_prev_week()                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │ _get_prev_week_master_seq()   │
                    │        (base.py 헬퍼)         │
                    └───────────────┬───────────────┘
                                    │
                        ┌───────────┴───────────┐
                        ▼                       ▼
                ┌───────────────┐       ┌───────────────┐
                │ 결과 있음     │       │ 결과 없음     │
                │ prev_master   │       │ return None   │
                │ _seq 반환     │       └───────────────┘
                └───────┬───────┘
                        │
                        ▼
    ┌───────────────────────────────────────────────────────────────┐
    │  1. 힌트 조회 (SCHEDULE/HELP STR_1)                          │
    └───────────────────────────────────────────────────────────────┘
                        │
                        ▼
    ┌───────────────────────────────────────────────────────────────┐
    │  2. SCHEDULE/GB 상세 조회 시도 (method='modon'일 때 저장됨)    │
    │     ┌─────────────────────────────────────────────────────┐   │
    │     │ 후보돈 CNT_1 합계 → plan_hubo (초교배예정)          │   │
    │     │ 이유돈+사고후교배 CNT_1 합계 → plan_js (정상교배예정)│   │
    │     └─────────────────────────────────────────────────────┘   │
    └───────────────────────────────────────────────────────────────┘
                        │
            ┌───────────┴───────────┐
            ▼                       ▼
    ┌───────────────┐       ┌───────────────┐
    │ 상세 있음     │       │ 상세 없음     │
    │ (method=modon)│       │ (method=farm) │
    └───────┬───────┘       └───────┬───────┘
            │                       │
            │                       ▼
            │       ┌───────────────────────────────────────────────┐
            │       │  3. Fallback: TS_INS_WEEK.THIS_GB_SUM 조회    │
            │       │     → 전체를 정상교배(plan_js)로 처리         │
            │       │     → return (0, total_gb, hint)              │
            │       └───────────────────────────────────────────────┘
            │                       │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────────┐
            │ return (plan_hubo,        │
            │         plan_js,          │
            │         hint)             │
            └───────────────────────────┘
```

#### 3. 힌트 저장 흐름 (_insert_hint)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         _insert_hint(ins_conf, prev_hint)                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │     prev_hint 매개변수 확인    │
                    └───────────────┬───────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
    ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
    │ prev_hint     │       │ prev_hint     │       │ method = None │
    │ is not None   │       │ is None       │       │               │
    │ (이전 주차    │       │ (직접 계산)    │       │ (설정 없음)   │
    │  힌트 있음)   │       │               │       │               │
    └───────┬───────┘       └───────┬───────┘       └───────┬───────┘
            │                       │                       │
            ▼                       ▼                       ▼
    ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
    │ hint =        │       │ 현재 설정으로 │       │   return      │
    │ prev_hint     │       │ 힌트 생성     │       │   (저장 안함) │
    └───────┬───────┘       └───────┬───────┘       └───────────────┘
            │                       │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────────────────────┐
            │  UPDATE TS_INS_WEEK_SUB               │
            │  SET HINT1 = :hint                   │
            │  WHERE MASTER_SEQ = :master_seq      │
            │    AND FARM_NO = :farm_no            │
            │    AND GUBUN = 'GB'/'BM'/'EU'        │
            │    AND (SUB_GUBUN='STAT' / SORT_NO=1)│
            └───────────────────────────────────────┘
```

#### 4. 로직 요약 (분기 조건 없음)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     모든 주차에서 동일한 로직 적용                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   1차: 이전 주차 금주예정 조회                                                │
│        └─ TS_INS_WEEK.THIS_GB_SUM / THIS_BM_SUM / THIS_EU_SUM              │
│        └─ SCHEDULE/HELP 힌트 정보                                           │
│                                                                             │
│   2차: Fallback (이전 주차 데이터 없는 경우)                                  │
│        └─ 신규 농장                                                         │
│        └─ 첫 리포트 생성                                                    │
│        └─ 이전 주차 리포트 삭제됨                                            │
│        → settings?tab=weekly 설정 기준 직접 계산                            │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   예시: 3주차 리포트 생성 시                                                  │
│        └─ 2주차 금주예정 조회 → 3주차 지난주예정으로 사용                      │
│        └─ 2주차 없으면 → Fallback (직접 계산)                                │
│                                                                             │
│   예시: 1주차(연도 전환) 리포트 생성 시                                        │
│        └─ 전년도 52/53주차 금주예정 조회 → 1주차 지난주예정으로 사용           │
│        └─ 전년도 데이터 없으면 → Fallback (직접 계산)                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5. 프로세서별 조회 데이터 요약

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           이전 주차 데이터 조회 요약                           │
├──────────────┬───────────────────────────────────────────────────────────────┤
│  Processor   │                        조회 대상                              │
├──────────────┼───────────────────────────────────────────────────────────────┤
│              │ • 교배 예정: TS_INS_WEEK_SUB (GUBUN='SCHEDULE', SUB_GUBUN='GB')│
│  mating.py   │   - 후보돈 CNT_1 합계 → plan_hubo                             │
│              │   - 이유돈+사고후교배 CNT_1 합계 → plan_js                     │
│              │ • 힌트: SUB_GUBUN='HELP' STR_1                                │
├──────────────┼───────────────────────────────────────────────────────────────┤
│              │ • 분만 예정: TS_INS_WEEK.THIS_BM_SUM                           │
│ farrowing.py │ • 힌트: SUB_GUBUN='HELP' STR_2                                │
├──────────────┼───────────────────────────────────────────────────────────────┤
│              │ • 이유 예정: TS_INS_WEEK.THIS_EU_SUM                           │
│  weaning.py  │ • 힌트: SUB_GUBUN='HELP' STR_3                                │
├──────────────┼───────────────────────────────────────────────────────────────┤
│              │ • 이전 주차 모돈 현황: YEAR/WEEK_NO 기준 정확한 이전 주차 조회 │
│   modon.py   │   (기존: SEQ 순서 기준 → 변경: YEAR/WEEK_NO 기준)             │
└──────────────┴───────────────────────────────────────────────────────────────┘
```

#### 6. base.py 헬퍼 메소드 구조

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        base.py (BaseProcessor)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  _get_current_week_info() -> tuple(year, week_no)                     │  │
│  │  • TS_INS_MASTER에서 현재 리포트의 REPORT_YEAR, REPORT_WEEK_NO 조회   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                      │                                      │
│                                      ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  _get_prev_week_info() -> tuple(prev_year, prev_week_no)              │  │
│  │  • week_no > 1: (year, week_no - 1)                                   │  │
│  │  • week_no = 1: (year - 1, _get_last_week_of_year(year - 1))         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                      │                                      │
│                                      ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  _get_last_week_of_year(year) -> int (52 or 53)                       │  │
│  │  • 1차: DB 조회 (해당 연도 최대 REPORT_WEEK_NO)                        │  │
│  │  • 2차: Python ISO week 계산 (date(year, 12, 28).isocalendar()[1])   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                      │                                      │
│                                      ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  _get_prev_week_master_seq() -> Optional[int]                         │  │
│  │  • TS_INS_MASTER에서 이전 주차의 SEQ 조회                              │  │
│  │  • WHERE REPORT_YEAR = prev_year AND REPORT_WEEK_NO = prev_week_no   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

*작성일: 2026-01-20*
*업데이트: 2026-01-20 - modon.py 이전 주차 조회 이슈 추가*
*업데이트: 2026-01-20 - HINT 컬럼 통합 구현 완료*
*업데이트: 2026-01-20 - 이전 주차 예정복수 조회 로직 구현 완료 (프로세스 흐름도 추가)*
