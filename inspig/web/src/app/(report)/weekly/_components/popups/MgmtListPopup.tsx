import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faExternalLinkAlt, faQuestionCircle, faBullhorn, faLightbulb, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { PopupContainer } from './PopupContainer';
import { MgmtItem } from '@/types/weekly';

// 타입별 아이콘 반환
const getMgmtTypeIcon = (mgmtType: string) => {
    switch (mgmtType) {
        case 'QUIZ': return faQuestionCircle;
        case 'CHANNEL': return faBullhorn;  // 박사채널&정보
        default: return faLightbulb;
    }
};

interface MgmtListPopupProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    items: MgmtItem[];
    periodFrom?: string;  // 조회 기간 시작일 (YYYYMMDD) - 만료 판단용
    periodTo?: string;    // 조회 기간 종료일 (YYYYMMDD) - 만료 판단용
    onItemClick: (item: MgmtItem, index?: number) => void;
}

const ITEMS_PER_PAGE = 10;

/**
 * 관리포인트 전체 리스트 팝업
 * - QUIZ/CHANNEL: 링크 있으면 새 탭, 없으면 상세 팝업
 * - PORK-NEWS: DIRECT이면 새 탭, POPUP이면 상세 팝업
 * - 10개씩 페이징 처리
 */
export const MgmtListPopup: React.FC<MgmtListPopupProps> = ({
    isOpen,
    onClose,
    title,
    items,
    periodFrom,
    periodTo,
    onItemClick
}) => {
    // 페이지 상태
    const [currentPage, setCurrentPage] = useState(1);

    // 팝업이 열릴 때 첫 페이지로 리셋
    useEffect(() => {
        if (isOpen) {
            setCurrentPage(1);
        }
    }, [isOpen]);

    // 페이징 계산
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentItems = items.slice(startIndex, endIndex);

    // 아이템 클릭 핸들러 (index는 전체 items 배열 기준)
    const handleItemClick = (item: MgmtItem, globalIndex: number) => {
        // PORK-NEWS는 POPUP/DIRECT 구분
        if (item.mgmtType === 'PORK-NEWS') {
            if (item.linkTarget === 'DIRECT' && item.link) {
                window.open(item.link, '_blank', 'noopener,noreferrer');
                return;
            }
            // POPUP이거나 링크 없으면 상세 팝업
            onItemClick(item, globalIndex);
            return;
        }

        // QUIZ/CHANNEL: 링크 있으면 새 탭, 없으면 상세 팝업
        if (item.link) {
            window.open(item.link, '_blank', 'noopener,noreferrer');
            return;
        }
        onItemClick(item, globalIndex);
    };

    // DIRECT 링크인지 확인 (외부 링크 아이콘 표시용)
    const isDirectLink = (item: MgmtItem): boolean => {
        if (item.mgmtType === 'PORK-NEWS') {
            return item.linkTarget === 'DIRECT' && !!item.link;
        }
        return !!item.link;
    };

    // 게시 만료 여부 확인 (주간보고서 조회 기간 기준)
    // 만료 조건: POST_FROM > periodTo OR POST_TO < periodFrom (기간이 겹치지 않음)
    const isExpired = (item: MgmtItem): boolean => {
        if (!periodFrom || !periodTo) return false;

        // POST_FROM이 조회 기간 종료일보다 크면 만료 (아직 시작 안 함)
        if (item.postFrom && item.postFrom > periodTo) return true;

        // POST_TO가 조회 기간 시작일보다 작으면 만료 (이미 종료됨)
        if (item.postTo && item.postTo < periodFrom) return true;

        return false;
    };

    // 페이지 이동
    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <PopupContainer
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            id="popup-mgmt-list"
            maxWidth="max-w-lg"
        >
            <div className="mgmt-list-popup-content">
                {items.length === 0 ? (
                    <div className="mgmt-list-empty">
                        등록된 항목이 없습니다.
                    </div>
                ) : (
                    <>
                        <ul className="mgmt-list-items">
                            {currentItems.map((item, index) => {
                                const globalIndex = startIndex + index;  // 전체 배열 기준 인덱스
                                const expired = isExpired(item);
                                return (
                                    <li
                                        key={globalIndex}
                                        className={`mgmt-list-item ${expired ? 'mgmt-list-item-expired' : ''}`}
                                        onClick={() => handleItemClick(item, globalIndex)}
                                    >
                                        <span className={`mgmt-list-item-icon mgmt-list-item-icon-${item.mgmtType?.toLowerCase() || 'quiz'}`}>
                                            <FontAwesomeIcon icon={getMgmtTypeIcon(item.mgmtType)} />
                                        </span>
                                        <span className="mgmt-list-item-title">
                                            {item.title}
                                            {expired && <span className="mgmt-expired-badge">만료</span>}
                                        </span>
                                        {isDirectLink(item) ? (
                                            <FontAwesomeIcon icon={faExternalLinkAlt} className="mgmt-list-item-link" />
                                        ) : (
                                            <FontAwesomeIcon icon={faChevronRight} className="mgmt-list-item-arrow" />
                                        )}
                                    </li>
                                );
                            })}
                        </ul>

                        {/* 페이징 UI - 2페이지 이상일 때만 표시 */}
                        {totalPages > 1 && (
                            <div className="mgmt-list-pagination">
                                <button
                                    className="mgmt-pagination-btn"
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <FontAwesomeIcon icon={faChevronLeft} />
                                </button>
                                <span className="mgmt-pagination-info">
                                    {currentPage} / {totalPages}
                                </span>
                                <button
                                    className="mgmt-pagination-btn"
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    <FontAwesomeIcon icon={faChevronRight} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </PopupContainer>
    );
};
