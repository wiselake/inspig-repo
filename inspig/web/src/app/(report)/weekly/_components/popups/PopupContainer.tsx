import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

interface PopupContainerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    maxWidth?: string;
    id?: string;
    zIndex?: number;  // 팝업 위에 팝업 띄울 때 사용
}

export const PopupContainer: React.FC<PopupContainerProps> = ({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    maxWidth = 'max-w-2xl',
    id,
    zIndex
}) => {
    if (!isOpen) return null;

    return (
        <div className="wr-layer-popup active" id={id} style={zIndex ? { zIndex } : undefined}>
            <div className={`wr-popup-content ${maxWidth}`}>
                {/* 헤더 - 푸른색 라인 */}
                <div className="wr-popup-header">
                    <h2 className="wr-popup-title">{title}</h2>
                    {subtitle && <p className="wr-popup-subtitle">{subtitle}</p>}
                </div>
                {/* 닫기 버튼 */}
                <button onClick={onClose} className="wr-popup-close">
                    <FontAwesomeIcon icon={faTimes} />
                </button>
                {/* 바디 */}
                <div className="wr-popup-body">
                    {children}
                </div>
            </div>
        </div>
    );
};
