'use client';

interface SummaryCardProps {
  label: string;
  value: string | number;
  unit?: string;
  change?: number | string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subLabel?: string;
  subValue?: string | number;
  subChange?: number | string;
  subChangeType?: 'positive' | 'negative' | 'neutral';
  cumulative?: string;
  subCumulative?: string;
  gradient?: string;
  onClick?: () => void;
}

export default function SummaryCard({
  label,
  value,
  unit = '',
  change,
  changeType = 'neutral',
  subLabel,
  subValue,
  subChange,
  subChangeType = 'neutral',
  cumulative,
  subCumulative,
  gradient = 'bg-gradient-blue',
  onClick,
}: SummaryCardProps) {
  const changeColor = {
    positive: 'text-[#90ee90]',
    negative: 'text-[#ffb3ba]',
    neutral: 'text-white/80',
  };

  const changeIcon = {
    positive: '▲',
    negative: '▼',
    neutral: '',
  };

  return (
    <div
      className={`${gradient} rounded-xl p-3 text-white relative min-h-[120px] flex flex-col cursor-pointer transition-all hover:-translate-y-0.5`}
      style={{ boxShadow: '0 6px 20px rgba(42, 82, 152, 0.4)' }}
      onClick={onClick}
    >
      {/* 값 영역 */}
      <div className="flex justify-between flex-1">
        {/* 메인 섹션 */}
        <div className="flex flex-col flex-1">
          <div className="text-xs text-white/90 mb-1 min-h-[16px]">{label}</div>
          <div className="text-lg font-bold text-white mb-1 min-h-[24px]">
            {value}
            {unit && <span className="text-sm ml-0.5">{unit}</span>}
          </div>
          {change !== undefined && (
            <div className={`text-xs mt-auto mb-1 min-h-[16px] ${changeColor[changeType]}`}>
              {changeIcon[changeType]} {change}
            </div>
          )}
        </div>

        {/* 서브 섹션 */}
        {subLabel && (
          <div className="flex flex-col flex-1 text-right">
            <div className="text-xs text-white/90 mb-1 min-h-[16px]">{subLabel}</div>
            <div className="text-base font-semibold text-white mb-1 min-h-[22px]">
              {subValue}
            </div>
            {subChange !== undefined && (
              <div className={`text-xs mt-auto mb-1 min-h-[16px] ${changeColor[subChangeType || 'neutral']}`}>
                {changeIcon[subChangeType || 'neutral']} {subChange}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 누적 정보 */}
      {(cumulative || subCumulative) && (
        <div className="flex justify-between mt-auto pt-2 border-t border-white/30 text-xs text-white/90">
          {cumulative && (
            <div className="flex-1 leading-tight">
              <div dangerouslySetInnerHTML={{ __html: cumulative }} />
            </div>
          )}
          {subCumulative && (
            <div className="flex-1 text-right leading-tight">
              <div dangerouslySetInnerHTML={{ __html: subCumulative }} />
            </div>
          )}
        </div>
      )}

      {/* 네비게이션 버튼 */}
      {onClick && (
        <button
          className="absolute bottom-[1%] left-1/2 -translate-x-1/2 w-[22px] h-[22px] rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-white/80 text-xs transition-all hover:bg-white/35 hover:border-white/60 hover:scale-110 active:scale-[0.92] active:bg-white/30"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <span className="transform translate-y-px">↓</span>
        </button>
      )}
    </div>
  );
}
