const slidesInfo = [
    { title: '피그플랜 시스템', file: 'page1.html' },
    { title: '개발 역사', file: 'page2.html' },
    { title: '주요기능 정보', file: 'page3.html' },
    { title: '주요 사용자층', file: 'page4.html' },
    { title: '회원 가입 현황', file: 'page5.html' },
    { title: '시스템 이용 현황', file: 'page6.html' },
    { title: '인사이트 피그플랜', file: 'page7.html' },
    { title: '서비스 바로가기', file: 'page8.html' }
];

function initNavigation(currentPageIndex) {
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;

    slidesInfo.forEach((info, index) => {
        const pageNum = index + 1;
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = info.file;
        a.className = index === currentPageIndex ? 'active' : '';
        a.innerHTML = '<span style="opacity: 0.5; margin-right: 8px;">' + pageNum + '.</span>' + info.title;
        li.appendChild(a);
        nav.appendChild(li);
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === ' ') {
            if (currentPageIndex < slidesInfo.length - 1) {
                window.location.href = slidesInfo[currentPageIndex + 1].file;
            }
        }
        if (e.key === 'ArrowLeft') {
            if (currentPageIndex > 0) {
                window.location.href = slidesInfo[currentPageIndex - 1].file;
            }
        }
    });
}

function changePage(direction, currentPageIndex) {
    const nextIndex = currentPageIndex + direction;
    if (nextIndex >= 0 && nextIndex < slidesInfo.length) {
        window.location.href = slidesInfo[nextIndex].file;
    }
}
