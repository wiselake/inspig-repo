"use client";

import React, { useState, useEffect, use, useMemo } from 'react';
import {
    parseApiError,
    parseFetchError
} from '@/err';

// Hard navigation 함수 - Next.js 클라이언트 라우터 우회
// 이중화 서버 환경에서 RSC 상태 불일치 문제 방지
const navigateTo = (path: string) => {
  window.location.href = path;
};
import Header from '@/components/common/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/common/ScrollToTop';
import { WeeklyHeader } from '../_components/WeeklyHeader';
import { AlertCard } from '../_components/AlertCard';
import { LastWeekSection } from '../_components/LastWeekSection';

// 동적 렌더링 강제 - RSC 캐시 불일치 방지
export const dynamic = 'force-dynamic';
import { ThisWeekSection } from '../_components/ThisWeekSection';
import { ExtraSection } from '../_components/ExtraSection';
import { MgmtSection } from '../_components/MgmtSection';

// Popups
import { AlertMdPopup } from '../_components/popups/AlertMdPopup';
import { ModonPopup } from '../_components/popups/ModonPopup';
import { MatingPopup } from '../_components/popups/MatingPopup';
import { FarrowingPopup } from '../_components/popups/FarrowingPopup';
import { WeaningPopup } from '../_components/popups/WeaningPopup';
import { AccidentPopup } from '../_components/popups/AccidentPopup';
import { CullingPopup } from '../_components/popups/CullingPopup';
import { ShipmentPopup } from '../_components/popups/ShipmentPopup';
import { ScheduleDetailPopup } from '../_components/popups/ScheduleDetailPopup';
import { PsyTrendPopup } from '../_components/popups/PsyTrendPopup';
import { AuctionPopup } from '../_components/popups/AuctionPopup';
import { WeatherPopup } from '../_components/popups/WeatherPopup';
import { getTodayKST } from '@/utils/date';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface WeeklyDetailPageProps {
    params: Promise<{ id: string }>;
}

interface ReportData {
    header: {
        farmNo: number;
        farmNm: string;
        ownerNm: string;
        year: number;
        weekNo: number;
        period: { from: string; to: string; fromRaw?: string; toRaw?: string };
    };
    alertMd: {
        count: number;
        hubo: number;
        euMiCnt: number;
        sgMiCnt: number;
        bmDelayCnt: number;
        euDelayCnt: number;
        items: any[];
    };
    lastWeek: any;
    thisWeek: any;
    kpi: any;
    popupData?: any;
    extra?: any;
    mgmt?: any;
    scheduleData?: any;
    psyTrend?: any;
    auction?: any;
    weather?: any;
}

export default function WeeklyDetailPage({ params }: WeeklyDetailPageProps) {
    const resolvedParams = use(params);
    const id = resolvedParams.id; // 이것이 토큰입니다.

    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expired, setExpired] = useState(false);
    const [activePopup, setActivePopup] = useState<string | null>(null);
    const [isLoginAccess, setIsLoginAccess] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // 금주 작업예정 기간 (thisWeek.calendarGrid에서 가져옴)
    const thisWeekPeriod = useMemo(() => {
        const calendarGrid = data?.thisWeek?.calendarGrid;
        if (!calendarGrid) return undefined;
        return {
            from: calendarGrid.periodFrom,
            to: calendarGrid.periodTo,
            fromRaw: calendarGrid.periodFromRaw,
            toRaw: calendarGrid.periodToRaw,
        };
    }, [data?.thisWeek?.calendarGrid]);

    // 과거 주차인지 확인 (금주 작업예정 종료일이 오늘보다 이전)
    // periodToRaw: YYYYMMDD 형식 (API에서 제공)
    const isPastWeek = useMemo(() => {
        const toRaw = thisWeekPeriod?.toRaw;
        if (!toRaw) return false;
        const todayStr = getTodayKST(); // YYYYMMDD
        return toRaw < todayStr;
    }, [thisWeekPeriod?.toRaw]);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                setLoading(true);
                setError(null);
                setExpired(false);

                // 로그인 토큰 가져오기 (localStorage의 accessToken)
                const token = localStorage.getItem('accessToken');
                const headers: HeadersInit = {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const response = await fetch(`${API_BASE_URL}/api/weekly/view/${id}`, {
                    headers
                });
                const result = await response.json();

                // 만료된 경우
                if (!result.success && result.expired) {
                    setExpired(true);
                    setError(result.message || '공유 링크가 만료되었습니다.');
                    return;
                }

                // 기타 오류
                if (!result.success) {
                    setError(result.message || '리포트를 찾을 수 없습니다.');
                    return;
                }

                // 농장 불일치: 다른 농장의 리포트를 로그인 상태로 보려고 할 때
                // 보안상 로그인 세션을 클리어하고 다이렉트 접속으로 처리
                if (result.farmMismatch) {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('testFarmNo');
                    console.log('[Weekly] Farm mismatch detected - session cleared');
                }

                // 성공: 세션 토큰 저장 (후속 API 호출용)
                if (result.sessionToken) {
                    sessionStorage.setItem('shareSessionToken', result.sessionToken);
                }

                setData(result.data);
                setIsLoginAccess(result.isLoginAccess); // farmMismatch면 false
            } catch (err) {
                setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchReport();
        } else {
            setError('유효하지 않은 리포트 ID입니다.');
            setLoading(false);
        }
    }, [id]);

    // 로그인 페이지로 이동
    const handleLoginRedirect = () => {
        navigateTo('/login');
    };

    const handlePopupOpen = (type: string) => {
        setActivePopup(type);
    };

    const handlePopupClose = () => {
        setActivePopup(null);
    };

    // 로딩 상태
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">리포트를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    // 에러 상태
    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {expired ? '링크가 만료되었습니다' : '리포트를 불러올 수 없습니다'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>

                    {/* 만료되었거나 리포트를 찾을 수 없는 경우 로그인 버튼 표시 */}
                    {(expired || error?.includes('찾을 수 없습니다')) && (
                        <button
                            onClick={handleLoginRedirect}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            로그인하여 확인하기
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // 데이터를 기존 형식으로 변환
    const headerData = {
        farmName: data.header.farmNm,
        owner: data.header.ownerNm,
        weekNum: data.header.weekNo,
        period: data.header.period,
    };

    return (
        <div className="report-page-wrapper">
            {/* Main Header - CI + 사용자정보/로그인버튼 */}
            <Header
                isLoginAccess={isLoginAccess}
                showMenu={isLoginAccess}
                onMenuToggle={() => setIsSidebarOpen(true)}
            />

            {/* Sidebar - 로그인 접속시만 */}
            {isLoginAccess && (
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            )}

            {/* Report Header - 주간리포트 제목 + 농장정보 */}
            <WeeklyHeader data={headerData} />

            {/* Content */}
            <div className="p-2 sm:p-3 lg:p-4 space-y-6">
                {/* Alert Card */}
                {data.alertMd?.count > 0 && (
                    <AlertCard data={data.alertMd} onClick={() => handlePopupOpen('alertMd')} />
                )}

                {/* Last Week Section */}
                <LastWeekSection data={data.lastWeek} onPopupOpen={handlePopupOpen} />

                {/* This Week Section */}
                <ThisWeekSection
                    data={data.thisWeek}
                    farmNo={isLoginAccess ? data.header?.farmNo : undefined}
                    onPopupOpen={handlePopupOpen}
                />

                <div className="space-y-6">
                    {/* Extra Section (부가 정보 아코디언) */}
                    {data.extra && <ExtraSection data={data.extra} onPopupOpen={handlePopupOpen} isPastWeek={isPastWeek} />}

                    {/* Mgmt Section (현재 시기 관리 포인트) */}
                    {data.mgmt && <MgmtSection data={data.mgmt} />}
                </div>
            </div>

            {/* Popups - 조건부 마운트로 메모리 최적화 */}
            {activePopup === 'alertMd' && data.alertMd?.items && (
                <AlertMdPopup
                    isOpen={true}
                    onClose={handlePopupClose}
                    data={data.alertMd.items}
                />
            )}

            {activePopup === 'modon' && data.popupData?.modon && (
                <ModonPopup
                    isOpen={true}
                    onClose={handlePopupClose}
                    data={data.popupData.modon}
                />
            )}

            {activePopup === 'mating' && data.popupData?.mating && (
                <MatingPopup
                    isOpen={true}
                    onClose={handlePopupClose}
                    data={data.popupData.mating}
                />
            )}

            {activePopup === 'farrowing' && data.popupData?.farrowing && (
                <FarrowingPopup
                    isOpen={true}
                    onClose={handlePopupClose}
                    data={data.popupData.farrowing}
                />
            )}

            {activePopup === 'weaning' && data.popupData?.weaning && (
                <WeaningPopup
                    isOpen={true}
                    onClose={handlePopupClose}
                    data={data.popupData.weaning}
                />
            )}

            {activePopup === 'accident' && data.popupData?.accident && (
                <AccidentPopup
                    isOpen={true}
                    onClose={handlePopupClose}
                    data={data.popupData.accident}
                />
            )}

            {activePopup === 'culling' && data.popupData?.culling && (
                <CullingPopup
                    isOpen={true}
                    onClose={handlePopupClose}
                    data={data.popupData.culling}
                />
            )}

            {activePopup === 'shipment' && data.popupData?.shipment && (
                <ShipmentPopup
                    isOpen={true}
                    onClose={handlePopupClose}
                    data={data.popupData.shipment}
                />
            )}

            {activePopup === 'scheduleGb' && data.scheduleData?.gb && (
                <ScheduleDetailPopup
                    isOpen={true}
                    onClose={handlePopupClose}
                    data={data.scheduleData.gb}
                    title="교배 예정"
                    id="pop-schedule-gb"
                />
            )}

            {activePopup === 'scheduleBm' && data.scheduleData?.bm && (
                <ScheduleDetailPopup
                    isOpen={true}
                    onClose={handlePopupClose}
                    data={data.scheduleData.bm}
                    title="분만 예정"
                    id="pop-schedule-bm"
                />
            )}

            {activePopup === 'scheduleEu' && data.scheduleData?.eu && (
                <ScheduleDetailPopup
                    isOpen={true}
                    onClose={handlePopupClose}
                    data={data.scheduleData.eu}
                    title="이유 예정"
                    id="pop-schedule-eu"
                />
            )}

            {activePopup === 'scheduleVaccine' && data.scheduleData?.vaccine && (
                <ScheduleDetailPopup
                    isOpen={true}
                    onClose={handlePopupClose}
                    data={data.scheduleData.vaccine}
                    title="백신 예정"
                    showVaccineName={true}
                    id="pop-schedule-vaccine"
                />
            )}

            {activePopup === 'psyTrend' && data.psyTrend && (
                <PsyTrendPopup
                    isOpen={true}
                    onClose={handlePopupClose}
                    data={data.psyTrend}
                />
            )}

            {activePopup === 'auction' && data.auction && (
                <AuctionPopup
                    isOpen={true}
                    onClose={handlePopupClose}
                    data={data.auction}
                />
            )}

            {activePopup === 'weather' && data.weather && (
                <WeatherPopup
                    isOpen={true}
                    onClose={handlePopupClose}
                    data={data.weather}
                    farmNo={data.header?.farmNo}
                    region={data.extra?.weather?.region}
                    weekPeriod={thisWeekPeriod}
                />
            )}

            {/* Footer - 로그인 접속시만 */}
            {isLoginAccess && <Footer />}

            {/* ScrollToTop - 항상 표시 */}
            <ScrollToTop />
        </div>
    );
}
