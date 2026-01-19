# InsightPig 공통 문서 저장소

inspig, inspig-etl, pig3.1 프로젝트에서 공통으로 참조하는 문서 저장소입니다.

## 문서 구조

```
inspig-docs-shared/
├── db/
│   ├── ref/                    # DB 테이블/뷰/함수 참조 (공통)
│   │   ├── 01.table.md         # 테이블 정의
│   │   ├── 02.view.md          # 뷰 정의
│   │   ├── 03.function.md      # 함수 정의
│   │   └── 04.log_tables.md    # 로그 테이블
│   ├── ins/                    # InsightPig 전용 DB 문서
│   │   ├── 01.overview.md
│   │   ├── 02.table.md
│   │   ├── 03.procedure-rules.md
│   │   └── week/               # 주간 리포트 관련
│   └── sql/                    # SQL 스크립트
│       ├── 00_SQL_GUIDE.md
│       └── ins/
└── README.md
```

## 사용 방법

### 각 프로젝트에서 심볼릭 링크로 참조

```bash
# inspig 프로젝트
mklink /D "C:\Projects\inspig\docs\shared" "C:\Projects\docs\inspig-docs-shared"

# inspig-etl 프로젝트
mklink /D "C:\Projects\inspig-etl\docs\shared" "C:\Projects\docs\inspig-docs-shared"

# pig3.1 프로젝트 (선택적)
mklink /D "C:\Projects\pig3.1\pigplan\pigplanxe\docs\shared" "C:\Projects\docs\inspig-docs-shared"
```

### Claude Code에서 참조

각 프로젝트의 CLAUDE.md 또는 .claude/settings.local.json에서:

```markdown
## 참조 문서
- DB 테이블 정의: docs/shared/db/ref/01.table.md
- 뷰 정의: docs/shared/db/ref/02.view.md
```

## 프로젝트별 제외 문서 (이동하지 않음)

### pig3.1/pigplanxe/docs (프로젝트 전용)
- project-architecture.md
- css-architecture-new.md
- es-modules-migration-guide.md
- farm-address-weather-integration.md
- insightpigplan-kakao-alimtalk.md
- officers-project-separation-guide.md

### inspig/docs (프로젝트 전용)
- aws.md
- deploy.md
- web/ 폴더 전체

### inspig-etl/docs (프로젝트 전용)
- 01_ETL_OVERVIEW.md ~ 05_OPERATION_GUIDE.md
- server-operation-guide.md
