# PigPlan Xenon (pig3.1) 프로젝트 아키텍처

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | Pigplan Xenon (newpigplan) |
| GroupId | kr.co.pigplanxe |
| ArtifactId | pigplanNew |
| 버전 | 1.0.0-SNAPSHOT |
| 패키징 | WAR |
| Java 버전 | 1.8 |

---

## 2. Git 저장소

| 항목 | 내용 |
|------|------|
| **Repository** | https://github.com/wiselake/pigplanNew |
| **기본 브랜치** | development |
| **운영 브랜치** | main |

### 2.1 브랜치 구조

```
remotes/origin/
├── main              # 운영 배포 브랜치
├── development       # 개발 통합 브랜치 (기본)
├── brian             # 개발자 브랜치
├── ray               # 개발자 브랜치
├── devBackup         # 개발 백업
└── hotfix_memoryleak # 핫픽스 브랜치
```

### 2.2 Git 워크플로우

```
feature/* ──┬──▶ development ──▶ main
hotfix/*  ──┘
```

- **development**: 개발 기능 통합, 테스트
- **main**: 운영 서버 배포용
- **feature/xxx**: 기능 개발 브랜치
- **hotfix/xxx**: 긴급 버그 수정

---

## 3. 기술 스택

### 3.1 Core Framework

| 구분 | 기술 | 버전 |
|------|------|------|
| **Web Framework** | Spring MVC | 4.3.21.RELEASE |
| **Security** | Spring Security | 4.2.11.RELEASE |
| **ORM/SQL Mapper** | MyBatis | 3.4.6 |
| **ORM/JPA** | Hibernate | 5.2.9.Final (보조) |
| **Template Engine** | Apache Tiles | 3.0.8 |
| **Template Engine** | Thymeleaf | 3.0.11.RELEASE |
| **AOP** | AspectJ | 1.8.10 |

### 3.2 Database

| 구분 | 기술 | 버전 |
|------|------|------|
| **Database** | Oracle | 19c |
| **JDBC Driver** | ojdbc8 | 19.3.0.0 |
| **Connection Pool** | HikariCP | 2.6.1 |
| **SQL Logging** | log4jdbc-log4j2 | 1.16 |

### 3.3 Session & Cache

| 구분 | 기술 | 버전 |
|------|------|------|
| **Session Store** | Redis (Lettuce) | 3.5.0.Final |
| **Session Management** | Spring Session Data Redis | 1.3.1.RELEASE |
| **Cache** | Ehcache | 2.10.4 |

### 3.4 검색 엔진

| 구분 | 기술 | 버전 |
|------|------|------|
| **Search Engine** | Elasticsearch | 7.9.3 |
| **Client** | transport, x-pack-transport | 7.9.3 |

### 3.5 외부 서비스

| 구분 | 기술 | 버전 | 용도 |
|------|------|------|------|
| **SMS/알림톡** | Nurigo SDK (Solapi) | 4.3.0 | 카카오 알림톡, SMS 발송 |

### 3.6 Utility

| 구분 | 기술 | 버전 |
|------|------|------|
| **Logging** | SLF4J + Log4j2 | 1.7.30 / 2.17.0 |
| **JSON** | Jackson | 2.8.7 |
| **Excel** | Apache POI | 3.15 |
| **Date/Time** | Joda-Time, ICU4J | 2.9.9 / 64.2 |
| **Lombok** | Lombok | 1.18.6 |
| **Password** | BCrypt (jBCrypt) | 0.4 |

### 3.7 스케줄러

| 구분 | 기술 | 버전 | 용도 |
|------|------|------|------|
| **Scheduler Lock** | ShedLock | 4.33.0 | 분산 환경 스케줄러 중복 실행 방지 |

---

## 4. 프로젝트 구조

```
pigplanxe/
├── src/main/java/newpig/
│   ├── api/           # REST API 컨트롤러
│   ├── chart/         # 차트 관련 기능
│   ├── common/        # 공통 유틸, 설정, 도메인
│   │   ├── configuration/  # Spring 설정 클래스
│   │   ├── domain/         # 공통 VO
│   │   ├── mapper/         # 공통 MyBatis Mapper
│   │   ├── service/        # 공통 서비스
│   │   └── util/           # 유틸리티 클래스
│   ├── company/       # 업체(계약사) 관련 기능
│   ├── elk/           # Elasticsearch 연동
│   ├── es/            # Elasticsearch 서비스
│   ├── into/          # 로그인, 메인페이지
│   │   ├── hme/           # 메인화면, 대시보드
│   │   └── lgin/          # 로그인/인증
│   ├── landing/       # 랜딩페이지 (Thymeleaf)
│   ├── mobile/        # 모바일 전용 기능
│   ├── officers/      # 관리자 기능
│   │   ├── sysmgnt/       # 시스템관리 (코드, 메뉴, 권한)
│   │   └── sysusage/      # 이용현황
│   ├── openapi/       # OpenAPI 연동
│   ├── pigplan/       # 핵심 비즈니스 로직
│   │   ├── bse/           # 기초정보관리
│   │   ├── dis/           # 분양관리
│   │   ├── farmsys/       # 농장시스템 설정
│   │   ├── mgt/           # 관리 (출하, 거래 등)
│   │   ├── pkd/           # 검정돈관리
│   │   ├── pmd/           # 모돈관리 (일일보고서 등)
│   │   └── spf/           # 스마트팜
│   ├── rpt/           # 보고서
│   ├── sch/           # 스케줄러 (배치 작업)
│   ├── Sharing/       # 공유 기능
│   └── test/          # 테스트
│
├── src/main/resources/
│   └── mybatis/mapper/oracle/  # MyBatis SQL Mapper XML
│
├── src/main/webapp/
│   ├── WEB-INF/
│   │   ├── config/
│   │   │   ├── context/        # Spring Context 설정
│   │   │   │   ├── root-context.xml
│   │   │   │   ├── security-context.xml
│   │   │   │   ├── redis-context.xml
│   │   │   │   ├── local/      # 로컬 환경 설정
│   │   │   │   ├── dev/        # 개발 환경 설정
│   │   │   │   ├── release/    # 운영 환경 설정
│   │   │   │   └── cjpig/      # CJ 전용 환경 설정
│   │   │   ├── mybatis/        # MyBatis 설정
│   │   │   ├── properties/     # 프로퍼티 파일
│   │   │   │   ├── countryset.properties
│   │   │   │   ├── smtp.properties
│   │   │   │   └── {env}/jdbc.properties, constantDef.properties
│   │   │   └── spring/         # Servlet 설정
│   │   │       ├── action-servlet.xml
│   │   │       ├── rest-servlet.xml
│   │   │       └── i18n_message-servlet.xml
│   │   ├── html/landing/       # Thymeleaf 템플릿
│   │   ├── jsp/                # JSP 뷰
│   │   │   ├── tiles/          # Tiles 설정
│   │   │   └── include/        # 공통 include JSP
│   │   └── web.xml
│   └── resources/              # 정적 리소스 (JS, CSS, images)
│
└── pom.xml
```

---

## 5. Spring Context 구조

### 5.1 Context 분리

```
┌─────────────────────────────────────────────────────────────┐
│                     Root Context                             │
│  (ContextLoaderListener)                                     │
│  - /WEB-INF/config/context/*-context.xml                    │
│  - /WEB-INF/config/context/${service.mode}/*-context.xml    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ root-context.xml                                     │    │
│  │ - Component Scan: newpig.*                          │    │
│  │ - PropertySourcesPlaceholderConfigurer              │    │
│  │ - BCryptPasswordEncoder                             │    │
│  │ - AuthenticationInterceptor Bean                    │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ dbpool-context.xml (환경별)                          │    │
│  │ - HikariDataSource (oracleDSSpied)                  │    │
│  │ - Log4jdbcProxyDataSource (oracleDS)                │    │
│  │ - SqlSessionFactory, SqlSessionTemplate             │    │
│  │ - TransactionManager                                │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ security-context.xml                                 │    │
│  │ - Spring Security 설정                               │    │
│  │ - CSRF 보호                                          │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ redis-context.xml                                    │    │
│  │ - RedisHttpSessionConfiguration                     │    │
│  │ - LettuceConnectionFactory                          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Servlet Context                           │
│  (DispatcherServlet)                                         │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ action-servlet.xml (*.do)                            │    │
│  │ - MVC Annotation Driven                             │    │
│  │ - Component Scan (configuration 제외)                │    │
│  │ - Tiles ViewResolver                                │    │
│  │ - Thymeleaf ViewResolver                            │    │
│  │ - Interceptors (Auth, Locale, Landing)              │    │
│  │ - MultipartResolver (파일 업로드)                    │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ rest-servlet.xml (*.json, *.xml)                     │    │
│  │ - REST API 전용 설정                                 │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 URL 패턴 매핑

| Servlet | URL Pattern | 용도 |
|---------|-------------|------|
| action | `*.do` | 일반 웹 페이지 요청 |
| rest | `*.json` | REST API (JSON) |
| xmlRest | `*.xml` | REST API (XML) |

---

## 6. 환경별 설정

### 6.1 환경 구분

| 환경 | service.mode | 용도 |
|------|--------------|------|
| local | local | 로컬 개발 환경 |
| dev | dev | 개발 서버 |
| release | release | 운영 서버 |
| cjpig | cjpig | CJ 전용 운영 서버 |

### 6.2 환경별 설정 파일

```
properties/{env}/
├── jdbc.properties         # DB 연결 정보
└── constantDef.properties  # 시스템 상수 (Redis 등)

context/{env}/
└── dbpool-context.xml      # DataSource 설정
```

---

## 7. 트랜잭션 관리

### 7.1 선언적 트랜잭션 (AOP)

```xml
<!-- 메서드명 기반 트랜잭션 적용 -->
<tx:advice id="oracleTxAdvice">
  <tx:attributes>
    <tx:method name="get*" read-only="true"/>
    <tx:method name="read*" read-only="true"/>
    <tx:method name="select*" read-only="true"/>
    <tx:method name="*" rollback-for="Exception"/>
  </tx:attributes>
</tx:advice>

<!-- Pointcut: *Tx 메서드에 트랜잭션 적용 -->
<aop:config>
  <aop:pointcut expression="execution(* newpig..service.*.*Tx(..))" id="pointcutMethods"/>
  <aop:advisor advice-ref="oracleTxAdvice" pointcut-ref="pointcutMethods"/>
</aop:config>
```

### 7.2 트랜잭션 규칙

- `get*`, `read*`, `select*` 메서드: **읽기 전용**
- `*Tx` 접미사 메서드: **트랜잭션 적용** (롤백: Exception 발생 시)

---

## 8. 세션 관리

### 8.1 Redis Session

- **Spring Session + Redis** 사용
- 클러스터 환경에서 세션 공유 지원
- Lettuce 클라이언트 사용

### 8.2 세션 타임아웃

```xml
<session-config>
  <session-timeout>60</session-timeout>  <!-- 60분 -->
</session-config>
```

---

## 9. 보안 설정

### 9.1 Spring Security

- CSRF 보호 활성화
- 익명 사용자 접근 허용 (커스텀 인증 인터셉터 사용)

### 9.2 비밀번호 암호화

- **BCrypt** 알고리즘 사용
- `BCryptPasswordEncoder` Bean 등록

---

## 10. View 레이어

### 10.1 View Resolver 우선순위

| 순서 | ViewResolver | 조건/용도 |
|------|--------------|-----------|
| 1 | BeanNameViewResolver | Excel 다운로드 (ExcelXlsView) |
| 99 | TilesViewResolver | Tiles 레이아웃 적용 |
| 100 | InternalResourceViewResolver | `jsp/*` 뷰 (JSP) |
| - | ThymeleafViewResolver | `/landing/**` 경로 (HTML) |

### 10.2 Tiles 레이아웃

- 설정 위치: `/WEB-INF/jsp/tiles/*-tiles.xml`
- 레이아웃 기반 일관된 UI 구성

---

## 11. 스케줄러

### 11.1 ShedLock

분산 환경에서 스케줄러 중복 실행 방지를 위해 **ShedLock** 사용

```java
@Scheduled(cron = "0 0 9 * * MON")
@SchedulerLock(name = "sendInsWeeklyReportKakao", lockAtMostFor = "PT10M")
public void sendInsWeeklyReportKakao() { ... }
```

### 11.2 주요 스케줄 작업

| 클래스 | 위치 | 용도 |
|--------|------|------|
| Scheduler.java | newpig.sch | 배치 작업 엔트리포인트 |
| SchedulerService.java | newpig.sch | 스케줄 비즈니스 로직 |

---

## 12. 국제화 (i18n)

### 12.1 메시지 소스

- **DatabaseMessageResource**: DB 기반 다국어 메시지
- 세션 기반 로케일 관리 (`SessionLocaleResolver`)
- 기본 로케일: `ko` (한국어)

### 12.2 로케일 변경

- 파라미터명: `langLocale`
- `LocaleChangeInterceptor` 사용

---

## 13. 파일 업로드

```xml
<bean id="multipartResolver" class="...CommonsMultipartResolver">
  <property name="maxUploadSize" value="30000000"/>  <!-- 30MB -->
</bean>
```

---

## 14. 에러 처리

### 14.1 Exception Handler

```xml
<bean class="SimpleMappingExceptionResolver">
  <property name="defaultErrorView" value="error"/>
  <property name="exceptionMappings">
    <prop key="RuntimeException">error</prop>
  </property>
</bean>
```

### 14.2 에러 페이지

- 기본 에러 핸들러: `/common/error/errors.do`
- `java.lang.Exception` 발생 시 해당 페이지로 이동

---

## 15. InsightPig ETL API 연동

### 15.1 API 엔드포인트

| API | 경로 | 설명 |
|-----|------|------|
| runFarmEtl | `/api/ins/runFarmEtl.json` | 농장 ETL 수동 실행 |
| getFarmEtlStatus | `/api/ins/getFarmEtlStatus.json` | 농장 ETL 상태 조회 |
| getOrCreateWeeklyReport | `/api/ins/getOrCreateWeeklyReport.json` | 주간 리포트 생성/조회 |
| getOrCreateMonthlyReport | `/api/ins/getOrCreateMonthlyReport.json` | 월간 리포트 생성/조회 |
| getOrCreateQuarterlyReport | `/api/ins/getOrCreateQuarterlyReport.json` | 분기 리포트 생성/조회 |

### 15.2 INS_DT(기준일) 개념

ETL 날짜 파라미터는 **INS_DT(기준일)** 기준입니다:

| INS_DT | 지난주(DT_FROM~DT_TO) | 금주 | REPORT_WEEK |
|--------|----------------------|------|-------------|
| 12/22(월)~12/28(일) | 12/15~12/21 | 12/22~12/28 | 51주 |
| 12/29(월)~12/31(수) | 12/22~12/28 | 12/29~01/04 | 52주 |

- **INS_DT**: 기준일 (ETL 실행일 또는 지정된 날짜)
- **지난주**: INS_DT가 속한 주의 이전 주 (월~일)
- **REPORT_WEEK**: 지난주의 ISO Week (일요일 기준)

### 15.3 API 호출 예시

```java
// InsEtlApiServiceImpl.java
Map<String, Object> requestBody = new HashMap<>();
requestBody.put("farmNo", farmNo);
requestBody.put("dayGb", "WEEK");
requestBody.put("insDate", "20251229");  // 기준일

// POST http://10.4.35.10:8000/api/etl/run-farm
// Response: { "status": "success", "shareToken": "abc123...", "year": 2025, "weekNo": 52, ... }
```

### 15.4 관련 소스

| 파일 | 위치 | 설명 |
|------|------|------|
| InsEtlApiController.java | newpig/api/ins/controller | API 컨트롤러 |
| InsEtlApiService.java | newpig/api/ins/service | 서비스 인터페이스 |
| InsEtlApiServiceImpl.java | newpig/api/ins/service/impl | 서비스 구현체 |
| InsEtlApiMapper.xml | mybatis/mapper/oracle/api/ins | SQL 매퍼 |

---

## 16. 관련 문서

- [인사이트피그 카카오 알림톡 가이드](./insightpigplan-kakao-alimtalk.md)
- [InsightPig ETL 개요](../../inspig-etl/docs/01_ETL_OVERVIEW.md)
- [InsightPig ETL 운영 가이드](../../inspig-etl/docs/05_OPERATION_GUIDE.md)
