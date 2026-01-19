import React from 'react';

interface LegendItem {
    label: string;
    color: string;
}

interface LegendProps {
    items: LegendItem[];
    className?: string;
}

export const Legend: React.FC<LegendProps> = ({ items, className }) => {
    return (
        <div className={`flex flex-wrap gap-4 ${className || ''}`}>
            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                        {item.label}
                    </span>
                </div>
            ))}
        </div>
    );
};
