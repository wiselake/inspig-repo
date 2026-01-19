/**
 * ============================================================================
 * 컴팩트 바 (Compact Bar)
 * ============================================================================
 * 
 * @description 테이블 인라인용 미니 프로그레스 바
 * @note ECharts 미사용 (순수 CSS)
 * 
 * @props
 * - value     : 현재 값
 * - maxValue  : 최대 값 (default: 100)
 * - color     : 바 색상 (default: #dc3545)
 * - height    : 높이 px (default: 20)
 * - showLabel : 라벨 표시 (default: false)
 * 
 * @example
 * <CompactBar value={75} maxValue={100} color="#28a745" />
 * ============================================================================
 */
'use client';

interface CompactBarProps {
  value: number;
  maxValue?: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
}

export default function CompactBar({
  value,
  maxValue = 100,
  color = '#dc3545',
  height = 20,
  showLabel = false,
}: CompactBarProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 rounded overflow-hidden"
        style={{ height, backgroundColor: '#f1f3f5' }}
      >
        <div
          className="h-full rounded transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold whitespace-nowrap" style={{ color }}>
          {value}%
        </span>
      )}
    </div>
  );
}
