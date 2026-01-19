@echo off
:: InsightPig 배포 실행 (git-bash 창에서 실행)
"C:\Program Files\Git\bin\bash.exe" -c "cd /c/Projects/inspig && ./deploy.sh -all; echo ''; echo '아무 키나 누르면 종료합니다...'; read -n 1"
pause
