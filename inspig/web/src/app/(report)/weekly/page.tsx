"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faCalendarAlt, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { ReportList } from '@/components/report/ReportList';
import { useAuth, useRequireAuth } from '@/contexts/AuthContext';

// Hard navigation 함수 - Next.js 클라이언트 라우터 우회
// 이중화 서버 환경에서 RSC 상태 불일치 문제 방지
const navigateTo = (path: string) => {
  window.location.href = path;
};

// 동적 렌더링 강제 - RSC 캐시 불일치 방지
export const dynamic = 'force-dynamic';

// API 베이스 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 페이지당 표시 건수
const PAGE_SIZE = 10;

interface ReportItem {
  id: string;
  title: string;
  period: string;
  date: string;
  masterSeq?: number;
  farmNo?: number;
  shareToken?: string;
}

// 6개월 전 날짜 계산
const getSixMonthsAgo = (): Date => {
  const date = new Date();
  date.setMonth(date.getMonth() - 6);
  return date;
};

// 날짜를 yyyy-MM-dd 형식으로 포맷
const formatDateForInput = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// 날짜를 yyyyMMdd 형식으로 포맷 (API용)
const formatDateForApi = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
};

// 날짜 포맷팅 함수 (표시용)
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  // 이미 YY.MM.DD 또는 YYYY.MM.DD 형식이면 그대로 반환
  if (dateStr.includes('.')) {
    return dateStr;
  }
  // YYYYMMDD -> YYYY.MM.DD
  if (dateStr.length === 8) {
    return `${dateStr.substring(0, 4)}.${dateStr.substring(4, 6)}.${dateStr.substring(6, 8)}`;
  }
  // ISO string -> YYYY.MM.DD
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
};

export default function WeeklyListPage() {
  // 인증 체크 - 로그인 안됐으면 리다이렉트
  const { isLoading: authLoading } = useRequireAuth('/login');
  const { user, activeFarmNo, testFarmNo, setTestFarmNo } = useAuth();

  // 최근 6개월 기본값
  const [startDate, setStartDate] = useState<string>(formatDateForInput(getSixMonthsAgo()));
  const [endDate, setEndDate] = useState<string>(formatDateForInput(new Date()));
  const [testFarmNoInput, setTestFarmNoInput] = useState<string>('');
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  // 자동 조회 플래그
  const initialFetchDone = useRef(false);

  // 테스트 농장번호 초기화
  useEffect(() => {
    if (testFarmNo !== null) {
      setTestFarmNoInput(String(testFarmNo));
    }
  }, [testFarmNo]);

  const handleTestFarmNoChange = (value: string) => {
    setTestFarmNoInput(value);
    if (value === '' || value === String(user?.farmNo)) {
      setTestFarmNo(null);
    } else {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue) && numValue > 0) {
        setTestFarmNo(numValue);
      }
    }
  };

  const handleSearch = useCallback(async () => {
    if (!activeFarmNo) {
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const from = formatDateForApi(new Date(startDate));
      const to = formatDateForApi(new Date(endDate));
      const url = `${API_BASE_URL}/api/weekly/list?farmNo=${activeFarmNo}&from=${from}&to=${to}`;

      const res = await fetch(url);

      // HTTP 상태 코드 체크
      if (!res.ok) {
        let errorData: any = {};
        try {
          errorData = await res.json();
        } catch {
          errorData = { message: await res.text() };
        }

        // 에러 처리 로직... (간소화)
        alert(errorData.message || '오류가 발생했습니다.');
        setReports([]);
        return;
      }

      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        const items: ReportItem[] = json.data.map((item: any) => ({
          id: `${item.masterSeq}-${activeFarmNo}`,
          masterSeq: item.masterSeq,
          farmNo: activeFarmNo,
          title: `${item.year}년 ${item.weekNo}주차 주간 보고서`,
          period: `${formatDate(item.period.from)} ~ ${formatDate(item.period.to)}`,
          date: formatDate(item.createdAt),
          shareToken: item.shareToken
        }));
        setReports(items);
        setCurrentPage(1);
      } else {
        if (json.message) {
          alert(`[API 응답 에러] ${json.message}`);
        }
        setReports([]);
      }
    } catch (error) {
      console.error('API 호출 오류:', error);
      alert('API 호출 중 오류가 발생했습니다.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [activeFarmNo, startDate, endDate]);

  // 페이지 진입시 자동 조회
  useEffect(() => {
    if (!authLoading && activeFarmNo && !initialFetchDone.current) {
      initialFetchDone.current = true;
      handleSearch();
    }
  }, [authLoading, activeFarmNo, handleSearch]);

  const handleItemClick = async (item: ReportItem) => {
    if (item.shareToken) {
      navigateTo(`/weekly/${item.shareToken}`);
      return;
    }

    // 토큰 생성
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/weekly/share/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          masterSeq: item.masterSeq,
          farmNo: item.farmNo,
          expireDays: 365 // 로그인 사용자는 긴 만료일
        })
      });
      const result = await res.json();
      if (result.success) {
        navigateTo(`/weekly/${result.token}`);
      } else {
        alert('리포트 토큰 생성 실패: ' + result.message);
      }
    } catch (e) {
      console.error(e);
      alert('오류가 발생했습니다.');
    }
  };

  // 페이징 계산
  const totalPages = Math.ceil(reports.length / PAGE_SIZE);
  const paginatedReports = reports.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // 인증 로딩 중
  if (authLoading) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="report-list-page p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          주간 보고서
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          농장의 주간 생산 성적을 확인하세요.
        </p>
      </div>

      {/* 검색 필터 */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              조회 기간
            </label>
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10 pr-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white w-full sm:w-44"
                />
                <FontAwesomeIcon
                  icon={faCalendarAlt}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
              <span className="text-gray-500">~</span>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="pl-10 pr-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white w-full sm:w-44"
                />
                <FontAwesomeIcon
                  icon={faCalendarAlt}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <FontAwesomeIcon icon={faSearch} />
                <span>조회</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 리포트 목록 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">리포트를 불러오는 중...</p>
        </div>
      ) : reports.length > 0 ? (
        <>
          <ReportList items={paginatedReports} basePath="/weekly" onItemClick={handleItemClick} />

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <span className="px-4 py-2 text-gray-600 dark:text-gray-400 font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FontAwesomeIcon icon={faChevronRight} className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          )}
        </>
      ) : hasSearched ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">조회된 리포트가 없습니다.</p>
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">기간을 선택하고 조회 버튼을 눌러주세요.</p>
        </div>
      )}
    </div>
  );
}
