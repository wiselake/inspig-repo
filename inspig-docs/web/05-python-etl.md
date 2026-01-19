# Python ETL 전환 가이드

**대상**: DevOps, 데이터 엔지니어
**최종 업데이트**: 2025-12-22
**주요 내용**: Oracle Job에서 Python ETL로 전환하기 위한 서버 환경 구성 및 운영 가이드

---

## 1. 현재 상태 (Oracle Job 기반)

### 1.1 현재 아키텍처
```
┌─────────────────────────────────────────────────────────────┐
│                    Oracle Database                          │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │ DBMS_SCHEDULER  │───▶│ SP_INS_WEEK_MAIN (PL/SQL)       │ │
│  │ 매주 월 02:00   │    │ 농장별 데이터 집계              │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Oracle Job 현황
| JOB 명칭 | 실행 주기 | 프로시저 |
|----------|----------|----------|
| JOB_INS_WEEKLY_REPORT | 매주 월요일 02:00 KST | SP_INS_WEEK_MAIN |

---

## 2. 전환 후 아키텍처 (Python ETL)

```
┌─────────────────────────────────────────────────────────────┐
│             AWS Python ETL 서버 (기존 Python 서버)           │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │ Crontab         │───▶│ Python ETL Script               │ │
│  │ 매주 월 02:00   │    │ /data/inspig-etl/run_weekly.sh  │ │
│  └─────────────────┘    └─────────────┬───────────────────┘ │
└───────────────────────────────────────┼─────────────────────┘
                                        │ python-oracledb
                                        ▼
                          ┌─────────────────────────────────┐
                          │        Oracle Database          │
                          │  - SP_INS_WEEK_MAIN 호출        │
                          │  - 집계 결과 저장               │
                          └─────────────────────────────────┘
```

---

## 3. 서버 환경 분석 결과

### 3.1 대상 서버 비교

| 항목 | 10.4.35.10 (권장) | 10.4.66.11 |
|------|-------------------|------------|
| **OS** | CentOS 7.7.1908 | CentOS 7.7.1908 |
| **Python** | 3.8.5 (Anaconda) ✅ | 3.6.8 ⚠️ |
| **메모리** | 15GB (가용 3.4GB) | 15GB (가용 10GB) |
| **디스크 /data** | 100GB (가용 87GB) | 100GB (가용 90GB) |
| **Anaconda** | ✅ 설치됨 | ❌ 없음 |
| **Oracle Client** | ✅ 12.2 설치됨 | ❌ 없음 |
| **cx_Oracle** | ✅ 8.3.0 | ❌ 없음 |
| **APScheduler** | ✅ 3.11.0 | ❌ 없음 |
| **Oracle RDS 연결** | ✅ 성공 | ✅ 성공 |
| **Cron 서비스** | ✅ active | ✅ active |
| **기존 ETL 서비스** | ✅ 4개 운영 중 | ❌ 없음 |
| **용도** | **Python ETL 서버** | ELK Stack 서버 |

### 3.2 권장 서버: 10.4.35.10

**즉시 배포 가능한 이유:**
- Python 3.8+ 환경 구성 완료
- cx_Oracle + Oracle Instant Client 설치됨
- 기존 ETL 서비스 운영 패턴 참고 가능 (consulting-report-etl 등)
- Cron/APScheduler 모두 사용 가능

### 3.3 기존 ETL 서비스 현황 (10.4.35.10)

| 서비스 | 포트 | Conda 환경 | 설명 |
|--------|------|------------|------|
| consulting_report_etl.py | - | consulting-report-etl | 컨설팅 리포트 ETL |
| farm_performance_scheduler.py | - | annual_performance_etl | 농장 성과 스케줄러 |
| uvicorn (feed_sales_service) | 8000 | feed_sales_service | 사료 판매 API |
| uvicorn (pigiot-apikey-manager) | 5173 | pigiot-apikey-manager | API 키 관리 |

### 3.4 기존 ETL 패턴 (config.ini 방식)

```ini
# /data/etl/consulting-report/config.ini
[database]
user = pksu
password = PKSU
dsn = pigclouddb.c8ks4denaq5l.ap-northeast-2.rds.amazonaws.com:1521/pigplan

[api]
base_url = http://10.4.35.10:8090/consulting/report
timeout = 180
```

### 3.5 ETL 단독 운영 원칙

ETL 작업은 **한쪽 서버에서만 실행**합니다.

| 구분 | 웹 서비스 | ETL 배치 작업 |
|------|----------|---------------|
| 구성 | 10.4.38.10 + 10.4.99.10 이중화 | **10.4.35.10 단독** |
| 이유 | 가용성, 부하 분산 | 중복 실행 방지 |
| 스케줄 | 항상 실행 | 주 1회 (월 02:00) |

**단독 운영 이유:**
- 중복 실행 시 데이터 중복 INSERT 발생
- 배치 작업은 한 서버로 충분
- 로그/모니터링 집중 관리

---

## 4. 서버 환경 구성

### 4.1 방법 A: Conda 환경 사용 (권장)

기존 Anaconda 환경 패턴을 활용합니다.

```bash
# 1. Conda 환경 생성
source /data/anaconda/anaconda3/etc/profile.d/conda.sh
conda create -n inspig-weekly-etl python=3.8 -y
conda activate inspig-weekly-etl

# 2. 라이브러리 설치
pip install cx_Oracle pandas APScheduler python-dotenv

# 3. 작업 디렉토리 생성
mkdir -p /data/etl/inspig-weekly
mkdir -p /data/etl/inspig-weekly/logs
cd /data/etl/inspig-weekly
```

### 4.2 방법 B: 독립 venv 사용

Anaconda 없이 시스템 Python 사용 시:

```bash
# 1. 작업 디렉토리 생성
sudo mkdir -p /data/inspig-etl
sudo chown pigplan:pigplan /data/inspig-etl
cd /data/inspig-etl

# 2. 가상환경 생성 (Python 3.8+ 필요)
python3 -m venv venv
source venv/bin/activate

# 3. 라이브러리 설치
pip install --upgrade pip
pip install python-oracledb pandas python-dotenv
```

### 4.3 설정 파일 (config.ini)

기존 ETL 패턴과 동일하게 config.ini 방식 사용:

```ini
# /data/etl/inspig-weekly/config.ini
[database]
user = pksu
password = PKSU
dsn = pigclouddb.c8ks4denaq5l.ap-northeast-2.rds.amazonaws.com:1521/pigplan

[processing]
parallel = 4
test_mode = N

[logging]
log_path = /data/etl/inspig-weekly/logs
```

### 4.4 디렉토리 구조

```
/data/etl/inspig-weekly/          # Conda 환경 사용 시
├── config.ini                    # 설정 파일 (DB 접속 정보)
├── weekly_report_etl.py          # 메인 ETL 스크립트
├── run_weekly.sh                 # 실행 스크립트
└── logs/                         # 실행 로그
    └── weekly_YYYYMMDD.log
```

---

## 5. 스케줄러 구동 방법

### 5.1 방법 비교

| 방법 | 장점 | 단점 | 권장 |
|------|------|------|------|
| **Crontab** | 시스템 내장, 안정적 | 복잡한 스케줄 어려움 | **권장** |
| **Systemd Timer** | 로깅 통합, 재시작 관리 | 설정 복잡 | 중급 |
| **APScheduler** | Python 내 스케줄링 | 별도 프로세스 필요 | 복잡한 경우 |

### 5.2 Crontab 설정 (권장)

```bash
# 1. crontab 편집
crontab -e

# 2. 주간 리포트: 매주 월요일 02:00 KST
0 2 * * 1 /data/etl/inspig-weekly/run_weekly.sh >> /data/etl/inspig-weekly/logs/cron.log 2>&1
```

### 5.3 실행 스크립트 (run_weekly.sh)

```bash
#!/bin/bash
# /data/etl/inspig-weekly/run_weekly.sh

# Conda 환경 활성화
source /data/anaconda/anaconda3/etc/profile.d/conda.sh
conda activate inspig-weekly-etl

# 작업 디렉토리 이동
cd /data/etl/inspig-weekly

# ETL 실행
python weekly_report_etl.py

# 종료 코드 확인
if [ $? -eq 0 ]; then
    echo "[$(date)] Weekly ETL completed successfully"
else
    echo "[$(date)] Weekly ETL failed"
fi
```

```bash
# 실행 권한 부여
chmod +x /data/etl/inspig-weekly/run_weekly.sh
```

---

## 6. ETL 스크립트 예시

### 6.1 주간 리포트 ETL (weekly_report_etl.py)

기존 consulting-report-etl 패턴을 참고한 스크립트:

```python
import cx_Oracle
import configparser
import logging
from datetime import datetime
import os

# 로깅 설정
def setup_logger():
    log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
    os.makedirs(log_dir, exist_ok=True)

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(os.path.join(log_dir, f"weekly_{datetime.now():%Y%m%d}.log")),
            logging.StreamHandler()
        ]
    )
    return logging.getLogger("inspig_weekly_etl")

logger = setup_logger()

# 설정 파일 로드
def load_config():
    config = configparser.ConfigParser()
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.ini")
    config.read(config_path)
    return config

def get_connection(config):
    """Oracle DB 연결"""
    return cx_Oracle.connect(
        user=config['database']['user'],
        password=config['database']['password'],
        dsn=config['database']['dsn']
    )

def call_procedure(conn, proc_name: str, params: list = None):
    """프로시저 호출"""
    with conn.cursor() as cursor:
        cursor.callproc(proc_name, params or [])
        conn.commit()

def run_weekly_report():
    """주간 리포트 생성 (기존 Oracle Job 대체)"""
    config = load_config()

    try:
        logger.info("Weekly ETL 시작")

        with get_connection(config) as conn:
            # 기존 PL/SQL 프로시저 호출
            parallel = int(config['processing'].get('parallel', 4))
            test_mode = config['processing'].get('test_mode', 'N')

            call_procedure(conn, 'SP_INS_WEEK_MAIN', ['WEEK', None, parallel, test_mode])

        logger.info("Weekly ETL 완료")
        return True
    except Exception as e:
        logger.error(f"Weekly ETL 실패: {e}")
        raise

if __name__ == '__main__':
    run_weekly_report()
```

---

## 7. 전환 단계

### 7.1 단계별 계획

| 단계 | 내용 | 비고 |
|------|------|------|
| **1단계** | Python 환경 구성 및 테스트 | 개발 환경에서 테스트 |
| **2단계** | 프로시저 호출 방식 ETL | 기존 PL/SQL 재사용 |
| **3단계** | Oracle Job 비활성화 | Python ETL로 완전 전환 |

### 7.2 환경 구성 체크리스트

- [ ] SSH 접속 확인 (`ssh -i ProdPigplanKey.pem pigplan@10.4.35.10`)
- [ ] Conda 환경 생성 (`conda create -n inspig-weekly-etl python=3.8`)
- [ ] 라이브러리 설치 (`pip install cx_Oracle pandas APScheduler`)
- [ ] 디렉토리 생성 (`/data/etl/inspig-weekly`)
- [ ] config.ini 설정 (DB 접속 정보)
- [ ] Oracle RDS 연결 테스트
- [ ] 프로시저 호출 테스트 (`SP_INS_WEEK_MAIN`)
- [ ] run_weekly.sh 실행 권한 (`chmod +x`)
- [ ] Crontab 등록

### 7.3 Oracle Job 비활성화

```sql
-- Oracle Job 비활성화
BEGIN
    DBMS_SCHEDULER.DISABLE('JOB_INS_WEEKLY_REPORT');
END;
/

-- 상태 확인
SELECT JOB_NAME, STATE, ENABLED
FROM USER_SCHEDULER_JOBS
WHERE JOB_NAME = 'JOB_INS_WEEKLY_REPORT';
```

---

## 8. 모니터링

### 8.1 로그 확인
```bash
# SSH 접속
ssh -i "E:/ssh key/sshkey/aws/ProdPigplanKey.pem" pigplan@10.4.35.10

# 최신 로그 확인
tail -f /data/etl/inspig-weekly/logs/weekly_*.log

# cron 실행 로그
tail -f /data/etl/inspig-weekly/logs/cron.log
```

### 8.2 서비스 확인
```bash
# cron 서비스 상태
sudo systemctl status crond

# Conda 환경 목록
conda env list

# 실행 중인 Python 프로세스
ps aux | grep python
```

---

## 9. 트러블슈팅

### 9.1 Oracle 연결 실패
```bash
# RDS 연결 테스트
timeout 3 bash -c 'echo > /dev/tcp/pigclouddb.c8ks4denaq5l.ap-northeast-2.rds.amazonaws.com/1521' && echo 'OK' || echo 'FAIL'

# AWS Security Group 1521 포트 인바운드 허용 확인
```

### 9.2 Conda 환경 문제
```bash
# Conda 초기화
source /data/anaconda/anaconda3/etc/profile.d/conda.sh

# 환경 활성화 확인
conda activate inspig-weekly-etl
which python
# /data/anaconda/anaconda3/envs/inspig-weekly-etl/bin/python
```

### 9.3 cx_Oracle 라이브러리 문제
```bash
# Oracle Instant Client 경로 확인
ls -la /usr/lib/oracle/12.2/

# LD_LIBRARY_PATH 설정 (필요시)
export LD_LIBRARY_PATH=/usr/lib/oracle/12.2/client64/lib:$LD_LIBRARY_PATH
```

---

## 10. 프로젝트 구성

### 10.1 별도 프로젝트 분리 (권장)

Python ETL은 inspig 웹 프로젝트와 **별도 Git 저장소**로 관리합니다.

**분리 이유:**
- 실행 환경이 다름 (Web: Docker, ETL: Conda/Python)
- 배포 서버가 다름 (Web: 이중화, ETL: 단독)
- 기술 스택이 다름 (Web: TypeScript, ETL: Python)
- 기존 ETL 패턴과 일관성 유지

**프로젝트 구조:**
```
GitHub/GitLab
├── inspig/                    # 웹 서비스 (기존)
│   ├── api/                   # NestJS Backend
│   ├── web/                   # Next.js Frontend
│   ├── docs/                  # 문서 (ETL 가이드 포함)
│   └── deploy.sh              # 웹 서버 배포
│
└── inspig-etl/                # Python ETL (별도 repo)
    ├── weekly_report_etl.py   # 주간 리포트 ETL
    ├── config.ini             # DB 설정 (gitignore)
    ├── config.ini.example     # 설정 예시
    ├── run_weekly.sh          # 실행 스크립트
    ├── requirements.txt       # Python 의존성
    ├── deploy-etl.sh          # ETL 서버 배포
    └── README.md              # ETL 문서
```

---

## 11. 로컬 개발 환경

### 11.1 로컬에서 ETL 개발 가능 여부

**가능합니다.** 단, Oracle DB 연결이 필요합니다.

| 환경 | 가능 여부 | 조건 |
|------|----------|------|
| Windows (로컬) | ✅ 가능 | Oracle Instant Client 또는 python-oracledb Thin mode |
| Mac | ✅ 가능 | python-oracledb Thin mode 권장 |
| Linux | ✅ 가능 | cx_Oracle 또는 python-oracledb |

### 11.2 Windows 로컬 개발 환경 구성

```bash
# 1. Python 가상환경 생성
cd C:\Projects\inspig-etl
python -m venv venv
venv\Scripts\activate

# 2. 라이브러리 설치 (Thin mode - Oracle Client 불필요)
pip install oracledb pandas python-dotenv

# 3. 설정 파일 생성
copy config.ini.example config.ini
# config.ini에 RDS 접속 정보 입력
```

### 11.3 로컬 config.ini 설정

```ini
# C:\Projects\inspig-etl\config.ini
[database]
user = pksu
password = PKSU
dsn = pigclouddb.c8ks4denaq5l.ap-northeast-2.rds.amazonaws.com:1521/pigplan

[processing]
parallel = 4
test_mode = Y    # 로컬 테스트 시 Y 권장

[logging]
log_path = ./logs
```

### 11.4 로컬 테스트 실행

```bash
# 가상환경 활성화
venv\Scripts\activate

# 테스트 모드로 실행 (금주 데이터만 처리)
python weekly_report_etl.py

# 또는 특정 기준일로 테스트
python weekly_report_etl.py --base-date 2024-12-15
```

### 11.5 VPN 연결 필요

로컬에서 RDS Oracle에 접속하려면 **AWS VPN 연결**이 필요합니다.
- RDS는 Private Subnet에 있어 외부에서 직접 접근 불가
- VPN 연결 후 10.x.x.x 대역 접근 가능

---

## 12. 운영 테스트 (수동 실행)

### 12.1 운영 서버에서 즉시 실행

배포 후 Crontab 스케줄과 별개로 **수동 실행**하여 테스트할 수 있습니다.

```bash
# 1. SSH 접속
ssh -i "E:/ssh key/sshkey/aws/ProdPigplanKey.pem" pigplan@10.4.35.10

# 2. Conda 환경 활성화
source /data/anaconda/anaconda3/etc/profile.d/conda.sh
conda activate inspig-weekly-etl

# 3. 작업 디렉토리 이동
cd /data/etl/inspig-weekly

# 4. 테스트 모드로 실행 (금주 데이터만, 오늘 포함)
python weekly_report_etl.py --test
```

### 12.2 테스트 모드 vs 운영 모드

| 모드 | config.ini | 기간 | 용도 |
|------|------------|------|------|
| **테스트** | `test_mode = Y` | 금주 월~오늘 | 배포 후 검증, 개발 |
| **운영** | `test_mode = N` | 전주 월~일 | 실제 스케줄 실행 |

### 12.3 테스트 모드 스크립트 수정

```python
# weekly_report_etl.py 수정

import argparse

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--test', action='store_true', help='테스트 모드 (금주 데이터)')
    parser.add_argument('--base-date', type=str, help='기준일 (YYYY-MM-DD)')
    return parser.parse_args()

def run_weekly_report():
    args = parse_args()
    config = load_config()

    # CLI 옵션이 config.ini보다 우선
    test_mode = 'Y' if args.test else config['processing'].get('test_mode', 'N')
    base_date = args.base_date  # None이면 현재일

    with get_connection(config) as conn:
        call_procedure(conn, 'SP_INS_WEEK_MAIN', [
            'WEEK',
            base_date,
            int(config['processing'].get('parallel', 4)),
            test_mode
        ])
```

### 12.4 데이터 검증 쿼리

ETL 실행 후 결과를 확인하는 SQL:

```sql
-- 1. 최신 MASTER 확인
SELECT SEQ, DAY_GB, DT_FROM, DT_TO, TARGET_CNT, COMPLETE_CNT, ERROR_CNT, STATUS_CD
FROM TS_INS_MASTER
ORDER BY SEQ DESC
FETCH FIRST 5 ROWS ONLY;

-- 2. 농장별 처리 현황
SELECT FARM_NO, COUNT(*) AS CNT
FROM TS_INS_WEEK
WHERE MASTER_SEQ = (SELECT MAX(SEQ) FROM TS_INS_MASTER)
GROUP BY FARM_NO
ORDER BY FARM_NO;

-- 3. 에러 로그 확인
SELECT PROC_NM, FARM_NO, ERROR_MSG, START_DT, END_DT
FROM TS_INS_JOB_LOG
WHERE MASTER_SEQ = (SELECT MAX(SEQ) FROM TS_INS_MASTER)
  AND STATUS_CD = 'ERROR';

-- 4. Oracle Job vs Python ETL 결과 비교
SELECT A.MASTER_SEQ AS ORACLE_SEQ, B.MASTER_SEQ AS PYTHON_SEQ,
       A.COMPLETE_CNT AS ORACLE_CNT, B.COMPLETE_CNT AS PYTHON_CNT
FROM TS_INS_MASTER A, TS_INS_MASTER B
WHERE A.DT_FROM = B.DT_FROM
  AND A.MASTER_SEQ <> B.MASTER_SEQ
ORDER BY A.DT_FROM DESC;
```

### 12.5 롤백 방법

테스트 데이터 삭제가 필요한 경우:

```sql
-- 주의: 테스트 데이터만 삭제
DECLARE
    v_master_seq NUMBER := (SELECT MAX(SEQ) FROM TS_INS_MASTER);
BEGIN
    DELETE FROM TS_INS_WEEK_SUB WHERE MASTER_SEQ = v_master_seq;
    DELETE FROM TS_INS_WEEK WHERE MASTER_SEQ = v_master_seq;
    DELETE FROM TS_INS_JOB_LOG WHERE MASTER_SEQ = v_master_seq;
    DELETE FROM TS_INS_MASTER WHERE SEQ = v_master_seq;
    COMMIT;
END;
/
```

---

## 13. 참고 문서

- [Oracle Job 프로세스](../db/ins/week/00.process.md)
- [python-oracledb 공식 문서](https://python-oracledb.readthedocs.io/)
- [배포 가이드](04-deployment.md)