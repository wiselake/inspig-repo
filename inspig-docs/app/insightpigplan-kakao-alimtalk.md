# 인사이트피그플랜 카카오 알림톡 발송 시스템

> InsightPig 주간 리포트 카카오 알림톡 발송 가이드

---

## 시스템 아키텍처

> ETL 배치 관련 내용은 [01_ETL_OVERVIEW.md](../../../inspig-etl/docs/01_ETL_OVERVIEW.md) 참조

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        인사이트피그 주간 리포트 알림톡 발송 시스템                    │
└─────────────────────────────────────────────────────────────────────────────────┘

 [1] 자동 발송 - 스케줄러 (매주 월요일 07:00)
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │                           pig3.1 (Java/Spring)                                  │
 │                                                                                 │
 │  ┌─────────────────────┐    ┌─────────────────────────┐    ┌─────────────────┐ │
 │  │   Scheduler.java    │───▶│  SchedulerService.java  │───▶│CommonKakaoSMS   │ │
 │  │                     │    │                         │    │Service.java     │ │
 │  │ @Scheduled          │    │ - INS_SCHEDULE_YN 체크  │    │                 │ │
 │  │ (MON 07:00)         │    │ - 대상 농장 조회         │    │ - Solapi API    │ │
 │  │                     │    │ - 농장별 발송 (150ms)    │    │ - 발송 로그 저장 │ │
 │  └─────────────────────┘    └─────────────────────────┘    └─────────────────┘ │
 │                                                                                 │
 └─────────────────────────────────────────────────────────────────────────────────┘

 [1-2] 수동 발송 - REST API
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │                           pig3.1 (Java/Spring)                                  │
 │                                                                                 │
 │  ┌─────────────────────────────────────────┐    ┌───────────────────────────┐  │
 │  │      CommonKakaoSMSControl.java         │───▶│ CommonKakaoSMSService.java│  │
 │  │                                         │    │                           │  │
 │  │  ① 특정 농가 발송                        │    │ - Solapi API 호출         │  │
 │  │     POST /sendInsWeeklyByFarm.json      │    │ - 발송 로그 저장           │  │
 │  │     - farmNo (농장번호)                  │    │                           │  │
 │  │     - SMS_INSPIG_YN = 'Y' 체크          │    │                           │  │
 │  │                                         │    │                           │  │
 │  │  ② 특정 1인 발송                        │    │                           │  │
 │  │     POST /sendInsWeeklyManual.json      │    │                           │  │
 │  │     - farmNo (농장번호)                  │    │                           │  │
 │  │     - toTel (수신번호)                   │    │                           │  │
 │  │     - SMS_INSPIG_YN 체크 안함 (테스트용) │    │                           │  │
 │  └─────────────────────────────────────────┘    └───────────────────────────┘  │
 │                                                                                 │
 └─────────────────────────────────────────────────────────────────────────────────┘

 [2] 데이터베이스 (Oracle)
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │                                                                                 │
 │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌─────────────────┐  │
 │  │ TA_SYS_CONFIG │  │  TA_MEMBER    │  │ TS_INS_WEEK   │  │TA_KAKAOMSG_SENT │  │
 │  │               │  │               │  │               │  │                 │  │
 │  │ INS_SCHEDULE  │  │ SMS_INSPIG_YN │  │ FARM_NO       │  │ FARM_NO         │  │
 │  │ _YN = 'Y'     │  │ HP_NUM        │  │ SHARE_TOKEN   │  │ MSG_GB          │  │
 │  │               │  │ SMS_INSPIG_   │  │ STATUS_CD     │  │ CREATEDAT       │  │
 │  │               │  │ SDT/EDT       │  │ REPORT_YEAR   │  │ STATUSCODE      │  │
 │  └───────────────┘  └───────────────┘  └───────────────┘  └─────────────────┘  │
 │                                                                                 │
 └─────────────────────────────────────────────────────────────────────────────────┘

 [3] 외부 서비스 및 사용자 흐름
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │                                                                                 │
 │  ┌───────────────┐      ┌───────────────┐      ┌─────────────┐                 │
 │  │  Solapi API   │ ───▶ │ 카카오 알림톡  │ ───▶ │   농장주    │                 │
 │  │               │      │               │      │   (수신)    │                 │
 │  │api.solapi.com │      │  템플릿 04    │      │             │                 │
 │  └───────────────┘      └───────────────┘      └──────┬──────┘                 │
 │                                                        │                        │
 │                                                        ▼                        │
 │                                               ┌─────────────────┐               │
 │                                               │  리포트 보기    │               │
 │                                               │  버튼 클릭      │               │
 │                                               └────────┬────────┘               │
 │                                                        │                        │
 │                                                        ▼                        │
 │                                         ┌────────────────────────────┐          │
 │                                         │ inspig.pigplan.kr/weekly   │          │
 │                                         │ /{SHARE_TOKEN}             │          │
 │                                         └────────────────────────────┘          │
 │                                                                                 │
 └─────────────────────────────────────────────────────────────────────────────────┘

 [4] 발송 조건 체크 흐름
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │                                                                                 │
 │  INS_SCHEDULE_YN = 'Y' ──▶ TS_INS_WEEK 존재 ──▶ SMS_INSPIG_YN = 'Y'            │
 │         │                        │                      │                       │
 │         │ No                     │ No                   │ No                    │
 │         ▼                        ▼                      ▼                       │
 │      [SKIP]                   [SKIP]                 [SKIP]                     │
 │                                                         │                       │
 │                                                         │ Yes                   │
 │                                                         ▼                       │
 │                                              HP_NUM 존재 & 기간 내              │
 │                                                         │                       │
 │                                                         │ Yes                   │
 │                                                         ▼                       │
 │                                                    [알림톡 발송]                 │
 │                                                                                 │
 └─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. 개요

### 1.1 목적
- ETL 작업 완료 후 **매주 월요일 오전 7시**에 주간 리포트 알림톡 발송
- 농장별로 개별 발송하여 리포트 확인 유도

### 1.2 발송 조건

| 조건 | 설명 |
|------|------|
| `TA_SYS_CONFIG.INS_SCHEDULE_YN = 'Y'` | 시스템 스케줄 활성화 |
| `TS_INS_WEEK.STATUS_CD = 'COMPLETE'` | 주간 리포트 생성 완료 |
| `TS_INS_MASTER.STATUS_CD = 'COMPLETE'` | 마스터 작업 완료 |
| `TA_MEMBER.FARM_NO = TS_INS_WEEK.FARM_NO` | 해당 농장의 회원 |
| `TA_MEMBER.MEMBER_TYPE_D = '911100'` | 농장주 |
| `TA_MEMBER.HP_NUM IS NOT NULL` | 핸드폰 번호 존재 |
| `TA_MEMBER.SMS_INSPIG_YN = 'Y'` | 인사이트피그 알림 수신 동의 |
| `SMS_INSPIG_SDT <= 발송일 <= SMS_INSPIG_EDT` | 알림 발송 기간 내 |

### 1.3 발송 메시지 (템플릿)

```
[인사이트피그플랜]
주간 리포트 도착 😊

#{value1} 농장의
#{value3}년 #{value4}주차 리포트가
준비되었습니다.

확인 기간: #{value5}

아래 버튼을 눌러
지금 확인해 보세요.
고객센터 : 031-421-3414
```

**버튼**: `리포트 보기` → `https://inspig.pigplan.kr/weekly/#{weekUrl}`

---

## 2. 발송 프로세스

### 2.1 전체 흐름

```
[매주 월요일 새벽 02:00]
         ↓
[Python ETL 실행] - inspig-etl 서버
  - TS_INS_MASTER 생성 (WEEK)
  - TS_INS_WEEK 농장별 리포트 생성
  - SHARE_TOKEN 발급
         ↓
[매주 월요일 오전 07:00]
         ↓
[Java Scheduler 실행] - pig3.1 서버
  - INS_SCHEDULE_YN 체크
  - 발송 대상 농장 조회
  - 농장별 알림톡 발송 (150ms 간격)
  - 발송 로그 저장
         ↓
[농장주 카카오톡 수신]
         ↓
[리포트 보기 버튼 클릭]
         ↓
[https://inspig.pigplan.kr/weekly/{token}]
```

### 2.2 발송 대상 조회 SQL

```sql
SELECT
    W.FARM_NO,
    W.FARM_NM,
    W.REPORT_YEAR,
    W.REPORT_WEEK_NO,
    W.DT_FROM,
    W.DT_TO,
    W.SHARE_TOKEN,
    M.HP_NUM,
    -- 확인 기간 포맷: MM.DD ~ MM.DD
    SUBSTR(W.DT_FROM, 5, 2) || '.' || SUBSTR(W.DT_FROM, 7, 2) || ' ~ ' ||
    SUBSTR(W.DT_TO, 5, 2) || '.' || SUBSTR(W.DT_TO, 7, 2) AS PERIOD
FROM TS_INS_WEEK W
INNER JOIN TS_INS_MASTER MT ON W.MASTER_SEQ = MT.SEQ
LEFT JOIN (
    -- 농장주(911100) 핸드폰 번호 + 인사이트피그 알림 수신 동의 조회
    SELECT FARM_NO, MAX(HP_NUM) AS HP_NUM
    FROM TA_MEMBER
    WHERE MEMBER_TYPE_D = '911100'
      AND HP_NUM IS NOT NULL
      AND USE_YN = 'Y'
      -- 인사이트피그 알림 수신 동의
      AND NVL(SMS_INSPIG_YN, 'N') = 'Y'
      -- 알림 발송 기간 내 (발송일이 SDT~EDT 사이)
      AND TO_CHAR(SYSDATE, 'YYYYMMDD') >= NVL(SMS_INSPIG_SDT, '19000101')
      AND TO_CHAR(SYSDATE, 'YYYYMMDD') <= NVL(SMS_INSPIG_EDT, '99991231')
    GROUP BY FARM_NO
) M ON W.FARM_NO = M.FARM_NO
WHERE MT.DAY_GB = 'WEEK'
  AND MT.STATUS_CD = 'COMPLETE'
  AND W.STATUS_CD = 'COMPLETE'
  AND W.SHARE_TOKEN IS NOT NULL
  -- 지난주 주차 조건: 현재 주차 - 1
  AND W.REPORT_YEAR = TO_NUMBER(TO_CHAR(SYSDATE - 7, 'IYYY'))
  AND W.REPORT_WEEK_NO = TO_NUMBER(TO_CHAR(SYSDATE - 7, 'IW'))
  -- 핸드폰 번호가 있는 농장만
  AND M.HP_NUM IS NOT NULL
ORDER BY W.FARM_NO;
```

---

## 3. Solapi 카카오 알림톡 API

### 3.1 API 정보

| 항목 | 값 |
|------|-----|
| Provider | Solapi (https://api.solapi.com) |
| SDK | net.nurigo.sdk |
| 인증 | API Key + Secret Key |

### 3.2 템플릿 정보

| template | pfId | templateId | 용도 |
|----------|------|------------|------|
| 01 | pfId02 | KA01TP221027002252645FPwAcO9SguY | 인증번호 (미사용) |
| 02 | pfId02 | KA01TP221025083117992xkz17KyvNbr | 가입 환영 (미사용) |
| 03 | pfId01 | KA01TP240220052925941OX8Y9ta6fLa | 등급판정 인증번호 |
| **04** | **pfId01** | **KA01TP251224083820666IFBDftU19da** | **주간 리포트 알림** |

### 3.3 템플릿 변수 매핑

| 변수 | 컬럼 | 설명 | 예시 |
|------|------|------|------|
| `#{value1}` | FARM_NM | 농장명 | "행복농장" |
| `#{value3}` | REPORT_YEAR | 년도 | "2025" |
| `#{value4}` | REPORT_WEEK_NO | 주차 | "52" |
| `#{value5}` | PERIOD | 확인 기간 | "12.23 ~ 12.29" |
| `#{weekUrl}` | SHARE_TOKEN | 리포트 URL 토큰 | "abc123..." |

---

## 4. 구현 코드

### 4.1 스케줄러 (Scheduler.java)

```java
/**
 * 인사이트피그 주간리포트 카카오 알림톡 발송
 * - 매주 월요일 오전 7시 (07:00) 실행
 * - ETL 배치(02:00)에서 생성된 주간리포트 대상으로 알림톡 발송
 */
@Scheduled(cron="0 0 7 * * MON", zone="Asia/Seoul")
@SchedulerLock(name = "sendInsWeeklyReportKakao", lockAtLeastFor = "PT5M", lockAtMostFor = "PT30M")
public void sendInsWeeklyReportKakao() throws Exception {
    String env = String.valueOf(properties.get("env"));
    if(!env.equals("local")) {
        schedulerService.sendInsWeeklyReportKakaoSvc();
    }
}
```

### 4.2 서비스 (SchedulerService.java)

```java
public void sendInsWeeklyReportKakaoSvc() throws Exception {
    // 1. INS_SCHEDULE_YN 체크
    String insScheduleYn = commonSysInfoAndLogMapper.selectInsScheduleYnMapper();
    if (!"Y".equals(insScheduleYn)) {
        return;  // 스케줄 비활성화
    }

    // 2. 대상 농장 목록 조회
    List<EgovMap> targetList = commonSysInfoAndLogMapper.selectInsWeeklyReportTargetListMapper();

    // 3. 농장별 알림톡 발송
    for (EgovMap farm : targetList) {
        commonKakaoSMSService.sendInsWeeklyReportKakao(
            farm.get("farmNm"),
            farm.get("reportYear"),
            farm.get("reportWeekNo"),
            farm.get("period"),
            farm.get("shareToken"),
            farm.get("hpNum")
        );
        Thread.sleep(150);  // API 호출 간격 (초당 10건 제한)
    }
}
```

### 4.3 알림톡 발송 (CommonKakaoSMSService.java)

```java
public Map<String, Object> sendInsWeeklyReportKakao(
        String farmNm, int year, int weekNo, String period, String shareToken, String toTel) {

    // 템플릿 변수 설정
    HashMap<String, String> variables = new HashMap<>();
    variables.put("#{value1}", farmNm);               // 농장명
    variables.put("#{value3}", String.valueOf(year)); // 년도
    variables.put("#{value4}", String.valueOf(weekNo)); // 주차
    variables.put("#{value5}", period);               // 확인 기간
    variables.put("#{weekUrl}", shareToken);          // 리포트 URL 토큰

    // 카카오 옵션 설정
    KakaoOption kakaoOption = new KakaoOption();
    kakaoOption.setDisableSms(true);
    kakaoOption.setPfId(SolapiPfId01);
    kakaoOption.setTemplateId("KA01TP251224083820666IFBDftU19da");
    kakaoOption.setVariables(variables);

    // 메시지 발송
    Message message = new Message();
    message.setFrom(SolapiFrom);
    message.setTo(toTel.replaceAll("[^\\d]", ""));
    message.setKakaoOptions(kakaoOption);

    SingleMessageSentResponse response = messageService.sendOne(new SingleMessageSendingRequest(message));

    return result;
}
```

---

## 5. 데이터베이스

### 5.1 TA_MEMBER 테이블 - 알림 관련 컬럼

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| SMS_INSPIG_YN | CHAR(1) | 인사이트피그 알림 수신여부 (Y/N) |
| SMS_INSPIG_SDT | VARCHAR2(8) | 인사이트피그 알림 시작일 (YYYYMMDD) |
| SMS_INSPIG_EDT | VARCHAR2(8) | 인사이트피그 알림 종료일 (YYYYMMDD) |

**DDL (신규 컬럼 추가)**:

```sql
ALTER TABLE TA_MEMBER ADD SMS_INSPIG_YN CHAR(1) DEFAULT 'N';
ALTER TABLE TA_MEMBER ADD SMS_INSPIG_SDT VARCHAR2(8);
ALTER TABLE TA_MEMBER ADD SMS_INSPIG_EDT VARCHAR2(8);

COMMENT ON COLUMN TA_MEMBER.SMS_INSPIG_YN IS '인사이트피그 알림 수신여부 (Y/N)';
COMMENT ON COLUMN TA_MEMBER.SMS_INSPIG_SDT IS '인사이트피그 알림 시작일 (YYYYMMDD)';
COMMENT ON COLUMN TA_MEMBER.SMS_INSPIG_EDT IS '인사이트피그 알림 종료일 (YYYYMMDD)';
```

### 5.2 발송 로그 테이블 (TA_KAKAOMSG_SENT)

| 컬럼 | 설명 |
|------|------|
| TO_TEL | 수신 번호 |
| FROM_TEL | 발신 번호 |
| GROUPID | Solapi 그룹 ID |
| MESSAGEID | Solapi 메시지 ID |
| STATUS | 발송 상태 |
| STATUSCODE | 상태 코드 |
| STATUSMESSAGE | 상태 메시지 |
| PAYLOAD | 발송 데이터 (JSON) |
| CREATEDAT | 등록일시 |

### 5.3 상태 코드

| 코드 | 설명 |
|------|------|
| 2000 | 정상 접수 (이통사 접수 예정) |
| 3000 | 이통사 접수 (리포트 대기) |
| 4000 | 수신 완료 |
| 기타 | 오류 |

---

## 6. 관련 파일

### 6.1 pig3.1 프로젝트

| 파일 | 경로 | 설명 |
|------|------|------|
| Scheduler.java | `.../newpig/sch/` | 스케줄러 |
| SchedulerService.java | `.../newpig/sch/` | 스케줄러 서비스 |
| CommonKakaoSMSService.java | `.../common/service/` | 알림톡 발송 서비스 |
| CommonSysInfoAndLogMapper.java | `.../common/mapper/` | 매퍼 인터페이스 |
| CommonSysInfoAndLogMapper.xml | `.../mapper/oracle/common/` | MyBatis SQL |

### 6.2 inspig-etl 프로젝트

| 파일 | 경로 | 설명 |
|------|------|------|
| orchestrator.py | `src/weekly/` | 주간 ETL 오케스트레이터 |
| 01.table.md | `docs/db/ref/` | 테이블 정의 문서 |

---

## 7. 운영 가이드

### 7.1 TA_SYS_CONFIG 테이블 (시스템 설정)

```sql
CREATE TABLE TA_SYS_CONFIG (
    SEQ             NUMBER DEFAULT 1,           -- 일련번호 (항상 1)
    MODON_HIST_YN   VARCHAR2(1) DEFAULT 'N',    -- 모돈이력제 연계여부 (Y/N)
    EKAPE_YN        VARCHAR2(1) DEFAULT 'N',    -- 축평원 등급판정 연계여부 (Y/N)
    INS_SCHEDULE_YN VARCHAR2(1) DEFAULT 'Y',    -- 인사이트피그플랜 실행여부 (Y/N), 테스트(T)
    TEST_TEL        VARCHAR2(18),               -- 테스트 SMS수신번호
    SISAE_YN        CHAR(1) DEFAULT 'Y',        -- 축평원 도축시세 연계 여부 (Y/N)
    WEATHER_YN      CHAR(1) DEFAULT 'Y',        -- 기상청 API 연계 여부 (Y/N), 테스트(T)
    LOG_INS_DT      DATE DEFAULT SYSDATE,       -- 생성일
    LOG_UPT_DT      DATE DEFAULT SYSDATE,       -- 수정일
    CONSTRAINT PK_TA_SYS_CONFIG PRIMARY KEY (SEQ)
);
```

### 7.2 INS_SCHEDULE_YN 값별 동작

| 값 | 모드 | ETL 배치 | 웹 API | 알림톡 발송 번호 |
|----|------|---------|--------|-----------------|
| Y | 운영 | 정상 실행 | 정상 | TA_MEMBER.HP_NUM |
| T | 테스트 | 정상 실행 | 정상 | TA_SYS_CONFIG.TEST_TEL |
| N | 비활성화 | 스킵 | 비활성화 | - |

**참고:**
- `T` (테스트 모드): ETL 배치와 웹 API는 `Y`와 동일하게 동작하며, 알림톡만 `TEST_TEL`로 발송
- `TEST_TEL`이 비어있으면 기본값 `01050146714`로 발송

### 7.3 스케줄 활성화/비활성화

```sql
-- 운영 모드 활성화
UPDATE TA_SYS_CONFIG SET INS_SCHEDULE_YN = 'Y' WHERE SEQ = 1;

-- 테스트 모드 활성화 (TEST_TEL로 알림톡 발송)
UPDATE TA_SYS_CONFIG SET INS_SCHEDULE_YN = 'T', TEST_TEL = '01012345678' WHERE SEQ = 1;

-- 스케줄 비활성화
UPDATE TA_SYS_CONFIG SET INS_SCHEDULE_YN = 'N' WHERE SEQ = 1;
```

### 7.4 농장별 알림 설정

```sql
-- 특정 농장 알림 활성화 (2025년 전체)
UPDATE TA_MEMBER
SET SMS_INSPIG_YN = 'Y',
    SMS_INSPIG_SDT = '20250101',
    SMS_INSPIG_EDT = '20251231'
WHERE FARM_NO = 1234
  AND MEMBER_TYPE_D = '911100';

-- 알림 비활성화
UPDATE TA_MEMBER
SET SMS_INSPIG_YN = 'N'
WHERE FARM_NO = 1234
  AND MEMBER_TYPE_D = '911100';
```

### 7.5 발송 로그 확인

```sql
-- 최근 발송 로그 조회
SELECT TO_TEL, STATUS, STATUSCODE, STATUSMESSAGE, CREATEDAT, PAYLOAD
FROM TA_KAKAOMSG_SENT
WHERE CREATEDAT >= SYSDATE - 7
ORDER BY ID DESC;

-- 실패 건 조회
SELECT *
FROM TA_KAKAOMSG_SENT
WHERE STATUSCODE NOT IN ('2000', '3000', '4000')
  AND CREATEDAT >= SYSDATE - 7;
```

---

## 8. 수동 발송 API

> 관리자가 특정 농가 또는 특정인에게 직접 알림톡을 발송할 때 사용

### 8.1 발송 방식 비교

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           수동 발송 2가지 방식 비교                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌───────────────────────────────────┐  ┌───────────────────────────────────┐  │
│  │    ① 특정 농가 발송               │  │    ② 특정 1인 발송                │  │
│  │    sendInsWeeklyByFarm.json       │  │    sendInsWeeklyManual.json       │  │
│  ├───────────────────────────────────┤  ├───────────────────────────────────┤  │
│  │                                   │  │                                   │  │
│  │  파라미터:                         │  │  파라미터:                         │  │
│  │  - farmNo (농장번호)              │  │  - farmNo (농장번호)              │  │
│  │                                   │  │  - toTel (수신번호)               │  │
│  │                                   │  │                                   │  │
│  │  조건 체크:                        │  │  조건 체크:                        │  │
│  │  ✓ SMS_INSPIG_YN = 'Y'           │  │  ✗ SMS_INSPIG_YN 체크 안함        │  │
│  │  ✓ 알림기간(SDT~EDT) 체크         │  │  ✗ 알림기간 체크 안함             │  │
│  │  ✓ 농장주 HP_NUM 자동 조회        │  │  ✓ 직접 입력한 번호로 발송        │  │
│  │                                   │  │                                   │  │
│  │  용도:                            │  │  용도:                            │  │
│  │  - 정식 서비스 재발송              │  │  - 테스트 발송                    │  │
│  │  - 알림 동의된 농가만 발송         │  │  - 관리자 특정인 직접 발송        │  │
│  │                                   │  │  - 데모/시연용                    │  │
│  │                                   │  │                                   │  │
│  └───────────────────────────────────┘  └───────────────────────────────────┘  │
│                                                                                 │
│  공통 조건: TS_INS_WEEK 존재 + SHARE_TOKEN 존재 + STATUS_CD = 'COMPLETE'        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 API 명세

#### ① 특정 농가 발송 API

| 항목 | 내용 |
|------|------|
| URL | `POST /pigplan/kakaoMsg/sendInsWeeklyByFarm.json` |
| 용도 | 농장번호로 해당 농장의 농장주에게 발송 |
| 조건 | SMS_INSPIG_YN = 'Y', 알림기간 내, 주간리포트 + SHARE_TOKEN 존재 |

**Request Body**:
```json
{
    "farmNo": 2807
}
```

**Response (성공)**:
```json
{
    "result": true,
    "msg": "발송 완료: 행복농장 (2025년 52주차) → 01012345678"
}
```

**Response (실패 - 동의 없음)**:
```json
{
    "result": false,
    "msg": "해당 농장의 주간리포트가 없거나, 알림 수신 동의(SMS_INSPIG_YN=Y)가 되어있지 않습니다."
}
```

#### ② 특정 1인 발송 API

| 항목 | 내용 |
|------|------|
| URL | `POST /pigplan/kakaoMsg/sendInsWeeklyManual.json` |
| 용도 | 핸드폰 번호 직접 입력하여 발송 (테스트/관리자용) |
| 조건 | SMS_INSPIG_YN 체크 안함, 주간리포트 + SHARE_TOKEN 존재 |

**Request Body**:
```json
{
    "farmNo": 2807,
    "toTel": "01012345678"
}
```

**Response (성공)**:
```json
{
    "result": true,
    "msg": "발송 완료: 행복농장 (2025년 52주차) → 01012345678"
}
```

**Response (실패 - 리포트 없음)**:
```json
{
    "result": false,
    "msg": "해당 농장의 주간리포트가 없습니다."
}
```

### 8.3 수동 발송 데이터 조회 SQL

#### ① 특정 농가 발송용 (SMS_INSPIG_YN 체크)

```sql
/* selectInsWeeklyReportByFarmNoMapper */
SELECT
    W.FARM_NO,
    W.FARM_NM,
    W.REPORT_YEAR,
    W.REPORT_WEEK_NO,
    W.SHARE_TOKEN,
    M.HP_NUM,
    SUBSTR(W.DT_FROM, 5, 2) || '.' || SUBSTR(W.DT_FROM, 7, 2) || ' ~ ' ||
    SUBSTR(W.DT_TO, 5, 2) || '.' || SUBSTR(W.DT_TO, 7, 2) AS PERIOD
FROM TS_INS_WEEK W
INNER JOIN TS_INS_MASTER MT ON W.MASTER_SEQ = MT.SEQ
LEFT JOIN (
    SELECT FARM_NO, MAX(HP_NUM) AS HP_NUM
    FROM TA_MEMBER
    WHERE MEMBER_TYPE_D = '911100'
      AND HP_NUM IS NOT NULL
      AND USE_YN = 'Y'
      AND NVL(SMS_INSPIG_YN, 'N') = 'Y'  -- 알림 동의 체크
      AND TO_CHAR(SYSDATE, 'YYYYMMDD') >= NVL(SMS_INSPIG_SDT, '19000101')
      AND TO_CHAR(SYSDATE, 'YYYYMMDD') <= NVL(SMS_INSPIG_EDT, '99991231')
    GROUP BY FARM_NO
) M ON W.FARM_NO = M.FARM_NO
WHERE MT.DAY_GB = 'WEEK'
  AND MT.STATUS_CD = 'COMPLETE'
  AND W.STATUS_CD = 'COMPLETE'
  AND W.SHARE_TOKEN IS NOT NULL
  AND W.FARM_NO = :farmNo
ORDER BY W.REPORT_YEAR DESC, W.REPORT_WEEK_NO DESC
FETCH FIRST 1 ROWS ONLY;
```

#### ② 특정 1인 발송용 (SMS_INSPIG_YN 체크 안함)

```sql
/* selectInsWeeklyReportForManualMapper */
SELECT
    W.FARM_NO,
    W.FARM_NM,
    W.REPORT_YEAR,
    W.REPORT_WEEK_NO,
    W.SHARE_TOKEN,
    SUBSTR(W.DT_FROM, 5, 2) || '.' || SUBSTR(W.DT_FROM, 7, 2) || ' ~ ' ||
    SUBSTR(W.DT_TO, 5, 2) || '.' || SUBSTR(W.DT_TO, 7, 2) AS PERIOD
FROM TS_INS_WEEK W
INNER JOIN TS_INS_MASTER MT ON W.MASTER_SEQ = MT.SEQ
WHERE MT.DAY_GB = 'WEEK'
  AND MT.STATUS_CD = 'COMPLETE'
  AND W.STATUS_CD = 'COMPLETE'
  AND W.SHARE_TOKEN IS NOT NULL
  AND W.FARM_NO = :farmNo
ORDER BY W.REPORT_YEAR DESC, W.REPORT_WEEK_NO DESC
FETCH FIRST 1 ROWS ONLY;
```

### 8.4 구현 코드

#### Controller (CommonKakaoSMSControl.java)

```java
/**
 * 인사이트피그 주간리포트 - 특정 농가 발송
 * - 농장번호로 해당 농장의 농장주에게 발송 (SMS_INSPIG_YN = 'Y' 체크)
 * - 조건: 주간 리포트 존재 + SHARE_TOKEN 존재
 */
@ResponseBody
@RequestMapping(value="/pigplan/kakaoMsg/sendInsWeeklyByFarm.json", method=RequestMethod.POST)
public ReturnMsgVO sendInsWeeklyByFarmCtl(@RequestBody EgovMap infoVo, HttpServletRequest request) throws Exception {
    ReturnMsgVO rslt = new ReturnMsgVO();

    // 1. 농장번호 검증
    if (CommonUtil.hasValue(infoVo.get("farmNo"))) {
        rslt.setMsg("농장번호가 필요합니다.");
        rslt.setResult(false);
        return rslt;
    }

    int farmNo = Integer.parseInt(String.valueOf(infoVo.get("farmNo")));

    // 2. 해당 농장의 최신 주간리포트 조회 (SMS_INSPIG_YN = 'Y' 체크)
    EgovMap paramMap = new EgovMap();
    paramMap.put("farmNo", farmNo);
    EgovMap weekReport = commonSysInfoAndLogMapper.selectInsWeeklyReportByFarmNoMapper(paramMap);

    if (weekReport == null) {
        rslt.setMsg("해당 농장의 주간리포트가 없거나, 알림 수신 동의(SMS_INSPIG_YN=Y)가 되어있지 않습니다.");
        rslt.setResult(false);
        return rslt;
    }

    // 3. 핸드폰 번호 확인
    String hpNum = CommonUtil.convToSql(weekReport.get("hpNum"));
    if (CommonUtil.hasValue(hpNum)) {
        rslt.setMsg("해당 농장의 농장주 핸드폰 번호가 없습니다.");
        rslt.setResult(false);
        return rslt;
    }

    // 4. 알림톡 발송
    Map<String, Object> result = commonKakaoSMSService.sendInsWeeklyReportKakao(
        farmNo, weekReport.get("farmNm"), weekReport.get("reportYear"),
        weekReport.get("reportWeekNo"), weekReport.get("period"),
        weekReport.get("shareToken"), hpNum
    );

    if ("success".equals(result.get("status"))) {
        rslt.setResult(true);
        rslt.setMsg(String.format("발송 완료: %s (%d년 %d주차) → %s",
            weekReport.get("farmNm"), weekReport.get("reportYear"),
            weekReport.get("reportWeekNo"), hpNum));
    } else {
        rslt.setResult(false);
        rslt.setMsg("발송 실패: " + result.get("error"));
    }

    return rslt;
}

/**
 * 인사이트피그 주간리포트 - 특정 1인 발송
 * - 핸드폰 번호 직접 입력하여 발송 (SMS_INSPIG_YN 체크 안함)
 * - 테스트 목적 또는 관리자가 특정인에게 직접 발송
 */
@ResponseBody
@RequestMapping(value="/pigplan/kakaoMsg/sendInsWeeklyManual.json", method=RequestMethod.POST)
public ReturnMsgVO sendInsWeeklyManualCtl(@RequestBody EgovMap infoVo, HttpServletRequest request) throws Exception {
    ReturnMsgVO rslt = new ReturnMsgVO();

    // 1. 파라미터 검증
    if (CommonUtil.hasValue(infoVo.get("farmNo"))) {
        rslt.setMsg("농장번호가 필요합니다.");
        rslt.setResult(false);
        return rslt;
    }

    if (CommonUtil.hasValue(infoVo.get("toTel"))) {
        rslt.setMsg("수신 핸드폰 번호가 필요합니다.");
        rslt.setResult(false);
        return rslt;
    }

    int farmNo = Integer.parseInt(String.valueOf(infoVo.get("farmNo")));
    String toTel = CommonUtil.convToSql(infoVo.get("toTel")).replaceAll("[^\\d]", "");

    // 핸드폰 번호 형식 검증 (10~11자리 숫자)
    if (toTel.length() < 10 || toTel.length() > 11) {
        rslt.setMsg("올바른 핸드폰 번호 형식이 아닙니다.");
        rslt.setResult(false);
        return rslt;
    }

    // 2. 해당 농장의 최신 주간리포트 조회 (SMS_INSPIG_YN 체크 안함)
    EgovMap paramMap = new EgovMap();
    paramMap.put("farmNo", farmNo);
    EgovMap weekReport = commonSysInfoAndLogMapper.selectInsWeeklyReportForManualMapper(paramMap);

    if (weekReport == null) {
        rslt.setMsg("해당 농장의 주간리포트가 없습니다.");
        rslt.setResult(false);
        return rslt;
    }

    // 3. 알림톡 발송
    Map<String, Object> result = commonKakaoSMSService.sendInsWeeklyReportKakao(
        farmNo, weekReport.get("farmNm"), weekReport.get("reportYear"),
        weekReport.get("reportWeekNo"), weekReport.get("period"),
        weekReport.get("shareToken"), toTel
    );

    if ("success".equals(result.get("status"))) {
        rslt.setResult(true);
        rslt.setMsg(String.format("발송 완료: %s (%d년 %d주차) → %s",
            weekReport.get("farmNm"), weekReport.get("reportYear"),
            weekReport.get("reportWeekNo"), toTel));
    } else {
        rslt.setResult(false);
        rslt.setMsg("발송 실패: " + result.get("error"));
    }

    return rslt;
}
```

### 8.5 수동 발송 테스트

#### cURL 예시

```bash
# ① 특정 농가 발송 (알림 동의 농장주에게)
curl -X POST "https://pigplan.kr/pigplan/kakaoMsg/sendInsWeeklyByFarm.json" \
  -H "Content-Type: application/json" \
  -d '{"farmNo": 2807}'

# ② 특정 1인 발송 (테스트용)
curl -X POST "https://pigplan.kr/pigplan/kakaoMsg/sendInsWeeklyManual.json" \
  -H "Content-Type: application/json" \
  -d '{"farmNo": 2807, "toTel": "01012345678"}'
```

#### Postman 예시

```
POST {{baseUrl}}/pigplan/kakaoMsg/sendInsWeeklyManual.json
Content-Type: application/json

{
    "farmNo": 2807,
    "toTel": "01012345678"
}
```

---

## 9. 관련 파일

### 9.1 pig3.1 프로젝트

| 파일 | 경로 | 설명 |
|------|------|------|
| Scheduler.java | `.../newpig/sch/` | 스케줄러 (자동 발송) |
| SchedulerService.java | `.../newpig/sch/` | 스케줄러 서비스 |
| **CommonKakaoSMSControl.java** | `.../common/control/` | **수동 발송 API 컨트롤러** |
| CommonKakaoSMSService.java | `.../common/service/` | 알림톡 발송 서비스 |
| CommonSysInfoAndLogMapper.java | `.../common/mapper/` | 매퍼 인터페이스 |
| CommonSysInfoAndLogMapper.xml | `.../mapper/oracle/common/` | MyBatis SQL |

### 9.2 inspig-etl 프로젝트

| 파일 | 경로 | 설명 |
|------|------|------|
| orchestrator.py | `src/weekly/` | 주간 ETL 오케스트레이터 |
| 01.table.md | `docs/db/ref/` | 테이블 정의 문서 |

---

## 10. InsEtlApi - ETL 연동 API

> pig3.1 Java Spring 에서 Python ETL 서버를 호출하여 리포트 생성/조회

### 10.1 시스템 구조

```
 [pig3.1 Java/Spring]                    [Python ETL 서버]
 ┌────────────────────────────┐          ┌──────────────────────┐
 │  InsEtlApiController.java  │   HTTP   │  FastAPI server.py   │
 │  /api/ins/...              │ ───────▶│  /api/etl/run-farm   │
 │                            │ ◀───────│  /api/etl/status     │
 │  InsEtlApiServiceImpl.java │   JSON   │                      │
 │  - DB 조회 (기존 리포트)    │          │  orchestrator.py     │
 │  - 없으면 ETL 호출         │          │  - TS_INS_WEEK 생성   │
 │                            │          │  - SHARE_TOKEN 발급   │
 │  InsEtlApiMapper.xml       │          └──────────────────────┘
 │  - TS_INS_WEEK 조회        │                   │
 └────────────────────────────┘                   ▼
              │                          ┌──────────────────────┐
              └─────────────────────────▶│     Oracle DB        │
                                         │  TS_INS_WEEK/MONTH   │
                                         └──────────────────────┘
```

### 10.2 API 엔드포인트

| API | 경로 | 설명 |
|-----|------|------|
| runFarmEtl | `POST /api/ins/runFarmEtl.json` | 농장 ETL 수동 실행 |
| getFarmEtlStatus | `POST /api/ins/getFarmEtlStatus.json` | 농장 ETL 상태 조회 |
| getOrCreateWeeklyReport | `POST /api/ins/getOrCreateWeeklyReport.json` | 주간 리포트 생성/조회 |
| getOrCreateMonthlyReport | `POST /api/ins/getOrCreateMonthlyReport.json` | 월간 리포트 생성/조회 |
| getOrCreateQuarterlyReport | `POST /api/ins/getOrCreateQuarterlyReport.json` | 분기 리포트 생성/조회 |

### 10.3 getOrCreateWeeklyReport 요청/응답

```
POST /api/ins/getOrCreateWeeklyReport.json
{ "farmNo": 2807 }

Response:
{
    "result": true,
    "shareToken": "abc123...",
    "year": 2025,
    "weekNo": 52,
    "dtFrom": "20251222",
    "dtTo": "20251228",
    "isNew": false  // true: 신규 생성, false: 기존 조회
}
```

### 10.4 관련 파일

| 파일 | 경로 |
|------|------|
| InsEtlApiController.java | `newpig/api/ins/controller/` |
| InsEtlApiServiceImpl.java | `newpig/api/ins/service/` |
| InsEtlApiMapper.xml | `mybatis/mapper/oracle/api/ins/` |

### 10.5 설정

```properties
# application.properties
ins.etl.api.url=http://10.4.35.10:8000
```

---

## 11. FarmInfoMgmt - SMS 수동 발송 팝업

> 농장 정보 관리 화면에서 인사이트피그 SMS 수동 발송

### 11.1 화면 구조

```
 [dgMemberGrid - 회원 그리드]
 ┌────────────────────────────────────────────────────────────┐
 │ 회원유형 | 사용자ID | 성명 | 사용여부 | 인사이트 |          │
 │─────────────────────────────────────────────────────────── │
 │  농장주  | test1   | 홍길동 |    Y    | [SMS발송] |         │
 └────────────────────────────────────────────────────────────┘
                              │ 클릭
                              ▼
 [SMS 발송 팝업]
 ┌──────────────────────────────────────┐
 │  인사이트피그 SMS 발송            [X] │
 │──────────────────────────────────────│
 │  농장명:       행복농장               │
 │  지난주 리포트: 2025년 52주차         │
 │  리포트 URL:   https://inspig...      │
 │  수신번호:    [010-5014-6714]         │
 │──────────────────────────────────────│
 │  [SMS 발송] [URL 복사] [닫기]         │
 └──────────────────────────────────────┘
```

### 11.2 동작 흐름

1. `insFigSms` 컬럼의 "SMS발송" 버튼 클릭
2. `/api/ins/getOrCreateWeeklyReport.json` 호출
   - 기존 리포트 있으면: SHARE_TOKEN 표시
   - 없으면: ETL 실행 → 리포트 생성
3. SMS 발송: `/pigplan/kakaoMsg/sendInsWeeklyManual.json` 호출
4. URL 복사: 클립보드에 리포트 URL 복사

### 11.3 관련 파일

| 파일 | 경로 |
|------|------|
| FarmInfoMgmt.jsp | `.../officers/sysusage/farm/` |

---

## 12. 관련 테이블 요약

### 12.1 시스템 설정 테이블

| 테이블 | 설명 | 주요 컬럼 |
|--------|------|-----------|
| `TA_SYS_CONFIG` | 시스템 설정 | `INS_SCHEDULE_YN` (Y/T/N), `TEST_TEL` |

### 12.2 회원/농장 테이블

| 테이블 | 설명 | 주요 컬럼 |
|--------|------|-----------|
| `TA_MEMBER` | 회원 정보 | `FARM_NO`, `HP_NUM`, `SMS_INSPIG_YN`, `SMS_INSPIG_SDT`, `SMS_INSPIG_EDT`, `MEMBER_TYPE_D` |
| `TA_FARM` | 농장 정보 | `FARM_NO`, `FARM_NM` |

### 12.3 인사이트피그 ETL 테이블

| 테이블 | 설명 | 주요 컬럼 |
|--------|------|-----------|
| `TS_INS_MASTER` | ETL 배치 마스터 | `SEQ`, `DAY_GB` (WEEK/MONTH/QUARTER), `STATUS_CD`, `INS_DT` |
| `TS_INS_WEEK` | 주간 리포트 | `FARM_NO`, `MASTER_SEQ`, `REPORT_YEAR`, `REPORT_WEEK_NO`, `DT_FROM`, `DT_TO`, `SHARE_TOKEN`, `TOKEN_EXPIRE_DT`, `STATUS_CD` |
| `TS_INS_MONTH` | 월간 리포트 (향후) | `FARM_NO`, `MASTER_SEQ`, `REPORT_YEAR`, `REPORT_MONTH_NO`, `SHARE_TOKEN`, `STATUS_CD` |
| `TS_INS_QUARTER` | 분기 리포트 (향후) | `FARM_NO`, `MASTER_SEQ`, `REPORT_YEAR`, `REPORT_QUARTER_NO`, `SHARE_TOKEN`, `STATUS_CD` |

### 12.4 발송 로그 테이블

| 테이블 | 설명 | 주요 컬럼 |
|--------|------|-----------|
| `TA_KAKAOMSG_SENT` | 카카오/SMS 발송 로그 | `FARM_NO`, `MSG_GB`, `TO_TEL`, `GROUPID`, `MESSAGEID`, `STATUS`, `STATUSCODE`, `CREATEDAT` |

### 12.5 컬럼 상세

#### SMS_INSPIG 관련 (TA_MEMBER)
- `SMS_INSPIG_YN`: 인사이트피그 알림 수신 동의 (Y/N)
- `SMS_INSPIG_SDT`: 알림 시작일 (YYYYMMDD) - NULL이면 미신청
- `SMS_INSPIG_EDT`: 알림 종료일 (YYYYMMDD) - NULL이면 무기한

#### 발송 조건 (날짜 로직)
```
- SDT = NULL → 제외 (미신청)
- SYSDATE >= SDT → 포함 (당일 시작 포함)
- SYSDATE < EDT → 포함 (당일 종료 불포함)
- EDT = NULL → 무기한 포함
```

---

## 13. 참고 자료

- Solapi SDK: https://github.com/solapi/solapi-java
- Solapi 문서: https://docs.solapi.com/ko/kakao
- 카카오 알림톡 가이드: https://docs.solapi.com/ko/kakao/alimtalk
- [InsightPig ETL 개요](../../inspig-etl/docs/01_ETL_OVERVIEW.md)
- [InsightPig ETL 운영 가이드](../../inspig-etl/docs/05_OPERATION_GUIDE.md)
