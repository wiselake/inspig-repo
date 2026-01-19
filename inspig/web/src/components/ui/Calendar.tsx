import React from 'react';

interface CalendarProps {
    events: { date: string; type: string; count?: number; title?: string }[];
    startDate: Date;
    days?: number;
}

export const Calendar: React.FC<CalendarProps> = ({ events, startDate, days = 7 }) => {
    const dates = Array.from({ length: days }, (_, i) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        return d;
    });

    const getEventsForDate = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return events.filter(e => e.date === dateStr);
    };

    return (
        <div className="flex w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {dates.map((date, index) => {
                const dayEvents = getEventsForDate(date);
                const isToday = new Date().toDateString() === date.toDateString();

                return (
                    <div key={index} className={`flex-1 flex flex-col border-r last:border-r-0 border-gray-200 dark:border-gray-700 min-h-[120px] ${isToday ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-white dark:bg-gray-900'}`}>
                        <div className="p-2 text-center border-b border-gray-100 dark:border-gray-800">
                            <span className="text-xs text-gray-500 dark:text-gray-400 block">{date.toLocaleDateString('ko-KR', { weekday: 'short' })}</span>
                            <span className={`text-sm font-bold ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                {date.getDate()}
                            </span>
                        </div>
                        <div className="p-1 flex-1 flex flex-col gap-1">
                            {dayEvents.map((event, idx) => (
                                <div key={idx} className="text-xs p-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 truncate">
                                    {event.title || `${event.type} ${event.count}`}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
