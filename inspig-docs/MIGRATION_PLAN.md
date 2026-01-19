# 공통 문서 통합 마이그레이션 계획

## 개요

inspig, inspig-etl, pig3.1 프로젝트의 중복 문서를 `C:\Projects\docs\inspig-docs-shared`로 통합합니다.

---

## Phase 1: 공통 문서 식별 및 이동

### 1.1 DB 참조 문서 (ref/) - 공통

| 원본 경로 | 이동 경로 | 비고 |
|-----------|-----------|------|
| `inspig-etl/docs/db/ref/01.table.md` | `docs/inspig-docs-shared/db/ref/01.table.md` | 기준 문서 (최신) |
| `inspig-etl/docs/db/ref/02.view.md` | `docs/inspig-docs-shared/db/ref/02.view.md` | |
| `inspig-etl/docs/db/ref/03.function.md` | `docs/inspig-docs-shared/db/ref/03.function.md` | |
| `inspig-etl/docs/db/ref/04.log_tables.md` | `docs/inspig-docs-shared/db/ref/04.log_tables.md` | |
| `inspig/docs/db/_backup/*.md` | 삭제 | 백업본, 중복 |

### 1.2 InsightPig DB 문서 (ins/) - 공통

| 원본 경로 | 이동 경로 | 비고 |
|-----------|-----------|------|
| `inspig/docs/db/ins/*.md` | `docs/inspig-docs-shared/db/ins/*.md` | |
| `inspig/docs/db/ins/week/*.md` | `docs/inspig-docs-shared/db/ins/week/*.md` | |
| `inspig-etl/docs/db/ins/*.md` | 병합 또는 삭제 | 중복 확인 필요 |

### 1.3 SQL 스크립트 - 공통

| 원본 경로 | 이동 경로 | 비고 |
|-----------|-----------|------|
| `inspig/docs/db/sql/*.md` | `docs/inspig-docs-shared/db/sql/*.md` | |
| `inspig/docs/db/sql/ins/*.sql` | `docs/inspig-docs-shared/db/sql/ins/*.sql` | |

---

## Phase 2: 프로젝트별 제외 문서

### pig3.1/pigplanxe/docs (이동하지 않음)
- `project-architecture.md` - pig3.1 프로젝트 아키텍처
- `css-architecture-new.md` - CSS 아키텍처
- `es-modules-migration-guide.md` - ES 모듈 마이그레이션
- `farm-address-weather-integration.md` - 주소/날씨 연동
- `insightpigplan-kakao-alimtalk.md` - 카카오 알림톡
- `officers-project-separation-guide.md` - 프로젝트 분리 가이드

### inspig/docs (이동하지 않음)
- `aws.md` - AWS 설정
- `deploy.md` - 배포 가이드
- `web/` 폴더 전체 - 프론트엔드/백엔드 개발 문서

### inspig-etl/docs (이동하지 않음)
- `01_ETL_OVERVIEW.md` - ETL 개요
- `02_WEEKLY_REPORT.md` - 주간 리포트
- `03_MONTHLY_REPORT.md` - 월간 리포트
- `04_QUARTERLY_REPORT.md` - 분기 리포트
- `05_OPERATION_GUIDE.md` - 운영 가이드
- `server-operation-guide.md` - 서버 운영

---

## Phase 3: 심볼릭 링크 생성

### Windows (관리자 권한 필요)

```batch
@echo off
REM inspig-docs-shared 심볼릭 링크 생성 스크립트
REM 관리자 권한으로 실행 필요

REM inspig 프로젝트
if exist "C:\Projects\inspig\docs\shared" rmdir "C:\Projects\inspig\docs\shared"
mklink /D "C:\Projects\inspig\docs\shared" "C:\Projects\docs\inspig-docs-shared"

REM inspig-etl 프로젝트
if exist "C:\Projects\inspig-etl\docs\shared" rmdir "C:\Projects\inspig-etl\docs\shared"
mklink /D "C:\Projects\inspig-etl\docs\shared" "C:\Projects\docs\inspig-docs-shared"

REM pig3.1 프로젝트 (선택)
if exist "C:\Projects\pig3.1\pigplan\pigplanxe\docs\shared" rmdir "C:\Projects\pig3.1\pigplan\pigplanxe\docs\shared"
mklink /D "C:\Projects\pig3.1\pigplan\pigplanxe\docs\shared" "C:\Projects\docs\inspig-docs-shared"

echo 심볼릭 링크 생성 완료
pause
```

---

## Phase 4: 기존 docs 폴더 정리

### inspig-etl/docs 정리
```bash
# 이동 완료 후 삭제
rm -rf C:\Projects\inspig-etl\docs\db\ref
# 남는 것: ETL 전용 문서만
```

### inspig/docs 정리
```bash
# 이동 완료 후 삭제
rm -rf C:\Projects\inspig\docs\db\ins
rm -rf C:\Projects\inspig\docs\db\sql
rm -rf C:\Projects\inspig\docs\db\_backup
rm -rf C:\Projects\inspig\docs\db\README.md
# 남는 것: aws.md, deploy.md, web/
```

---

## Phase 5: Claude Code 설정 업데이트

### 각 프로젝트 CLAUDE.md 업데이트

```markdown
## 공통 문서 참조

DB 관련 문서는 `docs/shared/` 경로에서 참조:
- 테이블 정의: docs/shared/db/ref/01.table.md
- 뷰 정의: docs/shared/db/ref/02.view.md
- 함수 정의: docs/shared/db/ref/03.function.md
```

---

## 실행 순서 체크리스트

- [x] 1. `C:\Projects\docs\inspig-docs-shared` 폴더 생성
- [ ] 2. `inspig-etl/docs/db/ref/*.md` → `docs/inspig-docs-shared/db/ref/` 이동
- [ ] 3. `inspig/docs/db/ins/*.md` → `docs/inspig-docs-shared/db/ins/` 이동
- [ ] 4. `inspig/docs/db/sql/` → `docs/inspig-docs-shared/db/sql/` 이동
- [ ] 5. 심볼릭 링크 생성 (관리자 권한)
- [ ] 6. 기존 중복 폴더 삭제
- [ ] 7. 각 프로젝트 CLAUDE.md 업데이트
- [ ] 8. 테스트: Claude Code에서 문서 참조 확인

---

## 최종 구조

```
C:\Projects\
├── docs/
│   └── inspig-docs-shared/       # 공통 문서 (실제 파일)
│       ├── db/
│       │   ├── ref/
│       │   ├── ins/
│       │   └── sql/
│       ├── MIGRATION_PLAN.md
│       └── README.md
│
├── inspig/
│   ├── docs/
│   │   ├── shared -> ../../docs/inspig-docs-shared (심볼릭 링크)
│   │   ├── aws.md                # 프로젝트 전용
│   │   ├── deploy.md
│   │   └── web/
│   └── ...
│
├── inspig-etl/
│   ├── docs/
│   │   ├── shared -> ../../docs/inspig-docs-shared (심볼릭 링크)
│   │   ├── 01_ETL_OVERVIEW.md    # 프로젝트 전용
│   │   └── ...
│   └── ...
│
└── pig3.1/pigplan/pigplanxe/
    ├── docs/
    │   ├── shared -> ../../../../../docs/inspig-docs-shared (심볼릭 링크)
    │   ├── project-architecture.md  # 프로젝트 전용
    │   └── ...
    └── ...
```
