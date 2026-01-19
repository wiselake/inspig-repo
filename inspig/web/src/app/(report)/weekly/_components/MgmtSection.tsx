import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb, faNewspaper, faChevronRight, faQuestionCircle, faBullhorn } from '@fortawesome/free-solid-svg-icons';
import { MgmtItem, MgmtData } from '@/types/weekly';
import { MgmtListPopup } from './popups/MgmtListPopup';
import { MgmtDetailPopup } from './popups/MgmtDetailPopup';

// 타입별 아이콘 반환
const getMgmtTypeIcon = (mgmtType: string) => {
    switch (mgmtType) {
        case 'QUIZ': return faQuestionCircle;
        case 'CHANNEL': return faBullhorn;  // 박사채널&정보
        default: return faLightbulb;
    }
};

interface MgmtSectionProps {
    data: MgmtData;
}

type MgmtType = 'quizInfo' | 'news';

/**
 * 현재 시기 관리 포인트 섹션
 * 2개 카드: 피그플랜 퀴즈&정보 (퀴즈+안박사채널), 한돈&업계소식
 * - 칩 클릭: 상세 팝업
 * - 더보기 클릭: 전체 리스트 팝업
 */
export const MgmtSection: React.FC<MgmtSectionProps> = ({ data }) => {
    // 리스트 팝업 상태
    const [listPopupOpen, setListPopupOpen] = useState(false);
    const [listPopupType, setListPopupType] = useState<MgmtType>('quizInfo');

    // 상세 팝업 상태
    const [detailPopupOpen, setDetailPopupOpen] = useState(false);
    const [detailItem, setDetailItem] = useState<MgmtItem | null>(null);
    const [detailItemIndex, setDetailItemIndex] = useState<number>(-1);  // 리스트 네비게이션용
    const [isFromList, setIsFromList] = useState(false);  // 리스트에서 진입 여부

    // 기간 내 항목인지 확인 (카드 표시용)
    const isInPeriod = (item: MgmtItem): boolean => {
        const { periodFrom, periodTo } = data;
        if (!periodFrom || !periodTo) return true; // 기간 정보 없으면 모두 표시

        // POST_FROM이 조회 기간 종료일보다 크면 기간 외 (아직 시작 안 함)
        if (item.postFrom && item.postFrom > periodTo) return false;

        // POST_TO가 조회 기간 시작일보다 작으면 기간 외 (이미 종료됨)
        if (item.postTo && item.postTo < periodFrom) return false;

        return true;
    };

    // 퀴즈 + 박사채널 통합 리스트 (전체 - 팝업용)
    const quizInfoList = [
        ...(data.quizList || []),
        ...(data.channelList || [])
    ];

    // 카드에 표시할 리스트 (기간 내 항목만)
    const quizInfoListFiltered = quizInfoList.filter(isInPeriod);
    const porkNewsListFiltered = (data.porkNewsList || []).filter(isInPeriod);

    // 더보기 클릭 - 리스트 팝업 열기
    const openListPopup = (type: MgmtType) => {
        setListPopupType(type);
        setListPopupOpen(true);
    };

    // 칩/리스트 아이템 클릭 핸들러
    // - QUIZ/CHANNEL: 링크 있으면 새 탭에서 열기, 없으면 상세 팝업
    // - PORK-NEWS: DIRECT이면 새 탭, POPUP이면 상세 팝업 (content + 하단 링크)
    const handleItemClick = (item: MgmtItem) => {
        // PORK-NEWS는 POPUP/DIRECT 구분
        if (item.mgmtType === 'PORK-NEWS') {
            if (item.linkTarget === 'DIRECT' && item.link) {
                window.open(item.link, '_blank', 'noopener,noreferrer');
                return;
            }
            // POPUP이거나 링크 없으면 상세 팝업
            setDetailItem(item);
            setDetailItemIndex(-1);
            setIsFromList(false);
            setDetailPopupOpen(true);
            return;
        }

        // QUIZ/CHANNEL: 링크 있으면 새 탭, 없으면 상세 팝업
        if (item.link) {
            window.open(item.link, '_blank', 'noopener,noreferrer');
            return;
        }
        setDetailItem(item);
        setDetailItemIndex(-1);
        setIsFromList(false);
        setDetailPopupOpen(true);
    };

    const getListPopupTitle = (): string => {
        switch (listPopupType) {
            case 'quizInfo': return '피그플랜 퀴즈&정보';
            case 'news': return '한돈&업계소식';
            default: return '';
        }
    };

    const getListPopupItems = (): MgmtItem[] => {
        switch (listPopupType) {
            case 'quizInfo': return quizInfoList;
            case 'news': return data.porkNewsList || [];
            default: return [];
        }
    };

    // 카드에 표시할 아이템 수 (최대 3개)
    const maxDisplayItems = 3;

    // 칩 텍스트 자르기 (40자)
    const truncateText = (text: string, maxLength: number = 40) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '…';
    };

    return (
        <div className="mgmt-section-v2">
            {/* 피그플랜 퀴즈&정보 (퀴즈 + 안박사채널 통합) */}
            <div className="mgmt-card-v2" id="sec-mgmt-quiz">
                <div className="mgmt-card-header">
                    <span className="mgmt-badge quiz-info">
                        <FontAwesomeIcon icon={faLightbulb} />
                        피그플랜 퀴즈&정보
                    </span>
                    <span className="mgmt-more" onClick={() => openListPopup('quizInfo')}>
                        더보기 <FontAwesomeIcon icon={faChevronRight} />
                    </span>
                </div>
                <div className="mgmt-chips">
                    {quizInfoListFiltered.length > 0 ? (
                        quizInfoListFiltered.slice(0, maxDisplayItems).map((item, index) => (
                            <span
                                key={index}
                                className={`mgmt-chip mgmt-chip-${item.mgmtType?.toLowerCase() || 'quiz'}`}
                                onClick={() => handleItemClick(item)}
                            >
                                <FontAwesomeIcon icon={getMgmtTypeIcon(item.mgmtType)} className="mgmt-chip-icon" />
                                {truncateText(item.title)}
                            </span>
                        ))
                    ) : (
                        <span className="mgmt-empty">등록된 콘텐츠가 없습니다</span>
                    )}
                </div>
            </div>

            {/* 한돈&업계소식 */}
            <div className="mgmt-card-v2" id="sec-mgmt-news">
                <div className="mgmt-card-header">
                    <span className="mgmt-badge news">
                        <FontAwesomeIcon icon={faNewspaper} />
                        한돈&업계소식
                    </span>
                    <span className="mgmt-more" onClick={() => openListPopup('news')}>
                        더보기 <FontAwesomeIcon icon={faChevronRight} />
                    </span>
                </div>
                <div className="mgmt-chips">
                    {porkNewsListFiltered.length > 0 ? (
                        porkNewsListFiltered.slice(0, maxDisplayItems).map((item, index) => (
                            <span
                                key={index}
                                className="mgmt-chip"
                                onClick={() => handleItemClick(item)}
                            >
                                {truncateText(item.title)}
                            </span>
                        ))
                    ) : (
                        <span className="mgmt-empty">등록된 소식이 없습니다</span>
                    )}
                </div>
            </div>

            {/* 전체 리스트 팝업 */}
            <MgmtListPopup
                isOpen={listPopupOpen}
                onClose={() => setListPopupOpen(false)}
                title={getListPopupTitle()}
                items={getListPopupItems()}
                periodFrom={data.periodFrom}
                periodTo={data.periodTo}
                onItemClick={(item, index) => {
                    // 링크가 없는 경우만 호출됨 (링크는 MgmtListPopup 내부에서 처리)
                    // 리스트 팝업은 유지하고 상세 팝업만 열기
                    setDetailItem(item);
                    setDetailItemIndex(index ?? -1);
                    setIsFromList(true);
                    setDetailPopupOpen(true);
                }}
            />

            {/* 상세 팝업 */}
            <MgmtDetailPopup
                isOpen={detailPopupOpen}
                onClose={() => {
                    // 상세 팝업 닫기 (리스트 팝업은 유지)
                    setDetailPopupOpen(false);
                    setDetailItem(null);
                    setDetailItemIndex(-1);
                    setIsFromList(false);
                }}
                item={detailItem}
                listItems={isFromList ? getListPopupItems() : undefined}
                currentIndex={isFromList ? detailItemIndex : undefined}
                onNavigate={isFromList ? (item, index) => {
                    setDetailItem(item);
                    setDetailItemIndex(index);
                } : undefined}
            />
        </div>
    );
};
