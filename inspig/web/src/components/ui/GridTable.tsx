import React from 'react';

interface GridTableProps {
    className?: string;
    children: React.ReactNode;
}

export const GridTable: React.FC<GridTableProps> = ({ className, children }) => {
    return (
        <div className={`grid grid-cols-6 gap-0 border border-gray-200 dark:border-gray-700 ${className}`}>
            {children}
        </div>
    );
};

interface GridCellProps {
    className?: string;
    children?: React.ReactNode;
    colSpan?: number;
    rowSpan?: number;
    header?: boolean;
    onClick?: () => void;
}

export const GridCell: React.FC<GridCellProps> = ({
    className,
    children,
    colSpan = 1,
    rowSpan = 1,
    header = false,
    onClick
}) => {
    const baseClasses = "p-2 border-r border-b border-gray-200 dark:border-gray-700 flex items-center justify-center text-sm";
    const headerClasses = header ? "bg-gray-50 dark:bg-gray-800 font-bold text-gray-700 dark:text-gray-300" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400";
    const interactiveClasses = onClick ? "cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" : "";

    const style = {
        gridColumn: `span ${colSpan} / span ${colSpan}`,
        gridRow: `span ${rowSpan} / span ${rowSpan}`,
    };

    return (
        <div
            className={`${baseClasses} ${headerClasses} ${interactiveClasses} ${className || ''}`}
            style={style}
            onClick={onClick}
        >
            {children}
        </div>
    );
};
