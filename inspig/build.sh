#!/bin/bash
# InsightPig 로컬 빌드 스크립트
# 사용법:
#   ./build.sh          - web, api 모두 빌드
#   ./build.sh web      - web만 빌드
#   ./build.sh api      - api만 빌드

cd "$(dirname "$0")"
PROJECT_DIR=$(pwd)

echo "========================================="
echo "  InsightPig 빌드"
echo "========================================="
echo "프로젝트 경로: $PROJECT_DIR"
echo ""

# 빌드 결과 저장
WEB_RESULT=""
API_RESULT=""

# web 빌드 함수
build_web() {
    echo ">>> [1/2] web 빌드 시작 (Next.js)"
    echo "-----------------------------------------"
    cd "$PROJECT_DIR/web"

    # node_modules 확인
    if [ ! -d "node_modules" ]; then
        echo "  node_modules가 없습니다. npm install 실행..."
        npm install
    fi

    # 빌드 실행
    npm run build

    if [ $? -eq 0 ]; then
        WEB_RESULT="[OK] web 빌드 성공"
        echo ""
        echo "$WEB_RESULT"
    else
        WEB_RESULT="[FAIL] web 빌드 실패"
        echo ""
        echo "$WEB_RESULT"
    fi
    echo ""
}

# api 빌드 함수
build_api() {
    echo ">>> [2/2] api 빌드 시작 (NestJS)"
    echo "-----------------------------------------"
    cd "$PROJECT_DIR/api"

    # node_modules 확인
    if [ ! -d "node_modules" ]; then
        echo "  node_modules가 없습니다. npm install 실행..."
        npm install
    fi

    # 빌드 실행
    npm run build

    if [ $? -eq 0 ]; then
        API_RESULT="[OK] api 빌드 성공"
        echo ""
        echo "$API_RESULT"
    else
        API_RESULT="[FAIL] api 빌드 실패"
        echo ""
        echo "$API_RESULT"
    fi
    echo ""
}

# 인자에 따라 빌드 실행
case "$1" in
    "web")
        build_web
        ;;
    "api")
        build_api
        ;;
    *)
        # 기본: 모두 빌드
        build_web
        build_api
        ;;
esac

echo "========================================="
echo "  빌드 결과"
echo "========================================="
[ -n "$WEB_RESULT" ] && echo "  $WEB_RESULT"
[ -n "$API_RESULT" ] && echo "  $API_RESULT"
echo ""
echo "배포하려면: ./deploy.sh"
echo ""
