# 농장 주소 및 기상청 데이터 연동 가이드

## 1. 시스템 아키텍처 구조도

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        농장 주소 및 기상청 데이터 연동 시스템                         │
└─────────────────────────────────────────────────────────────────────────────────┘

 [1] 주소 검색 및 좌표 추출 (사용자 영역)
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │                           pig3.1 (Web UI / JSP)                                 │
 │                                                                                 │
 │  ┌─────────────────────┐    ┌─────────────────────────┐    ┌─────────────────┐ │
 │  │ KakaoAddrMapPopup  │───▶│      comPigPlan.js      │───▶│   부모창 필드    │ │
 │  │       (.jsp)       │    │  (pp_kakaoAddrCallback) │    │ (mapX, mapXN..) │ │
 │  │ - Daum Postcode API│    │                         │    │                 │ │
 │  │ - Kakao Geocoder   │    │ - 상세/대표 좌표 매핑     │    │ - Hidden 필드    │ │
 │  └─────────────────────┘    └─────────────────────────┘    └────────┬────────┘ │
 │                                                                     │           │
 └─────────────────────────────────────────────────────────────────────┼───────────┘
                                                                       │
 [2] 격자 변환 및 저장 (서버 영역)                                        │
 ┌─────────────────────────────────────────────────────────────────────┼───────────┐
 │                           pig3.1 (Java/Spring)                      │           │
 │                                                                     ▼           │
 │  ┌─────────────────────────┐    ┌─────────────────────┐    ┌─────────────────┐  │
 │  │ FarmInfoSharingService  │───▶│   WeatherGridUtil   │───▶│SharingFarmInfo  │  │
 │  │        (.java)          │    │       (.java)       │    │Mapper (.xml)    │  │
 │  │                         │    │                     │    │                 │  │
 │  │ - insert/update 호출    │    │ - Lambert 투영 계산  │    │ - TA_FARM 저장   │  │
 │  │ - 격자변환 유틸 호출     │    │ - NX_N, NY_N 자동생성│    │ - 6개 좌표 컬럼  │  │
 │  └─────────────────────────┘    └─────────────────────┘    └────────┬────────┘  │
 │                                                                     │           │
 └─────────────────────────────────────────────────────────────────────┼───────────┘
                                                                       │
 [3] 기상 데이터 수집 (데이터 영역)                                       │
 ┌─────────────────────────────────────────────────────────────────────┼───────────┐
 │                           inspig-etl (Python)                       │           │
 │                                                                     ▼           │
 │  ┌─────────────────────┐    ┌─────────────────────────┐    ┌─────────────────┐  │
 │  │  weather.py (ETL)   │◀───│      TA_FARM (DB)       │───▶│   TM_WEATHER    │  │
 │  │                     │    │                         │    │      (DB)       │  │
 │  │ - 유니크 격자 조회    │    │ - WEATHER_NX_N          │    │ - 일별/시간별    │  │
 │  │ - 기상청 API 호출    │    │ - WEATHER_NY_N          │    │ - 날씨 정보 저장 │  │
 │  └─────────────────────┘    └─────────────────────────┘    └─────────────────┘  │
 │                                                                                 │
 └─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 주소 및 좌표 관리 (Address & Coordinates)

### 2.1 주요 컬럼 (TA_FARM)

| 컬럼명 | 타입 | 설명 | 용도 |
|--------|------|------|------|
| **MAP_X, MAP_Y** | NUMBER(18,14) | 상세 위경도 좌표 | 지도상 정밀 위치 표시 |
| **MAP_X_N, MAP_Y_N** | NUMBER(18,14) | **읍면동 대표 위경도** | 기상 데이터 매핑용 |
| **WEATHER_NX_N, WEATHER_NY_N** | NUMBER(4) | 기상청 격자 좌표 | 기상 수집용 (자동 계산) |

> [!IMPORTANT]
> **좌표 컬럼 타입 변경 (Oracle)**
> 1. **NULL 초기화**: `UPDATE TA_FARM SET MAP_X=NULL, MAP_Y=NULL, MAP_X_N=NULL, MAP_Y_N=NULL; COMMIT;`
> 2. **타입 변경**: `ALTER TABLE TA_FARM MODIFY (MAP_X NUMBER(18,14), MAP_Y NUMBER(18,14), MAP_X_N NUMBER(18,14), MAP_Y_N NUMBER(18,14));`

---

## 3. 시스템 연동 구성 (System Integration)

### 3.1 Java 서버 (Real-time)
농장 저장 시 `WeatherGridUtil`을 통해 기상 격자를 즉시 계산하여 저장합니다.
- **대상**: `FarmInfoSharingService.java` -> `insertFarmInfo`
- **로직**: `WeatherGridUtil.updateWeatherGrid(infoVo)` 호출

### 3.2 ETL 프로세스 (Batch)
대표 격자(`WEATHER_NX_N/NY_N`) 기준으로 기상 데이터를 수집하여 중복을 최소화합니다.
- **대상**: `TA_FARM`의 유니크 격자 목록 (`DISTINCT`)
- **저장**: `TM_WEATHER` (일별), `TM_WEATHER_HOURLY` (시간별)

---

## 4. TM_WEATHER 테이블 구조 (날씨 데이터)

> [!NOTE]
> 지역 정보(시도/시군구/읍면동)는 TA_FARM.ADDR1에서 조회하므로 TM_WEATHER에 저장하지 않습니다.
> 격자(NX, NY)만으로 날씨 데이터를 관리합니다.

### 4.1 TM_WEATHER (일별 날씨)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| SEQ | NUMBER | 일련번호 (PK) |
| WK_DATE | VARCHAR2(8) | 예보일 (YYYYMMDD) |
| **NX, NY** | INTEGER | 기상청 격자 좌표 (5km 단위) |
| WEATHER_CD, WEATHER_NM | VARCHAR2 | 날씨코드/날씨명 (sunny/cloudy/rainy 등) |
| TEMP_AVG/HIGH/LOW | NUMBER(4,1) | 평균/최고/최저 기온 |
| RAIN_PROB | INTEGER | 강수확률 (%) |
| RAIN_AMT | NUMBER(5,1) | 강수량 (mm) |
| HUMIDITY | INTEGER | 습도 (%) |
| WIND_SPEED | NUMBER(4,1) | 풍속 (m/s) |
| SKY_CD | VARCHAR2(10) | 하늘상태 (1:맑음, 3:구름많음, 4:흐림) |
| IS_FORECAST | CHAR(1) | 예보여부 (Y:예보, N:실측) |

**인덱스**: `UK_TM_WEATHER_01 (NX, NY, WK_DATE)` - UNIQUE

### 4.2 TM_WEATHER_HOURLY (시간별 날씨)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| SEQ | NUMBER | 일련번호 (PK) |
| WK_DATE | VARCHAR2(8) | 예보일 (YYYYMMDD) |
| WK_TIME | VARCHAR2(4) | 예보시간 (HHMM) |
| **NX, NY** | INTEGER | 기상청 격자 좌표 |
| TEMP | NUMBER(4,1) | 기온 |
| RAIN_PROB | INTEGER | 강수확률 (%) |
| HUMIDITY | INTEGER | 습도 (%) |
| SKY_CD | VARCHAR2(10) | 하늘상태 (1:맑음, 3:구름많음, 4:흐림) |
| PTY_CD | VARCHAR2(10) | 강수형태 (0:없음, 1:비, 3:눈, 4:소나기) |

**인덱스**: `UK_TM_WEATHER_HOURLY_01 (NX, NY, WK_DATE, WK_TIME)` - UNIQUE

### 4.3 농장별 날씨 조회 방법

농장의 읍면동 정보는 TA_FARM에 저장되어 있으므로, TM_WEATHER와 JOIN하여 조회:

```sql
-- 농장별 오늘 날씨 조회 (읍면동 정보 포함)
SELECT F.FARM_NO, F.FARM_NM, F.ADDR1 AS 농장주소,
       W.WEATHER_NM, W.TEMP_HIGH, W.TEMP_LOW, W.RAIN_PROB
FROM TA_FARM F
JOIN TM_WEATHER W ON W.NX = F.WEATHER_NX_N AND W.NY = F.WEATHER_NY_N
WHERE F.FARM_NO = :farmNo
  AND W.WK_DATE = TO_CHAR(SYSDATE, 'YYYYMMDD');
```

> [!NOTE]
> 기상청 격자는 5km x 5km 단위로, 여러 읍면동이 같은 격자에 포함될 수 있습니다.
> 읍면동 정보는 TA_FARM.ADDR1에 포함되어 있으므로 TM_WEATHER에 별도 저장하지 않습니다.

---

## 5. 관련 파일 목록

| 위치 | 파일명 | 역할 |
|------|--------|------|
| pig3.1 (JSP) | `KakaoAddrMapPopup.jsp` | 주소 검색 및 상세/대표 좌표 추출 |
| pig3.1 (Java) | `WeatherGridUtil.java` | 기상 격자 변환 유틸리티 (Lambert 투영) |
| pig3.1 (Java) | `FarmInfoSharingService.java` | 농장 정보 저장 및 격자 변환 연동 |
| pig3.1 (MyBatis) | `SharingFarmInfoMapper.xml` | 농장 정보 DB 매퍼 |
| inspig-etl (Python) | `src/collectors/weather.py` | 기상청 API 호출 및 TM_WEATHER 저장 |

---

## 6. 외부 API 출처 및 관리 정보

| 구분 | 서비스명 (공식 명칭) | 제공처 | 주요 용도 및 관리 사이트 |
|------|---------------------|--------|-------------------|
| **API 관리** | **[Kakao Developers](https://developers.kakao.com)** | 카카오 | **API 키 발급, 도메인 등록, 지도 서비스 설정** |
| **주소 검색** | **Daum 우편번호 서비스** | 카카오 | 주소 검색 및 법정동코드(bcode) 추출 ([가이드](https://postcode.map.daum.net/guide)) |
| **좌표 변환** | **Kakao Maps API (Geocoder)** | 카카오 | 주소 기반 상세 위경도(WGS84) 추출 ([문서](https://apis.kakao.com/web/documentation/#geocoder)) |
| **기상 예보** | **기상청 단기예보 조회서비스** | 기상청 | 격자 기반 날씨 예보 데이터 수집 ([공공데이터포털](https://www.data.go.kr/data/15084084/openapi.do)) |
| **기상 실측** | **기상청 ASOS 일자료 조회서비스** | 기상청 | 관측소 기반 일별 실측 데이터 ([공공데이터포털](https://www.data.go.kr/data/15057210/openapi.do)) |
| **기상 실측** | **기상청 ASOS 시간자료 조회서비스** | 기상청 | 관측소 기반 시간별 실측 데이터 ([공공데이터포털](https://www.data.go.kr/data/15057209/openapi.do)) |

---

## 7. ASOS 관측소 매핑

### 7.1 개요

ASOS(종관기상관측)는 관측소 기반 실측 데이터입니다. 격자 기반인 단기예보와 달리, 97개 관측소 중 농장과 가장 가까운 관측소의 데이터를 사용합니다.

### 7.2 관련 테이블

| 테이블 | 설명 |
|--------|------|
| **TM_WEATHER_ASOS** | ASOS 관측소 메타정보 (97개 관측소) |
| **TA_FARM** | 농장별 ASOS 관측소 매핑 (캐싱) |

### 7.3 TA_FARM ASOS 컬럼

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| ASOS_STN_ID | NUMBER | ASOS 관측소 지점번호 (예: 235) |
| ASOS_STN_NM | VARCHAR2(50) | 관측소명 (예: 보령) |
| ASOS_DIST_KM | NUMBER(6,2) | 농장~관측소 거리 (km) |

### 7.4 매핑 방식

**ETL에서 자동 처리** (pig3.1에서 별도 작업 불필요)

```bash
# ASOS 관측소 매핑 실행
python weather_etl.py --update-asos
```

1. `TA_FARM`에서 `ASOS_STN_ID IS NULL`인 농장 조회
2. `TM_WEATHER_ASOS` 테이블에서 가장 가까운 관측소 찾기 (Haversine 공식)
3. `TA_FARM.ASOS_STN_ID`, `ASOS_STN_NM`, `ASOS_DIST_KM` 업데이트

> [!NOTE]
> 신규 농장 추가 시 다음 날씨 ETL 실행에서 자동으로 ASOS 매핑됩니다.
