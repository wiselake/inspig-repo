'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Icon } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignInAlt } from '@fortawesome/free-solid-svg-icons';

// Hard navigation 함수 - Next.js 클라이언트 라우터 우회
// 이중화 서버 환경에서 RSC 상태 불일치 문제 방지
const navigateTo = (path: string) => {
  window.location.href = path;
};

interface HeaderProps {
  onMenuToggle?: () => void;
  isLoginAccess?: boolean;
  showMenu?: boolean;
}

interface ServiceInfo {
  farmNo: number;
  inspigYn: string;
  inspigFromDt: string | null;
  inspigToDt: string | null;
  useYn: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Header({ onMenuToggle, isLoginAccess = true, showMenu = true }: HeaderProps) {
  const { user, getAccessToken, logout } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo | null>(null);
  const [isLoadingService, setIsLoadingService] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // 서비스 정보 조회
  const fetchServiceInfo = async () => {
    const token = getAccessToken();
    if (!token) return;

    setIsLoadingService(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/service`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setServiceInfo(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch service info:', error);
    } finally {
      setIsLoadingService(false);
    }
  };

  // 팝업 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowPopup(false);
      }
    };

    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopup]);

  // 아이콘 클릭 핸들러
  const handleUserIconClick = () => {
    if (!showPopup) {
      fetchServiceInfo();
    }
    setShowPopup(!showPopup);
  };

  // 날짜 포맷팅 (YYYYMMDD VARCHAR(8) -> YY.MM.DD)
  const formatDate = (dateStr: string | null) => {
    if (!dateStr || dateStr.length !== 8) return '-';
    const year = dateStr.substring(2, 4);  // YY
    const month = dateStr.substring(4, 6); // MM
    const day = dateStr.substring(6, 8);   // DD
    return `${year}.${month}.${day}`;
  };

  return (
    <header id="main-header" className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="flex items-center justify-between px-2 py-2">
        {/* 왼쪽: 햄버거 메뉴 + 로고 */}
        <div className="flex items-center gap-1">
          {/* 햄버거 메뉴 버튼 */}
          {showMenu && (
            <button
              onClick={onMenuToggle}
              className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="메뉴 열기"
            >
              <Icon name="bars" className="text-lg" />
            </button>
          )}

          {/* 로고 - Hard navigation 사용 */}
          <a
            id="btn-top-ci"
            href={isLoginAccess ? "/" : "/login"}
            onClick={(e) => {
              e.preventDefault();
              navigateTo(isLoginAccess ? "/" : "/login");
            }}
            className="flex items-center cursor-pointer"
          >
            <Image
              src="/images/insight_ci.png"
              alt="피그플랜"
              width={100}
              height={28}
              className="dark:brightness-0 dark:invert"
            />
          </a>
        </div>

        {/* 오른쪽: 사용자 정보 또는 로그인 버튼 */}
        {isLoginAccess ? (
          <div id="sec-user-info" className="flex items-center gap-2 text-right relative" ref={popupRef}>
            <div className="text-xs">
              <div className="font-medium text-gray-900 dark:text-white">
                {user?.name || '-'}
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-[11px]">
                {user?.farmNm || user?.farmNo || '-'}
              </div>
            </div>

            {/* 사용자 아이콘 버튼 */}
            <button
              id="btn-user-menu"
              onClick={handleUserIconClick}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              aria-label="사용자 정보"
            >
              <Icon name="user" className="text-sm" />
            </button>

            {/* 사용자 정보 팝업 */}
            {showPopup && (
            <div
              id="pop-user-menu"
              className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
            >
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm border-b border-gray-200 dark:border-gray-700 pb-2">
                  회원 정보
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">성명</span>
                    <span className="text-gray-900 dark:text-white font-medium">{user?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">농장명</span>
                    <span className="text-gray-900 dark:text-white font-medium">{user?.farmNm || '-'}</span>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 dark:text-white mt-4 mb-3 text-sm border-b border-gray-200 dark:border-gray-700 pb-2">
                  서비스 정보
                </h3>

                {isLoadingService ? (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                    로딩중...
                  </div>
                ) : serviceInfo ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">서비스 상태</span>
                      <span className={`font-medium ${serviceInfo.inspigYn === 'Y' ? 'text-green-600' : 'text-red-600'}`}>
                        {serviceInfo.inspigYn === 'Y' ? '사용중' : '미사용'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">시작일</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {formatDate(serviceInfo.inspigFromDt)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">만료일</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {formatDate(serviceInfo.inspigToDt)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                    서비스 정보 없음
                  </div>
                )}

                {/* 로그아웃 버튼 */}
                <button
                  onClick={() => {
                    setShowPopup(false);
                    logout();
                  }}
                  className="w-full mt-4 py-2 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  로그아웃
                </button>
              </div>
            </div>
            )}
          </div>
        ) : (
          <button
            id="btn-report-login"
            onClick={() => window.location.href = '/login'}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <FontAwesomeIcon icon={faSignInAlt} />
            <span>로그인</span>
          </button>
        )}
      </div>
    </header>
  );
}
