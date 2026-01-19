#!/bin/bash
# InsightPig Weekly ETL 실행 스크립트
#
# Usage: ./run_weekly.sh [AM7|PM2]
#   AM7: 오전 7시 알림 대상 (Crontab: 0 2 * * 1)
#   PM2: 오후 2시 알림 대상 (Crontab: 0 12 * * 1)
#   인자 없음: 전체 농장 대상
#
# Crontab 예시 (KST 기준, 1=월요일):
#   0 2 * * 1 /data/etl/inspig/run_weekly.sh AM7    # 월요일 02:00 → 07:00 발송
#   0 12 * * 1 /data/etl/inspig/run_weekly.sh PM2   # 월요일 12:00 → 14:00 발송

SCHEDULE_GROUP="$1"

# 스크립트 디렉토리로 이동
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 로그 디렉토리 생성
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"

# 타임스탬프
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 로그 파일명 (스케줄 그룹 포함)
if [ -n "$SCHEDULE_GROUP" ]; then
    LOG_FILE="$LOG_DIR/cron_${SCHEDULE_GROUP}_${TIMESTAMP}.log"
else
    LOG_FILE="$LOG_DIR/cron_${TIMESTAMP}.log"
fi

echo "========================================" >> "$LOG_FILE"
echo "InsightPig Weekly ETL 시작: $(date)" >> "$LOG_FILE"
echo "스케줄 그룹: ${SCHEDULE_GROUP:-전체}" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# Conda 환경 활성화
source /data/anaconda/anaconda3/etc/profile.d/conda.sh
conda activate inspig-etl
echo "Conda 환경: inspig-etl" >> "$LOG_FILE"

# Python 버전 확인
python --version >> "$LOG_FILE" 2>&1

# ETL 실행 (스케줄 그룹 옵션 추가)
if [ -n "$SCHEDULE_GROUP" ]; then
    python run_etl.py weekly --schedule-group "$SCHEDULE_GROUP" >> "$LOG_FILE" 2>&1
else
    python run_etl.py weekly >> "$LOG_FILE" 2>&1
fi
EXIT_CODE=$?

echo "========================================" >> "$LOG_FILE"
echo "종료 코드: $EXIT_CODE" >> "$LOG_FILE"
echo "종료 시각: $(date)" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# 오래된 로그 정리 (30일 이상)
find "$LOG_DIR" -name "cron_*.log" -mtime +30 -delete

exit $EXIT_CODE
