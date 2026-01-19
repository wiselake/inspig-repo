import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt, faCalendarAlt, faPlayCircle, faTimes, faDownload, faFile, faSpinner, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { PopupContainer } from './PopupContainer';
import { MgmtItem } from '@/types/weekly';

interface MgmtDetailPopupProps {
    isOpen: boolean;
    onClose: () => void;
    item: MgmtItem | null;
    // 리스트 네비게이션용 (팝업 리스트에서 진입 시)
    listItems?: MgmtItem[];           // 전체 리스트
    currentIndex?: number;            // 현재 아이템 인덱스
    onNavigate?: (item: MgmtItem, index: number) => void;  // 네비게이션 콜백
}

/**
 * 관리포인트 상세 팝업 (단일 아이템)
 * 팝업 열릴 때 API 호출하여 상세 정보(CONTENT, 첨부파일) 조회
 *
 * 진입 경로에 따른 동작:
 * - 카드 칩 클릭: 단순 상세보기 (닫기만)
 * - 팝업 리스트 클릭: 네비게이션 (이전/닫기/다음)
 */
export const MgmtDetailPopup: React.FC<MgmtDetailPopupProps> = ({
    isOpen,
    onClose,
    item,
    listItems,
    currentIndex,
    onNavigate
}) => {
    const [showVideo, setShowVideo] = useState(false);
    const [detailData, setDetailData] = useState<MgmtItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 리스트 네비게이션 모드 여부
    const hasNavigation = listItems && listItems.length > 0 && currentIndex !== undefined && onNavigate;
    const canGoPrev = hasNavigation && currentIndex > 0;
    const canGoNext = hasNavigation && currentIndex < listItems.length - 1;

    // 팝업 열릴 때 상세 정보 조회
    useEffect(() => {
        if (isOpen && item?.seq) {
            // 이미 content가 있으면 API 호출 불필요 (이전 데이터 재사용)
            if (item.content !== undefined) {
                setDetailData(item);
                return;
            }

            setLoading(true);
            setError(null);

            fetch(`/api/weekly/mgmt/${item.seq}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.data) {
                        // 기존 item 정보에 상세 정보 병합
                        setDetailData({ ...item, ...data.data });
                    } else {
                        setError('상세 정보를 불러올 수 없습니다.');
                        setDetailData(item); // 기본 정보라도 표시
                    }
                })
                .catch(() => {
                    setError('상세 정보를 불러오는 중 오류가 발생했습니다.');
                    setDetailData(item); // 기본 정보라도 표시
                })
                .finally(() => {
                    setLoading(false);
                });
        } else if (!isOpen) {
            // 팝업 닫힐 때 상태 초기화
            setDetailData(null);
            setShowVideo(false);
        }
    }, [isOpen, item]);

    if (!item) return null;

    // 표시할 데이터 (상세 데이터 우선, 없으면 기본 item)
    const displayItem = detailData || item;

    // 날짜 포맷팅 (YYYYMMDD -> YYYY.MM.DD)
    const formatDate = (dateStr: string | null): string => {
        if (!dateStr || dateStr.length !== 8) return '';
        return `${dateStr.substring(0, 4)}.${dateStr.substring(4, 6)}.${dateStr.substring(6, 8)}`;
    };

    // 링크 클릭 핸들러 - 항상 새 탭에서 열기
    const handleLinkClick = () => {
        if (!displayItem.link) return;
        window.open(displayItem.link, '_blank', 'noopener,noreferrer');
    };

    // 동영상 보기 클릭 핸들러
    const handleVideoClick = () => {
        setShowVideo(true);
    };

    // 동영상 닫기 핸들러
    const handleVideoClose = () => {
        setShowVideo(false);
    };

    // 팝업 닫힐 때 동영상도 닫기
    const handlePopupClose = () => {
        setShowVideo(false);
        onClose();
    };

    // 이전 아이템으로 이동
    const handlePrev = () => {
        if (canGoPrev && listItems && onNavigate) {
            const prevIndex = currentIndex - 1;
            setDetailData(null);  // 상세 데이터 초기화
            setShowVideo(false);
            onNavigate(listItems[prevIndex], prevIndex);
        }
    };

    // 다음 아이템으로 이동
    const handleNext = () => {
        if (canGoNext && listItems && onNavigate) {
            const nextIndex = currentIndex + 1;
            setDetailData(null);  // 상세 데이터 초기화
            setShowVideo(false);
            onNavigate(listItems[nextIndex], nextIndex);
        }
    };

    return (
        <PopupContainer
            isOpen={isOpen}
            onClose={handlePopupClose}
            title={displayItem.title}
            id="popup-mgmt-detail"
            maxWidth="max-w-xl"
            zIndex={10001}  /* 리스트 팝업(10000) 위에 표시 */
        >
            <div className="mgmt-detail-content">
                {/* 로딩 중 */}
                {loading && (
                    <div className="mgmt-detail-loading">
                        <FontAwesomeIcon icon={faSpinner} spin />
                        <span>불러오는 중...</span>
                    </div>
                )}

                {/* 에러 메시지 */}
                {error && !loading && (
                    <div className="mgmt-detail-error">
                        {error}
                    </div>
                )}

                {/* 상세 내용 */}
                {!loading && displayItem.content && (
                    <div className="mgmt-detail-body">
                        {displayItem.contentType === 'HTML' ? (
                            <div
                                className="mgmt-html-content"
                                dangerouslySetInnerHTML={{ __html: displayItem.content }}
                            />
                        ) : (
                            <div className="mgmt-text-content whitespace-pre-wrap">
                                {displayItem.content}
                            </div>
                        )}
                    </div>
                )}

                {/* 동영상 플레이어 */}
                {showVideo && displayItem.videoUrl && (
                    <div className="mgmt-video-container">
                        <div className="mgmt-video-header">
                            <span>동영상</span>
                            <button
                                onClick={handleVideoClose}
                                className="mgmt-video-close"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <video
                            controls
                            autoPlay
                            className="mgmt-video-player"
                            src={displayItem.videoUrl}
                        >
                            브라우저가 동영상을 지원하지 않습니다.
                        </video>
                    </div>
                )}

                {/* 동영상 보기 버튼 */}
                {displayItem.videoUrl && !showVideo && (
                    <button
                        onClick={handleVideoClick}
                        className="mgmt-detail-video-btn"
                    >
                        <FontAwesomeIcon icon={faPlayCircle} />
                        동영상 보기
                    </button>
                )}

                {/* 링크 버튼 */}
                {displayItem.link && (
                    <button
                        onClick={handleLinkClick}
                        className="mgmt-detail-link-btn"
                    >
                        <FontAwesomeIcon icon={faExternalLinkAlt} />
                        자세히 보기
                    </button>
                )}

                {/* 첨부파일 목록 */}
                {!loading && displayItem.attachFiles && displayItem.attachFiles.length > 0 && (
                    <div className="mgmt-attach-files">
                        <div className="mgmt-attach-header">
                            <FontAwesomeIcon icon={faFile} />
                            <span>첨부파일 ({displayItem.attachFiles.length})</span>
                        </div>
                        <ul className="mgmt-attach-list">
                            {displayItem.attachFiles.map((file) => (
                                <li key={file.fileSeq} className="mgmt-attach-item">
                                    <a
                                        href={file.fileUrl}
                                        download={file.fileOrgnlNm}
                                        className="mgmt-attach-link"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <span className="mgmt-attach-name">{file.fileOrgnlNm}</span>
                                        <span className="mgmt-attach-size">
                                            {file.fileSize > 1024 * 1024
                                                ? `${(file.fileSize / 1024 / 1024).toFixed(1)}MB`
                                                : `${Math.round(file.fileSize / 1024)}KB`}
                                        </span>
                                        <FontAwesomeIcon icon={faDownload} className="mgmt-attach-icon" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* 게시 기간 */}
                {(displayItem.postFrom || displayItem.postTo) && (
                    <div className="mgmt-detail-period">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        <span>
                            게시기간: {formatDate(displayItem.postFrom)}
                            {displayItem.postFrom && displayItem.postTo && ' ~ '}
                            {formatDate(displayItem.postTo)}
                        </span>
                    </div>
                )}

                {/* 네비게이션 푸터 (리스트에서 진입한 경우만) */}
                {hasNavigation && (
                    <div className="mgmt-detail-nav">
                        <button
                            className="mgmt-nav-btn mgmt-nav-prev"
                            onClick={handlePrev}
                            disabled={!canGoPrev}
                        >
                            <FontAwesomeIcon icon={faChevronLeft} />
                            <span>이전</span>
                        </button>
                        <span className="mgmt-nav-info">
                            {currentIndex + 1} / {listItems.length}
                        </span>
                        <button
                            className="mgmt-nav-btn mgmt-nav-next"
                            onClick={handleNext}
                            disabled={!canGoNext}
                        >
                            <span>다음</span>
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    </div>
                )}
            </div>
        </PopupContainer>
    );
};
