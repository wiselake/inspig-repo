import React from 'react';
import { FarrowingPopupData } from '@/types/weekly';
import { PopupContainer } from './PopupContainer';
import { formatNumber } from '@/utils/format';

interface FarrowingPopupProps {
    isOpen: boolean;
    onClose: () => void;
    data: FarrowingPopupData;
}

/**
 * 분만 실적 팝업 (탭 없음)
 * - 섹션1: 작업예정대비 테이블
 * - 섹션2: 분만 성적 (유형2 스타일: 총산/생시도태/포유개시 + 사산/미라/실산 프로그레스바)
 * @see popup.js tpl-farrowing
 */
export const FarrowingPopup: React.FC<FarrowingPopupProps> = ({ isOpen, onClose, data }) => {
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

    // 총산 기준 비율 계산
    const totalBorn = data.stats.totalBorn.sum;
    const bornAliveRate = calcRateNum(totalBorn, data.stats.bornAlive.sum);
    const stillbornRate = calcRateNum(totalBorn, data.stats.stillborn.sum);
    const mummyRate = calcRateNum(totalBorn, data.stats.mummy.sum);

    return (
        <PopupContainer
            isOpen={isOpen}
            onClose={onClose}
            title="분만 실적"
            subtitle="지난주 예정 대비 및 분만 성적"
            id="pop-farrowing"
        >
            {/* 작업예정대비 섹션 */}
            <div className="popup-section-label">
                <span>작업예정대비 <span className="popup-section-desc">달성율 : 예정작업 대비</span></span>
                <span className="popup-section-desc">단위: 복</span>
            </div>
            <div className="popup-table-wrap">
                <table className="popup-table-02" id="tbl-farrowing-plan">
                    <thead>
                        <tr>
                            <th>구분</th>
                            <th>예정</th>
                            <th>분만</th>
                            <th>달성률</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="label">분만</td>
                            <td>{formatNumber(data.planned)}</td>
                            <td className="total">{formatNumber(data.actual)}</td>
                            <td className={rateValue >= 100 ? 'text-green-600' : 'text-red-600'}>
                                {rate}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* 분만 성적 섹션 - 유형2 스타일 */}
            <div className="popup-section-label" style={{ marginTop: '16px' }}>
                <span>분만 성적</span>
                <span className="popup-section-desc">비율: 총산대비</span>
            </div>

            <div className="mating-summary-list" id="farrowing-stats">
                {/* 총산 - 하이라이트 */}
                <div className="summary-row highlight">
                    <div className="summary-row-left">
                        <span className="summary-dot"></span>
                        <span className="summary-label">총산</span>
                    </div>
                    <div className="summary-row-right">
                        <span className="summary-value">{formatNumber(totalBorn)}두</span>
                        <div className="summary-sub">평균 {data.stats.totalBorn.avg.toFixed(1)}두</div>
                    </div>
                </div>

                {/* 분만 성적 세부 항목 (프로그레스바) */}
                <div className="section-title">분만 성적 구성</div>

                {/* 실산 - 강조 스타일 */}
                <div className="summary-row with-bar accent">
                    <div className="summary-row-header">
                        <span className="summary-label">
                            실산
                            <span className="summary-plan">
                                평균 {data.stats.bornAlive.avg.toFixed(1)}두 ({bornAliveRate.toFixed(1)}%)
                            </span>
                        </span>
                        <span className="summary-value">{formatNumber(data.stats.bornAlive.sum)}두</span>
                    </div>
                    <div className="summary-bar">
                        <div
                            className="summary-bar-fill primary"
                            style={{ width: `${Math.min(bornAliveRate, 100)}%` }}
                        ></div>
                    </div>
                </div>

                {/* 사산 - 빨간색 */}
                <div className="summary-row with-bar">
                    <div className="summary-row-header">
                        <span className="summary-label">
                            사산
                            <span className="summary-plan">
                                평균 {data.stats.stillborn.avg.toFixed(1)}두 ({stillbornRate.toFixed(1)}%)
                            </span>
                        </span>
                        <span className="summary-value">{formatNumber(data.stats.stillborn.sum)}두</span>
                    </div>
                    <div className="summary-bar">
                        <div
                            className="summary-bar-fill danger"
                            style={{ width: `${Math.min(stillbornRate, 100)}%` }}
                        ></div>
                    </div>
                </div>

                {/* 미라 - 주황색 */}
                <div className="summary-row with-bar">
                    <div className="summary-row-header">
                        <span className="summary-label">
                            미라
                            <span className="summary-plan">
                                평균 {data.stats.mummy.avg.toFixed(1)}두 ({mummyRate.toFixed(1)}%)
                            </span>
                        </span>
                        <span className="summary-value">{formatNumber(data.stats.mummy.sum)}두</span>
                    </div>
                    <div className="summary-bar">
                        <div
                            className="summary-bar-fill warning"
                            style={{ width: `${Math.min(mummyRate, 100)}%` }}
                        ></div>
                    </div>
                </div>

                {/* 그라데이션 구분선 */}
                <div className="gradient-divider"></div>

                {/* 생시도태, 양자, 포유개시 - 내장 테이블 */}
                <table className="embedded-table" id="tbl-farrowing-stats">
                    <thead>
                        <tr>
                            <th>구분</th>
                            <th>합계</th>
                            <th>평균</th>
                            <th>비율</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="label">생시도태</td>
                            <td>{formatNumber(data.stats.culling.sum)}</td>
                            <td>{data.stats.culling.avg.toFixed(1)}</td>
                            <td className="text-red-600">{data.stats.culling.rate}</td>
                        </tr>
                        <tr>
                            <td className="label">양자</td>
                            <td>{formatNumber(data.stats.foster.sum)}</td>
                            <td>{data.stats.foster.avg.toFixed(1)}</td>
                            <td className="text-blue-600">{data.stats.foster.rate}</td>
                        </tr>
                        <tr className="row-highlight">
                            <td className="label">포유개시</td>
                            <td>{formatNumber(data.stats.nursingStart.sum)}</td>
                            <td>{data.stats.nursingStart.avg.toFixed(1)}</td>
                            <td className="text-green-600">{data.stats.nursingStart.rate}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </PopupContainer>
    );
};
