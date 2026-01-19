---
description: 이중화 서버(38, 99)에 소스 전송 및 Docker 빌드 통합 배포
---

이 워크플로우는 로컬 소스를 두 대의 운영 서버에 배포하고 Docker 컨테이너를 재빌드합니다.

## 운영 서버

| 서버 | IP | 용도 |
|------|-----|------|
| 38번 서버 | 10.4.38.10 | insightPig API/Web |
| 99번 서버 | 10.4.99.10 | insightPig API/Web |
| 35번 서버 | 10.4.35.10 | Python ETL |

---

## insightPig 배포 (38, 99번 서버)

### 1. 운영 서버 #1 (10.4.38.10) 배포

```bash
ssh -i "E:/ssh key/sshkey/aws/ProdPigplanKey.pem" pigplan@10.4.38.10 "cd /data/insightPig && docker-compose up -d --build"

cd /data/insightPig && docker-compose down && docker-compose build --no-cache && docker-compose up -d

```

### 2. 운영 서버 #2 (10.4.99.10) 배포

```bash
ssh -i "E:/ssh key/sshkey/aws/ProdPigplanKey.pem" pigplan@10.4.99.10 "cd /data/insightPig && docker-compose up -d --build"
```

### 3. 배포 상태 확인

```bash
ssh -i "E:/ssh key/sshkey/aws/ProdPigplanKey.pem" pigplan@10.4.38.10 "docker-compose ps"
ssh -i "E:/ssh key/sshkey/aws/ProdPigplanKey.pem" pigplan@10.4.99.10 "docker-compose ps"
```

---

## Python ETL 배포 (35번 서버)

ETL 관련 상세 정보는 [inspig-etl/README.md](../../inspig-etl/README.md) 참조

### 서버 접속

```bash
ssh -i "E:/ssh key/sshkey/aws/ProdPigplanKey.pem" pigplan@10.4.35.10
cd /data/etl/inspig
```

### 배포 스크립트

```bash
# inspig-etl 프로젝트에서 실행
./deploy-etl.sh
```
