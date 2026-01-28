# 기상 데이터 수집 (TM_WEATHER)

> 기상청 API를 통한 날씨 데이터 수집 및 TM_WEATHER, TM_WEATHER_HOURLY 저장

---

## 1. 개요

| 테이블명 | 설명 | UK |
|----------|------|-----|
| TM_WEATHER | 일별 날씨 | NX + NY + WK_DATE |
| TM_WEATHER_HOURLY | 시간별 날씨 | NX + NY + WK_DATE + WK_TIME |
| TM_WEATHER_ASOS | ASOS 관측소 정보 | STN_ID |
| TS_API_KEY_INFO | API 키 관리 | SEQ |

수집기: `src/collectors/weather.py`

### 1.1 수집 시기

| 스케줄 | 설명 |
|--------|------|
| 주간 리포트 ETL | 매주 월요일 02:00 (`run_etl.py weekly`) 실행 시 함께 수집 |
| 수동 실행 | `run_etl.py weather` 명령으로 단독 실행 가능 |

### 1.2 수집 대상

| 조건 | 설명 |
|------|------|
| 대상 격자 | TA_FARM.WEATHER_NX, WEATHER_NY 조회 (중복 제거) |
| 보조 조회 | WEATHER_NX/NY가 없으면 MAP_X_N/Y_N → 격자 변환 |
| API 키 | TS_API_KEY_INFO에서 REQ_CNT 기반 로드밸런싱 |

### 1.3 수집 전략

| 구분 | API | 대상 기간 | IS_FORECAST |
|------|-----|-----------|-------------|
| 단기예보 | getVilageFcst | 오늘 ~ +3일 | Y (예보) |
| 초단기실황 | getUltraSrtNcst | 현재 시각 | N (실측) |
| ASOS 일자료 | getWthrDataList | 어제까지 | N (실측) |

### 1.4 실행 흐름 (WeatherCollector)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       WeatherCollector 실행 흐름                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  [1] 초기화                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  collector = WeatherCollector()                                          │    │
│  │  - base_url: https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0  │    │
│  │  - asos_daily_url: https://apis.data.go.kr/1360000/AsosDalyInfoService  │    │
│  │  - key_manager: ApiKeyManager (TS_API_KEY_INFO 관리)                     │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                              │                                                  │
│                              ▼                                                  │
│  [2] 수집 (collect)                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  data = collector.collect()                                              │    │
│  │                                                                         │    │
│  │  1. API 키 로드                                                          │    │
│  │     └→ key_manager.load_keys() → TS_API_KEY_INFO에서 유효 키 조회        │    │
│  │                                                                         │    │
│  │  2. 대상 격자 조회                                                        │    │
│  │     ├→ _get_target_grids()                                              │    │
│  │     │   └→ TA_FARM.WEATHER_NX, WEATHER_NY (중복 제거)                    │    │
│  │     └→ _get_grids_from_mapxy()                                          │    │
│  │         └→ MAP_X_N, MAP_Y_N → latlon_to_grid() 변환                     │    │
│  │                                                                         │    │
│  │  3. 기준 시간 계산                                                        │    │
│  │     ├→ _get_base_datetime() → 단기예보 기준 (02:00/05:00/08:00/...)     │    │
│  │     └→ _get_ncst_base_datetime() → 초단기실황 기준 (매시 정각)            │    │
│  │                                                                         │    │
│  │  4. 격자별 API 호출 (순차 처리)                                           │    │
│  │     ┌─────────────────────────────────────────────────────────────────┐ │    │
│  │     │ for (nx, ny) in unique_grids:                                   │ │    │
│  │     │                                                                 │ │    │
│  │     │   [4-1] 단기예보 수집 (IS_FORECAST='Y')                          │ │    │
│  │     │         └→ _fetch_forecast(nx, ny, base_date, base_time)       │ │    │
│  │     │             └→ GET /getVilageFcst                               │ │    │
│  │     │                                                                 │ │    │
│  │     │   [4-2] TMN/TMX 확보 (필요시)                                    │ │    │
│  │     │         └→ _fetch_forecast(..., '0500') → 05:00 발표 데이터     │ │    │
│  │     │                                                                 │ │    │
│  │     │   [4-3] 초단기실황 수집 (IS_FORECAST='N')                         │ │    │
│  │     │         └→ _fetch_ultra_srt_ncst(nx, ny, base_date, base_time)  │ │    │
│  │     │             └→ GET /getUltraSrtNcst                             │ │    │
│  │     └─────────────────────────────────────────────────────────────────┘ │    │
│  │                                                                         │    │
│  │  5. 응답 변환                                                             │    │
│  │     ├→ _parse_forecast_items() → daily_data, hourly_data               │    │
│  │     ├→ _finalize_daily_data() → TM_WEATHER 레코드                       │    │
│  │     ├→ _finalize_hourly_data() → TM_WEATHER_HOURLY 레코드               │    │
│  │     └→ _parse_ncst_items() → 실황 레코드                                 │    │
│  │                                                                         │    │
│  │  6. 결과 반환                                                             │    │
│  │     └→ {'daily': [...], 'hourly': [...], 'ncst': [...],                │    │
│  │          'is_complete': bool, 'total_grids': N, 'collected_grids': M}   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                              │                                                  │
│                              ▼                                                  │
│  [3] 저장 (save)                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  collector.save(data)                                                    │    │
│  │                                                                         │    │
│  │  ※ is_complete=False 이면 저장 스킵 (API limit 등으로 중단 시)            │    │
│  │                                                                         │    │
│  │  1. TM_WEATHER 저장 (일별)                                               │    │
│  │     └→ MERGE INTO TM_WEATHER (UK: NX, NY, WK_DATE)                      │    │
│  │                                                                         │    │
│  │  2. TM_WEATHER_HOURLY 저장 (시간별)                                       │    │
│  │     └→ MERGE INTO TM_WEATHER_HOURLY (UK: NX, NY, WK_DATE, WK_TIME)      │    │
│  │                                                                         │    │
│  │  3. API 키 사용량 업데이트                                                │    │
│  │     └→ UPDATE TS_API_KEY_INFO SET REQ_CNT = REQ_CNT + :cnt              │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                              │                                                  │
│                              ▼                                                  │
│  [4] ASOS 실측 업데이트 (선택)                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  collector.collect_asos_daily()                                          │    │
│  │                                                                         │    │
│  │  - 어제까지의 실측 데이터로 TM_WEATHER 덮어쓰기                            │    │
│  │  - IS_FORECAST='N'으로 업데이트                                          │    │
│  │  - 농장별 가장 가까운 ASOS 관측소 데이터 사용                              │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.5 API 키 관리 (TS_API_KEY_INFO)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          API 키 로드밸런싱 전략                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  1. 키 로드 (ApiKeyManager.load_keys)                                           │
│     └→ SELECT * FROM TS_API_KEY_INFO WHERE USE_YN = 'Y'                        │
│         ORDER BY REQ_CNT ASC  ← 사용량 적은 순서                                │
│                                                                                 │
│  2. 키 선택 (get_current_key)                                                   │
│     └→ REQ_CNT가 가장 작은 유효 키 반환                                         │
│                                                                                 │
│  3. 호출 성공 시                                                                 │
│     └→ increment_count(key) → REQ_CNT += 1                                     │
│                                                                                 │
│  4. 호출 제한 시 (resultCode: 22, 99 등)                                        │
│     └→ mark_key_exhausted(key) → 해당 키 제외, 다음 키로 전환                   │
│                                                                                 │
│  5. 모든 키 소진 시                                                              │
│     └→ 수집 중단, is_complete=False 반환 → 저장 스킵                            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.6 CLI 실행 예시

```bash
# 날씨 데이터만 수집 (현재 시간 기준)
python run_etl.py weather

# ASOS 실측 데이터 수집 (어제까지)
python run_etl.py weather --asos

# 테스트 모드 (특정 격자만)
python run_etl.py weather --test --grids "60,127,61,128"

# 전체 ETL (날씨 + 생산성 + 주간리포트)
python run_etl.py all
```

### 1.7 Python 사용 예시

```python
from src.collectors.weather import WeatherCollector

# 날씨 데이터 수집
collector = WeatherCollector()
data = collector.collect()

# 수집 완료 여부 확인 후 저장
if data['is_complete']:
    collector.save(data)
    print(f"저장 완료: 일별 {len(data['daily'])}건, 시간별 {len(data['hourly'])}건")
else:
    print(f"수집 중단: {data['collected_grids']}/{data['total_grids']} 격자만 수집됨")

# ASOS 실측 데이터로 업데이트 (어제까지)
collector.collect_asos_daily()
```

---

## 2. 격자 좌표 시스템

### 2.1 좌표 변환

기상청 API는 위경도(WGS84) 대신 **Lambert Conformal Conic 격자 좌표**를 사용합니다.

| 항목 | 값 |
|------|-----|
| 격자 크기 | 5km x 5km |
| 좌표 범위 | NX: 1~149, NY: 1~253 |
| 좌표계 | Lambert Conformal Conic |

**변환 함수 (Python):**

```python
def latlon_to_grid(lat: float, lon: float) -> Tuple[int, int]:
    """위경도를 기상청 격자 좌표로 변환

    Args:
        lat: 위도 (MAP_Y)
        lon: 경도 (MAP_X)

    Returns:
        (nx, ny) 격자 좌표 튜플
    """
    # Lambert Conformal Conic 변환 상수
    RE = 6371.00877    # 지구 반경(km)
    GRID = 5.0         # 격자 간격(km)
    SLAT1 = 30.0       # 투영 위도1
    SLAT2 = 60.0       # 투영 위도2
    OLON = 126.0       # 기준점 경도
    OLAT = 38.0        # 기준점 위도
    XO = 43            # 기준점 X좌표
    YO = 136           # 기준점 Y좌표
    # ... (변환 로직)
```

### 2.2 농장 좌표 매핑

```
┌───────────────────────────────────────────────────────────────────────────┐
│ TA_FARM 테이블                                                            │
├───────────────────────────────────────────────────────────────────────────┤
│ MAP_X, MAP_Y (WGS84 위경도)                                               │
│     │                                                                     │
│     ├─── latlon_to_grid() ───▶ WEATHER_NX, WEATHER_NY (격자 좌표)         │
│     │                                                                     │
│     └─── find_nearest_asos_station() ───▶ ASOS_STN_ID (실측 관측소)       │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

**TA_FARM 확장 컬럼:**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| MAP_X, MAP_Y | NUMBER | WGS84 위경도 (Kakao API) |
| WEATHER_NX, WEATHER_NY | INTEGER | 기상청 격자 좌표 |
| ASOS_STN_ID | INTEGER | 가장 가까운 ASOS 관측소 ID |
| ASOS_STN_NM | VARCHAR2(50) | ASOS 관측소명 |
| ASOS_DIST_KM | NUMBER | 관측소까지 거리 (km) |

---

## 3. 데이터 수집 전략

### 3.1 수집 흐름도

```
┌──────────────────────────────────────────────────────────────────────────┐
│                       WeatherCollector                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [1] TM_WEATHER (일별)                                                   │
│      ├── 단기예보(getVilageFcst): 오늘 ~ +3일 예보 (IS_FORECAST='Y')     │
│      └── ASOS 일자료: 어제까지 실측으로 덮어쓰기 (IS_FORECAST='N')       │
│                                                                          │
│  [2] TM_WEATHER_HOURLY (시간별)                                          │
│      ├── 초단기실황(getUltraSrtNcst): 현재 시각 실측 (IS_FORECAST='N')   │
│      └── 단기예보(getVilageFcst): 오늘 ~ +3일 예보 (IS_FORECAST='Y')     │
│                                                                          │
│  [3] API 키 관리                                                         │
│      └── TS_API_KEY_INFO: REQ_CNT 기반 로드밸런싱                        │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.2 API 종류 및 용도

| API | 용도 | 대상 테이블 | IS_FORECAST |
|-----|------|-------------|-------------|
| getVilageFcst (단기예보) | 오늘~+3일 예보 | TM_WEATHER, TM_WEATHER_HOURLY | Y |
| getUltraSrtNcst (초단기실황) | 현재 시각 실측 | TM_WEATHER_HOURLY | N |
| getWthrDataList (ASOS 일자료) | 어제까지 실측 | TM_WEATHER | N |
| getMidTa (중기기온예보) | +4일~+10일 기온 | TM_WEATHER | Y |
| getMidLandFcst (중기육상예보) | +4일~+10일 날씨 | TM_WEATHER | Y |

### 3.3 데이터 갱신 주기

| 데이터 | 발표 주기 | API 제공 시간 |
|--------|----------|--------------|
| 초단기실황 | 매시 정각 | 발표 후 40분 |
| 단기예보 | 3시간 (02,05,08,11,14,17,20,23시) | 발표 후 10분 |
| 중기예보 | 1일 2회 (06시, 18시) | 발표 후 약 1시간 |
| ASOS 일자료 | 1일 1회 (전일 데이터) | 익일 새벽 |

---

## 4. TM_WEATHER (일별 날씨)

### 4.1 테이블 구조

```sql
CREATE TABLE TM_WEATHER (
    NX              INTEGER NOT NULL,       -- 격자 X좌표
    NY              INTEGER NOT NULL,       -- 격자 Y좌표
    WK_DATE         VARCHAR2(8) NOT NULL,   -- 날짜 (YYYYMMDD)

    -- 기온
    TMP             NUMBER(5,1),            -- 기온 (시간대별 대표)
    TMN             NUMBER(5,1),            -- 최저기온
    TMX             NUMBER(5,1),            -- 최고기온

    -- 강수/습도
    POP             NUMBER(3),              -- 강수확률 (%)
    PCP             NUMBER(6,1),            -- 1시간 강수량 (mm)
    REH             NUMBER(3),              -- 습도 (%)

    -- 바람
    WSD             NUMBER(5,1),            -- 풍속 (m/s)
    VEC             NUMBER(3),              -- 풍향 (도)

    -- 날씨 상태
    SKY_CD          VARCHAR2(1),            -- 하늘상태 코드 (1:맑음, 3:구름많음, 4:흐림)
    PTY_CD          VARCHAR2(1),            -- 강수형태 코드 (0~4)
    WEATHER_CD      VARCHAR2(20),           -- 날씨 코드 (sunny, rainy, snow 등)
    WEATHER_NM      VARCHAR2(50),           -- 날씨 한글명

    -- 메타
    IS_FORECAST     CHAR(1) DEFAULT 'Y',    -- 예보/실측 구분 (Y:예보, N:실측)
    INS_DT          DATE DEFAULT SYSDATE,
    UPD_DT          DATE,

    CONSTRAINT PK_TM_WEATHER PRIMARY KEY (NX, NY, WK_DATE)
);
```

### 4.2 날씨 코드 정의

**SKY_CD (하늘상태):**

| 코드 | WEATHER_CD | WEATHER_NM |
|------|------------|------------|
| 1 | sunny | 맑음 |
| 3 | cloudy | 구름많음 |
| 4 | overcast | 흐림 |

**PTY_CD (강수형태) - PTY가 있으면 SKY보다 우선:**

| 코드 | WEATHER_CD | WEATHER_NM |
|------|------------|------------|
| 0 | (SKY_CD 따름) | - |
| 1 | rainy | 비 |
| 2 | rain_snow | 비/눈 |
| 3 | snow | 눈 |
| 4 | shower | 소나기 |

**날씨 코드 결정 로직:**

```python
def determine_weather_code(sky_cd: str, pty_cd: str) -> Tuple[str, str]:
    """SKY_CD와 PTY_CD로 날씨 코드 결정"""
    # PTY가 0이 아니면 강수형태 우선
    if pty_cd and pty_cd != '0':
        return PTY_CODES[pty_cd]  # (weather_cd, weather_nm)

    # PTY가 0이면 하늘상태 사용
    if sky_cd:
        return SKY_CODES[sky_cd]

    return ('sunny', '맑음')  # 기본값
```

---

## 5. TM_WEATHER_HOURLY (시간별 날씨)

### 5.1 테이블 구조

```sql
CREATE TABLE TM_WEATHER_HOURLY (
    NX              INTEGER NOT NULL,
    NY              INTEGER NOT NULL,
    WK_DATE         VARCHAR2(8) NOT NULL,
    WK_TIME         VARCHAR2(4) NOT NULL,   -- 시간 (HHMM, 0000~2300)

    -- 기온/강수/습도/바람
    TMP             NUMBER(5,1),
    PCP             NUMBER(6,1),
    REH             NUMBER(3),
    WSD             NUMBER(5,1),
    VEC             NUMBER(3),

    -- 날씨 상태
    SKY_CD          VARCHAR2(1),
    PTY_CD          VARCHAR2(1),
    WEATHER_CD      VARCHAR2(20),
    WEATHER_NM      VARCHAR2(50),

    -- 메타
    IS_FORECAST     CHAR(1) DEFAULT 'Y',
    INS_DT          DATE DEFAULT SYSDATE,
    UPD_DT          DATE,

    CONSTRAINT PK_TM_WEATHER_HOURLY PRIMARY KEY (NX, NY, WK_DATE, WK_TIME)
);
```

---

## 6. TM_WEATHER_ASOS (ASOS 관측소)

### 6.1 테이블 구조

```sql
CREATE TABLE TM_WEATHER_ASOS (
    STN_ID          INTEGER NOT NULL,       -- 관측소 번호
    STN_NM          VARCHAR2(50) NOT NULL,  -- 관측소명
    LAT             NUMBER(10,6) NOT NULL,  -- 위도
    LON             NUMBER(10,6) NOT NULL,  -- 경도
    USE_YN          CHAR(1) DEFAULT 'Y',
    CONSTRAINT PK_TM_WEATHER_ASOS PRIMARY KEY (STN_ID)
);
```

### 6.2 ASOS 관측소 매핑

농장별로 가장 가까운 ASOS 관측소를 찾아 일별 실측 데이터를 조회합니다.

```python
def find_nearest_asos_station(lat: float, lon: float) -> Tuple[int, str, float]:
    """위경도에서 가장 가까운 ASOS 관측소 찾기 (Haversine 공식)

    Returns:
        (관측소번호, 관측소명, 거리km)
    """
```

---

## 7. TS_API_KEY_INFO (API 키 관리)

### 7.1 테이블 구조

```sql
CREATE TABLE TS_API_KEY_INFO (
    SEQ             NUMBER NOT NULL,
    API_TYPE        VARCHAR2(20) NOT NULL,  -- WEATHER, PRODUCTIVITY 등
    API_KEY         VARCHAR2(200) NOT NULL, -- 인코딩된 API 키
    DAILY_LIMIT     INTEGER DEFAULT 10000,  -- 일일 호출 한도
    REQ_CNT         INTEGER DEFAULT 0,      -- 당일 호출 횟수
    LAST_REQ_DT     DATE,                   -- 마지막 요청 시간
    USE_YN          CHAR(1) DEFAULT 'Y',
    CONSTRAINT PK_TS_API_KEY_INFO PRIMARY KEY (SEQ)
);
```

### 7.2 로드밸런싱 로직

```python
class ApiKeyManager:
    """API 키 로드밸런싱 관리자

    여러 API 키를 REQ_CNT 기준으로 균등 분배합니다.
    """

    def get_next_key(self, api_type: str = 'WEATHER') -> str:
        """사용 가능한 API 키 중 호출 횟수가 가장 적은 키 반환

        1. USE_YN='Y'이고 REQ_CNT < DAILY_LIMIT인 키 조회
        2. REQ_CNT 오름차순 정렬
        3. 첫 번째 키 반환 및 REQ_CNT 증가
        """
```

---

## 8. 중기예보 지역코드 매핑

중기예보 API는 격자 좌표 대신 **지역코드(regId)** 기반으로 조회합니다.

### 8.1 시도코드 → 중기예보 지역코드

| 시도코드 | 지역 | getMidTa (기온) | getMidLandFcst (육상) |
|----------|------|-----------------|----------------------|
| 11 | 서울 | 11B10101 | 11B00000 |
| 41 | 경기 | 11B20601 (수원) | 11B00000 |
| 28 | 인천 | 11B20201 | 11B00000 |
| 42, 43 | 강원 | 11D10301 (춘천) | 11D10000 (영서) |
| 44, 30, 36 | 대전/세종/충남 | 11C20401 | 11C20000 |
| 45 | 충북 | 11C10301 (청주) | 11C10000 |
| 46, 29 | 광주/전남 | 11F20501 | 11F20000 |
| 47 | 전북 | 11F10201 (전주) | 11F10000 |
| 48, 26, 31, 49 | 부산/울산/경남 | 11H10701 | 11H10000 |
| 50, 27 | 대구/경북 | 11H20201 | 11H20000 |
| 51 | 제주 | 11G00201 | 11G00000 |

---

## 9. CLI 실행 예시

```bash
# 기상 데이터만 수집
python run_etl.py weather

# 특정 날짜 기준 수집
python run_etl.py weather --base-date 2025-01-13

# 전체 ETL (기상 + 생산성 + 주간리포트)
python run_etl.py all
```

---

## 10. 조회 예시

### 10.1 농장의 일별 날씨 조회

```sql
-- 농장의 주간 날씨 예보
SELECT W.WK_DATE, W.WEATHER_CD, W.WEATHER_NM, W.TMN, W.TMX, W.POP
FROM TM_WEATHER W
JOIN TA_FARM F ON W.NX = F.WEATHER_NX AND W.NY = F.WEATHER_NY
WHERE F.FARM_NO = :farm_no
  AND W.WK_DATE BETWEEN :dt_from AND :dt_to
ORDER BY W.WK_DATE;
```

### 10.2 오늘 시간별 날씨 조회

```sql
-- 농장의 오늘 시간별 날씨
SELECT H.WK_TIME, H.TMP, H.WEATHER_CD, H.WEATHER_NM, H.IS_FORECAST
FROM TM_WEATHER_HOURLY H
JOIN TA_FARM F ON H.NX = F.WEATHER_NX AND H.NY = F.WEATHER_NY
WHERE F.FARM_NO = :farm_no
  AND H.WK_DATE = TO_CHAR(SYSDATE, 'YYYYMMDD')
ORDER BY H.WK_TIME;
```

---

## 관련 문서

- [05_OPERATION_GUIDE.md](./05_OPERATION_GUIDE.md) - ETL 운영 가이드
- [06_PRODUCTIVITY_COLLECT.md](./06_PRODUCTIVITY_COLLECT.md) - 생산성 데이터 수집
- [02.table.md](../db/ins/02.table.md) - INS 테이블 전체 구조

## 관련 소스

- [weather.py](../../inspig-etl/src/collectors/weather.py) - ETL 수집기
- [TM_WEATHER.sql](../db/sql/ins/ddl/TM_WEATHER.sql) - DDL
