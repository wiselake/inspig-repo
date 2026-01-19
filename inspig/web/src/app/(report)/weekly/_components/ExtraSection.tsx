'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCircleInfo,
    faGrip,
    faWonSign,
    faCloudSun,
    faChevronDown,
    faChartLine,
    faCaretUp,
    faCaretDown
} from '@fortawesome/free-solid-svg-icons';

export interface ExtraData {
    psy: {
        zone: string;
        status: string;
        value: number;
        delay: number;
    };
    price: {
        avg: number;
        max: number;
        min: number;
        source: string;
    };
    weather: {
        min: number | null;
        max: number | null;
        current: number | null;
        region: string;
        weatherCd?: string;
        weatherNm?: string;
    };
}

interface ExtraSectionProps {
    data: ExtraData;
    onPopupOpen?: (type: string) => void;
    isPastWeek?: boolean;  // 과거 주차 여부
}

/**
 * 부가 정보 아코디언 섹션
 * @see weekly.html #secExtra
 */
export const ExtraSection: React.FC<ExtraSectionProps> = ({ data, onPopupOpen, isPastWeek = false }) => {
    const [isOpen, setIsOpen] = useState(false);

    // 날씨 데이터 유효성 체크
    const hasWeatherData = data.weather.current !== null || data.weather.max !== null || data.weather.min !== null;

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    const handlePopup = (type: string) => {
        if (onPopupOpen) {
            onPopupOpen(type);
        }
    };

    return (
        <div className={`info-accordion ${isOpen ? 'open' : ''}`} id="sec-extra">
            {/* 아코디언 헤더 */}
            <div className="info-accordion-header" onClick={handleToggle}>
                <div className="info-accordion-title">
                    <FontAwesomeIcon icon={faCircleInfo} />
                    부가 정보
                </div>
                <div className="info-accordion-preview">
                    {/* TODO: PSY 데이터 준비되면 활성화 */}
                    {/* <span><FontAwesomeIcon icon={faGrip} /> {data.psy.zone}</span> */}
                    <span><FontAwesomeIcon icon={faWonSign} /> {data.price.avg.toLocaleString()}원</span>
                    <span className="weather-preview inline-flex items-center !bg-transparent !p-0">
                        <FontAwesomeIcon icon={faCloudSun} />
                        {hasWeatherData ? (
                            <>
                                {data.weather.current !== null && <span className="ml-1 !bg-transparent !p-0">{data.weather.current}°</span>}
                                <span className="ml-1 inline-grid text-[10px] leading-none px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/50">
                                    {data.weather.max !== null && (
                                        <span className="text-red-700 dark:text-red-400 !p-0 !m-0 !bg-transparent"><FontAwesomeIcon icon={faCaretUp} /> {data.weather.max}°</span>
                                    )}
                                    {data.weather.min !== null && (
                                        <span className="text-blue-700 dark:text-blue-400 !p-0 !m-0 !bg-transparent"><FontAwesomeIcon icon={faCaretDown} /> {data.weather.min}°</span>
                                    )}
                                </span>
                            </>
                        ) : (
                            <span className="ml-1 text-gray-400 dark:text-gray-500 !bg-transparent !p-0">정보없음</span>
                        )}
                    </span>
                </div>
                <div className="info-accordion-toggle">
                    <FontAwesomeIcon icon={faChevronDown} />
                </div>
            </div>

            {/* 아코디언 바디 */}
            <div className="info-accordion-body">
                <div className="info-accordion-grid">
                    {/* PSY & 입력지연 카드 - TODO: PSY 데이터 준비되면 활성화 */}
                    {/* <div className="info-accordion-card" id="cardPsy">
                        <div className="card-header">
                            <div className="card-title">
                                <FontAwesomeIcon icon={faGrip} className="fa-sm" /> PSY & 입력지연
                            </div>
                            <button className="card-more" onClick={() => handlePopup('psytrend')}>
                                <FontAwesomeIcon icon={faChartLine} />&nbsp;추이
                            </button>
                        </div>
                        <div className="card-content">
                            <div className="section-left">
                                <div className="psy-value">
                                    {data.psy.zone} <span className="badge">{data.psy.status}</span>
                                </div>
                            </div>
                            <div className="section-right">
                                <div className="psy-desc">PSY {data.psy.value}</div>
                                <div className="psy-desc">입력지연 {data.psy.delay}일</div>
                            </div>
                        </div>
                    </div> */}

                    {/* 경락가격 카드 */}
                    <div className="info-accordion-card" id="cardPrice">
                        <div className="card-header">
                            <div className="card-title">
                                <FontAwesomeIcon icon={faWonSign} className="fa-sm" /> 경락가격(지난주) <span className="title-note">- 등외/제주제외, 탕박</span>
                            </div>
                            <button className="card-more" onClick={() => handlePopup('auction')}>
                                <FontAwesomeIcon icon={faChartLine} />&nbsp;주간가격
                            </button>
                        </div>
                        <div className="card-content">
                            <div className="section-left">
                                <div className="value-box">
                                    <div className="label">평균</div>
                                    <div className="value">{data.price.avg.toLocaleString()}원</div>
                                </div>
                                <div className="value-box">
                                    <div className="label">최고</div>
                                    <div className="value red">{data.price.max.toLocaleString()}원</div>
                                </div>
                                <div className="value-box">
                                    <div className="label">최저</div>
                                    <div className="value blue">{data.price.min.toLocaleString()}원</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 날씨 카드 */}
                    <div className="info-accordion-card" id="cardWeather">
                        <div className="card-header">
                            <div className="card-title">
                                <FontAwesomeIcon icon={faCloudSun} className="fa-sm" /> {isPastWeek ? '주간 날씨' : '오늘 날씨'}
                            </div>
                            {hasWeatherData && (
                                <button className="card-more" onClick={() => handlePopup('weather')}>
                                    <FontAwesomeIcon icon={faChartLine} />&nbsp;{isPastWeek ? '날씨기록' : '주간날씨'}
                                </button>
                            )}
                        </div>
                        <div className="card-content">
                            {hasWeatherData ? (
                                <>
                                    <div className="section-left">
                                        {isPastWeek ? (
                                            <>
                                                <div className="value-box">
                                                    <div className="label">최고</div>
                                                    <div className="value red">{data.weather.max !== null ? `${data.weather.max}°` : '-'}</div>
                                                </div>
                                                <div className="value-box">
                                                    <div className="label">최저</div>
                                                    <div className="value blue">{data.weather.min !== null ? `${data.weather.min}°` : '-'}</div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="value-box">
                                                    <div className="label">현재</div>
                                                    <div className="value" style={{ fontSize: '18px' }}>{data.weather.current !== null ? `${data.weather.current}°` : '-'}</div>
                                                </div>
                                                <div className="value-box">
                                                    <div className="label">최고</div>
                                                    <div className="value red">{data.weather.max !== null ? `${data.weather.max}°` : '-'}</div>
                                                </div>
                                                <div className="value-box">
                                                    <div className="label">최저</div>
                                                    <div className="value blue">{data.weather.min !== null ? `${data.weather.min}°` : '-'}</div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="section-right">
                                        <div className="source-label">지역</div>
                                        <div className="source-value">{data.weather.region}</div>
                                    </div>
                                </>
                            ) : (
                                <div className="section-left">
                                    <div className="text-gray-400 dark:text-gray-500 text-sm">
                                        날씨 정보없음
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
