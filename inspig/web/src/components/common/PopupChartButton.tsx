'use client';

import Icon from './Icon';

interface PopupChartButtonProps {
  label: string;
  icon?: string;
  onClick: () => void;
  className?: string;
}

export default function PopupChartButton({
  label,
  icon = 'chart-line',
  onClick,
  className = '',
}: PopupChartButtonProps) {
  return (
    <button
      className={`popup-chart-btn ${className}`}
      onClick={onClick}
    >
      <Icon name={icon} className="text-xs" />
      <span>{label}</span>
    </button>
  );
}
