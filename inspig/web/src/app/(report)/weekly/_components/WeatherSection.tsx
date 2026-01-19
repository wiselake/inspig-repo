import React from 'react';
import { WeatherData } from '@/types/weekly';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faCloud, faCloudRain, faSnowflake } from '@fortawesome/free-solid-svg-icons';

interface WeatherSectionProps {
    data: WeatherData;
}

export const WeatherSection: React.FC<WeatherSectionProps> = ({ data }) => {
    const getWeatherIcon = (condition: string) => {
        switch (condition) {
            case 'sunny': return faSun;
            case 'cloudy': return faCloud;
            case 'rainy': return faCloudRain;
            case 'snowy': return faSnowflake;
            default: return faSun;
        }
    };

    const getWeatherColor = (condition: string) => {
        switch (condition) {
            case 'sunny': return 'text-orange-500';
            case 'cloudy': return 'text-gray-500';
            case 'rainy': return 'text-blue-500';
            case 'snowy': return 'text-sky-300';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="report-card">
            <div className="card-header">
                <h3 className="card-title">주간 날씨</h3>
            </div>
            <div className="card-body">
                {data.forecast.length > 0 ? (
                    <div className="grid grid-cols-7 gap-1">
                        {data.forecast.map((day, index) => (
                            <div key={index} className="flex flex-col items-center p-1">
                                <span className="text-xs text-gray-500 mb-1">{day.date.split('-')[2]}</span>
                                <FontAwesomeIcon
                                    icon={getWeatherIcon(day.condition)}
                                    className={`w-6 h-6 mb-1 ${getWeatherColor(day.condition)}`}
                                />
                                <span className="text-sm font-bold">{day.temp}°</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                        날씨 정보 없음
                    </div>
                )}
            </div>
        </div>
    );
};
