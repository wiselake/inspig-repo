import { useState, useEffect } from 'react';

/**
 * 차트 반응형 크기 훅
 * 브레이크포인트에 따라 차트 라벨 크기를 조정
 * - 모바일 (480px 이하): 기본값
 * - 태블릿 (481px ~ 768px): 중간
 * - 데스크탑 (769px 이상): 큰 값
 */
export const useChartResponsive = () => {
    const [sizes, setSizes] = useState({
        axisLabelSize: 10,    // x, y축 라벨 크기
        axisNameSize: 11,     // 축 이름 크기
        legendSize: 10,       // 범례 크기
        tooltipSize: 11,      // 툴팁 크기
        dataLabelSize: 10,    // 데이터 라벨 크기
    });

    useEffect(() => {
        const updateSizes = () => {
            const width = window.innerWidth;

            if (width >= 769) {
                // 데스크탑
                setSizes({
                    axisLabelSize: 13,
                    axisNameSize: 14,
                    legendSize: 13,
                    tooltipSize: 13,
                    dataLabelSize: 12,
                });
            } else if (width >= 481) {
                // 태블릿
                setSizes({
                    axisLabelSize: 11,
                    axisNameSize: 12,
                    legendSize: 11,
                    tooltipSize: 12,
                    dataLabelSize: 11,
                });
            } else {
                // 모바일
                setSizes({
                    axisLabelSize: 10,
                    axisNameSize: 11,
                    legendSize: 10,
                    tooltipSize: 11,
                    dataLabelSize: 10,
                });
            }
        };

        // 초기 설정
        updateSizes();

        // 리사이즈 이벤트 리스너
        window.addEventListener('resize', updateSizes);
        return () => window.removeEventListener('resize', updateSizes);
    }, []);

    return sizes;
};
