#!/bin/bash
# 전체 농장 생산성 데이터 수집 스크립트
#
# Usage: ./run_productivity_all.sh [W|M|Q]
#   W: 주간 데이터 수집 (기본값)
#   M: 월간 데이터 수집
#   Q: 분기 데이터 수집
#
# Crontab 예시 (KST 기준, 서버는 UTC):
#   주간: 매주 월요일 00:05 KST (UTC 일요일 15:05)
#   5 15 * * 0 /data/etl/inspig/run_productivity_all.sh W
#
#   월간: 매월 1일, 15일 02:05 KST (UTC 전날 17:05)
#   - 15일 기준으로 API 데이터 범위 변경되므로 월 2회 수집
#   - 1일~14일: 전전월 말일 기준 12개월
#   - 15일~말일: 전월 말일 기준 12개월
#   5 17 1 * * /data/etl/inspig/run_productivity_all.sh M
#   5 17 15 * * /data/etl/inspig/run_productivity_all.sh M
#
# 수집 대상:
#   - 승인된 회원이 있는 모든 농장
#   - InsightPig 서비스 농장 우선 수집
#
# TS_PRODUCTIVITY 테이블 PERIOD 값:
#   - W: 주간 (PERIOD_NO = ISO 주차 1~53)
#   - M: 월간 (PERIOD_NO = 월 1~12)
#   - Q: 분기 (PERIOD_NO = 분기 1~4)

PERIOD="${1:-W}"  # 기본값: W (주간)

# 스크립트 디렉토리로 이동
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 로그 디렉토리 생성
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"

# 타임스탬프
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 로그 파일명 (기간구분 포함)
LOG_FILE="$LOG_DIR/productivity_all_${PERIOD}_${TIMESTAMP}.log"

echo "========================================" >> "$LOG_FILE"
echo "전체 농장 생산성 수집 시작: $(date)" >> "$LOG_FILE"
echo "기간구분: $PERIOD" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# Conda 환경 활성화
source /data/anaconda/anaconda3/etc/profile.d/conda.sh
conda activate inspig-etl
echo "Conda 환경: inspig-etl" >> "$LOG_FILE"

# Python 버전 확인
python --version >> "$LOG_FILE" 2>&1

# 생산성 데이터 수집 실행 (--period 옵션 추가)
python run_etl.py productivity-all --period "$PERIOD" >> "$LOG_FILE" 2>&1
EXIT_CODE=$?

echo "========================================" >> "$LOG_FILE"
echo "종료 코드: $EXIT_CODE" >> "$LOG_FILE"
echo "종료 시각: $(date)" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# 오래된 로그 정리 (30일 이상)
find "$LOG_DIR" -name "productivity_all_*.log" -mtime +30 -delete

exit $EXIT_CODE
