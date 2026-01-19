# 배포 및 운영 가이드 (Docker 기반)

**대상**: DevOps, 배포 담당자
**최종 업데이트**: 2025-12-22
**주요 내용**: Docker Compose를 이용한 이중화 환경 배포 및 운영 가이드

---

## 1. 운영 환경 분석 (Production Environment)

현재 운영 서버는 고가용성을 위해 **이중화(Dual Server)**로 구성되어 있으며, 기존 레거시 서비스와 공존하는 환경입니다.

### 1.1 서버 구성
| 서버 구분 | IP 주소 | 역할 | OS |
| :--- | :--- | :--- | :--- |
| **운영 서버 #1** | 10.4.38.10 | Web/API 서비스 (Active) | CentOS 7 |
| **운영 서버 #2** | 10.4.99.10 | Web/API 서비스 (Active/Active) | CentOS 7 |

### 1.2 기존 서비스 현황 (Port Inventory)
새로운 서비스 배포 시 아래 기존 포트와의 충돌에 주의해야 합니다.
*   **8080 (TCP6)**: Tomcat (Java) 서비스 구동 중
*   **5000 (TCP)**: uWSGI (Python) 서비스 구동 중
*   **8002 (HTTP)**: **신규 서비스용 포트 (Nginx)** - ALB와 연결됨
*   **3000, 3001**: Docker 내부 서비스용 (외부 노출 불필요)

### 1.3 리소스 현황
*   **Memory**: 총 7.5GB (가용 메모리 약 4.2GB)
*   **Disk**: `/data` 파티션 활용 (권장 경로: `/data/insightPig`)

---

## 2. 배포 아키텍처

```
┌─────────────────────────────────────────┐
│       AWS Application Load Balancer     │
│         Domain: ins.pigplan.io          │
│         (Port 80/443 -> 8002)           │
└─────────────┬───────────────────────────┘
              │
      ┌───────┴────────┐
      │  Docker Engine │
      ├────────────────┤
      │ - Web (Next.js)│ (Internal: 3000)
      │ - API (NestJS) │ (Internal: 3001)
      │ - Nginx        │ (External: 8002)
      └───────┬────────┘
              │
      ┌───────▼───────────────┐
      │        Oracle Database        │
      │  - Data Processing (Job)      │
      │  - Data Storage               │
      └───────────────────────────────┘
```

---

## 3. 서버 설정 및 배포 절차

### 3.1 Docker 환경 구축 (최초 1회, 양쪽 서버 공통)
CentOS 7의 라이브러리 제약을 극복하기 위해 Docker를 사용합니다.
```bash
# 1. Docker 엔진 설치
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker

# 2. 권한 설정 (pigplan 계정)
sudo usermod -aG docker pigplan
# 즉시 적용을 위해 소켓 권한 변경
sudo chmod 666 /var/run/docker.sock

# 3. Docker Compose 설치 (v2.24.5)
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3.2 소스 코드 배포 (deploy.sh)
프로젝트 루트의 `deploy.sh` 스크립트를 사용하여 이중화 서버에 배포합니다.

```bash
# 사용법
./deploy.sh              # 커밋되지 않은 변경 파일만 배포
./deploy.sh -last        # 마지막 1개 커밋 변경 파일 배포
./deploy.sh -last 3      # 최근 3개 커밋 변경 파일 배포
./deploy.sh -all         # 전체 프로젝트 배포
```

*   **설정 파일**: `deploy.sh` (SSH 키 경로, 서버 IP 등)
*   **대상 경로**: `/data/insightPig`
*   **대상 서버**: 10.4.38.10, 10.4.99.10 (자동 이중화 배포)

### 3.3 환경 변수 설정 (`.env`)
각 서버의 `/data/insightPig/.env` 파일에 실제 DB 접속 정보를 설정합니다.
```env
DB_HOST=10.x.x.x
DB_PORT=1521
DB_USER=username
DB_PASSWORD=password
DB_SERVICE_NAME=xe
```

### 3.4 서비스 실행
```bash
cd /data/insightPig
# 컨테이너 빌드 및 백그라운드 실행
docker-compose up -d --build
```

---

## 4. 데이터 처리 및 모니터링

### 4.1 Oracle Job 운영 (현재 방식)
데이터 수집 및 가공은 현재 Oracle 내부 스케줄러를 통해 수행됩니다.
*   **JOB 명칭**: `JOB_INS_WEEKLY_REPORT`
*   **실행 주기**: 매주 월요일 02:00 (KST)
*   **프로시저**: `SP_INS_WEEK_MAIN` 호출

### 4.2 모니터링 및 유지보수
*   **로그 확인**: `docker-compose logs -f`
*   **상태 확인**: `docker-compose ps`
*   **서비스 재시작**: `docker-compose restart`
*   **완전 삭제 후 재시작**: `docker-compose down && docker-compose up -d --build`

---

## 5. Python ETL 서버

Web/API 서비스와 별도로 Python ETL 전용 서버가 구성되어 있습니다.

### 5.1 서버 구성
| 서버 | IP 주소 | 역할 | Python | 상태 |
|------|---------|------|--------|------|
| **ETL 서버** | 10.4.35.10 | Python ETL (권장) | 3.8.5 (Anaconda) | ✅ 운영 중 |
| ELK 서버 | 10.4.66.11 | Elasticsearch/Logstash | 3.6.8 | ETL 비권장 |

### 5.2 ETL 서버 환경 (10.4.35.10)
*   **OS**: CentOS 7.7.1908
*   **Python**: 3.8.5 (Anaconda)
*   **Oracle**: cx_Oracle 8.3.0 + Instant Client 12.2
*   **스케줄러**: Crontab / APScheduler 3.11.0
*   **DB 연결**: RDS Oracle (pigclouddb.xxx.rds.amazonaws.com)
*   **기존 ETL**: consulting-report-etl, farm_performance_scheduler 등 운영 중

### 5.3 ETL 단독 운영 이유
ETL 작업은 이중화 없이 **단일 서버에서만 실행**합니다.
*   중복 실행 방지 (데이터 중복 INSERT 방지)
*   배치 작업은 한 서버로 충분
*   로그/모니터링 집중 관리

> **상세 가이드**: [Python ETL 전환 가이드](05-python-etl.md)

---

## 6. 이중화 서버 Next.js RSC 문제 및 해결

> **작성일**: 2026-01-16 | **상태**: 해결됨 (Hard Navigation 적용)

### 6.1 문제 현상

운영 서버(https://ins.pigplan.io/)에서 다음과 같은 문제가 간헐적으로 발생:

- 버튼 클릭 시 페이지 이동 불가
- RSC(React Server Components) 페이로드가 HTML 대신 화면에 텍스트로 표시
- **한 번 문제 발생 시 모든 버튼이 동작하지 않음**
- F5(새로고침) 시 정상으로 복구됨
- 로컬 개발 환경에서는 재현되지 않음

### 6.2 근본 원인

이중화 서버 환경에서 Next.js App Router의 RSC 상태 불일치:

| 문제 | 설명 |
|------|------|
| **BUILD_ID 불일치** | 각 서버에서 개별 빌드 시 서로 다른 BUILD_ID 생성 |
| **RSC 페이로드 캐시** | 브라우저/CDN이 RSC 페이로드를 잘못 캐싱 |
| **라우터 상태 불일치** | 서로 다른 서버로 라우팅될 때 클라이언트 라우터 상태 corruption |

**참고 이슈**:
- [GitHub #786: mismatch BUILD_ID in multi server](https://github.com/vercel/next.js/issues/786)
- [GitHub Discussion #59167: RSC and CDN cache problems](https://github.com/vercel/next.js/discussions/59167)

### 6.3 적용된 해결책

#### 1) BUILD_ID 일치 (`next.config.ts`)
```typescript
import { execSync } from "child_process";

const getGitCommitHash = (): string => {
  try {
    return execSync("git rev-parse HEAD").toString().trim().slice(0, 12);
  } catch {
    return `build-${Date.now()}`;
  }
};

const nextConfig: NextConfig = {
  generateBuildId: async () => getGitCommitHash(),
  // ...
};
```

#### 2) 캐시 비활성화 (`next.config.ts`)
```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-store, must-revalidate' },
      ],
    },
  ];
},
```

#### 3) Hard Navigation 적용 (핵심 해결책)

모든 네비게이션을 `window.location.href`를 통한 전체 페이지 새로고침으로 변경:

```typescript
// Hard navigation 함수 - Next.js 클라이언트 라우터 우회
const navigateTo = (path: string) => {
  window.location.href = path;
};

// 사용 예시: Link 대신 a 태그 + navigateTo
<a href="/weekly" onClick={(e) => { e.preventDefault(); navigateTo('/weekly'); }}>
```

**변경된 파일**:
- `Header.tsx`, `Footer.tsx`, `Sidebar.tsx` - `<Link>` → `<a>` + `navigateTo()`
- `page.tsx` (홈), `login/page.tsx` - `router.push()` → `navigateTo()`
- `AuthContext.tsx` - 로그아웃, useRequireAuth 훅
- `weekly/page.tsx`, `weekly/[id]/page.tsx`, `monthly/page.tsx`, `quarterly/page.tsx`

### 6.4 향후 개선 가능 사항

| 방안 | 설명 | 현재 상태 |
|------|------|----------|
| **Sticky Session** | ALB/Nginx에서 세션 고정 설정 | 미적용 (검토 중) |
| **빌드 산출물 공유** | 한 번 빌드 → 모든 서버에 동일한 `.next` 배포 | 미적용 |
| **CDN 캐시 무효화** | 배포 후 CDN 캐시 클리어 | 해당 없음 |

Sticky Session 적용 시 `<Link>` 컴포넌트 복원 검토 가능.

---

## 7. 주의 사항 및 팁

1.  **이중화 동기화**: `deploy.sh` 스크립트 사용 시 자동으로 두 서버에 배포됩니다.
2.  **AWS 설정**: AWS 보안 그룹에서 **8002 포트**가 인바운드 허용되어야 하며, ALB 리스너 규칙에 `ins.pigplan.io`가 등록되어야 합니다. (상세 내용은 `docs/aws.md` 참조)
3.  **접속 주소**: `https://ins.pigplan.io` (ALB 연동, HTTPS)
4.  **권한 문제**: `docker-compose` 실행 시 권한 에러가 발생하면 `sudo chmod 666 /var/run/docker.sock`을 다시 실행하십시오.
5.  **컨테이너 충돌**: 기존 컨테이너가 남아있으면 `docker rm -f inspig-api inspig-web inspig-nginx` 후 재빌드
6.  **페이지 이동 문제**: 이중화 환경에서 Next.js `<Link>` 사용 시 RSC 상태 불일치 발생 가능 → Hard Navigation 사용 (6장 참조)
