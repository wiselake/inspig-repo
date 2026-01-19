import React from 'react';
import { KPIData } from '@/types/weekly';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faPiggyBank, faCoins } from '@fortawesome/free-solid-svg-icons';

interface KPISectionProps {
    data: KPIData;
}

export const KPISection: React.FC<KPISectionProps> = ({ data }) => {
    return (
        <div className="report-card">
            <div className="card-header">
                <h3 className="card-title">주요 지표 (KPI)</h3>
            </div>
            <div className="card-body grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <FontAwesomeIcon icon={faChartLine} />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">PSY</div>
                            <div className="font-bold text-gray-900 dark:text-gray-100 text-lg">{data.psy}</div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 dark:text-green-400">
                            <FontAwesomeIcon icon={faPiggyBank} />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">이유일령</div>
                            <div className="font-bold text-gray-900 dark:text-gray-100 text-lg">{data.weaningAge}일</div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                            <FontAwesomeIcon icon={faCoins} />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">경락가격</div>
                            <div className="font-bold text-gray-900 dark:text-gray-100 text-lg">{data.marketPrice.toLocaleString()}원</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
