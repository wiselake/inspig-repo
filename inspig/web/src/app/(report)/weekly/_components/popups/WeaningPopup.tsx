import React from 'react';
import { WeaningPopupData } from '@/types/weekly';
import { PopupContainer } from './PopupContainer';
import { formatNumber } from '@/utils/format';

interface WeaningPopupProps {
    isOpen: boolean;
    onClose: () => void;
    data: WeaningPopupData;
}

/**
 * 이유 실적 팝업 (탭 없음)
 * - 섹션1: 작업예정대비 테이블 (id: tbl-weaning-plan)
 * - 섹션2: 이유 성적 (id: weaning-stats)
 *   - 총 이유두수 하이라이트
 *   - 이유자돈수/부분이유 프로그레스바
 *   - 3×2 grid: 1행(평균체중, 포유기간, 이유육성율), 2행(양자전입, 양자전출, 포유자돈폐사)
 * - 섹션3: 분만 기준 현황 카드 (id: weaning-farrowing-cards) - 총산/실산/포유개시
 * @see popup.js tpl-weaning
 */
export const WeaningPopup: React.FC<WeaningPopupProps> = ({ isOpen, onClose, data }) => {
    // 달성률 계산 (소수점 1자리)
    const calcRate = (planned: number, actual: number): string => {
        if (planned === 0) return '-';
        return ((actual / planned) * 100).toFixed(1) + '%';
    };

    // 비율 계산 (숫자 반환)
    const calcRateNum = (total: number, value: number): number => {
        if (total === 0) return 0;
        return (value / total) * 100;
    };

    const rate = calcRate(data.planned, data.actual);
    const rateValue = parseFloat(rate);

    // 분만 기준 데이터 (이유 대상 모돈의 분만 정보)
    const farrowingBased = data.farrowingBased || { totalBirth: 0, liveBirth: 0, nursingStart: 0 };

    // 자돈 증감 내역
    const pigletChanges = data.pigletChanges || { dead: 0, partialWean: 0, fosterIn: 0, fosterOut: 0 };

    // 총 이유두수 기준 비율 계산
    const totalWean = data.stats.weanPigs.sum;
    const partialWeanRate = calcRateNum(totalWean, pigletChanges.partialWean);

    return (
        <PopupContainer
            isOpen={isOpen}
            onClose={onClose}
            title="이유 실적"
            subtitle="지난주 예정 대비 및 이유 성적"
            id="pop-weaning"
        >
            {/* 섹션1: 작업예정대비 */}
            <div className="popup-section-label" id="weaning-plan-section">
                <span>작업예정대비 <span className="popup-section-desc">달성율 : 예정작업 대비</span></span>
                <span className="popup-section-desc">단위: 복</span>
            </div>
            <div className="popup-table-wrap">
                <table className="popup-table-02" id="tbl-weaning-plan">
                    <thead>
                        <tr>
                            <th>구분</th>
                            <th>예정</th>
                            <th>이유</th>
                            <th>달성률</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="label">이유</td>
                            <td>{formatNumber(data.planned)}</td>
                            <td className="total">{formatNumber(data.actual)}</td>
                            <td className={rateValue >= 100 ? 'text-green-600' : 'text-red-600'}>
                                {rate}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* 섹션2: 이유 성적 - farrowing-stats 스타일 */}
            <div className="popup-section-label" id="weaning-stats-section" style={{ marginTop: '16px' }}>
                <span>이유 성적</span>
            </div>

            <div className="mating-summary-list" id="weaning-stats">
                {/* 총 이유두수 - 하이라이트 */}
                <div className="summary-row highlight">
                    <div className="summary-row-left">
                        <span className="summary-dot"></span>
                        <span className="summary-label">총 이유두수</span>
                    </div>
                    <div className="summary-row-right">
                        <span className="summary-value">{formatNumber(totalWean)}두</span>
                        <div className="summary-sub">평균 {data.stats.weanPigs.avg.toFixed(1)}두</div>
                    </div>
                </div>

                {/* 이유 성적 세부 항목 */}
                <div className="section-title">이유 성적 구성</div>

                {/* 이유자돈수 - 강조 스타일 */}
                <div className="summary-row with-bar accent">
                    <div className="summary-row-header">
                        <span className="summary-label">
                            이유자돈수
                            <span className="summary-plan">
                                평균 {data.stats.weanPigs.avg.toFixed(1)}두
                            </span>
                        </span>
                        <span className="summary-value">{formatNumber(totalWean)}두</span>
                    </div>
                    <div className="summary-bar">
                        <div
                            className="summary-bar-fill primary"
                            style={{ width: '100%' }}
                        ></div>
                    </div>
                </div>

                {/* 부분이유자돈수 */}
                <div className="summary-row with-bar">
                    <div className="summary-row-header">
                        <span className="summary-label">
                            부분이유자돈수
                            <span className="summary-plan">
                                ({partialWeanRate.toFixed(1)}%)
                            </span>
                        </span>
                        <span className="summary-value">{formatNumber(pigletChanges.partialWean)}두</span>
                    </div>
                    <div className="summary-bar">
                        <div
                            className="summary-bar-fill warning"
                            style={{ width: `${Math.min(partialWeanRate, 100)}%` }}
                        ></div>
                    </div>
                </div>

                {/* 이유 성적 + 자돈 증감 통합 (3×2 grid) */}
                <div className="section-title">이유 성적 및 자돈 증감</div>

                {/* 1행: 평균체중, 포유기간, 이유육성율 */}
                <div id="tbl-weaning-stats" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '8px',
                    marginBottom: '8px'
                }}>
                    <div className="weaning-grid-card">
                        <div className="card-label">평균체중</div>
                        <div className="card-value">{data.stats.avgWeight.avg.toFixed(1)}kg</div>
                    </div>
                    <div className="weaning-grid-card">
                        <div className="card-label">포유기간</div>
                        <div className="card-value">{data.stats.nursingDays?.avg?.toFixed(1) || '-'}일</div>
                    </div>
                    <div className="weaning-grid-card highlight-green">
                        <div className="card-label">이유육성율<br /><span className="card-label-sub">(실산대비)</span></div>
                        <div className="card-value">{data.stats.survivalRate.rate}</div>
                    </div>
                </div>

                {/* 2행: 양자전입, 양자전출, 포유자돈폐사 */}
                <div id="tbl-weaning-piglet-changes" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '8px',
                    marginBottom: '12px'
                }}>
                    <div className="weaning-grid-card">
                        <div className="card-label">양자전입</div>
                        <div className="card-value">{formatNumber(pigletChanges.fosterIn)}두</div>
                    </div>
                    <div className="weaning-grid-card">
                        <div className="card-label">양자전출</div>
                        <div className="card-value">{formatNumber(pigletChanges.fosterOut)}두</div>
                    </div>
                    <div className="weaning-grid-card">
                        <div className="card-label">포유자돈폐사</div>
                        <div className="card-value">{formatNumber(pigletChanges.dead)}두</div>
                    </div>
                </div>
            </div>

            {/* 섹션3: 분만 기준 현황 카드 (이유 대상 모돈의 분만 정보) */}
            <div className="popup-section-label" id="weaning-farrowing-section" style={{ marginTop: '16px' }}>
                <span>분만 기준 현황</span>
                <span className="popup-section-desc">이유 대상 모돈의 분만 정보</span>
            </div>

            <div id="weaning-farrowing-cards" className="stat-cards-row" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <div className="weaning-stat-card gray" style={{ flex: 1, padding: '12px', borderRadius: '8px' }}>
                    <div className="card-label">총산</div>
                    <div className="card-value" style={{ fontSize: '18px', fontWeight: '600' }}>
                        {formatNumber(farrowingBased.totalBirth)}두
                    </div>
                </div>
                <div className="weaning-stat-card blue" style={{ flex: 1, padding: '12px', borderRadius: '8px' }}>
                    <div className="card-label">실산</div>
                    <div className="card-value" style={{ fontSize: '18px', fontWeight: '600' }}>
                        {formatNumber(farrowingBased.liveBirth)}두
                    </div>
                </div>
                <div className="weaning-stat-card green" style={{ flex: 1, padding: '12px', borderRadius: '8px' }}>
                    <div className="card-label">포유개시</div>
                    <div className="card-value" style={{ fontSize: '18px', fontWeight: '600' }}>
                        {formatNumber(farrowingBased.nursingStart)}두
                    </div>
                </div>
            </div>
        </PopupContainer>
    );
};
