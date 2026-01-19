import React from 'react';
import { AlertMdData } from '@/types/weekly';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation, faTable } from '@fortawesome/free-solid-svg-icons';
import { formatNumber } from '@/utils/format';

interface AlertCardProps {
    data: AlertMdData;
    onClick?: () => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ data, onClick }) => {
    return (
        <div className="alert-card" id="sec-alert">
            <div className="alert-card-icon">
                <FontAwesomeIcon icon={faTriangleExclamation} className="fa-sm" />
            </div>
            <div className="alert-card-info">
                <div className="alert-card-title">관리대상모돈</div>
                <div className="alert-card-subtitle">(피그플랜)농장기본값 설정 기준</div>
                <button className="alert-card-btn" onClick={onClick}>
                    <FontAwesomeIcon icon={faTable} /> 더보기
                </button>
            </div>
            <div className="alert-card-values">
                <div className="alert-card-total">
                    <div className="value">{formatNumber(data.count)}<span className="unit">복</span></div>
                    <div className="label">총두수</div>
                </div>
                <div className="alert-card-highlights">
                    <div className="alert-highlight-item">
                        <div className="value">{formatNumber(data.euMiCnt || 0)}</div>
                        <div className="label">이유후<br/>미교배</div>
                    </div>
                    <div className="alert-highlight-item">
                        <div className="value">{formatNumber(data.sgMiCnt || 0)}</div>
                        <div className="label">사고후<br/>미교배</div>
                    </div>
                    <div className="alert-highlight-item">
                        <div className="value">{formatNumber(data.bmDelayCnt || 0)}</div>
                        <div className="label">교배후<br/>분만지연</div>
                    </div>
                    <div className="alert-highlight-item">
                        <div className="value">{formatNumber(data.euDelayCnt || 0)}</div>
                        <div className="label">분만후<br/>이유지연</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
