# AWS 인프라 설정 가이드

**대상**: AWS 인프라 관리자, 배포 담당자  
**최종 업데이트**: 2025-12-19  
**주요 내용**: `ins.pigplan.io` 서비스를 위한 AWS 리소스(ALB, Target Group, Route 53) 설정 정보

---

## 1. Application Load Balancer (ALB)

기존 운영 중인 ALB를 활용하여 외부 트래픽을 수신하고 내부 서버로 분산합니다.

*   **ALB 명칭**: `XePro-Appli-15KOJJ3UWZSB9` (또는 유사한 명칭의 운영 ALB)
*   **체계**: Internet-facing
*   **리스너 설정**:
    *   **HTTP:80**: `ins.pigplan.io` 호스트 헤더 규칙 추가 -> `INSIGHT-PIGPLAN-GROUP-8002`로 전달
    *   **HTTPS:443**: `ins.pigplan.io` 호스트 헤더 규칙 추가 -> `INSIGHT-PIGPLAN-GROUP-8002`로 전달

---

## 2. 대상 그룹 (Target Group)

ALB가 트래픽을 전달할 실제 서버와 포트를 정의합니다.

*   **대상 그룹 명칭**: `INSIGHT-PIGPLAN-GROUP-8002`
*   **프로토콜 : 포트**: `HTTP : 8002`
*   **대상 유형**: 인스턴스 (Instance)
*   **등록된 대상**:
    *   `XeProd-Statistic Sever-A` (10.4.38.10)
    *   `XeProd-Statistic Sever-C` (10.4.99.10)
*   **상태 검사 (Health Check)**:
    *   프로토콜: HTTP
    *   경로: `/`
    *   성공 코드: 200

---

## 3. 보안 그룹 (Security Group)

서버로의 접근 권한을 제어합니다.

*   **대상 보안 그룹**: `XeProd-Root-SGStack-1B2JD...` (서버에 적용된 보안 그룹)
*   **인바운드 규칙 추가**:
    *   **유형**: 사용자 지정 TCP
    *   **포트 범위**: `8002`
    *   **소스**: `0.0.0.0/0` (또는 ALB 보안 그룹 ID)
    *   **설명**: InsightPig Docker Nginx Port

---

## 4. Route 53 (DNS)

도메인 이름을 ALB와 연결합니다.

*   **호스팅 영역**: `pigplan.io`
*   **레코드 설정**:
    *   **레코드 이름**: `ins.pigplan.io`
    *   **레코드 유형**: A (별칭)
    *   **별칭 대상**: `XePro-Appli-15KOJJ3UWZSB9` 로드 밸런서 선택

---

## 5. 장애 조치 및 점검 사항

1.  **504 Gateway Time-out 발생 시**: 
    *   EC2 보안 그룹에서 8002 포트가 열려 있는지 확인하십시오.
    *   서버 내 Docker 컨테이너가 정상 실행 중인지 확인하십시오 (`docker ps`).
2.  **대상 그룹 상태가 Unhealthy인 경우**:
    *   서버 내부에서 `curl -I http://localhost:8002` 명령어로 응답을 확인하십시오.
    *   CentOS 방화벽(`firewalld`)에서 8002 포트가 허용되었는지 확인하십시오.
