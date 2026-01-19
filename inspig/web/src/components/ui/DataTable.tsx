'use client';

interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  highlightRow?: (row: T, index: number) => boolean;
  highlightLast?: boolean;
  onRowClick?: (row: T, index: number) => void;
  emptyMessage?: string;
  summaryRow?: Record<string, React.ReactNode>;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  highlightRow,
  highlightLast,
  onRowClick,
  emptyMessage = '데이터가 없습니다.',
  summaryRow,
}: DataTableProps<T>) {
  const getNestedValue = (obj: T, key: string): unknown => {
    return key.split('.').reduce((o: unknown, k) => {
      if (o && typeof o === 'object' && k in o) {
        return (o as Record<string, unknown>)[k];
      }
      return undefined;
    }, obj);
  };

  return (
    <div className="overflow-x-auto">
      <table className="table-base">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                style={{ width: col.width }}
                className={`text-${col.align || 'center'}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center text-gray-400 py-8">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            <>
              {data.map((row, index) => {
                const isLastRow = index === data.length - 1;
                return (
                  <tr
                    key={index}
                    className={`
                      ${highlightRow?.(row, index) ? 'highlight-row' : ''}
                      ${highlightLast && isLastRow ? 'highlight-row' : ''}
                      ${onRowClick ? 'cursor-pointer' : ''}
                    `}
                    onClick={() => onRowClick?.(row, index)}
                  >
                    {columns.map((col) => {
                      const value = getNestedValue(row, String(col.key));
                      return (
                        <td
                          key={String(col.key)}
                          className={`text-${col.align || 'center'}`}
                        >
                          {col.render ? col.render(value, row, index) : String(value ?? '')}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {/* 합계/요약 행 */}
              {summaryRow && (
                <tr className="bg-[#e3f2fd]">
                  {columns.map((col) => {
                    const key = String(col.key);
                    return (
                      <td key={key} className={`text-${col.align || 'center'} font-bold`}>
                        {summaryRow[key] ?? ''}
                      </td>
                    );
                  })}
                </tr>
              )}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}
